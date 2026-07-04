import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

import API from './api';
import { ApiResponse, Download } from './types';

import * as Crypto from 'expo-crypto';

export interface DownloadQuery {
  limit?: number;
  offset?: number;
}

/*
----------------------------------------
DOWNLOAD HISTORY
----------------------------------------
*/

export const getDownloads = async (
  query: DownloadQuery = {},
) => {
  const response =
    await API.get<ApiResponse<Download[]>>(
      '/downloads',
      {
        params: query,
      },
    );

  return response.data;
};

/*
----------------------------------------
GUEST ID
----------------------------------------
*/

const GUEST_ID_KEY = 'guest_id';

export const getGuestId = async (): Promise<string> => {
  const existing =
    await SecureStore.getItemAsync(
      GUEST_ID_KEY,
    );

  if (existing) {
    return existing;
  }

  const guestId =
    Crypto.randomUUID();

  await SecureStore.setItemAsync(
    GUEST_ID_KEY,
    guestId,
  );

  return guestId;
};
/*
----------------------------------------
DOWNLOAD
----------------------------------------
*/

export const recordDownload =
  async (
    wallpaperId: string,
    loggedIn: boolean,
  ) => {
    const headers: Record<
      string,
      string
    > = {};

    if (!loggedIn) {
      headers['x-guest-id'] =
        await getGuestId();
    }

    const response =
      await API.post<
        ApiResponse<Download>
      >(
        '/downloads',
        {
          wallpaperId,
        },
        {
          headers,
        },
      );

    return response.data;
  };

/*
----------------------------------------
SMART DOWNLOAD
----------------------------------------
*/

export const addDownload =
  async (
    wallpaperId: string,
    loggedIn: boolean,
  ) => {
    return recordDownload(
      wallpaperId,
      loggedIn,
    );
  };