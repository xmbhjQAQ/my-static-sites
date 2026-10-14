const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'locales/en_us.json'), 'utf8'));

function getMessage(key) {
  let cursor = en;
  for (const part of key.split('.')) {
    if (cursor == null || cursor[part] == null || cursor[part] === '') return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

for (const key of ['punish.stampText', 'punish.descs.1', 'punish.descs.5', 'punish.analysis.1', 'punish.analysis.5']) {
  const value = getMessage(key);
  assert.strictEqual(typeof value, 'string', `${key} should resolve to English text`);
  assert.ok(value.trim(), `${key} should not be empty`);
}

const standardOptions = getMessage('question.standardOptions');
assert.ok(Array.isArray(standardOptions), 'English locale should define current quiz option labels');
assert.deepStrictEqual(
  standardOptions.map(option => option.l),
  ['Strongly agree', 'Somewhat agree', 'Neutral / unsure', 'Somewhat disagree', 'Strongly disagree']
);

for (const key of [
  'home.introHtml',
  'home.engineHtml',
  'quiz.badges.likert',
  'quiz.helpers.likert',
  'result.actions.share',
  'result.sections.report',
  'scoreStats.syncing',
  'stability.defaultLevel',
  'punish.tier',
  'traits.A.title'
]) {
  const value = getMessage(key);
  assert.strictEqual(typeof value, 'string', `${key} should resolve to English text`);
  assert.ok(value.trim(), `${key} should not be empty`);
}

assert.ok(Array.isArray(getMessage('tiers')), 'English locale should define result tiers');
assert.ok(getMessage('traits') && typeof getMessage('traits') === 'object', 'English locale should define result traits');

console.log('en-US translation completeness tests passed');
