import API from './api';
import { ApiResponse, Favorite } from './types';

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

const unwrapApiData = <T>(responseData: any): T => {
  return (responseData?.data ?? responseData) as T;
};

/**
 * Get User Favorites
 */
export const getFavorites = async (query: FavoriteQuery = {}) => {
  const response = await API.get<ApiResponse<Favorite[]>>('/favorites', {
    params: query,
  });

  return response.data;
};

/**
 * Add Favorite
 */
export const addFavorite = async (wallpaperId: string) => {
  const response = await API.post<ApiResponse<FavoriteStatus>>('/favorites', {
    wallpaperId,
  });

  return unwrapApiData<FavoriteStatus>(response.data);
};

/**
 * Remove Favorite
 */
export const removeFavorite = async (wallpaperId: string) => {
  const response = await API.delete<ApiResponse<FavoriteStatus>>(
    `/favorites/${wallpaperId}`,
  );

  return unwrapApiData<FavoriteStatus>(response.data);
};

/**
 * Toggle Favorite
 */
export const toggleFavorite = async (wallpaperId: string) => {
  const response = await API.post<ApiResponse<FavoriteStatus>>(
    `/favorites/toggle/${wallpaperId}`,
  );

  return unwrapApiData<FavoriteStatus>(response.data);
};

/**
 * Favorite Status
 */
export const getFavoriteStatus = async (wallpaperId: string) => {
  const response = await API.get<ApiResponse<FavoriteStatus>>(
    `/favorites/status/${wallpaperId}`,
  );

  return unwrapApiData<FavoriteStatus>(response.data);
};