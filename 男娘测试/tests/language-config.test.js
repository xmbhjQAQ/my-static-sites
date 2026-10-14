const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = name => import(pathToFileURL(path.join(__dirname, '../js', name)).href);

test('actual locale matching preserves URL, saved and device precedence', async () => {
    const { FALLBACK_LANGUAGE_CONFIG: config } = await load('config.js');
    const { state } = await load('state.js');
    const i18n = await load('i18n.js');
    i18n.loadLanguageConfig();
    assert.equal(config.defaultLocale, 'zh-CN');
    assert.equal(config.locales['en-US'].dict, 'locales/en_us.json');
    assert.equal(config.locales.ja.questions, 'questions/questions_ja.js');
    for (const [candidate, expected] of [['en-GB', 'en-US'], ['en_US', 'en-US'], ['ja-JP', 'ja'], ['ko-KR', 'zh-CN']]) {
        assert.equal(i18n.normalizeLocale(candidate), expected);
    }
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { languages: ['en-GB'], language: 'en-GB' } });
    globalThis.localStorage = { getItem: () => 'ja' };
    globalThis.window = { location: { search: '?lang=zh-CN' } };
    assert.equal(i18n.resolveLocale(), 'zh-CN');
    window.location.search = '';
    assert.equal(i18n.resolveLocale(), 'ja');
    localStorage.getItem = () => null;
    assert.equal(i18n.resolveLocale(), 'en-US');
    state.SUPPORTED_LOCALES['en-US'].enabled = false;
    assert.equal(i18n.normalizeLocale('en-US'), 'zh-CN');
    i18n.loadLanguageConfig();
});

test('actual nested lookup falls back on missing and empty strings', async () => {
    const { state } = await load('state.js');
    const { getMessage, t } = await load('messages.js');
    state.activeMessages = { home: { title: 'English {name}', empty: '' }, 'home.flat': 'obsolete' };
    state.fallbackMessages = { home: { empty: '中文', missing: '回退' } };
    assert.equal(t('home.title', { name: 'Ada' }), 'English Ada');
    assert.equal(getMessage('home.empty'), '中文');
    assert.equal(getMessage('home.missing'), '回退');
    assert.equal(getMessage('home.flat', 'fallback'), 'fallback');
});
