import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Premium refresh reconciles purchases and opens Manage Premium without checkout',()=>{
  const screen=src('../src/screens/Premium/PremiumScreen.tsx');
  const section=screen.slice(screen.indexOf('const onRefresh = async'),screen.indexOf('const handleClose ='));
  assert.match(section,/await auth\.syncGooglePlayPurchases\(\)/);
  assert.match(section,/await loadCurrentPremiumPlan\(\)/);
  assert.match(section,/openManagePremium\(\)/);
  assert.doesNotMatch(section,/requestPurchase\(/);
  assert.match(screen,/fromPremiumScreen: true/);
});
test('Manage Premium back returns to prior PremiumScreen, not Profile fallback',()=>{
 const screen=src('../src/screens/ManagePremium/ManagePremiumScreen.tsx');
 assert.match(screen,/route\?\.params\?\.fromPremiumScreen/);
 assert.match(screen,/navigation\.goBack\(\)/);
 assert.match(screen,/navigate\?\.\('Premium', \{ returnTo:/);
 assert.match(screen,/onPress=\{handleBack\}/);
});
test('active billing plan and lifetime purchase lock disable checkout',()=>{
 const screen=src('../src/screens/Premium/PremiumScreen.tsx');
 assert.match(screen,/active=\{activePlan === PLAN_MAP\[plan\.id\]\}/);
 assert.match(screen,/disabled=\{planLocked\(plan\.id\)\}/);
 assert.match(screen,/disabled=\{loading \|\| restoring \|\| planLocked\(selectedPlan\)\}/);
 assert.match(screen,/lifetimeActive \|\| activePlan === PLAN_MAP\[id\]/);
 assert.match(screen,/ACTIVE/);
});
test('recurring switches pass existing token as Play replacement, avoiding parallel subscriptions',()=>{
 const screen=src('../src/screens/Premium/PremiumScreen.tsx');
 assert.match(screen,/decision\.kind === 'replace'/);
 assert.match(screen,/purchaseToken: replacementToken/);
 assert.match(screen,/replacementMode: 1/);
 assert.match(screen,/if \(!originalPurchase\?\.purchaseToken\)/);
 assert.match(screen,/const alreadyRestored = decision\.kind === 'allow'/);
});
