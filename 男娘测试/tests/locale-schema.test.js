const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'locales', name), 'utf8'));
const schema = read('locale.schema.json');
const validate = new Ajv({ allErrors: true, strictTuples: false }).compile(schema);
const zh = read('zh-cn.json');

function leaves(value, prefix = '', result = {}) {
    if (typeof value === 'object' && value !== null) {
        for (const [key, child] of Object.entries(value)) leaves(child, prefix ? `${prefix}.${key}` : key, result);
    } else result[prefix] = value;
    return result;
}
const placeholders = text => [...new Set(String(text).match(/\{\w+\}/g) || [])].sort();

for (const name of ['zh-cn.json', 'en_us.json', 'ja.json']) {
    test(`${name} has the exact nested schema and preserves placeholders`, () => {
        const locale = read(name);
        assert.ok(validate(locale), JSON.stringify(validate.errors));
        const actual = leaves(locale);
        for (const [key, value] of Object.entries(leaves(zh))) {
            assert.deepEqual(placeholders(actual[key]), placeholders(value), `Placeholders differ: ${name}:${key}`);
        }
    });
}

test('schema rejects dotted aliases, missing keys, empty messages and incorrect arrays', () => {
    for (const mutate of [
        locale => locale['meta.title'] = 'duplicate',
        locale => delete locale.result.radarUnavailable,
        locale => locale.home.title = '',
        locale => locale.question.standardOptions.reverse(),
        locale => locale.loading.steps.pop(),
        locale => locale.controls = { language: 'obsolete' }
    ]) {
        const locale = structuredClone(zh);
        mutate(locale);
        assert.equal(validate(locale), false);
    }
});

test('translator template matches the canonical shape', () => {
    const template = read('template.json');
    delete template.__translatorNotes;
    assert.deepEqual(Object.keys(leaves(template)).sort(), Object.keys(leaves(zh)).sort());
});

test('all literal application translation references exist in the schema', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8') + fs.readdirSync(path.join(root, 'js'))
        .filter(name => name.endsWith('.js')).map(name => fs.readFileSync(path.join(root, 'js', name), 'utf8')).join('\n');
    const references = [
        ...html.matchAll(/(?:\bt|\bgetMessage)\(\s*['"]([^'"]+)['"]/g),
        ...html.matchAll(/data-i18n(?:-html|-title|-aria-label|-alt|-content)?="([^"]+)"/g)
    ].map(match => match[1]);
    for (const key of references) {
        assert.notEqual(key.split('.').reduce((o, k) => o?.[k], zh), undefined, `Missing translation: ${key}`);
    }
});
