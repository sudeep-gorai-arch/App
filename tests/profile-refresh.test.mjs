import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const auth = readFileSync(new URL('../src/context/AuthContext.tsx', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/screens/Profile/ProfileScreen.tsx', import.meta.url), 'utf8');
const refresh = auth.slice(
  auth.indexOf('const refreshProfile = useCallback('),
  auth.indexOf('return (\n    <AuthContext.Provider'),
);

test('profile refresh callback is stable across auth rerenders', () => {
  assert.match(auth, /const refreshProfile = useCallback\(/);
  assert.match(refresh, /}, \[\]\);/);
});

test('background profile refresh does not show full-screen loading spinner', () => {
  assert.doesNotMatch(refresh, /setLoading\(/);
  assert.match(profile, /if \(loading\) \{/);
});

test('concurrent refresh requests are coalesced', () => {
  assert.match(refresh, /if \(profileRefreshInFlight\.current\)/);
  assert.match(refresh, /return profileRefreshInFlight\.current/);
  assert.match(refresh, /profileRefreshInFlight\.current = request/);
  assert.match(refresh, /profileRefreshInFlight\.current = null/);
});

test('profile focus refresh retains a stable dependency', () => {
  assert.match(profile, /\[loadDownloads, refreshProfile, Boolean\(user\)\]/);
});
