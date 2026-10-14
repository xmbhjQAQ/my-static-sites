import { RESULT_STORAGE_KEY, STATE_STORAGE_KEY } from './config.js';
import { getMessage, t } from './messages.js';
import { getQuestionBank, validateQuestionBank } from './questions.js';
import { ensureRenderedOptionOrders, getAnswerScore, normalizeSavedAnswers, prepareQuestionOptions, selectQuestions } from './quiz-logic.js';
import { loadChartjsAndResult } from './result.js';
import { requestScoreStatsForCurrentResult, resetPendingScoreStatsRequest } from './scores.js';
import { calculateConsistencyInfo } from './spam-detect.js';
import { state } from './state.js';
import { readSavedResult, readSavedState, restoreSavedResult, saveState } from './storage.js';
import { setText, showPage, showToast, updateLoadingSteps } from './ui.js';

export function confirmExitTest() {
    const answered = state.userAnswers.filter(ans => ans != null).length;
    if (answered > 0 && !confirm(t('confirm.exit', {}, '确定退出本次鉴定吗？当前进度会保留，下次可以继续。'))) return;
    saveState();
    localStorage.removeItem(RESULT_STORAGE_KEY);
    showPage('home');
    document.getElementById('btn-continue').style.display = 'block';
    document.getElementById('btn-continue').innerText = t('home.continue', {}, '继续上次鉴定');
}

export function getQuestionHelper(q) {
    if (q.type === 'likert') {
        return q.scored === false ? t('quiz.helpers.likertCheck', {}, '用于校验前后作答波形，照常按第一反应选择。') : t('quiz.helpers.likert', {}, '判断这句话与你的真实状态有多接近。');
    }
    return q.scored === false ? t('quiz.helpers.choiceCheck', {}, '这题不直接计入总分，但会影响报告可信度。') : t('quiz.helpers.choice', {}, '代入场景，选择最像你会做出的反应。');
}

export function continueTest() {
    const savedResult = readSavedResult();
    if (savedResult && restoreSavedResult(savedResult)) return;
    let st = readSavedState();
    if (!st) return startTest();
    if (!Array.isArray(st.shuffledQuestions) || !st.shuffledQuestions.length) {
        localStorage.removeItem(STATE_STORAGE_KEY);
        showToast(t('errors.stateInvalid', {}, '上次进度已损坏，已为你清理。'));
        return startTest();
    }
    state.shuffledQuestions = st.shuffledQuestions;
    state.userAnswers = st.userAnswers;
    state.currentQIdx = st.currentQIdx;
    state.dimMaxScores = st.dimMaxScores;
    state.totalAnsweringTimeMs = st.totalAnsweringTimeMs || 0;
    state.consistencyInfo = st.consistencyInfo || null;
    state.userAnswers = normalizeSavedAnswers(state.userAnswers, state.shuffledQuestions.length);
    ensureRenderedOptionOrders();
    showPage('quiz');
    renderQuestion();
}

export function resetTest() {
    if (!confirm(t('confirm.reset', {}, '确定重新抽取题库并开始新一轮鉴定吗？当前报告不会保留在页面上。'))) return;
    resetPendingScoreStatsRequest();
    localStorage.removeItem(STATE_STORAGE_KEY);
    localStorage.removeItem(RESULT_STORAGE_KEY);
    location.reload();
}

export function initGame() {
    const questionBank = getQuestionBank();
    const error = validateQuestionBank(questionBank);
    if (error) throw new Error(error);
    Object.assign(state, selectQuestions(questionBank));
}

export function startTest() {
    if (!state.questionBankReady) {
        showToast(state.questionBankError || t('errors.questionLoad', {}, '题库加载失败，请刷新后重试。'));
        return;
    }
    try {
        initGame();
    } catch (error) {
        console.error('Unable to initialize game:', error);
        showToast(error.message || t('errors.questionInvalid', {}, '题库字段异常，暂时无法开始测试。'));
        return;
    }
    localStorage.removeItem(RESULT_STORAGE_KEY);
    state.currentQIdx = 0;
    state.totalAnsweringTimeMs = 0;
    state.consistencyInfo = null;
    state.debugBypassSpam = false;
    state.debugScoreOverride = null;
    state.suppressScoreUploadForCurrentResult = false;
    state.debugSession = false;
    resetPendingScoreStatsRequest();
    state.userAnswers = new Array(state.shuffledQuestions.length).fill(null);
    showPage('quiz');
    renderQuestion();
}

export function renderQuestion() {
    state.isAnswering = false;
    const q = state.shuffledQuestions[state.currentQIdx];
    if (!q) {
        showToast(t('errors.questionInvalid', {}, '题库字段异常，暂时无法开始测试。'));
        showPage('home');
        return;
    }

    document.getElementById('current-q').innerText = state.currentQIdx + 1;
    const answeredCount = state.userAnswers.filter(ans => ans != null).length;
    const progressPercent = Math.round((answeredCount / state.shuffledQuestions.length) * 100);
    document.getElementById('progress').style.width = `${progressPercent}%`;
    setText('progress-percent', t('quiz.progressPercent', { percent: progressPercent }, `${progressPercent}% 已完成`));
    setText('progress-left', t('quiz.progressLeft', { count: Math.max(0, state.shuffledQuestions.length - answeredCount) }, `剩余 ${Math.max(0, state.shuffledQuestions.length - answeredCount)} 题`));

    const btnPrev = document.getElementById('btn-prev');
    if (state.currentQIdx === 0) btnPrev.classList.add('hidden');
    else btnPrev.classList.remove('hidden');

    const badge = document.getElementById('q-badge');
    if (q.type === 'likert') {
        badge.innerText = q.scored === false ? t('quiz.badges.likertCheck', {}, "状态校验") : t('quiz.badges.likert', {}, "偏好判断");
        badge.style.background = "#e0f7fa"; badge.style.color = "#00acc1";
        document.getElementById('question-text').innerText = q.t.replace(t('question.reversePrefix', {}, '【反向】'), '');
    } else {
        badge.innerText = q.scored === false ? t('quiz.badges.choiceCheck', {}, "日常切片") : t('quiz.badges.choice', {}, "情境选择");
        badge.style.background = "#f3e5f5"; badge.style.color = "#8e24aa";
        document.getElementById('question-text').innerText = q.t;
    }
    setText('q-helper', getQuestionHelper(q));

    const container = document.getElementById('options-container');
    container.innerHTML = '';
    prepareQuestionOptions(q);
    const optsToRender = q.type === 'likert' ? state.standardOptions : q.renderOptions;

    optsToRender.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.l;

        let scoreVal = q.type === 'likert' && q.r ? (6 - opt.v) : opt.v;
        const savedAnswer = state.userAnswers[state.currentQIdx];
        if (savedAnswer && (savedAnswer.label === opt.l || (!savedAnswer.label && getAnswerScore(savedAnswer) === scoreVal))) {
            btn.classList.add('selected');
        }

        btn.onclick = () => {
            if (state.isAnswering) return;
            state.isAnswering = true;

            state.totalAnsweringTimeMs += (Date.now() - state.lastQTime);

            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.userAnswers[state.currentQIdx] = { score: scoreVal, raw: opt.v, label: opt.l };

            setTimeout(() => {
                saveState();
                if (state.currentQIdx < state.shuffledQuestions.length - 1) {
                    state.currentQIdx++; renderQuestion();
                } else {
                    finishTest();
                }
            }, 350);
        };
        container.appendChild(btn);
    });
    state.lastQTime = Date.now();
}

export function prevQuestion() {
    if (state.currentQIdx > 0) { state.currentQIdx--; renderQuestion(); }
}

export function finishTest() {
    const totalSecs = state.totalAnsweringTimeMs / 1000;
    window.spamStatus = 0;
    state.consistencyInfo = calculateConsistencyInfo();

    if (state.debugBypassSpam) {
        state.consistencyInfo.score = 100;
        state.consistencyInfo.level = t('stability.defaultLevel', {}, '高');
        state.consistencyInfo.grade = 'high';
        state.consistencyInfo.desc = t('stability.debugDesc', {}, '调试作弊档已启用，本次样本跳过异常拦截并按满分画像渲染。');
        state.consistencyInfo.discount = 1;
    } else if (totalSecs < 35) {
        window.spamStatus = 1;
        window.spamVal = totalSecs.toFixed(1);
    } else {
        if (state.consistencyInfo.maxSameCount >= 42) {
            window.spamStatus = 2;
            window.spamVal = state.consistencyInfo.maxSameCount;
        } else if (state.consistencyInfo.streak >= 25) {
            window.spamStatus = 3;
            window.spamVal = state.consistencyInfo.streak;
        } else if (state.consistencyInfo.extremeCount >= 46) {
            window.spamStatus = 4;
            window.spamVal = state.consistencyInfo.extremeCount;
        } else if (state.consistencyInfo.grade === 'very_low') {
            window.spamStatus = 5;
            window.spamVal = state.consistencyInfo.score;
        }
    }

    document.getElementById('progress').style.width = '100%';
    setText('progress-percent', t('quiz.progressPercent', { percent: 100 }, '100% 已完成'));
    setText('progress-left', t('quiz.progressLeft', { count: 0 }, '剩余 0 题'));
    setTimeout(() => {
        showPage('loading');
        updateLoadingSteps(0);
        requestScoreStatsForCurrentResult();
        const allTexts = window.spamStatus > 0
            ? getMessage('loading.punishTexts', ["⚠️ 检测到异常作答脑电波...", "启动核心测谎防御系统...", "正在拦截机械化狂点信号...", "提取系统识别日志..."])
            : getMessage('loading.normalTexts', ["正在构建核心行为树...", "深度分析潜意识倾向...", "匹配全网亚文化图谱...", "生成高维雷达模型..."]);
        const texts = allTexts.sort(() => Math.random() - 0.5).slice(0, 4);
        let tIdx = 0;
        document.getElementById('loading-text').innerText = texts[0];
        const intv = setInterval(() => {
            tIdx++;
            updateLoadingSteps(Math.min(tIdx, 3));
            if (tIdx < texts.length) document.getElementById('loading-text').innerText = texts[tIdx];
            else {
                clearInterval(intv);
                loadChartjsAndResult();
            }
        }, 600);
    }, 400);
}
