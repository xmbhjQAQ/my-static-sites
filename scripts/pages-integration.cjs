const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { randomUUID } = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { once } = require('node:events');

const root = path.resolve(__dirname, '..');
// npm exec supplies the pinned test CLI on PATH; it is not a project dependency.
const cli = (process.env.PATH || process.env.Path || '').split(path.delimiter)
    .map(directory => path.resolve(directory, '../wrangler/bin/wrangler.js'))
    .find(file => {
        if (!fs.existsSync(file)) return false;
        const manifest = JSON.parse(fs.readFileSync(path.resolve(path.dirname(file), '../package.json'), 'utf8'));
        return manifest.name === 'wrangler' && manifest.version === '4.151.0';
    });
if (!cli) throw new Error('Run this integration test with npm run test:pages to supply Wrangler 4.151.0.');
const databaseId = '00000000-0000-4000-8000-000000000001';
const environment = { ...process.env, WRANGLER_SEND_METRICS: 'false' };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function freePort() {
    const socket = net.createServer().listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const port = socket.address().port;
    await new Promise(resolve => socket.close(resolve));
    return port;
}

async function main() {
    const stateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-pages-test-'));
    const configFile = path.join(root, `.pages-test-${randomUUID()}.json`);
    const runtimeArgs = ['pages', 'dev', 'dist', '--ip', '127.0.0.1', '--port', String(await freePort()),
        '--inspector-port', '0', '--d1', `DB=${databaseId}`, '--persist-to', stateDirectory,
        '--compatibility-date', '2026-10-01'];
    const url = `http://127.0.0.1:${runtimeArgs[runtimeArgs.indexOf('--port') + 1]}`;
    let runtime, logs = '', exited = false;
    try {
        fs.writeFileSync(configFile, JSON.stringify({
            name: 'quiz-pages-local-test', compatibility_date: '2026-10-01',
            d1_databases: [{ binding: 'DB', database_name: 'quiz-pages-local-test', database_id: databaseId }]
        }));
        for (const migration of fs.readdirSync(path.join(root, '男娘测试/migrations')).filter(name => name.endsWith('.sql')).sort()) {
            execFileSync(process.execPath, [cli, 'd1', 'execute', 'DB', '--config', configFile,
                '--local', '--persist-to', stateDirectory, '--file', path.join(root, '男娘测试/migrations', migration)],
                { cwd: root, env: environment, stdio: 'pipe', timeout: 45000 });
        }
        runtime = spawn(process.execPath, [cli, ...runtimeArgs], { cwd: root, env: environment, stdio: 'pipe' });
        runtime.stdout.on('data', data => { logs += data; });
        runtime.stderr.on('data', data => { logs += data; });
        runtime.on('error', error => { logs += error.message; exited = true; });
        runtime.on('exit', () => { exited = true; });
        let ready = false;
        for (let attempt = 0; attempt < 120; attempt++) {
            if (exited) throw new Error(`Pages runtime exited before ready:\n${logs}`);
            try {
                const response = await fetch(`${url}/api/score`, { signal: AbortSignal.timeout(500) });
                const data = await response.json();
                if (response.ok && data.ok && data.stats?.count === 0) { ready = true; break; }
            } catch {}
            await delay(250);
        }
        if (!ready) throw new Error(`Real Pages /api/score route did not become ready:\n${logs}`);
        const post = body => fetch(`${url}/api/score`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000)
        });
        const first = await (await post({ clientSubmissionId: 'local-test-real-1', score: 180, isSpam: false })).json();
        assert.equal(first.ok, true);
        assert.equal(first.inserted, true);
        assert.equal(first.stats.averageScore, 180);
        const duplicate = await (await post({ clientSubmissionId: 'local-test-real-1', score: 180 })).json();
        assert.equal(duplicate.inserted, false);
        const spam = await (await post({ clientSubmissionId: 'local-test-spam-1', score: 0, isSpam: true })).json();
        assert.equal(spam.inserted, true);
        assert.equal((await post({ score: 250, isDebug: true })).status, 400);
        const summary = await (await fetch(`${url}/api/score`)).json();
        assert.equal(summary.stats.count, 1);
        assert.equal(summary.stats.averageScore, 180);
        assert.deepEqual(summary.totals, { totalCount: 2, validCount: 1, spamCount: 1 });
        assert.equal((await fetch(`${url}/api/score`, { method: 'OPTIONS' })).status, 204);
        const page = await fetch(url);
        assert.equal(page.status, 200);
        assert.match(await page.text(), /type="module" src="js\/main.js"/);
        // Pages may return the SPA's HTML fallback for a missing asset.
        const debugAsset = await fetch(`${url}/js/debug.js`);
        assert.ok(!debugAsset.headers.get('content-type')?.includes('javascript'));
        assert.ok(!(await debugAsset.text()).includes('export function installDebugConsole'));
        console.log('Real Pages/D1 integration passed: root Functions route, GET/POST/OPTIONS, duplicate, debug rejection, spam exclusion and production assets.');
    } finally {
        if (runtime && !exited) {
            runtime.kill('SIGTERM');
            await Promise.race([once(runtime, 'exit'), delay(5000)]);
            if (!exited) { runtime.kill('SIGKILL'); await once(runtime, 'exit'); }
        }
        fs.rmSync(configFile, { force: true });
        // This exact directory was created by mkdtemp for this test only.
        fs.rmSync(stateDirectory, { recursive: true, force: true });
    }
}
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
