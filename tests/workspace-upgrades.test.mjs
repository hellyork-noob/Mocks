import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

async function load(path) {
  const source = readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}
const appearance = await load('app/appearance.ts');
const practice = await load('features/analytics/practiceModel.ts');
const { subjectColor } = await load('features/analytics/subjectColors.ts');

test('appearance normalizes malformed preferences and keeps all accents readable', () => {
  assert.deepEqual(appearance.normalizeAppearance({ accent: 'bad', customAccent: 'red', glass: 'heavy' }), appearance.defaultAppearance);
  for (const theme of ['dark', 'light']) for (const accent of [...Object.keys(appearance.accentPresets), 'custom']) {
    const colors = appearance.appearanceColors({ ...appearance.defaultAppearance, accent, customAccent: '#111111', textTone: 'custom', customTextDark: '#111111', customTextLight: '#ffffff' }, theme);
    const surface = theme === 'light' ? '#f8f9fc' : '#22252c';
    assert.ok(appearance.contrast(colors.accent, surface) >= 4.5);
    assert.ok(appearance.contrast(colors.text, surface) >= 4.5);
    assert.ok(appearance.contrast(colors.accent, colors.onAccent) >= 4.5);
  }
});

const profile = { key: 'exam', targetScore: 80, sections: [
  { name: 'Maths', maxMarks: 50 }, { name: 'English', maxMarks: 50 }, { name: 'Computer', maxMarks: 10, sectionType: 'qualifying' },
] };
test('trend uses full mocks only, and target gap requires a matching scored scale', () => {
  const mocks = Array.from({ length: 10 }, (_, index) => ({ id: index, date: `2026-11-${String(index + 1).padStart(2, '0')}`, subject: 'Full Mock', score: index < 5 ? 60 : 80, maxScore: 100 }));
  const result = practice.recentProgress([...mocks, { id: 99, date: '2026-12-01', subject: 'Maths', score: 0, maxScore: 50 }]);
  assert.equal(result.current, 80); assert.equal(result.previous, 60); assert.equal(result.change, 20);
  assert.equal(practice.targetGap(result.latest, profile), 0);
  assert.equal(practice.targetGap({ score: 100, maxScore: 200 }, profile), null);
});

test('practice uses recorded accuracy and coverage, excluding qualifying subjects', () => {
  const mocks = [1, 2].map(id => ({ id, exam: 'exam', date: `2026-11-0${id}`, subject: 'Full Mock', sections: [
    { subject: 'Maths', score: 10, maxScore: 50, correct: 2, incorrect: 8, unattempted: 10 },
    { subject: 'English', score: 30, maxScore: 50, correct: 8, incorrect: 0, unattempted: 12 },
    { subject: 'Computer', score: 0, maxScore: 10, correct: 0, incorrect: 10, unattempted: 0, sectionType: 'qualifying' },
  ] }));
  const result = practice.practicePriorities(mocks, 'exam', profile);
  assert.deepEqual(result.map(item => item.subject), ['Maths', 'English']);
  assert.equal(result[0].accuracy, 20); assert.match(result[0].action, /wrong answers/);
  assert.equal(result[1].attempts, 40); assert.match(result[1].action, /timed 15-question/);
  assert.deepEqual(practice.practicePriorities(mocks, 'other', profile), []);
});

test('subject colors stay stable across capitalization and have no accent dependency', () => {
  assert.equal(subjectColor(' Maths '), subjectColor('maths'));
  assert.equal(subjectColor('English'), 'var(--subject-3)');
  assert.equal(subjectColor('Custom subject'), subjectColor('Custom subject'));
  assert.ok(!subjectColor('Reasoning').includes('accent'));
});
