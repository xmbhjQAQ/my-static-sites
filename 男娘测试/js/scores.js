import { QUESTION_BANK_VERSION, SCORE_ALGORITHM_VERSION, SCORE_COLLECTION_ENDPOINT } from './config.js';
import { getAnswerScore } from './quiz-logic.js';
import { state } from './state.js';

export function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `score_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function submitScoreSummary(data) {
    if (isDebugResult() || state.suppressScoreUploadForCurrentResult) return fetchScoreStatsOnly();
    if (!window.fetch) return null;

    const payload = {
        clientSubmissionId: createSubmissionId(),
        score: data.score,
        scoreMax: 250,
        scorePercent: Number(((data.score / 250) * 100).toFixed(2)),
        rawScore: data.rawScore ?? null,
        rawPercent: data.rawPercent ?? null,
        stabilityScore: data.stabilityScore ?? null,
        consistencyDiscount: data.consistencyDiscount ?? null,
        isSpam: Boolean(data.isSpam),
        isDebug: false,
        spamStatus: data.spamStatus ?? 0,
        durationSeconds: Number((state.totalAnsweringTimeMs / 1000).toFixed(2)),
        questionCount: state.shuffledQuestions.length,
        algorithmVersion: SCORE_ALGORITHM_VERSION,
        questionVersion: QUESTION_BANK_VERSION
    };

    try {
        const response = await fetch(SCORE_COLLECTION_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.warn('Score collection failed:', err);
        return null;
    }
}

export async function fetchScoreStatsOnly() {
    if (!window.fetch) return null;
    try {
        const response = await fetch(SCORE_COLLECTION_ENDPOINT, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.warn('Score stats fetch failed:', err);
        return null;
    }
}

export function resetPendingScoreStatsRequest() {
    state.pendingScoreStatsRequest = null;
}

export function buildResultScoreContext() {
    if (window.spamStatus > 0) {
        return {
            mode: 'punish',
            displayScore: 0,
            submission: {
                score: 0,
                rawScore: null,
                rawPercent: null,
                stabilityScore: state.consistencyInfo ? Number(state.consistencyInfo.score.toFixed(2)) : null,
                consistencyDiscount: state.consistencyInfo ? state.consistencyInfo.discount : null,
                isSpam: true,
                spamStatus: window.spamStatus || 0
            }
        };
    }

    let scores = { A: 0, B: 0, C: 0, D: 0 };
    for (let i = 0; i < state.shuffledQuestions.length; i++) {
        const q = state.shuffledQuestions[i];
        if (q.scored === false || scores[q.d] === undefined) continue;
        scores[q.d] += getAnswerScore(state.userAnswers[i]) || 0;
    }

    const totalPercent = ((scores.A / state.dimMaxScores.A) + (scores.B / state.dimMaxScores.B) + (scores.C / state.dimMaxScores.C) + (scores.D / state.dimMaxScores.D)) / 4 * 100;
    const rawDisplayScore = Math.round(totalPercent * 2.5);
    const hasDebugScoreOverride = Number.isFinite(state.debugScoreOverride);
    const effectiveConsistencyDiscount = (state.consistencyInfo && state.consistencyInfo.discount) || 1;
    const displayScore = hasDebugScoreOverride
        ? Math.max(0, Math.min(250, Math.round(state.debugScoreOverride)))
        : Math.round(rawDisplayScore * effectiveConsistencyDiscount);

    return {
        mode: 'normal',
        scores,
        totalPercent,
        rawDisplayScore,
        effectiveConsistencyDiscount,
        displayScore,
        submission: {
            score: displayScore,
            rawScore: rawDisplayScore,
            rawPercent: Number(totalPercent.toFixed(2)),
            stabilityScore: state.consistencyInfo ? Number(state.consistencyInfo.score.toFixed(2)) : null,
            consistencyDiscount: effectiveConsistencyDiscount,
            isSpam: false,
            spamStatus: 0
        }
    };
}

export function isDebugResult() {
    return state.debugSession || Number.isFinite(state.debugScoreOverride) || state.debugBypassSpam;
}

export function requestScoreStatsForCurrentResult(context = buildResultScoreContext()) {
    if (!state.pendingScoreStatsRequest) {
        state.pendingScoreStatsRequest = (state.suppressScoreUploadForCurrentResult || isDebugResult())
            ? fetchScoreStatsOnly()
            : submitScoreSummary(context.submission);
    }
    return state.pendingScoreStatsRequest;
}
