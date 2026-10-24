import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decidePlayPurchase } from '../src/utils/playPurchasePolicy.ts';
const now = Date.parse('2026-10-24T12:00:00Z');
const future='2026-11-24T12:00:00Z',past='2026-09-24T12:00:00Z';
const premium=(plan,until=future)=>({
  isPremium: true, premiumUntil: until,
  currentPlan: plan,
  activeSubscription: { active: true, plan, endDate: until },
});
test('Free user can buy monthly',()=>assert.equal(decidePlayPurchase({isPremium:false},'MONTHLY',now).kind,'allow'));
test('Expired user can subscribe',()=>assert.equal(decidePlayPurchase(premium('MONTHLY',past),'YEARLY',now).kind,'allow'));
test('Current monthly user cannot buy second monthly subscription',()=>assert.equal(decidePlayPurchase(premium('MONTHLY'),'MONTHLY',now).kind,'blocked'));
test('Current monthly user cannot stack yearly subscription',()=>assert.equal(decidePlayPurchase(premium('MONTHLY'),'YEARLY',now).kind,'blocked'));
test('Current yearly user cannot stack monthly subscription',()=>assert.equal(decidePlayPurchase(premium('YEARLY'),'MONTHLY',now).kind,'blocked'));
test('Lifetime user cannot buy again',()=>assert.equal(decidePlayPurchase(premium('LIFETIME'),'LIFETIME',now).kind,'blocked'));
test('Lifetime user cannot subscribe to recurring plan',()=>assert.equal(decidePlayPurchase(premium('LIFETIME'),'MONTHLY',now).kind,'blocked'));
test('Upgrading from recurring to Lifetime requires explicit warning',()=>assert.equal(decidePlayPurchase(premium('YEARLY'),'LIFETIME',now).kind,'confirm-lifetime'));
