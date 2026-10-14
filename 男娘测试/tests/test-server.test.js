const assert = require('node:assert/strict');
const { test } = require('node:test');
const http = require('node:http');
const { once } = require('node:events');
const server = require('../scripts/serve.cjs');

test('test server rejects malformed URLs and traversal without stopping subsequent requests', async () => {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const request = path => new Promise((resolve, reject) => {
        http.get({ hostname: '127.0.0.1', port: server.address().port, path }, response => {
            response.resume();
            response.on('end', () => resolve(response.statusCode));
        }).on('error', reject);
    });
    try {
        assert.equal(await request('/%ZZ'), 400);
        assert.equal(await request('/%E0%A4%A'), 400);
        assert.equal(await request('/%2e%2e%2fLICENSE'), 403);
        assert.equal(await request('/missing-file'), 404);
        assert.equal(await request('/'), 200);
    } finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});
