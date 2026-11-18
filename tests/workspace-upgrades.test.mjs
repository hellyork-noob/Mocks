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

test('subject colors stay stable across capitalization and have no accent dependency', () => {
  assert.equal(subjectColor(' Maths '), subjectColor('maths'));
  assert.equal(subjectColor('English'), 'var(--subject-3)');
  assert.equal(subjectColor('Custom subject'), subjectColor('Custom subject'));
  assert.ok(!subjectColor('Reasoning').includes('accent'));
});
