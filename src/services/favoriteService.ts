import API from './api';
import { ApiResponse, Favorite } from './types';
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWallpaperById } from './wallpaperService';

export interface FavoriteQuery {
  limit?: number;
  offset?: number;
}

export interface FavoriteStatus {
  wallpaperId?: string;
  favorite?: boolean;
  isFavorite: boolean;
  favoriteCount?: number;
  favorite_count?: number;
  favoritesCount?: number;
  favorites_count?: number;
  removed?: boolean;
  wallpaper?: any;
}

export interface LocalFavoriteInput {
  wallpaperId: string;
  wallpaper?: any;
}

export interface LocalFavoriteRecord {
  wallpaperId: string;
  wallpaper: any;
  createdAt: string;
}

export const LOCAL_FAVORITES_KEY = '@flexiwalls:guestFavorites';

export const getLocalFavorites = async (): Promise<LocalFavoriteRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const saveLocalFavorite = async (
  input: LocalFavoriteInput,
) => {
  const current = await getLocalFavorites();

  const next = current.filter(
    item => item.wallpaperId !== input.wallpaperId,
  );

  next.unshift({
    wallpaperId: input.wallpaperId,
    wallpaper: input.wallpaper ?? {},
    createdAt: new Date().toISOString(),
  });

  await AsyncStorage.setItem(
    LOCAL_FAVORITES_KEY,
    JSON.stringify(next),
  );
};

export const removeLocalFavorite = async (
  wallpaperId: string,
) => {
  const current = await getLocalFavorites();

  const next = current.filter(
    item => item.wallpaperId !== wallpaperId,
  );

  await AsyncStorage.setItem(
    LOCAL_FAVORITES_KEY,
    JSON.stringify(next),
  );
};

export const clearLocalFavorites = async () => {
  await AsyncStorage.removeItem(LOCAL_FAVORITES_KEY);
};

const unwrapApiData = <T>(responseData: any): T => {
  return (responseData?.data ?? responseData) as T;
};

const isLoggedIn = async () => {
  const token = await SecureStore.getItemAsync('token');

  return !!token;
};

/**
 * Get User Favorites
 */
export const getFavorites = async (
  query: FavoriteQuery = {},
) => {
  if (!(await isLoggedIn())) {
    return {
      success: true,
      data: await getLocalFavorites(),
    };
  }

  const response = await API.get<ApiResponse<Favorite[]>>(
    '/favorites',
    {
      params: query,
    },
  );

  return response.data;
};


export const getLiveFavorites = async (
  query: FavoriteQuery = {},
) => {
  if (!(await isLoggedIn())) {
    return {
      success: true,
      data: await getLocalFavorites(),
    };
  }

  const response = await API.get<ApiResponse<Favorite[]>>(
    '/favorites/live',
    {
      params: query,
    },
  );

  return response.data;
};


/**
 * Add Favorite
 */
export const addFavorite = async (
  wallpaperId: string,
  wallpaper?: any,
) => {
  if (!(await isLoggedIn())) {
    await saveLocalFavorite({
      wallpaperId,
      wallpaper,
    });

    return {
      isFavorite: true,
      favoriteCount: 1,
    };
  }

  const response = await API.post<ApiResponse<FavoriteStatus>>(
    '/favorites',
    {
      wallpaperId,
    },
  );

  return unwrapApiData<FavoriteStatus>(response.data);
};


/**
 * Remove Favorite
 */
export const removeFavorite = async (
  wallpaperId: string,
) => {
  if (!(await isLoggedIn())) {
    await removeLocalFavorite(wallpaperId);

    return {
      removed: true,
      isFavorite: false,
    };
  }

  const response = await API.delete<ApiResponse<FavoriteStatus>>(
    `/favorites/${wallpaperId}`,
  );

  return unwrapApiData<FavoriteStatus>(response.data);
};

/**
 * Toggle Favorite
 */
export const toggleFavorite = async (
  wallpaperId: string,
  wallpaper?: any,
) => {
  if (!(await isLoggedIn())) {
    const favorites = await getLocalFavorites();

    const exists = favorites.some(
      item => item.wallpaperId === wallpaperId,
    );

    if (exists) {
      await removeLocalFavorite(wallpaperId);

      return {
        isFavorite: false,
      };
    }

    let wallpaperData = wallpaper;

    // If caller didn't pass wallpaper, fetch it
    if (!wallpaperData) {
      try {
        const response = await getWallpaperById(wallpaperId);

        wallpaperData = response?.data;
      } catch (error) {
        console.log(
          'Failed to fetch wallpaper details for guest favorite',
          error,
        );

        wallpaperData = {
          id: wallpaperId,
        };
      }
    }

    await saveLocalFavorite({
      wallpaperId,
      wallpaper: {
        ...wallpaperData,
        isFavorite: true,
        is_favorite: true,
      },
    });

    return {
      isFavorite: true,
    };
  }

  // Logged-in flow unchanged
  const response = await API.post<ApiResponse<FavoriteStatus>>(
    `/favorites/toggle/${wallpaperId}`,
  );

  return unwrapApiData<FavoriteStatus>(response.data);
};

/**
 * Favorite Status
 */
export const getFavoriteStatus = async (
  wallpaperId: string,
) => {
  if (!(await isLoggedIn())) {
    const favorites = await getLocalFavorites();

    return {
      isFavorite: favorites.some(
        item => item.wallpaperId === wallpaperId,
      ),
    };
  }

  const response = await API.get<ApiResponse<FavoriteStatus>>(
    `/favorites/status/${wallpaperId}`,
  );

  return unwrapApiData<FavoriteStatus>(response.data);
};