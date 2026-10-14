import { LOCALE_STORAGE_KEY } from './config.js';
import { copyResultText, downloadResult, nativeShare } from './export.js';
import { applyTranslations, changeLocale, loadLanguageConfig, loadLocaleMessages, resolveLocale } from './i18n.js';
import { t } from './messages.js';
import { loadQuestionsForLocale } from './questions.js';
import { confirmExitTest, continueTest, prevQuestion, resetTest, startTest } from './quiz-engine.js';
import { showNormalResultFromPunish, togglePunishEffect } from './result.js';
import { state } from './state.js';
import { readSavedResult, readSavedState } from './storage.js';
import { requestDockUpdate, showToast, toggleCreatorNote, toggleDarkMode, updateResultDockVisibility } from './ui.js';

export async function bootApp() {
    await loadLanguageConfig();
    state.activeLocale = resolveLocale();
    localStorage.setItem(LOCALE_STORAGE_KEY, state.activeLocale);
    await loadLocaleMessages(state.activeLocale);
    applyTranslations();
    state.latestResultShareText = t('share.defaultText', {}, state.latestResultShareText);
    await loadQuestionsForLocale(state.activeLocale);
    const savedResult = readSavedResult();
    const savedState = readSavedState();
    if (savedResult || savedState) {
        const btnContinue = document.getElementById('btn-continue');
        btnContinue.style.display = 'block';
        btnContinue.innerText = savedResult
            ? t('home.continueResult', {}, '查看上次结果')
            : t('home.continue', {}, '继续上次鉴定');
    }
    updateResultDockVisibility();
    if (!state.questionBankReady && state.questionBankError) showToast(state.questionBankError);
}

(function initCreatorNoteClone() {
    const template = document.getElementById('creator-note-card-result');
    const container = document.getElementById('creator-note-home-container');
    if (template && container) {
        const clone = template.cloneNode(true);
        clone.id = 'creator-note-card-home';
        const toggleBtn = clone.querySelector('.creator-note-toggle');
        if (toggleBtn) toggleBtn.id = 'creator-note-toggle-home';
        const bodyContainer = clone.querySelector('.creator-note-body');
        if (bodyContainer) bodyContainer.id = 'creator-note-body-home';
        container.appendChild(clone);
    }
})();

document.addEventListener('click', function (e) {
    const ripple = document.createElement('div');
    ripple.classList.add('click-ripple');
    // 根据设备宽度，圆圈大小稍作固定
    const size = 100;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - size / 2}px`;
    ripple.style.top = `${e.clientY - size / 2}px`;
    document.body.appendChild(ripple);
    setTimeout(() => { ripple.remove(); }, 600);
});

window.addEventListener('scroll', requestDockUpdate, { passive: true });

window.addEventListener('resize', requestDockUpdate);

window.addEventListener('touchmove', requestDockUpdate, { passive: true });

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', requestDockUpdate);
    window.visualViewport.addEventListener('scroll', requestDockUpdate);
}

const actions = {
    startTest, continueTest, prevQuestion, confirmExitTest, resetTest,
    showNormalResultFromPunish, toggleCreatorNote, toggleDarkMode, togglePunishEffect,
    nativeShare, copyResultText, downloadResult
};
document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (button && Object.hasOwn(actions, button.dataset.action)) actions[button.dataset.action]();
});
document.getElementById('language-select').addEventListener('change', event => changeLocale(event.target.value));

async function startApp() {
    await bootApp();
    // Development tools are loaded only for an explicit local debugging session.
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (local && new URLSearchParams(location.search).get('debug') === '1') {
        const { installDebugConsole } = await import('./debug.js');
        installDebugConsole();
    }
    document.documentElement.dataset.appReady = 'true';
}
startApp().catch(error => {
    console.error('Application startup failed:', error);
    showToast(error.message);
});
