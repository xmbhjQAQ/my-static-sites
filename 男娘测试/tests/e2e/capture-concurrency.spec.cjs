const { test, expect } = require('@playwright/test');

async function resultPage(page) {
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/score') return route.fulfill({ json: { ok: true, stats: { count: 100, averageScore: 150 } } });
        return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    await page.goto('/?debug=1');
    await page.waitForFunction(() => typeof nnDebug === 'object' && Array.isArray(window.rawQuestionBank));
    await page.evaluate(() => nnDebug.score(180));
    await expect(page.locator('#page-result')).toHaveClass(/active/);
}
const stubEngine = `window.html2canvas = async () => {
    window.captureCalls = (window.captureCalls || 0) + 1;
    await new Promise(resolve => setTimeout(resolve, 100));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 20;
    return canvas;
};`;

test('slow first engine load allows only one capture across both save entry points', async ({ page }) => {
    await resultPage(page);
    let release, requested;
    const gate = new Promise(resolve => { release = resolve; });
    const started = new Promise(resolve => { requested = resolve; });
    await page.route('**/vendor/html2canvas-1.4.1.min.js', async route => {
        requested();
        await gate;
        await route.fulfill({ contentType: 'text/javascript', body: stubEngine });
    });
    let downloads = 0;
    page.on('download', () => { downloads++; });
    const oldText = await page.locator('#btn-download').innerText();
    const before = await page.locator('#page-result .btn-main').evaluateAll(buttons => buttons.map(button => button.style.display));
    await page.evaluate(() => {
        document.getElementById('btn-download').click();
        const dockSave = document.querySelector('.result-action-dock [onclick="downloadResult()"], .result-action-dock [data-action="downloadResult"]');
        dockSave.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await started;
    await expect(page.locator('#btn-download')).toBeDisabled();
    const dockSave = page.locator('.result-action-dock [onclick="downloadResult()"], .result-action-dock [data-action="downloadResult"]');
    await expect(dockSave).toBeDisabled();
    release();
    await expect(page.locator('#btn-download')).toHaveText(oldText);
    await expect(page.locator('#btn-download')).toBeEnabled();
    await expect(dockSave).toBeEnabled();
    expect(downloads).toBe(1);
    expect(await page.evaluate(() => window.captureCalls)).toBe(1);
    expect(await page.locator('#page-result .btn-main').evaluateAll(buttons => buttons.map(button => button.style.display))).toEqual(before);
    await expect(page.locator('body')).not.toHaveClass(/capture-mode/);
});

test('engine and capture failures release the lock and permit a subsequent save', async ({ page }) => {
    await resultPage(page);
    let attempts = 0;
    await page.route('**/vendor/html2canvas-1.4.1.min.js', route => {
        attempts++;
        return attempts === 1 ? route.abort() : route.fulfill({ contentType: 'text/javascript', body: stubEngine });
    });
    const oldText = await page.locator('#btn-download').innerText();
    await page.locator('#btn-download').click();
    await expect(page.locator('#btn-download')).toHaveText(oldText);
    await expect(page.locator('#btn-download')).toBeEnabled();
    let download = page.waitForEvent('download');
    await page.locator('#btn-download').click();
    await download;
    await expect(page.locator('#btn-download')).toBeEnabled();
    await page.evaluate(() => { window.html2canvas = async () => { throw new Error('capture failed'); }; });
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#btn-download').click();
    await expect(page.locator('#btn-download')).toBeEnabled();
    await expect(page.locator('body')).not.toHaveClass(/capture-mode/);
    await page.evaluate(stubEngine);
    download = page.waitForEvent('download');
    await page.locator('#btn-download').click();
    await download;
    await expect(page.locator('#btn-download')).toHaveText(oldText);
});
