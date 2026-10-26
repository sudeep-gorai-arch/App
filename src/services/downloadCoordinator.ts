import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosError } from 'axios';

import {
  commitDownload,
  createClientRequestId,
  ensureDownloadAllowed,
  preflightDownload,
  type DownloadAccessResponse,
} from './downloadService';
import {
  getDeviceDownload,
  listPendingDeviceDownloads,
  markDeviceDownloadCommitted,
  removeDeviceDownloadRecords,
  upsertDeviceDownload,
  type DeviceDownloadRecord,
  type DeviceMediaKind,
  type DownloadOwnerType,
} from './deviceDownloadRepository';
import {
  deleteDeviceAsset,
  deviceAssetExists,
  ensureDeviceMediaPermission,
  reconcileDeviceDownloadRecords,
  saveWallpaperAsset,
} from './deviceMediaService';

const activeWallpaperDownloads = new Set<string>();
const pendingKey = (ownerType: DownloadOwnerType, wallpaperId: string) =>
  `@flexiwalls:download-retry:v1:${ownerType}:${wallpaperId}`;

const getPendingRequestId = async (ownerType: DownloadOwnerType, wallpaperId: string) => {
  const stored = await AsyncStorage.getItem(pendingKey(ownerType, wallpaperId));
  return stored && /^[a-f0-9-]{36}$/i.test(stored) ? stored : null;
};

export type DownloadCoordinatorResult =
  | {
      type: 'downloaded';
      record: DeviceDownloadRecord;
      response: DownloadAccessResponse;
    }
  | {
      type: 'already-downloaded';
      record: DeviceDownloadRecord;
    }
  | {
      type: 'permission-required';
    }
  | {
      type: 'saved-pending-sync';
      record: DeviceDownloadRecord;
    }
  | {
      type: 'busy';
    };

const isNetworkError = (error: any) =>
  error?.message === 'Network Error' ||
  error?.code === 'ERR_NETWORK' ||
  !error?.response;

const getResponseUrl = (
  response: DownloadAccessResponse,
  fallbackUrl: string,
) => String(response?.downloadUrl || fallbackUrl || '').trim();

const getServerDownloadCount = (response: DownloadAccessResponse) => {
  const value = Number(response?.downloadCount);
  return Number.isFinite(value) ? value : null;
};

const getDailyCount = (response: DownloadAccessResponse) => {
  const value = Number(response?.dailyDownloadCount);
  return Number.isFinite(value) ? value : null;
};

const getDailyLimit = (response: DownloadAccessResponse) => {
  const value = Number(response?.dailyDownloadLimit);
  return Number.isFinite(value) ? value : null;
};

const mergeWallpaperResponse = (
  wallpaper: Record<string, any>,
  response: DownloadAccessResponse,
) => ({
  ...wallpaper,
  ...response,
  id: String(response?.wallpaperId || wallpaper?.id || ''),
  downloadCount:
    getServerDownloadCount(response) ??
    wallpaper?.downloadCount ??
    wallpaper?.download_count ??
    wallpaper?.downloads ??
    0,
  download_count:
    getServerDownloadCount(response) ??
    wallpaper?.download_count ??
    wallpaper?.downloadCount ??
    wallpaper?.downloads ??
    0,
  downloads:
    getServerDownloadCount(response) ??
    wallpaper?.downloads ??
    wallpaper?.downloadCount ??
    wallpaper?.download_count ??
    0,
});

export const validateDownloadedWallpaper = async (wallpaperId: string) => {
  const record = await getDeviceDownload(wallpaperId);
  if (!record) return null;

  const exists = await deviceAssetExists(record.assetId);
  if (exists) return record;

  await removeDeviceDownloadRecords([wallpaperId]);
  return null;
};

export const downloadWallpaperToDevice = async (input: {
  wallpaperId: string;
  wallpaper: Record<string, any>;
  sourceUrl: string;
  mediaKind: DeviceMediaKind;
  extension?: string | null;
  ownerType: DownloadOwnerType;
}): Promise<DownloadCoordinatorResult> => {
  const wallpaperId = String(input.wallpaperId || '').trim();
  if (!wallpaperId) {
    throw new Error('Wallpaper ID is required.');
  }

  if (activeWallpaperDownloads.has(wallpaperId)) {
    return { type: 'busy' };
  }

  activeWallpaperDownloads.add(wallpaperId);

  try {
    await ensureDownloadAllowed();

    const existing = await validateDownloadedWallpaper(wallpaperId);
    if (existing) {
      return { type: 'already-downloaded', record: existing };
    }

    // Permission is deliberately requested before any backend operation. A
    // denied permission can never consume the daily limit or increment counts.
    const permissionGranted = await ensureDeviceMediaPermission(input.mediaKind);
    if (!permissionGranted) {
      return { type: 'permission-required' };
    }

    // A previously charged request can be retried without consuming a new slot.
    const pendingRequestId = await getPendingRequestId(input.ownerType, wallpaperId);
    const preflight = pendingRequestId ? null : await preflightDownload(wallpaperId, input.ownerType);

    // Close the race where another tap/download completed while permission or
    // preflight was in progress.
    const existingAfterPreflight = await validateDownloadedWallpaper(wallpaperId);
    if (existingAfterPreflight) {
      return { type: 'already-downloaded', record: existingAfterPreflight };
    }

    // A quota is reserved atomically on the backend before the unrestricted
    // media URL is returned. Preflight never exposes a full media URL.
    const clientRequestId = pendingRequestId || createClientRequestId();
    // Persist before authorizing. Survives app restart or a failed transfer.
    await AsyncStorage.setItem(pendingKey(input.ownerType, wallpaperId), clientRequestId);
    let committed: DownloadAccessResponse;
    try {
      committed = await commitDownload(wallpaperId, clientRequestId, input.ownerType);
    } catch (error: any) {
      // This wallpaper may have a pending retry created by a different
      // signed-in account. Never keep replaying another owner's request ID.
      if (pendingRequestId && error?.response?.status === 409) {
        await AsyncStorage.removeItem(pendingKey(input.ownerType, wallpaperId));
        const freshRequestId = createClientRequestId();
        await AsyncStorage.setItem(pendingKey(input.ownerType, wallpaperId), freshRequestId);
        committed = await commitDownload(wallpaperId, freshRequestId, input.ownerType);
      } else {
        throw error;
      }
    }
    const sourceUrl = getResponseUrl(committed, '');
    if (!sourceUrl) {
      throw new Error('This wallpaper has no downloadable media.');
    }

    // NOTE: a failed transfer can still consume the reserved quota. This is
    // intentional fail-closed behavior while direct media URLs are public.
    const savedAsset = await saveWallpaperAsset({
      wallpaperId,
      sourceUrl,
      mediaKind: input.mediaKind,
      extension: input.extension || committed?.extension || preflight?.extension || null,
    });
    const now = new Date().toISOString();
    const committedWallpaper = mergeWallpaperResponse(
      { ...input.wallpaper, ...preflight },
      committed,
    );
    const record: DeviceDownloadRecord = {
      wallpaperId,
      assetId: savedAsset.assetId,
      localUri: savedAsset.localUri,
      sourceUrl,
      mediaKind: savedAsset.mediaKind,
      fileName: savedAsset.fileName,
      albumName: savedAsset.albumName,
      downloadedAt: now,
      ownerType: input.ownerType,
      clientRequestId,
      syncStatus: 'committed',
      wallpaper: {
        ...committedWallpaper,
        id: wallpaperId,
        wallpaperId,
        localUri: savedAsset.localUri,
        savedUri: savedAsset.localUri,
        assetId: savedAsset.assetId,
        mediaAssetId: savedAsset.assetId,
        downloadedAt: now,
      },
      serverDownloadCount: getServerDownloadCount(committed),
      dailyDownloadCount: getDailyCount(committed),
      dailyDownloadLimit: getDailyLimit(committed),
      updatedAt: now,
    };

    try {
      await upsertDeviceDownload(record);
    } catch (error) {
      await deleteDeviceAsset(savedAsset.assetId);
      throw error;
    }

    await AsyncStorage.removeItem(pendingKey(input.ownerType, wallpaperId));
    return { type: 'downloaded', record, response: committed };
  } finally {
    activeWallpaperDownloads.delete(wallpaperId);
  }
};

export const syncPendingDeviceDownloads = async () => {
  const pending = await listPendingDeviceDownloads();
  const committedWallpaperIds: string[] = [];
  const rolledBackWallpaperIds: string[] = [];

  for (const record of pending) {
    const exists = await deviceAssetExists(record.assetId);
    if (!exists) {
      await removeDeviceDownloadRecords([record.wallpaperId]);
      rolledBackWallpaperIds.push(record.wallpaperId);
      continue;
    }

    try {
      const response = await commitDownload(
        record.wallpaperId,
        record.clientRequestId,
        record.ownerType,
      );
      await markDeviceDownloadCommitted(record.wallpaperId, {
        wallpaper: mergeWallpaperResponse(record.wallpaper, response),
        serverDownloadCount: getServerDownloadCount(response),
        dailyDownloadCount: getDailyCount(response),
        dailyDownloadLimit: getDailyLimit(response),
      });
      committedWallpaperIds.push(record.wallpaperId);
    } catch (error: any) {
      if (isNetworkError(error) || error?.response?.status === 401) {
        continue;
      }

      const status = (error as AxiosError)?.response?.status;
      if (status && status >= 400 && status < 500) {
        await deleteDeviceAsset(record.assetId);
        await removeDeviceDownloadRecords([record.wallpaperId]);
        rolledBackWallpaperIds.push(record.wallpaperId);
      }
    }
  }

  return { committedWallpaperIds, rolledBackWallpaperIds };
};

export const getVerifiedDeviceDownloads = async () => {
  await syncPendingDeviceDownloads();
  return reconcileDeviceDownloadRecords();
};