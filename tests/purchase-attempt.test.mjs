import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PurchaseAttemptGate } from '../src/utils/purchaseAttemptGate.ts';

test('first tap starts purchase', () => {
  const gate = new PurchaseAttemptGate();
  assert.equal(gate.beginPurchase(), true);
});
test('rapid second tap does not start a second purchase', () => {
  const gate = new PurchaseAttemptGate();
  assert.equal(gate.beginPurchase(), true);
  assert.equal(gate.beginPurchase(), false);
});
test('cancelled purchase releases the gate', () => {
  const gate = new PurchaseAttemptGate();
  gate.beginPurchase();
  gate.finishPurchase();
  assert.equal(gate.beginPurchase(), true);
});
test('slow internet leaves pending attempt locked', () => {
  const gate = new PurchaseAttemptGate();
  gate.beginPurchase();
  assert.equal(gate.isPurchaseInFlight(), true);
  assert.equal(gate.beginPurchase(), false);
});
test('duplicate Google Play callbacks for same token are rejected', () => {
  const gate = new PurchaseAttemptGate();
  assert.equal(gate.beginVerification('token-A'), true);
  assert.equal(gate.beginVerification('token-A'), false);
});
test('separate tokens can be verified independently', () => {
  const gate = new PurchaseAttemptGate();
  gate.beginVerification('token-A');
  assert.equal(gate.beginVerification('token-B'), true);
});
test('failed callback verification can be retried', () => {
  const gate = new PurchaseAttemptGate();
  gate.beginVerification('token-A');
  gate.finishVerification('token-A');
  assert.equal(gate.beginVerification('token-A'), true);
});
