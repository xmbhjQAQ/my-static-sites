const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loader() {
    const scripts = [];
    const context = vm.createContext({
        window: {}, setTimeout, clearTimeout,
        document: {
            createElement: () => ({ remove() { this.removed = true; } }),
            head: { appendChild: script => scripts.push(script) }
        }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/dependencies.js'), 'utf8'), context);
    return { context, scripts };
}

test('concurrent requests share a single script and resolved requests are cached', async () => {
    const { context, scripts } = loader();
    const a = context.loadScriptOnce('example.js');
    const b = context.loadScriptOnce('example.js');
    assert.equal(a, b);
    assert.equal(scripts.length, 1);
    scripts[0].onload();
    await a;
    await context.loadScriptOnce('example.js');
    assert.equal(scripts.length, 1);
});

for (const mode of ['error', 'timeout']) {
    test(`${mode} removes the failed script and permits a retry`, async () => {
        const { context, scripts } = loader();
        const request = context.loadScriptOnce('broken.js', 5);
        const rejection = assert.rejects(request, mode === 'error' ? /Failed/ : /Timed out/);
        if (mode === 'error') scripts[0].onerror();
        await rejection;
        assert.equal(scripts[0].removed, true);
        const retry = context.loadScriptOnce('broken.js');
        scripts[1].onload();
        await retry;
    });
}

test('engines load local pinned assets and verify their globals', async () => {
    const { context, scripts } = loader();
    const chart = context.loadChartEngine();
    assert.equal(scripts[0].src, 'vendor/chart.umd-4.4.1.js');
    context.window.Chart = function () {};
    scripts[0].onload();
    await chart;
    const capture = context.loadCaptureEngine();
    assert.equal(scripts[1].src, 'vendor/html2canvas-1.4.1.min.js');
    scripts[1].onload();
    await assert.rejects(capture, /did not initialize/);
    const retry = context.loadCaptureEngine();
    context.window.html2canvas = function () {};
    scripts[2].onload();
    await retry;
});
