const { test, expect } = require('@playwright/test');

const summary = { ok: true, stats: { count: 100, averageScore: 150 }, totals: { totalCount: 100, validCount: 100, spamCount: 0 } };
async function openApp(page, locale = 'zh-CN') {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/score') return route.fulfill({ json: summary });
        if (url.hostname !== '127.0.0.1') return route.abort();
        return route.continue();
    });
    await page.goto(`/?lang=${locale}&debug=1`);
    await page.waitForFunction(() => typeof nnDebug !== 'undefined' && document.documentElement.dataset.appReady === 'true');
    return errors;
}

for (const locale of ['zh-CN', 'en-US', 'ja']) {
    test(`local radar and PNG export work with all external requests blocked (${locale})`, async ({ page }) => {
        const errors = await openApp(page, locale);
        await page.evaluate(() => nnDebug.score(180));
        await expect(page.locator('#page-result')).toHaveClass(/active/);
        await expect(page.locator('#final-score')).toHaveText('180');
        await page.waitForFunction(async () => (await import('/js/state.js')).state.radarChartInstance !== null);
        expect(await page.evaluate(async () => (await import('/js/state.js')).state.radarChartInstance.data.labels.length)).toBe(4);
        await page.locator('#dark-mode-toggle').click();
        await expect(page.locator('body')).toHaveClass(/dark-mode/);
        const download = page.waitForEvent('download');
        await page.locator('#btn-download').click();
        expect((await download).suggestedFilename()).toMatch(/\.png$/);
        await expect(page.locator('body')).not.toHaveClass(/capture-mode/);
        expect(errors).toEqual([]);
    });
}

test('failed chart keeps the text report and failed capture restores its button', async ({ page }) => {
    await openApp(page);
    await page.route('**/vendor/**', route => route.abort());
    await page.evaluate(() => nnDebug.score(180));
    await expect(page.locator('#page-result')).toHaveClass(/active/);
    await expect(page.locator('#radar-summary')).toContainText('制图引擎加载失败');
    const buttonText = await page.locator('#btn-download').innerText();
    await page.locator('#btn-download').click();
    await expect(page.locator('#btn-download')).toHaveText(buttonText);
    await expect(page.locator('#btn-download')).toHaveCSS('pointer-events', 'auto');
    await expect(page.locator('body')).not.toHaveClass(/capture-mode/);
});

module.exports = { openApp };

test('delegated copy and native share use the report text and restore the creator note', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true,
            value: { writeText: async text => { window.copiedText = text; } } });
        Object.defineProperty(navigator, 'share', { configurable: true,
            value: async data => { window.sharedData = data; } });
    });
    await openApp(page);
    await page.evaluate(() => nnDebug.score(180));
    await expect(page.locator('#final-score')).toHaveText('180');
    await page.locator('#btn-copy').click();
    expect(await page.evaluate(() => window.copiedText)).toContain('180');
    await page.evaluate(() => document.getElementById('btn-share').click());
    await expect.poll(() => page.evaluate(() => window.sharedData?.text)).toContain('180');
    await expect(page.locator('#creator-note-card-result')).not.toHaveClass(/is-share-hidden/);
});
