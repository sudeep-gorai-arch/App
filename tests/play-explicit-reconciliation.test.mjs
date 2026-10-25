import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = file => readFileSync(new URL(file, import.meta.url), 'utf8');

test('explicit Play reconciliation verifies owned purchases without starting checkout', () => {
  const auth = source('../src/context/AuthContext.tsx');
  const body = auth.slice(auth.indexOf('const syncGooglePlayPurchases = useCallback'),auth.indexOf('return (\n    <AuthContext.Provider'));
  assert.match(body, /getAvailablePurchases\(\{ includeSuspendedAndroid: true \}\)/);
  assert.match(body, /selectRecoverablePlayPurchases\(/);
  assert.match(body, /verifyGooglePlayPurchase\(/);
  assert.match(body, /await applyVerifiedPurchase\(status, expectedUserId\)/);
  assert.match(body, /getStoredToken\(\)/);
  assert.doesNotMatch(body, /requestPurchase\(/);
  assert.match(auth, /playSyncInFlight/);
});

test('Manage Premium first load and refresh reconcile Play before fetching backend status', () => {
  const manage = source('../src/screens/ManagePremium/ManagePremiumScreen.tsx');
  const section = manage.slice(manage.indexOf('const loadData = useCallback'), manage.indexOf('const activeSubscription = useMemo'));
  assert.ok(section.indexOf('await syncGooglePlayPurchases()') < section.indexOf('await getSubscriptionStatus()'));
  assert.match(section, /getSubscriptionStatus\(\)/);
  assert.match(section, /void loadData\(false\)/);
  assert.match(manage, /skeletonHeroHeading/);
  assert.match(manage, /skeletonInfoRow/);
  assert.match(manage, /\['Plan Details', 'Latest Payment', 'Actions'\]/);
});

test('Settings and Profile manual refresh also reconcile Play ownership', () => {
  const settings = source('../src/screens/Settings/SettingsScreen.tsx');
  const profile = source('../src/screens/Profile/ProfileScreen.tsx');
  assert.ok(settings.indexOf('await syncGooglePlayPurchases()') < settings.indexOf('await refreshProfile();', settings.indexOf('const refreshSettings')));
  assert.match(profile, /await syncGooglePlayPurchases\(\)/);
});
