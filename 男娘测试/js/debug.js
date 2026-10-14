import { t } from './messages.js';
import { finishTest, initGame, resetTest } from './quiz-engine.js';
import { prepareQuestionOptions } from './quiz-logic.js';
import { loadChartjsAndResult } from './result.js';
import { resetPendingScoreStatsRequest } from './scores.js';
import { calculateConsistencyInfo } from './spam-detect.js';
import { state } from './state.js';
import { showPage, updateLoadingSteps } from './ui.js';

export function pickNearestOption(options, targetScore) {
    return options.reduce((best, opt) => {
        if (!best) return opt;
        return Math.abs(opt.v - targetScore) < Math.abs(best.v - targetScore) ? opt : best;
    }, null);
}

export function createSyntheticAnswer(q, targetScore) {
    if (q.type === 'likert') {
        const rawValue = q.r ? 6 - targetScore : targetScore;
        const opt = state.standardOptions.find(item => item.v === rawValue) || state.standardOptions[2];
        return { score: targetScore, raw: opt.v, label: opt.l };
    }

    prepareQuestionOptions(q);
    const opt = pickNearestOption(q.renderOptions || q.options || [], targetScore);
    if (!opt) return { score: targetScore, raw: targetScore, label: '' };
    return { score: opt.v, raw: opt.v, label: opt.l };
}

export function clampDebugScore(score) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return null;
    return Math.max(0, Math.min(250, Math.round(numericScore)));
}

export function getDebugPattern(profile = 'high') {
    const patterns = {
        low: [2, 1, 2, 3, 1, 2],
        mid: [3, 4, 2, 3, 4, 3],
        high: [5, 4, 5, 4, 3, 5],
        max: [5, 5, 4, 5, 4, 5],
        cheat: [5],
        perfect: [5],
        random: [5, 4, 3, 2, 4, 5]
    };
    const fixed = Number(profile);
    return Number.isInteger(fixed) && fixed >= 1 && fixed <= 5
        ? [fixed, Math.max(1, fixed - 1), fixed, Math.max(1, fixed - 2)]
        : (patterns[profile] || patterns.high);
}

export function fillSyntheticAnswers(profile = 'high') {
    const isCheat = profile === 'cheat';
    const isPerfect = profile === 'perfect';
    const pattern = getDebugPattern(profile);
    const consistencyTargets = {};

    state.userAnswers = state.shuffledQuestions.map((q, idx) => {
        let targetScore = pattern[idx % pattern.length];
        if (isPerfect && q.scored !== false) targetScore = 5;
        if (isPerfect && q.scored === false && !q.consistencyKey) targetScore = [2, 3, 4][idx % 3];
        if (q.consistencyKey) {
            const key = q.consistencyKey;
            if (!consistencyTargets[key]) consistencyTargets[key] = isCheat ? 5 : 3;
            const normalized = consistencyTargets[key];
            targetScore = q.consistencyPolarity === -1 ? 6 - normalized : normalized;
        }
        return createSyntheticAnswer(q, targetScore);
    });
}

export function prepareDebugResult(profile = 'high') {
    state.debugSession = true;
    initGame();
    resetPendingScoreStatsRequest();
    fillSyntheticAnswers(profile);
    state.currentQIdx = state.shuffledQuestions.length - 1;
    state.totalAnsweringTimeMs = profile === 'cheat' ? state.shuffledQuestions.length * 120 : state.shuffledQuestions.length * 1800;
}

export function renderDebugResult({ profile = 'high', score = null, loading = false, bypassSpam = true } = {}) {
    if (!state.questionBankReady) {
        throw new Error(state.questionBankError || 'Question bank is not ready yet.');
    }
    const scoreOverride = clampDebugScore(score);
    prepareDebugResult(profile);
    state.debugBypassSpam = bypassSpam || profile === 'perfect';
    state.debugScoreOverride = scoreOverride;
    if (loading) {
        finishTest();
        return;
    }
    window.spamStatus = 0;
    window.spamVal = undefined;
    state.consistencyInfo = calculateConsistencyInfo();
    if (state.debugBypassSpam) {
        state.consistencyInfo.score = 100;
        state.consistencyInfo.level = t('stability.defaultLevel', {}, '高');
        state.consistencyInfo.grade = 'high';
        state.consistencyInfo.desc = t('stability.debugDesc', {}, '调试作弊档已启用，本次样本跳过异常拦截并按满分画像渲染。');
        state.consistencyInfo.discount = 1;
    }
    loadChartjsAndResult();
}

export function runSyntheticResult(profile = 'high') {
    renderDebugResult({ profile, loading: true, bypassSpam: profile === 'perfect' });
}

export function runDebugScore(score, options = {}) {
    renderDebugResult({
        profile: options.profile || 'high',
        score,
        loading: Boolean(options.loading),
        bypassSpam: options.bypassSpam !== false
    });
}

export function runDebugPunish(status = 1, value = null, options = {}) {
    if (!state.questionBankReady) {
        throw new Error(state.questionBankError || 'Question bank is not ready yet.');
    }
    const spamStatus = Math.max(1, Math.min(5, Math.round(Number(status) || 1)));
    prepareDebugResult(options.profile || 'cheat');
    state.debugBypassSpam = false;
    state.debugScoreOverride = null;
    state.consistencyInfo = calculateConsistencyInfo();
    state.consistencyInfo.score = Math.max(0, Math.min(100, Number(state.consistencyInfo.score) || 0));
    window.spamStatus = spamStatus;
    window.spamVal = value == null ? ({
        1: '8.8',
        2: 50,
        3: 30,
        4: 48,
        5: 20
    })[spamStatus] : value;
    if (options.loading) {
        showPage('loading');
        updateLoadingSteps(3);
        document.getElementById('loading-text').innerText = t('loading.punishTexts.0', {}, '检测到异常作答脑电波...');
        setTimeout(loadChartjsAndResult, 300);
        return;
    }
    loadChartjsAndResult();
}

export function installDebugConsole() {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
    const api = {
        help() {
            const usage = [
                'nnDebug.score(180)                         // 直接渲染指定总分，范围 0-250',
                'nnDebug.score(240, { loading: true })       // 走加载页后出指定分',
                'nnDebug.profile("low|mid|high|max|perfect|cheat|random")',
                'nnDebug.punish(1-5)                         // 强制渲染异常/惩罚页',
                'nnDebug.punish(5, 12)                       // 指定惩罚类型和显示值',
                'nnDebug.reset()                             // 回到首页并清理本地进度'
            ];
            console.table(usage);
            return usage;
        },
        score: runDebugScore,
        profile(profile = 'high', options = {}) {
            renderDebugResult({
                profile,
                loading: Boolean(options.loading),
                bypassSpam: options.bypassSpam !== false
            });
        },
        punish: runDebugPunish,
        reset() {
            state.debugSession = false;
            state.debugScoreOverride = null;
            state.debugBypassSpam = false;
            state.suppressScoreUploadForCurrentResult = false;
            window.spamStatus = 0;
            window.spamVal = undefined;
            resetTest();
        }
    };
    Object.defineProperty(window, 'nnDebug', {
        value: api,
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(window, '__nn_dev_quick', {
        value: runSyntheticResult,
        enumerable: false,
        configurable: true
    });
    console.info('nnDebug ready. Run nnDebug.help() for commands.');
}
