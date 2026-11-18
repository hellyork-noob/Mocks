import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);
test('local module imports and lazy page imports resolve', () => {
  for (const path of files(resolve(root, 'src')).filter(path => /\.tsx?$/.test(path))) {
    const ast = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    const check = node => {
      if (ts.isStringLiteral(node) && node.text.startsWith('.') && (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent) || (ts.isCallExpression(node.parent) && node.parent.expression.kind === ts.SyntaxKind.ImportKeyword))) {
        const target = resolve(dirname(path), node.text.replace(/\?inline$/, ''));
        assert.ok(['', '.ts', '.tsx', '/index.ts', '/index.tsx'].some(suffix => existsSync(target + suffix)), `${path}: ${node.text}`);
      }
      ts.forEachChild(node, check);
    };
    check(ast);
  }
});
test('entry point mounts the app inside error recovery', () => {
  assert.match(read('index.html'), /src\/main\.tsx/);
  assert.match(read('src/main.tsx'), /<AppErrorBoundary>\s*<App\s*\/>\s*<\/AppErrorBoundary>/);
  assert.match(read('src/components/AppErrorBoundary.tsx'), /getDerivedStateFromError/);
});
test('database identities and backup transaction remain intact', () => {
  const db = read('src/data/db.ts');
  assert.match(db, /advance_analyzer_v2_clean_phase5a/);
  assert.match(db, /exportBackup/);
  assert.match(db, /importBackup/);
  assert.match(db, /db\.transaction/);
  assert.match(read('src/data/autoBackup.ts'), /advance_analyzer_v2_backup_vault/);
});
test('stored mock and subject target types are retained', () => {
  const types = read('src/data/types.ts');
  for (const field of ['provider', 'percentile', 'timeMinutes', 'subjectTargets']) assert.match(types, new RegExp(field + '\\?:'));
});
test('all ordered stylesheet imports exist', () => {
  const imports = [...read('src/style.css').matchAll(/@import "(.+?)";/g)];
  assert.ok(imports.length > 1);
  for (const [, path] of imports) assert.ok(existsSync(resolve(root, 'src', path)), path);
});
