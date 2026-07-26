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

    const preflight = await preflightDownload(wallpaperId, input.ownerType);

    // Close the race where another tap/download completed while permission or
    // preflight was in progress.
    const existingAfterPreflight = await validateDownloadedWallpaper(wallpaperId);
    if (existingAfterPreflight) {
      return { type: 'already-downloaded', record: existingAfterPreflight };
    }

    const sourceUrl = getResponseUrl(preflight, input.sourceUrl);
    if (!sourceUrl) {
      throw new Error('This wallpaper has no downloadable media.');
    }

    const clientRequestId = createClientRequestId();
    const savedAsset = await saveWallpaperAsset({
      wallpaperId,
      sourceUrl,
      mediaKind: input.mediaKind,
      extension: input.extension || preflight?.extension || null,
    });
    const now = new Date().toISOString();

    const pendingRecord: DeviceDownloadRecord = {
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
      syncStatus: 'pending',
      wallpaper: {
        ...input.wallpaper,
        ...preflight,
        id: wallpaperId,
        wallpaperId,
        localUri: savedAsset.localUri,
        savedUri: savedAsset.localUri,
        assetId: savedAsset.assetId,
        mediaAssetId: savedAsset.assetId,
        downloadedAt: now,
      },
      serverDownloadCount: null,
      dailyDownloadCount: null,
      dailyDownloadLimit: null,
      updatedAt: now,
    };

    // Persist immediately after the physical save. If local registration fails,
    // remove the physical asset so Downloads/Profile never drift from Gallery.
    // If the network response is lost later, the same request ID is retried.
    try {
      await upsertDeviceDownload(pendingRecord);
    } catch (error) {
      await deleteDeviceAsset(savedAsset.assetId);
      throw error;
    }

    try {
      const committed = await commitDownload(
        wallpaperId,
        clientRequestId,
        input.ownerType,
      );
      const committedWallpaper = mergeWallpaperResponse(
        pendingRecord.wallpaper,
        committed,
      );
      const committedRecord = await markDeviceDownloadCommitted(wallpaperId, {
        wallpaper: committedWallpaper,
        serverDownloadCount: getServerDownloadCount(committed),
        dailyDownloadCount: getDailyCount(committed),
        dailyDownloadLimit: getDailyLimit(committed),
      });

      return {
        type: 'downloaded',
        record: committedRecord || {
          ...pendingRecord,
          syncStatus: 'committed',
          wallpaper: committedWallpaper,
        },
        response: committed,
      };
    } catch (error) {
      if (isNetworkError(error)) {
        return { type: 'saved-pending-sync', record: pendingRecord };
      }

      await deleteDeviceAsset(savedAsset.assetId);
      await removeDeviceDownloadRecords([wallpaperId]);
      throw error;
    }
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