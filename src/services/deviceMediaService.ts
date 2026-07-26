import { Alert, Linking } from 'react-native';
import {
  Album,
  Asset,
  getPermissionsAsync,
  requestPermissionsAsync,
  type GranularPermission,
} from 'expo-media-library';
import { File, Paths } from 'expo-file-system';

import type {
  DeviceDownloadRecord,
  DeviceMediaKind,
} from './deviceDownloadRepository';
import {
  listDeviceDownloads,
  removeDeviceDownloadRecords,
} from './deviceDownloadRepository';

const ALBUM_NAME = 'FlexiWalls';

export type SavedDeviceAsset = {
  assetId: string;
  localUri: string;
  fileName: string;
  albumName: string;
  mediaKind: DeviceMediaKind;
};

const permissionFor = (mediaKind: DeviceMediaKind): GranularPermission[] => [
  mediaKind === 'video' ? 'video' : 'photo',
];

const hasMediaAccess = (permission: any) =>
  Boolean(
    permission?.granted ||
      permission?.accessPrivileges === 'all' ||
      permission?.accessPrivileges === 'limited',
  );

export const ensureDeviceMediaPermission = async (
  mediaKind: DeviceMediaKind,
): Promise<boolean> => {
  const granularPermissions = permissionFor(mediaKind);
  const current = await getPermissionsAsync(false, granularPermissions);

  if (hasMediaAccess(current)) return true;

  if (current.canAskAgain) {
    const requested = await requestPermissionsAsync(false, granularPermissions);
    if (hasMediaAccess(requested)) return true;
    if (requested.canAskAgain) return false;
  }

  Alert.alert(
    'Storage permission needed',
    'FlexiWalls needs media permission to save and manage downloaded wallpapers. Enable it in Settings, then tap Download again.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );

  return false;
};

const normalizeExtension = (value?: string | null) => {
  const clean = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '');
  return clean === 'jpeg' ? 'jpg' : clean;
};

const getExtension = (
  url: string,
  mediaKind: DeviceMediaKind,
  forcedExtension?: string | null,
) => {
  const forced = normalizeExtension(forcedExtension);
  const supported =
    mediaKind === 'video'
      ? ['mp4', 'webm', 'mov', 'm4v']
      : ['jpg', 'png', 'webp', 'avif'];

  if (supported.includes(forced)) return forced;

  const cleanUrl = String(url).split('?')[0].split('#')[0];
  const match = cleanUrl.match(/\.([a-z0-9]+)$/i);
  const fromUrl = normalizeExtension(match?.[1]);

  return supported.includes(fromUrl)
    ? fromUrl
    : mediaKind === 'video'
      ? 'mp4'
      : 'jpg';
};

const makeFileName = (
  wallpaperId: string,
  mediaKind: DeviceMediaKind,
  extension?: string | null,
  sourceUrl = '',
) => {
  const finalExtension = getExtension(sourceUrl, mediaKind, extension);
  return `flexiwalls-${wallpaperId}-${Date.now()}.${finalExtension}`;
};

const createAsset = async (localUri: string) => {
  const album = await Album.get(ALBUM_NAME);

  if (album) {
    return Asset.create(localUri, album);
  }

  const asset = await Asset.create(localUri);
  // Move the newly-created asset into FlexiWalls. Using `false` here
  // copies it on Android and leaves two physical Gallery items.
  await Album.create(ALBUM_NAME, [asset], true);
  return asset;
};

export const saveWallpaperAsset = async (input: {
  wallpaperId: string;
  sourceUrl: string;
  mediaKind: DeviceMediaKind;
  extension?: string | null;
}): Promise<SavedDeviceAsset> => {
  const fileName = makeFileName(
    input.wallpaperId,
    input.mediaKind,
    input.extension,
    input.sourceUrl,
  );
  const target = new File(Paths.cache, fileName);
  const downloaded = await File.downloadFileAsync(input.sourceUrl, target, {
    idempotent: true,
  });
  const downloadedUri = String(downloaded.uri || target.uri);

  try {
    const asset = await createAsset(downloadedUri);
    const assetId = String(asset.id || '').trim();

    if (!assetId) {
      throw new Error('Media Library did not return an asset ID.');
    }

    return {
      assetId,
      localUri: assetId,
      fileName,
      albumName: ALBUM_NAME,
      mediaKind: input.mediaKind,
    };
  } finally {
    try {
      const cacheFile = new File(downloadedUri);
      if (cacheFile.exists) {
        await cacheFile.delete();
      }
    } catch (error) {
      console.log('DOWNLOAD CACHE CLEANUP ERROR', error);
    }
  }
};

export const deviceAssetExists = async (assetId: string) => {
  if (!assetId) return false;

  try {
    const asset = new Asset(assetId);
    await asset.getInfo();
    return true;
  } catch {
    return false;
  }
};

export const deleteDeviceAsset = async (assetId: string) => {
  if (!assetId) return true;

  try {
    const asset = new Asset(assetId);
    await asset.delete();
    return true;
  } catch (error) {
    const exists = await deviceAssetExists(assetId);
    if (!exists) return true;

    console.log('DELETE DEVICE ASSET ERROR', assetId, error);
    return false;
  }
};

export const reconcileDeviceDownloadRecords = async () => {
  const records = await listDeviceDownloads();
  const checks = await Promise.all(
    records.map(async record => ({
      record,
      exists: await deviceAssetExists(record.assetId),
    })),
  );

  const staleIds = checks
    .filter(result => !result.exists)
    .map(result => result.record.wallpaperId);

  if (staleIds.length > 0) {
    await removeDeviceDownloadRecords(staleIds);
  }

  return {
    records: checks.filter(result => result.exists).map(result => result.record),
    removedWallpaperIds: staleIds,
  };
};

export const deleteDeviceDownloads = async (wallpaperIds: string[]) => {
  const idSet = new Set(wallpaperIds.map(value => String(value).trim()).filter(Boolean));
  const records = (await listDeviceDownloads()).filter(record =>
    idSet.has(record.wallpaperId),
  );

  const deletedWallpaperIds: string[] = [];
  const failedWallpaperIds: string[] = [];

  for (const record of records) {
    const deleted = await deleteDeviceAsset(record.assetId);
    if (deleted) {
      deletedWallpaperIds.push(record.wallpaperId);
    } else {
      failedWallpaperIds.push(record.wallpaperId);
    }
  }

  if (deletedWallpaperIds.length > 0) {
    await removeDeviceDownloadRecords(deletedWallpaperIds);
  }

  return { deletedWallpaperIds, failedWallpaperIds };
};

export const rollbackSavedDeviceDownload = async (
  record: Pick<DeviceDownloadRecord, 'wallpaperId' | 'assetId'>,
) => {
  await deleteDeviceAsset(record.assetId);
  await removeDeviceDownloadRecords([record.wallpaperId]);
};