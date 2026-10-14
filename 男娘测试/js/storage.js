import { RESULT_STORAGE_KEY, STATE_STORAGE_KEY } from './config.js';
import { t } from './messages.js';
import { ensureRenderedOptionOrders, normalizeSavedAnswers } from './quiz-logic.js';
import { loadChartjsAndResult } from './result.js';
import { resetPendingScoreStatsRequest } from './scores.js';
import { calculateConsistencyInfo } from './spam-detect.js';
import { state } from './state.js';
import { showToast } from './ui.js';

export function readSavedState() {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn('Saved state is invalid, clearing cache:', error);
        localStorage.removeItem(STATE_STORAGE_KEY);
        showToast(t('errors.stateInvalid', {}, '上次进度已损坏，已为你清理。'));
        return null;
    }
}

export function readSavedResult() {
    const raw = localStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn('Saved result is invalid, clearing cache:', error);
        localStorage.removeItem(RESULT_STORAGE_KEY);
        return null;
    }
}

export function saveState() {
    if (state.debugSession) return;
    try {
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({
            shuffledQuestions: state.shuffledQuestions, userAnswers: state.userAnswers, currentQIdx: state.currentQIdx, dimMaxScores: state.dimMaxScores, totalAnsweringTimeMs: state.totalAnsweringTimeMs, consistencyInfo: state.consistencyInfo
        }));
    } catch (error) {
        console.warn('Unable to save progress:', error);
    }
}

export function saveCompletedResult({ mode = 'normal' } = {}) {
    if (state.debugSession) return;
    try {
        localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({
            version: 1,
            mode,
            locale: state.activeLocale,
            savedAt: Date.now(),
            shuffledQuestions: state.shuffledQuestions,
            userAnswers: state.userAnswers,
            dimMaxScores: state.dimMaxScores,
            totalAnsweringTimeMs: state.totalAnsweringTimeMs,
            consistencyInfo: state.consistencyInfo,
            spamStatus: window.spamStatus || 0,
            spamVal: window.spamVal ?? null,
            scoreOverride: Number.isFinite(state.debugScoreOverride) ? state.debugScoreOverride : null
        }));
    } catch (error) {
        console.warn('Unable to save completed result:', error);
    }
}

export function restoreSavedResult(result) {
    if (!result || !Array.isArray(result.shuffledQuestions) || !Array.isArray(result.userAnswers)) return false;
    state.shuffledQuestions = result.shuffledQuestions;
    state.userAnswers = normalizeSavedAnswers(result.userAnswers, state.shuffledQuestions.length);
    state.currentQIdx = Math.max(0, state.shuffledQuestions.length - 1);
    state.dimMaxScores = result.dimMaxScores || { A: 0, B: 0, C: 0, D: 0 };
    state.totalAnsweringTimeMs = result.totalAnsweringTimeMs || 0;
    state.consistencyInfo = result.consistencyInfo || calculateConsistencyInfo();
    window.spamStatus = Number(result.spamStatus) || 0;
    window.spamVal = result.spamVal ?? undefined;
    state.debugScoreOverride = result.scoreOverride != null && Number.isFinite(Number(result.scoreOverride))
        ? Number(result.scoreOverride)
        : null;
    state.suppressScoreUploadForCurrentResult = true;
    resetPendingScoreStatsRequest();
    ensureRenderedOptionOrders();
    loadChartjsAndResult();
    return true;
}
