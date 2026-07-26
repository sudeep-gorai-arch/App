import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'flexiwalls-downloads.db';
const LEGACY_DOWNLOADS_KEY = '@flexiwalls:guestDownloads';
const LEGACY_DELETED_KEY = '@flexiwalls:locallyDeletedDownloads';
const LEGACY_MIGRATION_KEY = '@flexiwalls:downloadsSqliteMigrationV1';

export type DownloadOwnerType = 'guest' | 'user';
export type DownloadSyncStatus = 'pending' | 'committed';
export type DeviceMediaKind = 'image' | 'video';

export type DeviceDownloadRecord = {
  wallpaperId: string;
  assetId: string;
  localUri: string | null;
  sourceUrl: string | null;
  mediaKind: DeviceMediaKind;
  fileName: string | null;
  albumName: string;
  downloadedAt: string;
  ownerType: DownloadOwnerType;
  clientRequestId: string;
  syncStatus: DownloadSyncStatus;
  wallpaper: Record<string, any>;
  serverDownloadCount: number | null;
  dailyDownloadCount: number | null;
  dailyDownloadLimit: number | null;
  updatedAt: string;
};

type DeviceDownloadRow = {
  wallpaper_id: string;
  asset_id: string;
  local_uri: string | null;
  source_url: string | null;
  media_kind: DeviceMediaKind;
  file_name: string | null;
  album_name: string;
  downloaded_at: string;
  owner_type: DownloadOwnerType;
  client_request_id: string;
  sync_status: DownloadSyncStatus;
  wallpaper_json: string;
  server_download_count: number | null;
  daily_download_count: number | null;
  daily_download_limit: number | null;
  updated_at: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let migrationPromise: Promise<void> | null = null;

const normalizeId = (value: unknown) => String(value ?? '').trim();

const safeParseObject = (value: string): Record<string, any> => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const rowToRecord = (row: DeviceDownloadRow): DeviceDownloadRecord => ({
  wallpaperId: row.wallpaper_id,
  assetId: row.asset_id,
  localUri: row.local_uri,
  sourceUrl: row.source_url,
  mediaKind: row.media_kind,
  fileName: row.file_name,
  albumName: row.album_name,
  downloadedAt: row.downloaded_at,
  ownerType: row.owner_type,
  clientRequestId: row.client_request_id,
  syncStatus: row.sync_status,
  wallpaper: safeParseObject(row.wallpaper_json),
  serverDownloadCount: toNullableNumber(row.server_download_count),
  dailyDownloadCount: toNullableNumber(row.daily_download_count),
  dailyDownloadLimit: toNullableNumber(row.daily_download_limit),
  updatedAt: row.updated_at,
});

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS device_downloads (
          wallpaper_id TEXT PRIMARY KEY NOT NULL,
          asset_id TEXT NOT NULL UNIQUE,
          local_uri TEXT,
          source_url TEXT,
          media_kind TEXT NOT NULL CHECK (media_kind IN ('image', 'video')),
          file_name TEXT,
          album_name TEXT NOT NULL DEFAULT 'FlexiWalls',
          downloaded_at TEXT NOT NULL,
          owner_type TEXT NOT NULL CHECK (owner_type IN ('guest', 'user')),
          client_request_id TEXT NOT NULL UNIQUE,
          sync_status TEXT NOT NULL DEFAULT 'committed' CHECK (sync_status IN ('pending', 'committed')),
          wallpaper_json TEXT NOT NULL,
          server_download_count INTEGER,
          daily_download_count INTEGER,
          daily_download_limit INTEGER,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_device_downloads_downloaded_at
          ON device_downloads(downloaded_at DESC);

        CREATE INDEX IF NOT EXISTS idx_device_downloads_sync_status
          ON device_downloads(sync_status);
      `);

      return db;
    })();
  }

  return databasePromise;
};

const getLegacyWallpaperId = (item: any) =>
  normalizeId(
    item?.wallpaperId ||
      item?.wallpaper_id ||
      item?.wallpaper?.id ||
      item?.Wallpaper?.id ||
      item?.id,
  );

const getLegacyAssetId = (item: any) =>
  normalizeId(
    item?.assetId ||
      item?.asset_id ||
      item?.mediaAssetId ||
      item?.media_asset_id ||
      item?.mediaLibraryAssetId ||
      item?.media_library_asset_id ||
      item?.galleryAssetId ||
      item?.gallery_asset_id,
  );

const migrateLegacyDownloads = async () => {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    const alreadyMigrated = await AsyncStorage.getItem(LEGACY_MIGRATION_KEY);
    if (alreadyMigrated === '1') return;

    const raw = await AsyncStorage.getItem(LEGACY_DOWNLOADS_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const wallpaperId = getLegacyWallpaperId(item);
            const assetId = getLegacyAssetId(item);

            if (!wallpaperId || !assetId) continue;

            const wallpaper = {
              ...(item?.wallpaper && typeof item.wallpaper === 'object'
                ? item.wallpaper
                : {}),
              ...(item && typeof item === 'object' ? item : {}),
              id: wallpaperId,
            };

            const downloadedAt = String(
              item?.downloadedAt ||
                item?.downloaded_at ||
                item?.createdAt ||
                new Date().toISOString(),
            );

            await upsertDeviceDownload({
              wallpaperId,
              assetId,
              localUri:
                item?.savedUri ||
                item?.saved_uri ||
                item?.localUri ||
                item?.local_uri ||
                item?.fileUri ||
                item?.file_uri ||
                null,
              sourceUrl:
                item?.downloadUrl ||
                item?.download_url ||
                item?.imageUrl ||
                item?.image_url ||
                null,
              mediaKind:
                String(item?.mediaType || item?.media_type || '').toUpperCase() ===
                  'VIDEO' || item?.isVideo === true
                  ? 'video'
                  : 'image',
              fileName: item?.fileName || item?.filename || null,
              albumName: 'FlexiWalls',
              downloadedAt,
              ownerType: item?.loggedInAtDownload ? 'user' : 'guest',
              clientRequestId: `legacy-${wallpaperId}-${downloadedAt}`,
              syncStatus: 'committed',
              wallpaper,
              serverDownloadCount: toNullableNumber(
                item?.downloadCount || item?.download_count || item?.downloads,
              ),
              dailyDownloadCount: null,
              dailyDownloadLimit: null,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.log('LEGACY DOWNLOAD MIGRATION ERROR', error);
      }
    }

    await AsyncStorage.multiRemove([LEGACY_DOWNLOADS_KEY, LEGACY_DELETED_KEY]);
    await AsyncStorage.setItem(LEGACY_MIGRATION_KEY, '1');
  })();

  return migrationPromise;
};

export const initializeDeviceDownloadRepository = async () => {
  await getDatabase();
  await migrateLegacyDownloads();
};

export const listDeviceDownloads = async (): Promise<DeviceDownloadRecord[]> => {
  await initializeDeviceDownloadRepository();
  const db = await getDatabase();
  const rows = await db.getAllAsync<DeviceDownloadRow>(
    'SELECT * FROM device_downloads ORDER BY downloaded_at DESC',
  );
  return rows.map(rowToRecord);
};

export const listPendingDeviceDownloads = async () => {
  await initializeDeviceDownloadRepository();
  const db = await getDatabase();
  const rows = await db.getAllAsync<DeviceDownloadRow>(
    `SELECT * FROM device_downloads
     WHERE sync_status = 'pending'
     ORDER BY downloaded_at ASC`,
  );
  return rows.map(rowToRecord);
};

export const getDeviceDownload = async (wallpaperId: string) => {
  const id = normalizeId(wallpaperId);
  if (!id) return null;

  await initializeDeviceDownloadRepository();
  const db = await getDatabase();
  const row = await db.getFirstAsync<DeviceDownloadRow>(
    'SELECT * FROM device_downloads WHERE wallpaper_id = ?',
    id,
  );
  return row ? rowToRecord(row) : null;
};

export const upsertDeviceDownload = async (record: DeviceDownloadRecord) => {
  await getDatabase();
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO device_downloads (
      wallpaper_id,
      asset_id,
      local_uri,
      source_url,
      media_kind,
      file_name,
      album_name,
      downloaded_at,
      owner_type,
      client_request_id,
      sync_status,
      wallpaper_json,
      server_download_count,
      daily_download_count,
      daily_download_limit,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(wallpaper_id) DO UPDATE SET
      asset_id = excluded.asset_id,
      local_uri = excluded.local_uri,
      source_url = excluded.source_url,
      media_kind = excluded.media_kind,
      file_name = excluded.file_name,
      album_name = excluded.album_name,
      downloaded_at = excluded.downloaded_at,
      owner_type = excluded.owner_type,
      client_request_id = excluded.client_request_id,
      sync_status = excluded.sync_status,
      wallpaper_json = excluded.wallpaper_json,
      server_download_count = excluded.server_download_count,
      daily_download_count = excluded.daily_download_count,
      daily_download_limit = excluded.daily_download_limit,
      updated_at = excluded.updated_at`,
    record.wallpaperId,
    record.assetId,
    record.localUri,
    record.sourceUrl,
    record.mediaKind,
    record.fileName,
    record.albumName,
    record.downloadedAt,
    record.ownerType,
    record.clientRequestId,
    record.syncStatus,
    JSON.stringify(record.wallpaper || {}),
    record.serverDownloadCount,
    record.dailyDownloadCount,
    record.dailyDownloadLimit,
    record.updatedAt,
  );

  return record;
};

export const markDeviceDownloadCommitted = async (
  wallpaperId: string,
  patch: {
    wallpaper?: Record<string, any>;
    serverDownloadCount?: number | null;
    dailyDownloadCount?: number | null;
    dailyDownloadLimit?: number | null;
  },
) => {
  const current = await getDeviceDownload(wallpaperId);
  if (!current) return null;

  const next: DeviceDownloadRecord = {
    ...current,
    syncStatus: 'committed',
    wallpaper: patch.wallpaper
      ? { ...current.wallpaper, ...patch.wallpaper }
      : current.wallpaper,
    serverDownloadCount:
      patch.serverDownloadCount ?? current.serverDownloadCount,
    dailyDownloadCount:
      patch.dailyDownloadCount ?? current.dailyDownloadCount,
    dailyDownloadLimit:
      patch.dailyDownloadLimit ?? current.dailyDownloadLimit,
    updatedAt: new Date().toISOString(),
  };

  await upsertDeviceDownload(next);
  return next;
};

export const removeDeviceDownloadRecords = async (wallpaperIds: string[]) => {
  const ids = wallpaperIds.map(normalizeId).filter(Boolean);
  if (ids.length === 0) return;

  await initializeDeviceDownloadRepository();
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(
    `DELETE FROM device_downloads WHERE wallpaper_id IN (${placeholders})`,
    ids,
  );
};