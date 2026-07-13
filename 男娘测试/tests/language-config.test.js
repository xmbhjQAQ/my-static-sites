const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function readJson(file) {
  return JSON.parse(read(file));
}

const html = read('index.html');

// Extract FALLBACK_LANGUAGE_CONFIG from index.html
function extractFallbackConfig(html) {
  const match = html.match(/FALLBACK_LANGUAGE_CONFIG\s*=\s*(\{[^;]+\});/);
  if (!match) throw new Error('Could not find FALLBACK_LANGUAGE_CONFIG in index.html');
  // Use Function constructor to safely evaluate the JS object literal
  return new Function('return ' + match[1])();
}

const manifest = extractFallbackConfig(html);

function canonicalizeLocale(locale) {
  const parts = String(locale || '').trim().replace(/_/g, '-').split('-').filter(Boolean);
  if (!parts.length) return '';
  return [parts[0].toLowerCase(), ...parts.slice(1).map(part => part.length === 2 ? part.toUpperCase() : part)].join('-');
}

function matchSupportedLocale(locale, supportedLocales) {
  const value = canonicalizeLocale(locale);
  if (!value) return '';
  const supported = Object.keys(supportedLocales || {});
  const isEnabled = item => supportedLocales[item] && supportedLocales[item].enabled;
  const exact = supported.find(item => isEnabled(item) && canonicalizeLocale(item) === value);
  if (exact) return exact;
  const languageCode = value.split('-')[0];
  return supported.find(item => isEnabled(item) && canonicalizeLocale(item).split('-')[0] === languageCode) || '';
}

function resolveLocale({ urlLang, savedLang, deviceLanguages, navigatorLanguage }, supportedLocales, defaultLocale = 'zh-CN') {
  const candidates = [
    urlLang,
    savedLang,
    ...deviceLanguages,
    navigatorLanguage,
    defaultLocale
  ];
  for (const candidate of candidates) {
    const normalized = matchSupportedLocale(candidate, supportedLocales);
    if (normalized) return normalized;
  }
  return defaultLocale;
}

assert.strictEqual(manifest.defaultLocale, 'zh-CN', 'language.json should declare zh-CN as the default locale');
assert.ok(manifest.locales, 'language.json should expose a locales map');

assert.deepStrictEqual(
  manifest.locales['zh-CN'],
  {
    dict: 'locales/zh-cn.json',
    questions: 'questions/questions_zh_cn.js',
    label: '简体中文',
    enabled: true
  },
  'zh-CN should be configured from language.json'
);

assert.deepStrictEqual(
  manifest.locales['en-US'],
  {
    dict: 'locales/en_us.json',
    questions: 'questions/questions_en_us.js',
    label: 'English',
    enabled: true
  },
  'en-US should be unlocked and point at the new English files'
);

assert.strictEqual(
  resolveLocale({ urlLang: null, savedLang: null, deviceLanguages: ['en-GB', 'zh-CN'], navigatorLanguage: 'zh-CN' }, manifest.locales),
  'en-US',
  'device language region variants such as en-GB should match the available en-US dictionary'
);
assert.strictEqual(
  resolveLocale({ urlLang: null, savedLang: null, deviceLanguages: ['ja-JP', 'ko-KR'], navigatorLanguage: 'ja-JP' }, manifest.locales),
  'ja',
  'ja-JP device language should match the registered ja locale'
);
assert.strictEqual(
  resolveLocale({ urlLang: null, savedLang: null, deviceLanguages: ['ko-KR'], navigatorLanguage: 'ko-KR' }, manifest.locales),
  'zh-CN',
  'unknown device languages such as ko-KR should fall back to Chinese'
);
assert.strictEqual(
  resolveLocale({ urlLang: 'en-US', savedLang: 'zh-CN', deviceLanguages: ['zh-CN'], navigatorLanguage: 'zh-CN' }, manifest.locales),
  'en-US',
  'the URL lang parameter should override saved and device languages'
);
assert.strictEqual(
  resolveLocale({ urlLang: null, savedLang: 'en_US', deviceLanguages: ['zh-CN'], navigatorLanguage: 'zh-CN' }, manifest.locales),
  'en-US',
  'saved user preference should override device languages and support underscore locale codes'
);

assert.ok(
  html.includes('FALLBACK_LANGUAGE_CONFIG'),
  'index.html should define inline language config via FALLBACK_LANGUAGE_CONFIG'
);
assert.ok(
  !html.includes("LANGUAGE_CONFIG_PATH = 'language.json'"),
  'index.html should not reference a separate language.json file'
);
assert.ok(
  html.includes('loadLanguageConfig'),
  'index.html should have a manifest loading step'
);
assert.ok(
  html.includes('function matchSupportedLocale(locale)'),
  'locale matching should be centralized before falling back to the default locale'
);
assert.ok(
  html.includes('SUPPORTED_LOCALES[item]?.enabled'),
  'locale matching should only select enabled language configs'
);
assert.ok(
  html.includes('function getDeviceLocaleCandidates()'),
  'index.html should collect device language preferences separately'
);
assert.ok(
  html.includes('navigator.languages'),
  'locale resolution should consider the browser device language preference list'
);
assert.ok(
  html.includes('...getDeviceLocaleCandidates()'),
  'device language preferences should be checked after URL and saved user preference'
);
assert.ok(
  html.includes('return matchSupportedLocale(locale) || DEFAULT_LOCALE'),
  'unknown locales should fall back to zh-CN through DEFAULT_LOCALE'
);
assert.ok(
  html.includes('activeLocale = DEFAULT_LOCALE'),
  'failed non-default locale dictionaries should reset the active locale to the default'
);
assert.ok(
  html.includes('await loadQuestionsForLocale(DEFAULT_LOCALE)'),
  'failed non-default question banks should retry the default Chinese question bank'
);
assert.ok(
  !html.includes('const SUPPORTED_LOCALES = {'),
  'supported locales should not be hard-coded as a second object literal in index.html'
);
assert.ok(
  html.includes('source[key]'),
  'translation lookup should support flat dictionary keys such as meta.title'
);
assert.ok(
  html.includes('option.textContent = config.label'),
  'language selector option labels should come directly from the locale config'
);
assert.ok(
  !html.includes('option.textContent = t(`language.options.${locale}`'),
  'language selector should not depend on locale dictionaries for option labels'
);
assert.ok(
  html.includes('content: attr(data-punish-stamp)'),
  'punishment stamp pseudo-element should read localized text from a data attribute'
);
assert.ok(
  !html.includes('content: "你乱点的吧"'),
  'punishment stamp should not hard-code Chinese text in CSS'
);
assert.ok(
  html.includes('getRadarLabels()'),
  'radar chart axis labels should come from localized dimension names'
);
assert.ok(
  !html.includes("labels: ['审美', '行为', '心理', '社交']"),
  'radar chart axis labels should not be hard-coded in Chinese'
);

console.log('language-config tests passed');
