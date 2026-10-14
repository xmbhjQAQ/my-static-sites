const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const source = fs.readFileSync(path.join(__dirname, '../functions/api/score.js'), 'utf8');
const api = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

function database() {
    const db = new DatabaseSync(':memory:');
    for (const name of ['0001_score_submissions.sql', '0002_score_stats.sql']) {
        db.exec(fs.readFileSync(path.join(__dirname, '../migrations', name), 'utf8'));
    }
    const binding = {
        prepare(sql) {
            const statement = db.prepare(sql);
            let values = [];
            return {
                bind(...args) { values = args; return this; },
                async run() { return { meta: statement.run(...values) }; },
                async first() { return statement.get(...values); },
                async all() { return { results: statement.all(...values) }; }
            };
        }
    };
    return { db, binding };
}
const request = body => new Request('http://localhost/api/score', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

test('debug and malformed submissions are rejected before any DB access', async () => {
    const { onRequestPost } = await api;
    const DB = { prepare() { throw new Error('must not touch DB'); } };
    for (const body of [{ score: 250, isDebug: true }, null, [], 'invalid']) {
        const response = await onRequestPost({ request: request(body), env: { DB } });
        assert.equal(response.status, 400);
    }
});

test('valid submissions, duplicates, spam, stats and invalid scores use real SQLite', async () => {
    const { onRequestPost, onRequestGet } = await api;
    const { db, binding: DB } = database();
    try {
        const payload = { clientSubmissionId: 'real-result-123', score: 180, isSpam: false, isDebug: false };
        const post = () => onRequestPost({ request: request(payload), env: { DB } });
        assert.equal((await (await post()).json()).inserted, true);
        assert.equal((await (await post()).json()).inserted, false);
        await onRequestPost({ request: request({ clientSubmissionId: 'spam-result-123', score: 0, isSpam: true }), env: { DB } });
        const response = await onRequestGet({ request: new Request('http://localhost/api/score'), env: { DB } });
        const data = await response.json();
        assert.equal(data.stats.averageScore, 180);
        assert.deepEqual(data.totals, { totalCount: 2, validCount: 1, spamCount: 1 });
        assert.equal(data.recent, undefined);
        for (const score of [-1, 251, 'nan']) {
            assert.equal((await onRequestPost({ request: request({ score }), env: { DB } })).status, 400);
        }
    } finally { db.close(); }
});

test('cleanup removes only the reported record, rebuilds aggregates and is idempotent', async () => {
    const { onRequestPost } = await api;
    const { db, binding: DB } = database();
    try {
        for (const [id, score, isSpam] of [['real-one', 100, false], ['real-two', 200, false], ['spam-one', 0, true]]) {
            await onRequestPost({ request: request({ clientSubmissionId: id.padEnd(10, 'x'), score, isSpam }), env: { DB } });
        }
        db.exec(`INSERT INTO score_submissions (id, score, score_max, score_percent, is_spam, algorithm_version, question_version, created_at)
            VALUES ('34b10c5d-5208-4b3a-bea8-2d40857ed2b7', 250, 250, 100, 0, 'classic_250_v1', 'questions_2026_05_06_v1', '2026-10-14T04:30:39.200Z')`);
        const cleanup = fs.readFileSync(path.join(__dirname, '../migrations/0003_remove_reported_debug_submission.sql'), 'utf8');
        for (let attempt = 0; attempt < 2; attempt++) {
            db.exec(cleanup);
            const stats = db.prepare('SELECT * FROM score_stats').get();
            assert.equal(stats.total_count, 3);
            assert.equal(stats.valid_count, 2);
            assert.equal(stats.spam_count, 1);
            assert.equal(stats.valid_score_sum, 300);
            assert.equal(stats.valid_score_min, 100);
            assert.equal(stats.valid_score_max, 200);
        }
        await onRequestPost({ request: request({ score: 180 }), env: { DB } });
        assert.equal(db.prepare('SELECT valid_score_sum FROM score_stats').get().valid_score_sum, 480);
    } finally { db.close(); }
});
