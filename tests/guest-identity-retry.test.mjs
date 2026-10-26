import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Android guest UUID is stable and derived from a hashed Android identifier', () => {
  const native = readFileSync(new URL('../android/app/src/main/java/com/flexiwalls/app/AndroidWallpaperModule.kt', import.meta.url), 'utf8');
  const client = readFileSync(new URL('../src/services/downloadService.ts', import.meta.url), 'utf8');
  assert.match(native, /Settings\.Secure\.ANDROID_ID/);
  assert.match(native, /MessageDigest\.getInstance\("SHA-256"\)/);
  assert.match(native, /getStableGuestId/);
  assert.match(client, /AndroidWallpaperModule\?\.getStableGuestId/);
  assert.doesNotMatch(client, /return createClientRequestId\(\);\s*}\s*;/);
});

test('failed transfers reuse the original authorized commit, not another daily slot', () => {
  const flow = readFileSync(new URL('../src/services/downloadCoordinator.ts', import.meta.url), 'utf8');
  const download = flow.split('export const downloadWallpaperToDevice = async')[1].split('export const syncPendingDeviceDownloads')[0];
  assert.match(download, /getPendingRequestId/);
  assert.match(download, /pendingRequestId \|\| createClientRequestId\(\)/);
  assert.ok(download.indexOf('AsyncStorage.setItem(') < download.indexOf('commitDownload('));
  assert.ok(download.indexOf('commitDownload(') < download.indexOf('saveWallpaperAsset('));
  assert.ok(download.indexOf('AsyncStorage.removeItem(') > download.indexOf('saveWallpaperAsset('));
});
