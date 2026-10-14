const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const eslintScope = require('eslint-scope');
const siteRoot = path.resolve(__dirname, '..');
const root = path.join(siteRoot, 'js');
const globals = new Set('window document navigator location localStorage confirm alert console URL URLSearchParams FileReader setTimeout clearTimeout setInterval clearInterval requestAnimationFrame Chart html2canvas rawQuestionBank globalThis fetch encodeURIComponent Math Number Object Array JSON String Boolean Map Set Date Error Promise Uint32Array undefined'.split(' '));

test('modules have valid exports/imports and no implicit application globals', () => {
    const trees = new Map(fs.readdirSync(root).filter(n => n.endsWith('.js')).map(name => [name,
        acorn.parse(fs.readFileSync(path.join(root, name), 'utf8'), { sourceType: 'module', ecmaVersion: 'latest', ranges: true })]));
    for (const [name, ast] of trees) {
        const scope = eslintScope.analyze(ast, { sourceType: 'module', ecmaVersion: 2022, optimistic: true, ignoreEval: true });
        for (const ref of scope.globalScope.through) {
            assert.ok(globals.has(ref.identifier.name), `${name}: implicit global ${ref.identifier.name}`);
        }
        for (const node of ast.body.filter(node => node.type === 'ImportDeclaration')) {
            const target = trees.get(node.source.value.replace('./', ''));
            assert.ok(target, `${name}: missing module ${node.source.value}`);
            const names = target.body.filter(n => n.type === 'ExportNamedDeclaration').flatMap(n =>
                n.declaration?.id ? [n.declaration.id.name] : (n.declaration?.declarations || []).map(d => d.id.name));
            for (const specifier of node.specifiers) assert.ok(names.includes(specifier.imported.name));
        }
    }
});

test('HTML uses a module entry and stylesheet with delegated actions', () => {
    const html = fs.readFileSync(path.join(root, '../index.html'), 'utf8');
    assert.ok(html.includes('type="module" src="js/main.js"'));
    assert.ok(html.includes('href="css/style.css"'));
    assert.ok(!/on(?:click|change)=/.test(html));
    assert.ok(!/<style>/.test(html));
});

test('production build removes both debug module and development loader', () => {
    const dist = path.join(siteRoot, 'dist');
    assert.equal(fs.existsSync(path.join(dist, 'js/debug.js')), false);
    assert.ok(!fs.readFileSync(path.join(dist, 'js/main.js'), 'utf8').includes('debug.js'));
    assert.equal(fs.existsSync(path.join(dist, 'functions')), false);
    const entry = path.join(siteRoot, 'functions/api/score.js');
    assert.ok(fs.existsSync(entry), 'Pages must discover the score API from the project root');
    const handler = fs.readFileSync(entry, 'utf8');
    assert.ok(handler.includes('export async function onRequestGet'));
});
