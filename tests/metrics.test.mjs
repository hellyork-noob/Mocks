import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/features/analytics/metricsModel.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { metricRecords, summarizeMetrics } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const profile = { sections: [{ name: 'Maths' }, { name: 'English' }, { name: 'Computer', sectionType: 'qualifying' }] };
const full = { id: 1, exam: 'exam', date: '2026-11-01', title: 'Full', provider: ' Alpha ', subject: 'Full Mock', score: 45, maxScore: 100, correct: 35, incorrect: 10, unattempted: 15, timeMinutes: 90, percentile: 95, sections: [
  { subject: 'Maths', score: 17.5, maxScore: 50, correct: 10, incorrect: 5, unattempted: 10, timeMinutes: 20 },
  { subject: 'English', score: 27.5, maxScore: 50, correct: 15, incorrect: 5, unattempted: 5, timeMinutes: 25 },
  { subject: 'Computer', score: 10, maxScore: 10, correct: 10, incorrect: 0, unattempted: 0, timeMinutes: 10, sectionType: 'qualifying' },
] };
const filters = { mode: 'Full', subject: 'Maths', provider: 'All', from: '', to: '', limit: 0 };

test('full metrics use scored answer counts and matching section times without mutating records', () => {
  const records = metricRecords([full], filters, profile);
  assert.equal(records[0].correct, 25); assert.equal(records[0].timeMinutes, 45);
  const summary = summarizeMetrics(records);
  assert.equal(summary.averageAttempts, 35); assert.equal(summary.averageQuestions, 50);
  assert.equal(summary.accuracy, 25 / 35 * 100); assert.equal(summary.attemptRate, 70);
  assert.equal(full.correct, 35); assert.equal(full.timeMinutes, 90);
});

test('extracted subjects never inherit whole-mock percentile or missing subject time', () => {
  const missingTime = { ...full, sections: full.sections.map(section => ({ ...section, timeMinutes: undefined })) };
  const result = metricRecords([missingTime], { ...filters, mode: 'Sectional' }, profile)[0];
  assert.equal(result.score, 17.5); assert.equal(result.maxScore, 50);
  assert.equal(result.timeMinutes, undefined); assert.equal(result.sectionTimeMinutes, undefined);
  assert.equal(result.percentile, undefined); assert.equal(result.sections, undefined);
  const standalone = { ...full, subject: 'Maths', sections: undefined, timeMinutes: 15, sectionTimeMinutes: 12, percentile: 82 };
  const own = metricRecords([standalone], { ...filters, mode: 'Sectional' }, profile)[0];
  assert.equal(own.timeMinutes, 12); assert.equal(own.percentile, 82);
});

test('provider/date/window filters apply before all metrics and select the latest matching entries', () => {
  const mocks = [1, 2, 3, 4].map(id => ({ ...full, id, date: `2026-11-0${id}`, provider: id % 2 ? 'Alpha' : 'Beta' }));
  const selected = metricRecords(mocks, { ...filters, provider: 'Alpha', from: '2026-11-01', to: '2026-11-03', limit: 1 }, profile);
  assert.deepEqual(selected.map(mock => mock.id), [3]);
  assert.deepEqual(metricRecords(mocks, { ...filters, from: '2026-11-04', to: '2026-11-01' }, profile), []);
  assert.deepEqual(metricRecords(mocks, { ...filters, mode: 'Sectional', subject: 'Missing' }, profile), []);
});

test('no attempts and no recorded time stay unavailable, while negative scores remain real data', () => {
  const summary = summarizeMetrics([{ ...full, score: -5, correct: 0, incorrect: 0, unattempted: 50, timeMinutes: undefined }]);
  assert.equal(summary.accuracy, null); assert.equal(summary.speed, null); assert.equal(summary.timedCount, 0);
  assert.equal(summary.scoreRate, -5); assert.equal(summarizeMetrics([]).scoreRate, null);
});
