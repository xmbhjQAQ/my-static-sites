import { CREATOR_NOTE_COLLAPSED_KEY } from './config.js';
import { t } from './messages.js';
import { state } from './state.js';

function getPages() {
    return {
        home: document.getElementById('page-home'), quiz: document.getElementById('page-quiz'),
        loading: document.getElementById('page-loading'), result: document.getElementById('page-result')
    };
}

export function showPage(id) {
    const pages = getPages();
    Object.values(pages).forEach(p => p.classList.remove('active'));
    pages[id].classList.add('active');
    window.scrollTo(0, 0);
    requestAnimationFrame(updateResultDockVisibility);
}

export function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

export function isCreatorNoteCollapsed() {
    return localStorage.getItem(CREATOR_NOTE_COLLAPSED_KEY) === '1';
}

export function applyCreatorNoteState(collapsed = isCreatorNoteCollapsed()) {
    document.querySelectorAll('.creator-note-card').forEach(card => {
        card.classList.toggle('is-collapsed', collapsed);
    });
    document.querySelectorAll('.creator-note-toggle').forEach(btn => {
        btn.dataset.i18n = collapsed ? 'result.creatorNoteShow' : 'result.creatorNoteHide';
        btn.innerText = collapsed
            ? t('result.creatorNoteShow', {}, '展开说明')
            : t('result.creatorNoteHide', {}, '隐藏说明');
    });
}

export function toggleCreatorNote() {
    const nextCollapsed = !isCreatorNoteCollapsed();
    localStorage.setItem(CREATOR_NOTE_COLLAPSED_KEY, nextCollapsed ? '1' : '0');
    applyCreatorNoteState(nextCollapsed);
    updateResultDockVisibility();
}

export function hideCreatorNoteForShare() {
    const card = document.getElementById('creator-note-card-result');
    if (!card) return () => {};
    const wasHidden = card.classList.contains('is-share-hidden');
    card.classList.add('is-share-hidden');
    updateResultDockVisibility();
    return () => {
        card.classList.toggle('is-share-hidden', wasHidden);
        applyCreatorNoteState();
        updateResultDockVisibility();
    };
}

export function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.innerText = message;
    toast.classList.add('show');
    state.toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

export function updateResultDockVisibility() {
    const pages = getPages();
    const dock = document.querySelector('.result-action-dock');
    const actions = document.getElementById('result-actions');
    if (!dock || !actions) return;

    const isResultPage = pages.result && pages.result.classList.contains('active');
    if (!isResultPage || document.body.classList.contains('capture-mode')) {
        dock.classList.remove('is-visible');
        document.body.classList.remove('dock-visible');
        return;
    }

    const rect = actions.getBoundingClientRect();
    const viewportHeight = (window.visualViewport && window.visualViewport.height) || window.innerHeight || document.documentElement.clientHeight;
    const viewportPadding = 18;
    const actionsFullyVisible = rect.top >= viewportPadding && rect.bottom <= viewportHeight - viewportPadding;
    const shouldShowDock = !actionsFullyVisible;
    dock.classList.toggle('is-visible', shouldShowDock);
    document.body.classList.toggle('dock-visible', shouldShowDock);
}

export function requestDockUpdate() {
    if (state.dockTicking) return;
    state.dockTicking = true;
    requestAnimationFrame(() => {
        state.dockTicking = false;
        updateResultDockVisibility();
    });
}

export function updateLoadingSteps(activeIndex) {
    document.querySelectorAll('#loading-steps .loading-step').forEach((step, idx) => {
        step.classList.toggle('active', idx === activeIndex);
        step.classList.toggle('done', idx < activeIndex);
    });
}

export function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('dark-mode-toggle');
    btn.innerText = isDark ? '☀️' : '🌙';
    btn.title = isDark ? t('aria.darkToLight', {}, '切换为浅色模式') : t('aria.darkToDark', {}, '切换为深色模式');
    btn.setAttribute('aria-label', btn.title);

    // 动态更新雷达图的网格和文字颜色
    if (typeof state.radarChartInstance !== 'undefined' && state.radarChartInstance) {
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
        const labelColor = isDark ? '#eee' : '#666';

        if (state.radarChartInstance.options.scales.r) {
            if (!state.radarChartInstance.options.scales.r.grid) state.radarChartInstance.options.scales.r.grid = {};
            if (!state.radarChartInstance.options.scales.r.angleLines) state.radarChartInstance.options.scales.r.angleLines = {};
            if (!state.radarChartInstance.options.scales.r.pointLabels) state.radarChartInstance.options.scales.r.pointLabels = {};

            state.radarChartInstance.options.scales.r.grid.color = gridColor;
            state.radarChartInstance.options.scales.r.angleLines.color = gridColor;
            state.radarChartInstance.options.scales.r.pointLabels.color = labelColor;
            state.radarChartInstance.update();
        }
    }
}
