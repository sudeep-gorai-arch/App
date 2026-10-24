import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storage = readFileSync(new URL('../src/services/authSessionStorage.ts', import.meta.url), 'utf8');
const api = readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../src/context/AuthContext.tsx', import.meta.url), 'utf8');

test('401 can invalidate only its own still-current token', () => {
  assert.match(api, /error\.response\?\.status === 401/);
  assert.match(api, /invalidateSessionForToken\(rejectedToken\)/);
  assert.match(storage, /currentToken !== rejectedToken/);
});

test('credential writes are serialized to prevent stale 401 race', () => {
  assert.match(storage, /credentialWrites\.then\(operation, operation\)/);
  assert.match(storage, /return withCredentialLock\(/);
  assert.match(storage, /export const invalidateSessionForToken/);
});

test('requests use current credential and omit stale auth headers on login', () => {
  assert.match(api, /config\.url === '\/auth\/google'/);
  assert.match(api, /const token = await getStoredToken\(\)/);
  assert.doesNotMatch(api, /API\.defaults\.headers\.common\.Authorization/);
});

test('active session invalidation clears in-memory user and premium badge', () => {
  assert.match(auth, /subscribeToSessionInvalidation\(/);
  assert.match(auth, /setToken\(null\)/);
  assert.match(auth, /setUser\(null\)/);
  assert.match(auth, /AdController\.setPremiumUser\(false\)/);
});

test('late profile response cannot overwrite a newer signed-in session', () => {
  assert.match(auth, /persistProfileForToken\(sessionToken, updatedUser/);
  assert.match(storage, /getItemAsync\('token'\)\) !== expectedToken/);
});

test('session expiry is not silently renewed with an unverified token', () => {
  assert.doesNotMatch(api, /refresh_token|refreshToken/);
  assert.match(auth, /await clearStoredSession\(\)/);
});
