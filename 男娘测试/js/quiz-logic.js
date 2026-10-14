import { state } from './state.js';

export function getRandomIndex(max) {
    if (globalThis.crypto && globalThis.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        globalThis.crypto.getRandomValues(array);
        return array[0] % max;
    }
    return Math.floor(Math.random() * max);
}

export function shuffleArray(items) {
    const arr = JSON.parse(JSON.stringify(items));
    for (let i = arr.length - 1; i > 0; i--) {
        const j = getRandomIndex(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function getAnswerScore(ans) {
    if (ans == null) return null;
    return typeof ans === 'object' ? ans.score : ans;
}

export function normalizeSavedAnswers(answers, len) {
    const normalized = new Array(len).fill(null);
    (answers || []).slice(0, len).forEach((ans, idx) => {
        if (ans == null) return;
        normalized[idx] = typeof ans === 'object' ? ans : { score: ans, raw: ans, label: '' };
    });
    return normalized;
}

export function prepareQuestionOptions(q) {
    if (q.type !== 'choice') return;
    if (!q.renderOptions || q.renderOptions.length !== q.options.length) {
        q.renderOptions = shuffleArray(q.options).map((opt, idx) => ({ ...opt, _key: `${q.id || q.t}-${idx}-${opt.l}` }));
    }
}

export function ensureRenderedOptionOrders(questions = state.shuffledQuestions) {
    questions.forEach(prepareQuestionOptions);
}

export function selectQuestions(questionBank) {
    let selectedQuestions = [];
    const dimMaxScores = { A: 0, B: 0, C: 0, D: 0 };
    const highFaceState = { used: 0, max: 4 };
    for (const dim of ['A', 'B', 'C', 'D']) {
        const pool = questionBank.filter(q => q.scored !== false && q.d === dim);
        selectedQuestions = selectedQuestions.concat(drawFaceCapped(pool, 11, highFaceState));
    }
    const fillerPool = questionBank.filter(q => q.scored === false && q.d === 'F');
    selectedQuestions = selectedQuestions.concat(shuffleArray(fillerPool).slice(0, 4));
    const consistencyPool = questionBank.filter(q => q.scored === false && q.d === 'K');
    selectedQuestions = selectedQuestions.concat(drawConsistencyPair(consistencyPool));
    const shuffledQuestions = shuffleArray(selectedQuestions);
    ensureRenderedOptionOrders(shuffledQuestions);
    for (const q of shuffledQuestions) {
        if (q.scored !== false && dimMaxScores[q.d] !== undefined) dimMaxScores[q.d] += 5;
    }
    return { shuffledQuestions, dimMaxScores };
}

export function drawFaceCapped(pool, count, highFaceState) {
    const selected = [];
    const deferredHighFace = [];
    shuffleArray(pool).forEach(q => {
        if (selected.length >= count) return;
        const isHighFace = (q.face || 2) >= 3;
        if (isHighFace && highFaceState.used >= highFaceState.max) {
            deferredHighFace.push(q);
            return;
        }
        if (isHighFace) highFaceState.used++;
        selected.push(q);
    });
    return selected.concat(deferredHighFace.slice(0, count - selected.length));
}

export function drawConsistencyPair(pool) {
    const grouped = pool.reduce((map, q) => {
        const key = q.consistencyKey || q.facet || q.id;
        if (!map[key]) map[key] = [];
        map[key].push(q);
        return map;
    }, {});
    const pairs = Object.values(grouped).filter(group => group.length >= 2);
    if (!pairs.length) return shuffleArray(pool).slice(0, 2);
    return shuffleArray(pairs[getRandomIndex(pairs.length)]).slice(0, 2);
}
