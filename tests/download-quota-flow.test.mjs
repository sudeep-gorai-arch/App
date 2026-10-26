import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('mobile cannot start a full-media transfer until server commits the quota', () => {
  const source = readFileSync(new URL('../src/services/downloadCoordinator.ts', import.meta.url), 'utf8');
  const flow = source.split('export const downloadWallpaperToDevice = async')[1].split('export const syncPendingDeviceDownloads')[0];
  assert.ok(flow.indexOf('preflightDownload(') < flow.indexOf('commitDownload('));
  assert.ok(flow.indexOf('commitDownload(') < flow.indexOf('saveWallpaperAsset('));
  assert.match(flow, /getResponseUrl\(committed, ''\)/);
  assert.doesNotMatch(flow, /getResponseUrl\(preflight, input\.sourceUrl\)/);
  assert.ok(flow.indexOf('ensureDeviceMediaPermission(') < flow.indexOf('commitDownload('));
});
