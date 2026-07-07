import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";
import { v4 as uuid } from "uuid";
import * as Crypto from "expo-crypto";

import API from "./api";
import { ApiResponse, Download, Wallpaper } from "./types";
import { preferencesService } from "./preferencesService";

export interface DownloadQuery {
  limit?: number;
  offset?: number;
}

export interface LocalDownloadInput {
  wallpaperId: string;
  wallpaper?: Partial<Wallpaper> | Record<string, any> | null;
  localUri?: string | null;
  fileUri?: string | null;
  savedUri?: string | null;
  assetId?: string | null;
  mediaAssetId?: string | null;
  downloadedAt?: string | Date | null;
  downloadCount?: number;
}

export type LocalDownloadRecord = Record<string, any> & {
  id: string;
  wallpaperId: string;
  localUri?: string | null;
  fileUri?: string | null;
  savedUri?: string | null;
  assetId?: string | null;
  mediaAssetId?: string | null;
  downloadedAt: string;
};

/*
----------------------------------------
DOWNLOAD HISTORY
----------------------------------------
*/

export const getDownloads = async (query: DownloadQuery = {}) => {
  const response = await API.get<ApiResponse<Download[]>>("/downloads", {
    params: query,
  });

  return response.data;
};

/*
----------------------------------------
LOCAL DOWNLOAD HISTORY
Used by DownloadsScreen delete-from-device flow.
----------------------------------------
*/

export const LOCAL_DOWNLOADS_KEY = "@flexiwalls:guestDownloads";

const normalizeId = (value: unknown) => String(value ?? "").trim();

const getWallpaperId = (item: any) =>
  normalizeId(
    item?.wallpaperId ||
      item?.wallpaper_id ||
      item?.id ||
      item?.wallpaper?.id ||
      item?.Wallpaper?.id,
  );

const safeJsonParse = (raw: string | null) => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getLocalDownloads = async (): Promise<LocalDownloadRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_DOWNLOADS_KEY);
    const parsed = safeJsonParse(raw);

    return parsed.filter((item) => Boolean(getWallpaperId(item)));
  } catch (error) {
    console.log("GET LOCAL DOWNLOADS ERROR", error);
    return [];
  }
};

export const saveLocalDownload = async (
  input: LocalDownloadInput,
): Promise<LocalDownloadRecord | null> => {
  try {
    const wallpaper = (input.wallpaper || {}) as Record<string, any>;

    const wallpaperId = normalizeId(
      input.wallpaperId || wallpaper.id || wallpaper.wallpaperId,
    );

    if (!wallpaperId) return null;

    const current = await getLocalDownloads();

    const downloadedAt =
      input.downloadedAt instanceof Date
        ? input.downloadedAt.toISOString()
        : input.downloadedAt || new Date().toISOString();

    const nextRecord: LocalDownloadRecord = {
      ...wallpaper,
      id: wallpaperId,
      wallpaperId,
      wallpaper,
      localUri: input.localUri || input.fileUri || input.savedUri || null,
      fileUri: input.fileUri || input.localUri || input.savedUri || null,
      savedUri: input.savedUri || input.localUri || input.fileUri || null,
      assetId: input.assetId || input.mediaAssetId || null,
      mediaAssetId: input.mediaAssetId || input.assetId || null,
      downloadedAt,
      createdAt: downloadedAt,
      downloadCount:
        input.downloadCount ??
        wallpaper.downloadCount ??
        wallpaper.download_count ??
        wallpaper.downloads ??
        0,
    };

    const filtered = current.filter(
      (item) => getWallpaperId(item) !== wallpaperId,
    );

    const next = [nextRecord, ...filtered];

    await AsyncStorage.setItem(LOCAL_DOWNLOADS_KEY, JSON.stringify(next));

    return nextRecord;
  } catch (error) {
    console.log("SAVE LOCAL DOWNLOAD ERROR", error);
    return null;
  }
};

export const removeLocalDownloads = async (
  wallpaperIds: string[],
): Promise<void> => {
  try {
    const ids = new Set(wallpaperIds.map(normalizeId).filter(Boolean));

    if (ids.size === 0) return;

    const current = await getLocalDownloads();

    const next = current.filter((item) => !ids.has(getWallpaperId(item)));

    if (next.length === 0) {
      await AsyncStorage.removeItem(LOCAL_DOWNLOADS_KEY);
      return;
    }

    await AsyncStorage.setItem(LOCAL_DOWNLOADS_KEY, JSON.stringify(next));
  } catch (error) {
    console.log("REMOVE LOCAL DOWNLOADS ERROR", error);
  }
};

export const clearLocalDownloads = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCAL_DOWNLOADS_KEY);
  } catch (error) {
    console.log("CLEAR LOCAL DOWNLOADS ERROR", error);
  }
};

/*
----------------------------------------
GUEST ID
----------------------------------------
*/

const GUEST_ID_KEY = "guest_id";

const createGuestId = () => {
  try {
    if (typeof Crypto.randomUUID === "function") {
      return Crypto.randomUUID();
    }
  } catch {
    // fallback below
  }

  try {
    return uuid();
  } catch {
    return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

export const getGuestId = async (): Promise<string> => {
  try {
    const existing = await SecureStore.getItemAsync(GUEST_ID_KEY);

    if (existing) {
      return existing;
    }

    const guestId = createGuestId();

    await SecureStore.setItemAsync(GUEST_ID_KEY, guestId);

    return guestId;
  } catch (error) {
    console.log("GUEST ID ERROR", error);

    return createGuestId();
  }
};

/*
----------------------------------------
DOWNLOAD PREFERENCE CHECK
----------------------------------------
*/

export const ensureDownloadAllowed = async () => {
  const downloadCheck = await preferencesService.canDownloadNow();

  if (!downloadCheck.allowed) {
    throw new Error(downloadCheck.reason);
  }

  return true;
};

/*
----------------------------------------
DOWNLOAD
----------------------------------------
*/

const postDownload = async (
  endpoint: string,
  wallpaperId: string,
  headers: Record<string, string> = {},
) => {
  const response = await API.post<ApiResponse<Download>>(
    endpoint,
    {
      wallpaperId,
    },
    {
      headers,
    },
  );

  return response.data;
};

export const recordDownload = async (
  wallpaperId: string,
  loggedIn: boolean,
) => {
  await ensureDownloadAllowed();

  if (loggedIn) {
    return postDownload("/downloads", wallpaperId);
  }

  const guestId = await getGuestId();

  const headers = {
    "x-guest-id": guestId,
  };

  try {
    return await postDownload("/downloads", wallpaperId, headers);
  } catch (error: any) {
    const status = error?.response?.status;

    if (status === 401 || status === 404 || status === 405) {
      return postDownload("/downloads/public", wallpaperId, headers);
    }

    throw error;
  }
};

/*
----------------------------------------
SMART DOWNLOAD
----------------------------------------
*/

export const addDownload = async (
  wallpaperId: string,
  loggedIn: boolean,
  localDownload?: Omit<LocalDownloadInput, "wallpaperId">,
) => {
  const response = await recordDownload(wallpaperId, loggedIn);

  if (localDownload) {
    await saveLocalDownload({
      ...localDownload,
      wallpaperId,
    });
  }

  return response;
};