import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/features/study/studyMath.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { localDateKey, shiftDate, timerElapsed, focusSecondsOnDay, formatClock } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const at = text => new Date(text).getTime();

test('focus elapsed excludes pauses, follows timestamps, and stops at the deadline', () => {
  const timer = { durationSeconds: 1500, runningSince: 100000, segments: [{ start: 0, end: 60000 }] };
  assert.equal(timerElapsed(timer, 130000), 90);
  assert.equal(timerElapsed({ ...timer, runningSince: null }, 999999), 60);
  assert.equal(timerElapsed(timer, 99999999), 1500);
  assert.equal(timerElapsed(timer, 90000), 60);
});

test('midnight sessions split between local dates without counting paused gaps', () => {
  const sessions = [{ segments: [
    { start: at('2026-11-17T23:50:00'), end: at('2026-11-18T00:10:00') },
    { start: at('2026-11-18T00:20:00'), end: at('2026-11-18T00:30:00') },
  ] }];
  assert.equal(focusSecondsOnDay(sessions, '2026-11-17'), 600);
  assert.equal(focusSecondsOnDay(sessions, '2026-11-18'), 1200);
  assert.equal(focusSecondsOnDay(sessions, '2026-11-19'), 0);
});

test('local calendar and timer formatting handle month boundaries and zero', () => {
  assert.equal(localDateKey(new Date(2026, 10, 17, 23, 59)), '2026-11-17');
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDate('2026-03-01', -1), '2026-02-28');
  assert.equal(formatClock(1500), '25:00');
  assert.equal(formatClock(-10), '00:00');
});
