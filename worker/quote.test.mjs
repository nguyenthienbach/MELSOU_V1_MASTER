import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuote } from './quote.mjs';

test('Signature A5 12 pages and one shipment is 229,000 VND', () => {
  assert.equal(createQuote({ packageCode: 'SIGNATURE', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 1 }).total, 229000);
});
test('Twin second copy uses 75 percent and two shipments', () => {
  const result = createQuote({ packageCode: 'MELODY', size: 'A5_PORTRAIT', pages: 12, twin: true, shipments: 2 });
  assert.equal(result.breakdown.twinCopy, 89250);
  assert.equal(result.total, 268250);
});
test('single copy cannot request two shipments', () => {
  assert.throws(() => createQuote({ packageCode: 'VOICE', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 2 }), /single-copy/);
});
