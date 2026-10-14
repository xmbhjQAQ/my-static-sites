const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { chooseAnswer } = require('./helpers.cjs');
test.use({ baseURL: 'http://127.0.0.1:4174' });

test('production build excludes debug tools and supports genuine answers, PNG and restored reports', async ({ page }) => {
    const errors = [], posts = [], debugRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/score') {
            if (route.request().method() === 'POST') posts.push(route.request().postDataJSON());
            return route.fulfill({ json: { ok: true, stats: { count: 100, averageScore: 150 } } });
        }
        if (url.pathname.endsWith('/debug.js')) debugRequests.push(url.href);
        return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    await page.clock.install();
    await page.goto('/?debug=1&lang=en-US');
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    expect(await page.evaluate(() => typeof window.nnDebug)).toBe('undefined');
    expect(await page.evaluate(() => typeof window.startTest)).toBe('undefined');
    expect(debugRequests).toEqual([]);
    expect((await page.request.get('/js/debug.js')).status()).toBe(404);
    const note = page.locator('#creator-note-card-home');
    await note.locator('[data-action="toggleCreatorNote"]').click();
    await expect(note).toHaveClass(/is-collapsed/);
    await page.locator('[data-action="startTest"]').click();
    for (let index = 0; index < 50; index++) {
        await page.clock.fastForward(1500);
        await chooseAnswer(page, index);
        await page.clock.fastForward(400);
    }
    await page.clock.fastForward(4000);
    await expect(page.locator('#page-result')).toHaveClass(/active/);
    await expect.poll(() => posts.length).toBe(1);
    expect(posts[0].isSpam).toBe(false);
    await page.clock.fastForward(2000);
    await page.waitForFunction(async () => (await import('/js/state.js')).state.radarChartInstance !== null);
    const downloaded = page.waitForEvent('download');
    await page.locator('#btn-download').click();
    const data = fs.readFileSync(await (await downloaded).path());
    expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(data.length).toBeGreaterThan(10000);
    await expect(page.locator('body')).not.toHaveClass(/capture-mode/);
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.locator('#btn-continue').click();
    await expect(page.locator('#page-result')).toHaveClass(/active/);
    expect(posts.length).toBe(1);
    expect(errors).toEqual([]);
});

test('language fallback and saved progress survive module loading and reload', async ({ page }) => {
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.route('**/questions/questions_en_us.js', route => route.abort());
    await page.goto('/?lang=en-US');
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await page.locator('[data-action="startTest"]').click();
    await chooseAnswer(page, 0);
    await expect(page.locator('#current-q')).toHaveText('2');
    await page.locator('#btn-prev').click();
    await expect(page.locator('#current-q')).toHaveText('1');
    const selectedText = await page.locator('.option-btn.selected').innerText();
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.locator('#btn-continue').click();
    await expect(page.locator('#page-quiz')).toHaveClass(/active/);
    await expect(page.locator('.option-btn.selected')).toHaveText(selectedText);
});
