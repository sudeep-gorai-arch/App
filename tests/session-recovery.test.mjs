import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldKeepCachedSession } from '../src/utils/sessionRecovery.ts';

test('slow internet timeout retains cached login', () => {
  assert.equal(shouldKeepCachedSession({ message: 'timeout of 15000ms exceeded' }), true);
});
test('offline network retains cached login', () => {
  assert.equal(shouldKeepCachedSession({ message: 'Network Error' }), true);
});
test('server 503 retains cached login', () => {
  assert.equal(shouldKeepCachedSession({ status: 503 }), true);
});
test('server 401 revokes cached login', () => {
  assert.equal(shouldKeepCachedSession({ status: 401 }), false);
});
test('unknown transient error retains cache pending a later retry', () => {
  assert.equal(shouldKeepCachedSession(null), true);
});
