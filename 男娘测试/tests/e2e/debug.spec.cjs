const { test, expect } = require('@playwright/test');

test('all debug entry points only GET statistics, including loading and punishment reveal', async ({ page }) => {
    const methods = [];
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/score') {
            methods.push(route.request().method());
            return route.fulfill({ json: { ok: true, stats: { count: 100, averageScore: 150 } } });
        }
        return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    await page.goto('/?debug=1');
    await page.waitForFunction(() => questionBankReady);
    const cases = [
        () => nnDebug.score(250, { profile: 'perfect' }),
        () => nnDebug.profile('mid', { bypassSpam: false }),
        () => nnDebug.profile('perfect', { loading: true }),
        () => nnDebug.score(180, { loading: true }),
        () => nnDebug.punish(1),
        () => showNormalResultFromPunish(),
        () => nnDebug.punish(5, 12, { loading: true }),
        () => __nn_dev_quick('random')
    ];
    for (const action of cases) {
        const before = methods.length;
        await page.evaluate(action);
        await expect(page.locator('#page-result')).toHaveClass(/active/);
        await expect.poll(() => methods.length).toBeGreaterThan(before);
        expect(methods.every(method => method === 'GET')).toBe(true);
    }
    expect(await page.evaluate(() => localStorage.getItem('nnTestResult_v1'))).toBeNull();
    // Starting a real test explicitly exits the read-only debug session.
    await page.evaluate(() => startTest());
    expect(await page.evaluate(() => debugSession)).toBe(false);
});

test('normal UI answers POST once and restoring the report only GETs', async ({ page }) => {
    const submissions = [];
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/score') {
            if (route.request().method() === 'POST') submissions.push(route.request().postDataJSON());
            return route.fulfill({ json: { ok: true, stats: { count: 100, averageScore: 150 } } });
        }
        return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    await page.clock.install();
    await page.goto('/');
    await page.waitForFunction(() => questionBankReady);
    await page.locator('[data-i18n="home.start"]').click();
    for (let index = 0; index < 50; index++) {
        await page.clock.fastForward(1500);
        await page.locator('#options-container button').nth(index % 3 + 1).click();
        await page.clock.fastForward(400);
    }
    await page.clock.fastForward(4000);
    await expect(page.locator('#page-result')).toHaveClass(/active/);
    await expect.poll(() => submissions.length).toBe(1);
    expect(submissions[0].isDebug).toBe(false);
    expect(submissions[0].questionCount).toBe(50);
    expect(submissions[0].durationSeconds).toBeGreaterThan(35);
    await page.reload();
    await page.waitForFunction(() => questionBankReady);
    await page.locator('#btn-continue').click();
    await expect(page.locator('#page-result')).toHaveClass(/active/);
    expect(submissions.length).toBe(1);
});
