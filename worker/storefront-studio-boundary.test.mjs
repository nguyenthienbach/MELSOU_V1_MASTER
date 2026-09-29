import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const appPath = path.join(root, 'demo', 'recovery_fb38', 'app.js');
const studioPath = path.join(root, 'demo', 'recovery_fb38', 'studio.js');
const app = fs.readFileSync(appPath, 'utf8');
const studio = fs.readFileSync(studioPath, 'utf8');

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  assert.fail(`${name} has an unterminated body`);
}

test('cold storefront boot does not invoke Studio-only globals', () => {
  const boot = app.slice(app.indexOf('// ── INIT ON LOAD ──'), app.indexOf('// 🌟 FB46'));
  assert.doesNotMatch(boot, /\bcheckStudioFirstVisit\s*\(/);
  assert.doesNotMatch(boot, /\bupdateStudioUndoRedoButtons\s*\(/);
  assert.doesNotMatch(boot, /\bupdateContextualToolbar\s*\(/);
  assert.doesNotMatch(boot, /\bhandleGlobalClick\s*\(/);
});

test('language switching remains storefront-owned and never requests studio.js', () => {
  const source = functionSource(app, 'switchLanguage');
  assert.doesNotMatch(source, /\bensureStudioModule\s*\(/);
  assert.doesNotMatch(source, /\bupdateContextualToolbar\s*\(/);
  assert.doesNotMatch(source, /\bupdateCartBadge\s*\(/);
  assert.doesNotMatch(source, /\bupdateNavSpreadButtons\s*\(/);
  assert.doesNotMatch(source, /\bpendingAlbumSizeChange\b/);
  assert.match(source, /window\.MelsouStudio\?\.refreshLanguage\(lang\)/);
});

test('global click is safe before Studio load and delegates once after load', () => {
  const script = [
    functionSource(app, 'handleStorefrontGlobalClick'),
    functionSource(app, 'handleGlobalClick'),
    'globalThis.run = handleGlobalClick;'
  ].join('\n');
  let menuCloseCount = 0;
  let studioClickCount = 0;
  const context = {
    window: {},
    document: {
      getElementById(id) {
        assert.equal(id, 'userDropdownMenu');
        return { classList: { remove() { menuCloseCount += 1; } } };
      }
    }
  };
  vm.runInNewContext(script, context);
  const event = { target: { closest() { return null; } } };
  assert.doesNotThrow(() => context.run(event));
  assert.equal(menuCloseCount, 1);
  context.window.MelsouStudio = { handleGlobalClick() { studioClickCount += 1; } };
  context.run(event);
  assert.equal(menuCloseCount, 2);
  assert.equal(studioClickCount, 1);
});

test('Studio module registers one narrow contract and owns first-visit/global hooks', () => {
  assert.match(app, /window\.MelsouStudio\.checkFirstVisit\(\)/);
  assert.match(app, /window\.MelsouStudio\.updateUndoRedoButtons\(\)/);
  assert.match(app, /studio\.js loaded without registering the MelsouStudio contract/);
  assert.match(studio, /window\.MelsouStudio = Object\.freeze\(\{/);
  for (const member of [
    'checkFirstVisit: checkStudioFirstVisit',
    'updateContextualToolbar',
    'updateUndoRedoButtons: updateStudioUndoRedoButtons',
    'handleGlobalClick: handleStudioGlobalClick',
    'handleGlobalKey: handleStudioGlobalKey',
    'refreshLanguage(lang)'
  ]) assert.ok(studio.includes(member), `missing Studio contract member: ${member}`);
  assert.doesNotMatch(studio, /window\.addEventListener\(['"]keydown['"],\s*handleGlobalKey/);
});

test('split performance guardrail keeps Studio deferred and app.js below 275 KiB', () => {
  const index = fs.readFileSync(path.join(root, 'demo', 'recovery_fb38', 'index.html'), 'utf8');
  assert.doesNotMatch(index, /<script[^>]+src=["'][^"']*studio\.js/);
  assert.match(app, /script\.src = ["']\/studio\.js["']/);
  assert.ok(Buffer.byteLength(app) <= 275 * 1024, 'app.js exceeded the 275 KiB raw guardrail');
});
