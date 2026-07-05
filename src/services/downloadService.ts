import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";
import { v4 as uuid } from "uuid";
import * as Crypto from "expo-crypto";

import API from "./api";
import { ApiResponse, Download } from "./types";
import { preferencesService } from "./preferencesService";

export interface DownloadQuery {
  limit?: number;
  offset?: number;
}

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
) => {
  return recordDownload(wallpaperId, loggedIn);
};