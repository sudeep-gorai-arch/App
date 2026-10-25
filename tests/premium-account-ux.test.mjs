import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');

test('Manage Premium loads verified status before optional plan data', () => {
  const s=read('../src/screens/ManagePremium/ManagePremiumScreen.tsx');
  assert.match(s, /await getSubscriptionStatus\(\)/);
  assert.match(s, /setLoading\(false\);\s*void refreshProfile/);
  assert.match(s, /void getSubscriptionPlans\(\)/);
  assert.doesNotMatch(s, /const \[planResponse, statusResponse\] = await Promise\.all/);
  assert.match(s, /premiumSkeleton/);
});

test('Google Play cancellation uses in-app authenticated backend and cannot be one-tap', () => {
  const s=read('../src/screens/ManagePremium/ManagePremiumScreen.tsx');
  assert.match(s, /CANCELLATION_REASONS\.map/);
  assert.match(s, /setCancelConfirmStep\(true\)/);
  assert.match(s, /cancelGooglePlaySubscription\(selectedCancelReason\)/);
  assert.match(s, /Premium remains active until the paid period ends/);
  assert.match(s, /Modal/);
  assert.doesNotMatch(s, /Complete cancellation in Google Play/);
});

test('Settings and Profile refresh authenticated subscription status', () => {
  const profile=read('../src/screens/Profile/ProfileScreen.tsx');
  const settings=read('../src/screens/Settings/SettingsScreen.tsx');
  assert.match(profile, /user \? refreshProfile\(\) : Promise\.resolve\(\)/);
  assert.match(settings, /useFocusEffect/);
  assert.match(settings, /refreshControl=/);
  assert.match(settings, /await refreshProfile\(\)/);
  assert.match(settings, /rgba\(8,8,10,\.94\)/);
});

test('cancellation request contains only selected feedback, never client-provided purchase token', () => {
  const api=read('../src/services/subscriptionService.ts');
  assert.match(api, /\/subscriptions\/google-play\/cancel/);
  assert.match(api, /\{ reason \}/);
  assert.doesNotMatch(api.slice(api.indexOf('export const cancelGooglePlaySubscription')), /purchaseToken/);
});
