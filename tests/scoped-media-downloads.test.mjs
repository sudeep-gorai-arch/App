import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync(new URL('../src/services/deviceMediaService.ts', import.meta.url), 'utf8');
function loadService({ version = 36, exists = async () => true, save = async () => 'content://media/external/images/media/42', remove = async () => true } = {}) {
  const calls = { permissions: 0, expo: 0, cleanup: 0, removed: [] };
  class File {
    constructor(...parts) { this.uri = parts.join('/'); this.exists = true; }
    static async downloadFileAsync(url, target) { return target; }
    async delete() { calls.cleanup++; }
  }
  const records = [{ wallpaperId: 'wall-1', assetId: 'content://media/external/images/media/42' }];
  const deps = {
    Alert: { alert() { calls.permissions++; } }, Linking: {},
    Platform: { OS: 'android', Version: version },
    NativeModules: { AndroidWallpaperModule: {
      saveDownloadedWallpaper: save, downloadedWallpaperExists: exists, deleteDownloadedWallpaper: remove,
    } },
    PermissionsAndroid: {
      PERMISSIONS: { READ_EXTERNAL_STORAGE: 'read', WRITE_EXTERNAL_STORAGE: 'write' },
      RESULTS: { GRANTED: 'granted', NEVER_ASK_AGAIN: 'never' },
      async requestMultiple(permissions) {
        calls.permissions++;
        return Object.fromEntries(permissions.map(p => [p, 'granted']));
      },
    },
    Album: { async get() { calls.expo++; throw Error('Unexpected library access'); } },
    Asset: class { constructor() { calls.expo++; throw Error('Unexpected library access'); } },
    async getPermissionsAsync() { calls.permissions++; throw Error('Unexpected library access'); },
    async requestPermissionsAsync() { calls.permissions++; throw Error('Unexpected library access'); },
    File, Paths: { cache: 'file:///cache' },
    async listDeviceDownloads() { return records; },
    async removeDeviceDownloadRecords(ids) { calls.removed.push(...ids); },
  };
  // Keep the service logic intact; replace external native/database imports with fakes.
  const runnable = stripTypeScriptTypes(source)
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
    .replace(/export /g, '');
  const service = new Function('deps', 'const {' + Object.keys(deps).join(',') + '} = deps;\n' + runnable +
    '\nreturn {ensureDeviceMediaPermission,saveWallpaperAsset,deviceAssetExists,deleteDeviceAsset,reconcileDeviceDownloadRecords};')(deps);
  return { service, calls };
}

for (const version of [29, 30, 33, 36]) {
  test('Android ' + version + ' saves without any photo/video library permission request', async () => {
    const { service, calls } = loadService({ version });
    assert.equal(await service.ensureDeviceMediaPermission('image'), true);
    assert.equal(await service.ensureDeviceMediaPermission('video'), true);
    const saved = await service.saveWallpaperAsset({ wallpaperId: 'wall-1', sourceUrl: 'https://example.com/wall.jpg', mediaKind: 'image' });
    assert.equal(saved.assetId, 'content://media/external/images/media/42');
    assert.equal(saved.localUri, saved.assetId);
    assert.equal(calls.permissions, 0);
    assert.equal(calls.expo, 0);
    assert.equal(calls.cleanup, 1);
  });
}

test('Android 9 requests only legacy shared-storage access', async () => {
  const { service, calls } = loadService({ version: 28 });
  assert.equal(await service.ensureDeviceMediaPermission('image'), true);
  assert.equal(calls.permissions, 1);
});

test('known missing files remove stale records, but provider/permission errors preserve them', async () => {
  const missing = loadService({ exists: async () => false });
  assert.deepEqual((await missing.service.reconcileDeviceDownloadRecords()).removedWallpaperIds, ['wall-1']);
  const unavailable = loadService({ exists: async () => { throw Error('Permission denied'); } });
  const result = await unavailable.service.reconcileDeviceDownloadRecords();
  assert.equal(result.records.length, 1);
  assert.deepEqual(unavailable.calls.removed, []);
});

test('failed or cancelled deletion does not report success', async () => {
  const { service } = loadService({ remove: async () => { throw Error('Denied'); } });
  assert.equal(await service.deleteDeviceAsset('content://media/external/images/media/42'), false);
});

test('failed native save still cleans the downloaded cache file', async () => {
  const { service, calls } = loadService({ save: async () => { throw Error('No space'); } });
  await assert.rejects(service.saveWallpaperAsset({ wallpaperId: 'wall-1', sourceUrl: 'https://example.com/wall.mp4', mediaKind: 'video' }), /No space/);
  assert.equal(calls.cleanup, 1);
});
