import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Compile the pure selector without loading the browser database.
const source = readFileSync(new URL('../src/features/mocks/history.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { selectHistoryRows, selectHistoryProviders } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const filters = { historySearch: '', historySubject: 'All', historyProvider: 'All', historySort: 'newest' };
const mocks = [
  { id: 1, exam: 'A', title: 'First', date: '2026-11-01', subject: 'Full Mock', provider: ' Provider ', score: 50, maxScore: 100, sections: [{ subject: 'Maths' }] },
  { id: 2, exam: 'A', title: 'Second', date: '2026-11-02', subject: 'English', score: 40, maxScore: 50 },
  { id: 3, exam: 'B', title: 'Other', date: '2026-11-03', subject: 'Full Mock', score: 100, maxScore: 100 },
];

test('history scopes to an exam and sorts without changing stored order', () => {
  assert.deepEqual(selectHistoryRows(mocks, 'A', filters).map(m => m.id), [2, 1]);
  assert.deepEqual(mocks.map(m => m.id), [1, 2, 3]);
  assert.deepEqual(selectHistoryRows(mocks, 'A', { ...filters, historySort: 'score-high' }).map(m => m.id), [2, 1]);
  assert.deepEqual(selectHistoryRows(mocks, 'A', { ...filters, historySort: 'oldest' }).map(m => m.id), [1, 2]);
});

test('subject filters include matching sections inside full mocks', () => {
  assert.deepEqual(selectHistoryRows(mocks, 'A', { ...filters, historySubject: 'Maths' }).map(m => m.id), [1]);
  assert.deepEqual(selectHistoryRows(mocks, 'A', { ...filters, historySubject: 'Full Mock' }).map(m => m.id), [1]);
});

test('provider normalization and case-insensitive search agree', () => {
  assert.deepEqual(selectHistoryProviders(mocks, 'A'), ['Provider', 'Unspecified']);
  assert.equal(selectHistoryRows(mocks, 'A', { ...filters, historyProvider: 'Provider' })[0].id, 1);
  assert.equal(selectHistoryRows(mocks, 'A', { ...filters, historyProvider: 'Unspecified', historySearch: 'SECOND' })[0].id, 2);
  assert.deepEqual(selectHistoryRows(mocks, 'A', { ...filters, historySearch: 'missing' }), []);
});
