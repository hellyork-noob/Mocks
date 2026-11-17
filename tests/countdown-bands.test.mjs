import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/features/countdown/countdownBands.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { countdownBand } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
test('all ten countdown ranges include both boundaries', () => {
  for (let band = 1; band <= 10; band++) {
    assert.equal(countdownBand((band - 1) * 10 + 1), String(band));
    assert.equal(countdownBand(band * 10), String(band));
  }
});
test('today, past exams, and dates beyond 100 days have separate styles', () => {
  assert.equal(countdownBand(0), 'today');
  assert.equal(countdownBand(-1), 'past');
  assert.equal(countdownBand(101), 'far');
});
