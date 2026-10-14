import { t } from './messages.js';
import { getAnswerScore } from './quiz-logic.js';
import { state } from './state.js';

export function longestRun(values) {
    let longest = 0;
    let current = 0;
    let prev = null;
    values.forEach(v => {
        if (v == null) return;
        if (v === prev) current++;
        else current = 1;
        prev = v;
        longest = Math.max(longest, current);
    });
    return longest;
}

export function calculateConsistencyInfo(answers = state.userAnswers, questions = state.shuffledQuestions) {
    const answerScores = answers.map(getAnswerScore).filter(v => v != null);
    const valCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    answerScores.forEach(v => { valCounts[v] = (valCounts[v] || 0) + 1; });

    const consistencyGroups = {};
    questions.forEach((q, idx) => {
        if (!q.consistencyKey) return;
        const ans = getAnswerScore(answers[idx]);
        if (ans == null) return;
        const normalized = q.consistencyPolarity === -1 ? 6 - ans : ans;
        if (!consistencyGroups[q.consistencyKey]) consistencyGroups[q.consistencyKey] = [];
        consistencyGroups[q.consistencyKey].push(normalized);
    });

    let contradictionPenalty = 0;
    Object.values(consistencyGroups).forEach(group => {
        if (group.length < 2) return;
        contradictionPenalty += Math.abs(group[0] - group[1]) * 15;
    });

    const maxSameCount = Math.max(...Object.values(valCounts));
    const extremeCount = (valCounts[1] || 0) + (valCounts[5] || 0);
    const streak = longestRun(answers.map(getAnswerScore));
    let patternPenalty = 0;
    if (streak >= 18) patternPenalty += 25;
    else if (streak >= 12) patternPenalty += 12;
    if (extremeCount >= 40) patternPenalty += 18;
    else if (extremeCount >= 34) patternPenalty += 8;

    const score = Math.max(0, Math.min(100, 100 - contradictionPenalty - patternPenalty));
    let level = t('stability.defaultLevel', {}, "高");
    let grade = "high";
    let desc = t('stability.defaultDesc', {}, "前后作答波形比较稳定，系统决定认真给你算一卦。");
    let discount = 1;
    if (score < 45) {
        level = t('stability.veryLowLevel', {}, "极低");
        grade = "very_low";
        desc = t('stability.veryLowDesc', {}, "前后回答像在左右横跳，测谎防御网关已经开始冒烟。");
        discount = 0;
    } else if (score < 65) {
        level = t('stability.lowLevel', {}, "偏低");
        grade = "low";
        desc = t('stability.lowDesc', {}, "检测到一点防御性作答或前后摇摆，最终分数会被轻微打折。");
        discount = 0.92;
    } else if (score < 85) {
        level = t('stability.mediumLevel', {}, "中等");
        grade = "medium";
        desc = t('stability.mediumDesc', {}, "样本有轻微波动，但还在可解析范围内，别紧张，仪器还没爆。");
    }

    return { score, level, grade, desc, discount, maxSameCount, extremeCount, streak };
}
