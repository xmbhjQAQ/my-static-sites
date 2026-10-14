import { loadScriptOnce } from './dependencies.js';
import { applyTranslations, loadLocaleMessages } from './i18n.js';
import { t } from './messages.js';
import { state } from './state.js';

export function getQuestionBank() {
    if (Array.isArray(window.rawQuestionBank)) return window.rawQuestionBank;
    try {
        if (typeof rawQuestionBank !== 'undefined' && Array.isArray(rawQuestionBank)) return rawQuestionBank;
    } catch (error) {
        return [];
    }
    return [];
}

export function validateQuestionBank(bank) {
    if (!Array.isArray(bank) || bank.length === 0) return t('errors.questionEmpty', {}, '题库为空，暂时无法开始测试。');
    const invalid = bank.find(q => !q || !q.id || !q.type || !q.d || !q.t || (q.type === 'choice' && (!Array.isArray(q.options) || q.options.some(opt => opt.v == null || !opt.l))));
    return invalid ? t('errors.questionInvalid', {}, '题库字段异常，暂时无法开始测试。') : '';
}

export async function loadQuestionsForLocale(locale) {
    const config = state.SUPPORTED_LOCALES[locale] || state.SUPPORTED_LOCALES[state.DEFAULT_LOCALE];
    try {
        window.rawQuestionBank = null;
        await loadScriptOnce(config.questions);
        const error = validateQuestionBank(getQuestionBank());
        if (error) throw new Error(error);
        state.questionBankReady = true;
        state.questionBankError = '';
    } catch (error) {
        state.questionBankReady = false;
        state.questionBankError = error.message || t('errors.questionLoad', {}, '题库加载失败，请刷新后重试。');
        console.error('Question bank load failed:', error);
        if (locale !== state.DEFAULT_LOCALE) {
            state.activeLocale = state.DEFAULT_LOCALE;
            await loadLocaleMessages(state.DEFAULT_LOCALE);
            applyTranslations();
            await loadQuestionsForLocale(state.DEFAULT_LOCALE);
        }
    }
}
