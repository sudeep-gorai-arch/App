import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectRecoverablePlayPurchases } from '../src/utils/playPurchaseRecovery.ts';

const all = ['monthly', 'yearly', 'lifetime'];
const candidate = (productId, purchaseToken, extra = {}) =>
  ({ productId, purchaseToken, purchaseState: 'purchased', ...extra });

test('recovers owned purchases without opening another checkout', () => {
  assert.deepEqual(
    selectRecoverablePlayPurchases([candidate('monthly', 'token-1')], all, 'lifetime')
      .map(item => item.purchaseToken),
    ['token-1'],
  );
});

test('unknown, pending, suspended and tokenless items never qualify', () => {
  const entries = [
    candidate('unknown', 'u'),
    candidate('monthly', 'pending', {purchaseState:'pending'}),
    candidate('yearly', 'suspended', {isSuspendedAndroid:true}),
    candidate('monthly', null),
    candidate('monthly', 'valid'),
  ];
  assert.deepEqual(
    selectRecoverablePlayPurchases(entries, all, 'lifetime')
      .map(item => item.purchaseToken),
    ['valid'],
  );
});

test('deduplicates replayed tokens and verifies lifetime after subscriptions', () => {
  const entries = [
    candidate('lifetime', 'L'),
    candidate('monthly', 'M'),
    candidate('monthly', 'M'),
  ];
  assert.deepEqual(
    selectRecoverablePlayPurchases(entries, all, 'lifetime')
      .map(item => item.purchaseToken),
    ['M', 'L'],
  );
});

test('recovery is app-wide and reacts to foreground and connectivity restoration', () => {
  const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const recovery = readFileSync(new URL('../src/components/PlayPurchaseRecovery.tsx', import.meta.url), 'utf8');
  assert.match(app, /<PlayPurchaseRecovery\s*\/>/);
  assert.match(recovery, /Network\.useNetworkState\(\)/);
  assert.match(recovery, /AppState\.addEventListener\('change'/);
  assert.match(recovery, /getAvailablePurchases\(/);
  assert.match(recovery, /verifyGooglePlayPurchase\(/);
  assert.match(recovery, /auth\.applyVerifiedPurchase\(/);
  assert.match(recovery, /getStoredToken\(\)/);
  assert.doesNotMatch(recovery, /requestPurchase\(/);
  assert.doesNotMatch(recovery, /console\.(log|warn)\([^\n]*purchaseToken/);
});
