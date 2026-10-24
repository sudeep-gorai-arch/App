import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const premium = readFileSync(new URL('../src/screens/Premium/PremiumScreen.tsx', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../src/context/AuthContext.tsx', import.meta.url), 'utf8');
const billing = readFileSync(new URL('../src/services/subscriptionService.ts', import.meta.url), 'utf8');

test('only a Play-verified backend response may grant Pro entitlement', () => {
  assert.match(premium, /const verifiedStatus = await verifyGooglePlayPurchase\(/);
  assert.match(premium, /await auth\.applyVerifiedPurchase\(verifiedStatus/);
  assert.match(auth, /if \(!isCurrentPremium\(status\)\)/);
});

test('verified entitlement persists only to the expected logged-in user', () => {
  assert.match(auth, /String\(previousUser\.id\) !== String\(expectedUserId\)/);
  assert.match(auth, /persistProfileForToken\(currentToken, updatedUser/);
  assert.match(auth, /AdController\.setPremiumUser\(true\)/);
});

test('owned Play purchases are recovered before opening a new billing sheet', () => {
  const recovery = premium.indexOf('const alreadyRestored = await restoreOwnedPurchases()');
  const newPurchase = premium.indexOf('await requestPurchase({', recovery);
  assert.ok(recovery !== -1);
  assert.ok(newPurchase > recovery);
});

test('already owned purchase error invokes restore rather than another purchase', () => {
  const section = premium.slice(
    premium.indexOf('if (error?.code === ErrorCode.AlreadyOwned)'),
    premium.indexOf('const {\n    connected,'),
  );
  assert.match(section, /restoreOwnedPurchases\(\)/);
  assert.doesNotMatch(section, /requestPurchase\(/);
});

test('manual Restore Purchase invokes shared recovery path', () => {
  const section = premium.slice(
    premium.indexOf('const handleRestore = async () => {'),
    premium.indexOf('return (\n    <View style={styles.root}', premium.indexOf('const handleRestore = async () => {')),
  );
  assert.match(section, /await restoreOwnedPurchases\(\)/);
});

test('pending and suspended purchases cannot be granted Premium', () => {
  assert.match(premium, /purchase\.purchaseState === 'pending' \|\| \(purchase as any\)\.isSuspendedAndroid/);
  assert.match(premium, /pending or suspended purchase/);
  assert.match(billing, /\/subscriptions\/google-play\/verify/);
});
