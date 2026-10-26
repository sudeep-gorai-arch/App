import { NativeModules, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

import API from './api';
import { ApiResponse, Download } from './types';
import { preferencesService } from './preferencesService';
import type { DownloadOwnerType } from './deviceDownloadRepository';

export interface DownloadQuery {
  limit?: number;
  offset?: number;
}

export type DownloadAccessResponse = Record<string, any> & {
  wallpaperId?: string;
  downloadUrl?: string | null;
  mediaType?: string;
  isVideo?: boolean;
  extension?: string | null;
  downloadCount?: number;
  dailyDownloadCount?: number | null;
  dailyDownloadLimit?: number | null;
  remainingDailyDownloads?: number | null;
  isGuest?: boolean;
  idempotent?: boolean;
};

export const getDownloads = async (query: DownloadQuery = {}) => {
  const response = await API.get<ApiResponse<Download[]>>('/downloads', {
    params: query,
  });
  return response.data;
};

const GUEST_ID_KEY = 'guest_id';

export const createClientRequestId = () => {
  try {
    if (typeof Crypto.randomUUID === 'function') {
      return Crypto.randomUUID();
    }
  } catch {
    // fallback below
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, token => {
    const random = Math.floor(Math.random() * 16);
    const value = token === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const getGuestId = async (): Promise<string> => {
  // Native Android ID remains stable across ordinary app-data clears and
  // reinstalls (same device, user and app-signing key). The native method
  // hashes it to a UUID; the raw identifier is never sent to the server.
  if (Platform.OS === 'android') {
    const stableId = await NativeModules.AndroidWallpaperModule?.getStableGuestId?.();
    if (typeof stableId !== 'string' || !/^[a-f0-9-]{36}$/i.test(stableId)) {
      throw new Error('Stable guest identity is unavailable on this device.');
    }
    return stableId;
  }
  // Retain the previous identifier for other platforms.
  const existing = await SecureStore.getItemAsync(GUEST_ID_KEY);
  if (existing) return existing;
  const guestId = createClientRequestId();
  await SecureStore.setItemAsync(GUEST_ID_KEY, guestId);
  return guestId;
};

export const ensureDownloadAllowed = async () => {
  const check = await preferencesService.canDownloadNow();
  if (!check.allowed) {
    throw new Error(check.reason);
  }
  return true;
};

const unwrapResponse = (response: any): DownloadAccessResponse =>
  (response?.data?.data ?? response?.data ?? response) as DownloadAccessResponse;

const postDownloadAction = async (
  ownerType: DownloadOwnerType,
  action: 'preflight' | 'commit',
  body: Record<string, unknown>,
) => {
  if (ownerType === 'user') {
    const response = await API.post<ApiResponse<DownloadAccessResponse>>(
      `/downloads/${action}`,
      body,
    );
    return unwrapResponse(response);
  }

  const guestId = await getGuestId();
  const response = await API.post<ApiResponse<DownloadAccessResponse>>(
    `/downloads/public/${action}`,
    body,
    {
      headers: {
        'x-guest-id': guestId,
      },
    },
  );
  return unwrapResponse(response);
};

export const preflightDownload = async (
  wallpaperId: string,
  ownerType: DownloadOwnerType,
) =>
  postDownloadAction(ownerType, 'preflight', {
    wallpaperId,
  });

export const commitDownload = async (
  wallpaperId: string,
  clientRequestId: string,
  ownerType: DownloadOwnerType,
) =>
  postDownloadAction(ownerType, 'commit', {
    wallpaperId,
    clientRequestId,
  });

// Backward-compatible helper for older callers. New download UI should use the
// coordinator so permission and device save happen before this backend commit.
export const recordDownload = async (
  wallpaperId: string,
  loggedIn: boolean,
) => {
  await ensureDownloadAllowed();
  return commitDownload(
    wallpaperId,
    createClientRequestId(),
    loggedIn ? 'user' : 'guest',
  );
};

export const addDownload = async (
  wallpaperId: string,
  loggedIn: boolean,
) => recordDownload(wallpaperId, loggedIn);