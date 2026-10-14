import { FALLBACK_LANGUAGE_CONFIG, LOCALE_STORAGE_KEY, RESULT_STORAGE_KEY, STATE_STORAGE_KEY } from './config.js';
import { getMessage, t } from './messages.js';
import { state } from './state.js';
import { applyCreatorNoteState, showToast } from './ui.js';

export function canonicalizeLocale(locale) {
    const parts = String(locale || '').trim().replace(/_/g, '-').split('-').filter(Boolean);
    if (!parts.length) return '';
    return [parts[0].toLowerCase(), ...parts.slice(1).map(part => part.length === 2 ? part.toUpperCase() : part)].join('-');
}

export function normalizeLocale(locale) {
    return matchSupportedLocale(locale) || state.DEFAULT_LOCALE;
}

export function matchSupportedLocale(locale) {
    const value = canonicalizeLocale(locale);
    if (!value) return '';
    const supported = Object.keys(state.SUPPORTED_LOCALES || {});
    const isEnabled = item => state.SUPPORTED_LOCALES[item]?.enabled;
    const exact = supported.find(item => isEnabled(item) && canonicalizeLocale(item) === value);
    if (exact) return exact;
    const languageCode = value.split('-')[0];
    const languageMatch = supported.find(item => isEnabled(item) && canonicalizeLocale(item).split('-')[0] === languageCode);
    if (languageMatch) return languageMatch;
    return '';
}

export function getDeviceLocaleCandidates() {
    const languages = Array.isArray(navigator.languages) ? navigator.languages : [];
    return [...languages, navigator.language].filter(Boolean);
}

export function normalizeLanguageConfig(config) {
    const source = config && typeof config === 'object' ? config : FALLBACK_LANGUAGE_CONFIG;
    const sourceLocales = source.locales && typeof source.locales === 'object' ? source.locales : {};
    const locales = {};

    Object.entries(sourceLocales).forEach(([locale, localeConfig]) => {
        const normalizedLocale = canonicalizeLocale(locale);
        if (!normalizedLocale || !localeConfig || !localeConfig.dict || !localeConfig.questions) return;
        locales[normalizedLocale] = {
            dict: String(localeConfig.dict),
            questions: String(localeConfig.questions),
            label: String(localeConfig.label || normalizedLocale),
            enabled: localeConfig.enabled !== false
        };
    });

    if (!Object.keys(locales).length && source !== FALLBACK_LANGUAGE_CONFIG) {
        return normalizeLanguageConfig(FALLBACK_LANGUAGE_CONFIG);
    }

    const configuredDefault = canonicalizeLocale(source.defaultLocale);
    const defaultLocale = locales[configuredDefault] ? configuredDefault : (locales['zh-CN'] ? 'zh-CN' : Object.keys(locales)[0]);
    return { defaultLocale, locales };
}

export function loadLanguageConfig() {
    const normalized = normalizeLanguageConfig(FALLBACK_LANGUAGE_CONFIG);
    state.DEFAULT_LOCALE = normalized.defaultLocale;
    state.SUPPORTED_LOCALES = normalized.locales;
}

export function resolveLocale() {
    const params = new URLSearchParams(window.location.search);
    const candidates = [
        params.get('lang'),
        localStorage.getItem(LOCALE_STORAGE_KEY),
        ...getDeviceLocaleCandidates(),
        state.DEFAULT_LOCALE
    ];
    for (const candidate of candidates) {
        const normalized = matchSupportedLocale(candidate);
        if (normalized) return normalized;
    }
    return state.DEFAULT_LOCALE;
}

export async function fetchLocaleJson(locale) {
    const config = state.SUPPORTED_LOCALES[locale] || state.SUPPORTED_LOCALES[state.DEFAULT_LOCALE];
    const response = await fetch(config.dict, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export async function loadLocaleMessages(locale) {
    try {
        state.fallbackMessages = await fetchLocaleJson(state.DEFAULT_LOCALE);
    } catch (error) {
        console.warn(`Locale load failed for ${state.DEFAULT_LOCALE}:`, error);
        state.fallbackMessages = {};
    }

    if (locale === state.DEFAULT_LOCALE) {
        state.activeMessages = state.fallbackMessages;
        return;
    }

    try {
        state.activeMessages = await fetchLocaleJson(locale);
    } catch (error) {
        console.warn(`Locale load failed for ${locale}:`, error);
        state.activeMessages = state.fallbackMessages;
        state.activeLocale = state.DEFAULT_LOCALE;
    }
}

export function renderLanguageSelect() {
    const select = document.getElementById('language-select');
    if (!select) return;
    select.innerHTML = '';

    Object.entries(state.SUPPORTED_LOCALES).forEach(([locale, config]) => {
        const option = document.createElement('option');
        option.value = locale;
        option.disabled = !config.enabled;
        option.textContent = config.label;
        select.appendChild(option);
    });

    select.value = state.activeLocale;
}

export function applyTranslations() {
    document.documentElement.lang = state.activeLocale;
    renderLanguageSelect();
    if (!state.activeMessages || !Object.keys(state.activeMessages).length) return;
    document.title = t('meta.title', {}, document.title);
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerText = t(el.dataset.i18n, {}, el.innerText); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml, {}, el.innerHTML); });
    document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle, {}, el.title); });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel, {}, el.getAttribute('aria-label') || '')); });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = t(el.dataset.i18nAlt, {}, el.alt); });
    document.querySelectorAll('[data-i18n-content]').forEach(el => { el.setAttribute('content', t(el.dataset.i18nContent, {}, el.getAttribute('content') || '')); });
    const resultPage = document.getElementById('page-result');
    if (resultPage) resultPage.dataset.punishStamp = t('punish.stampText', {}, '你乱点的吧');
    applyCreatorNoteState();
    const localizedOptions = getMessage('question.standardOptions', null);
    if (Array.isArray(localizedOptions) && localizedOptions.length) {
        state.standardOptions = localizedOptions.map(item => ({ l: item.l, v: item.v }));
    }
    const localizedDimNames = getMessage('dimensions.names', null);
    const localizedDimMeta = getMessage('dimensions.meta', null);
    if (localizedDimNames) state.dimNames = localizedDimNames;
    if (localizedDimMeta) state.dimMeta = localizedDimMeta;
    renderLanguageSelect();
}

export function changeLocale(locale) {
    const nextLocale = normalizeLocale(locale);
    const config = state.SUPPORTED_LOCALES[nextLocale];

    if (!config || !config.enabled) {
        renderLanguageSelect();
        showToast(t('language.unavailable', {}, '该语言资源还没补全，暂时不可切换。'));
        return;
    }

    if (nextLocale === state.activeLocale) return;
    const hasProgress = state.userAnswers.some(ans => ans != null);
    if (hasProgress && !confirm(t('confirm.languageChange', {}, '切换语言会重载页面，并清除当前未完成的答题进度。确定切换吗？'))) {
        renderLanguageSelect();
        return;
    }

    localStorage.removeItem(STATE_STORAGE_KEY);
    localStorage.removeItem(RESULT_STORAGE_KEY);
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLocale);
    window.location.href = url.toString();
}
