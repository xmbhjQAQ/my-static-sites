const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { buildSite } = require('../scripts/build.cjs');
const buildPath = path.resolve(__dirname, '../scripts/build.cjs');

function fixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-build-test-'));
    for (const directory of ['css', 'js', 'locales', 'migrations', 'questions', 'vendor']) {
        fs.mkdirSync(path.join(root, directory), { recursive: true });
    }
    fs.writeFileSync(path.join(root, 'index.html'), 'complete site');
    fs.writeFileSync(path.join(root, 'js/debug.js'), 'development only');
    fs.writeFileSync(path.join(root, 'js/main.js'), `async function startApp() {
        const local = true;
        if (local) { await import('./debug.js'); }
        return 'ready';
    }`);
    return root;
}
function verify(root) {
    assert.equal(fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8'), 'complete site');
    assert.ok(!fs.readFileSync(path.join(root, 'dist/js/main.js'), 'utf8').includes('debug.js'));
    assert.equal(fs.existsSync(path.join(root, 'dist/js/debug.js')), false);
    assert.ok(!fs.readdirSync(root).some(n => n.startsWith('.build') || n.startsWith('.previous-build')));
}

test('failed build preserves existing output and releases staging directories and lock', () => {
    const root = fixture();
    try {
        buildSite(root);
        verify(root);
        fs.writeFileSync(path.join(root, 'js/main.js'), 'invalid source !!!');
        assert.throws(() => buildSite(root));
        verify(root);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a concurrent build cannot modify the output held by another builder', () => {
    const root = fixture();
    try {
        buildSite(root);
        const lock = path.join(root, '.build.lock');
        fs.writeFileSync(lock, 'owned by another builder');
        assert.throws(() => buildSite(root), /already running/);
        assert.equal(fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8'), 'complete site');
        assert.equal(fs.readFileSync(lock, 'utf8'), 'owned by another builder');
        fs.unlinkSync(lock);
        verify(root);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('publication failure rolls back to the complete previous output', () => {
    const root = fixture();
    const rename = fs.renameSync;
    try {
        buildSite(root);
        fs.renameSync = (from, to) => {
            if (path.basename(from).startsWith('.build-') && to === path.join(root, 'dist')) throw new Error('publication failure');
            return rename(from, to);
        };
        assert.throws(() => buildSite(root), /publication failure/);
        verify(root);
    } finally {
        fs.renameSync = rename;
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('simultaneous real build processes leave one complete production output', async () => {
    const root = fixture();
    const run = () => new Promise((resolve, reject) => {
        // Pass fixture paths as argv, never interpolated shell commands.
        const process = spawn(globalThis.process.execPath, ['-e', 'require(process.argv[1]).buildSite(process.argv[2])', buildPath, root]);
        let stderr = '';
        process.stderr.on('data', data => { stderr += data; });
        process.on('error', reject);
        process.on('close', code => resolve({ code, stderr }));
    });
    try {
        const results = await Promise.all([run(), run()]);
        assert.ok(results.some(r => r.code === 0));
        for (const result of results) {
            if (result.code !== 0) assert.match(result.stderr, /already running/);
        }
        verify(root);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
