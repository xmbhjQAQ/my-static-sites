const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const load = name => import(pathToFileURL(path.join(__dirname, '../js', name)).href);

for (const locale of ['zh_cn', 'en_us', 'ja']) {
    test(`sampling ${locale} preserves 50 unique questions, dimension quotas and consistency pair`, async () => {
        const context = vm.createContext({ window: {} });
        vm.runInContext(fs.readFileSync(path.join(__dirname, `../questions/questions_${locale}.js`), 'utf8'), context);
        const bank = JSON.parse(JSON.stringify(context.window.rawQuestionBank));
        const original = JSON.stringify(bank);
        const { selectQuestions } = await load('quiz-logic.js');
        for (let attempt = 0; attempt < 100; attempt++) {
            const { shuffledQuestions: questions, dimMaxScores } = selectQuestions(bank);
            assert.equal(questions.length, 50);
            assert.equal(new Set(questions.map(q => q.id)).size, 50);
            for (const dim of ['A', 'B', 'C', 'D']) {
                assert.equal(questions.filter(q => q.d === dim && q.scored !== false).length, 11);
                assert.equal(dimMaxScores[dim], 55);
            }
            assert.equal(questions.filter(q => q.d === 'F').length, 4);
            const pair = questions.filter(q => q.d === 'K');
            assert.equal(pair.length, 2);
            assert.equal(pair[0].consistencyKey, pair[1].consistencyKey);
            assert.ok(questions.filter(q => q.scored !== false && (q.face || 2) >= 3).length <= 4);
            for (const q of questions.filter(q => q.type === 'choice')) {
                assert.equal(q.renderOptions.length, q.options.length);
            }
        }
        assert.equal(JSON.stringify(bank), original, 'sampling must not mutate the source bank');
    });
}

test('scoring preserves 50–250 range, dimension weighting, discount and punishment exclusion', async () => {
    const { state } = await load('state.js');
    const { buildResultScoreContext } = await load('scores.js');
    globalThis.window = { spamStatus: 0 };
    state.dimMaxScores = { A: 55, B: 55, C: 55, D: 55 };
    state.shuffledQuestions = ['A', 'B', 'C', 'D'].flatMap(d => Array.from({ length: 11 }, () => ({ d })));
    state.shuffledQuestions.push({ d: 'F', scored: false });
    state.debugScoreOverride = null;
    state.consistencyInfo = { score: 100, discount: 1 };
    for (const score of [1, 3, 5]) {
        state.userAnswers = state.shuffledQuestions.map(() => ({ score }));
        assert.equal(buildResultScoreContext().displayScore, score * 50);
    }
    state.consistencyInfo.discount = 0.92;
    assert.equal(buildResultScoreContext().displayScore, 230);
    state.debugScoreOverride = 999;
    assert.equal(buildResultScoreContext().displayScore, 250);
    window.spamStatus = 1;
    assert.equal(buildResultScoreContext().submission.isSpam, true);
    assert.equal(buildResultScoreContext().displayScore, 0);
});

test('consistency uses polarity and contradictions without depending on a DOM', async () => {
    const { calculateConsistencyInfo } = await load('spam-detect.js');
    const questions = [{ consistencyKey: 'pair' }, { consistencyKey: 'pair', consistencyPolarity: -1 }];
    const stable = calculateConsistencyInfo([{ score: 5 }, { score: 1 }], questions);
    assert.equal(stable.score, 100);
    assert.equal(stable.discount, 1);
    const contradictory = calculateConsistencyInfo([{ score: 5 }, { score: 5 }], questions);
    assert.equal(contradictory.score, 40);
    assert.equal(contradictory.grade, 'very_low');
    assert.equal(contradictory.discount, 0);
    assert.equal(calculateConsistencyInfo(Array(50).fill(3), []).streak, 50);
});
