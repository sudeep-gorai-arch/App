import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const load = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('ad requests are preceded by Google UMP consent approval', () => {
  const ads = load('../src/ads/MobileAds.ts');
  const app = load('../App.tsx');
  assert.match(ads, /AdsConsent\.gatherConsent\(\)/);
  assert.match(ads, /canRequestAds/);
  assert.match(ads, /if \(!canRequestAds\) return false/);
  assert.ok(ads.indexOf('if (!canRequestAds) return false') < ads.indexOf('mobileAds().initialize()'));
  assert.match(app, /if \(adsAllowed\)/);
  assert.doesNotMatch(app, /\/\/ Preload Ads\s*InterstitialManager\.load/);
});

test('settings includes privacy choices, Store link, and account-deletion billing warning', () => {
  const settings = load('../src/screens/Settings/SettingsScreen.tsx');
  assert.match(settings, /AdsConsent\.showPrivacyOptionsForm\(\)/);
  assert.match(settings, /Ad Privacy Choices/);
  assert.match(settings, /play\.google\.com\/store\/apps\/details\?id=com\.flexiwalls\.app/);
  assert.doesNotMatch(settings, /expo\.dev\/artifacts\/eas/);
  assert.match(settings, /Deleting your FlexiWalls account does not cancel billing in Google Play/);
});
