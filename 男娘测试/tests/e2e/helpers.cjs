async function chooseAnswer(page, index) {
    const option = await page.evaluate(async index => {
        const { state } = await import('/js/state.js');
        const q = state.shuffledQuestions[state.currentQIdx];
        const options = q.type === 'likert' ? state.standardOptions : q.renderOptions;
        const score = q.consistencyKey ? 3 : (index % 3) + 2;
        const target = q.type === 'likert' && q.r ? 6 - score : score;
        return options.reduce((best, option, position) =>
            Math.abs(option.v - target) < Math.abs(options[best].v - target) ? position : best, 0);
    }, index);
    await page.locator('#options-container button').nth(option).click();
}
module.exports = { chooseAnswer };
