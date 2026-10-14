const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
    testDir: './男娘测试/tests/e2e',
    timeout: 45000,
    workers: 2,
    use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } }
    ],
    webServer: [
        { command: 'node scripts/serve.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
        { command: 'node scripts/serve.cjs', url: 'http://127.0.0.1:4174', reuseExistingServer: false,
            env: { PORT: '4174', TEST_SITE_ROOT: '../dist' } }
    ]
});
