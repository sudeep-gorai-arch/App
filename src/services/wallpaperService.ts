import API from './api';
import { ApiResponse, Wallpaper } from './types';

export interface WallpaperQuery {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
  active?: boolean;
}

const buildParams = ({
  limit = 20,
  offset = 0,
  search,
  category,
  active,
}: WallpaperQuery) => {
  const params: Record<string, any> = {
    limit,
    offset,
  };

  if (search?.trim()) params.search = search.trim();
  if (category?.trim()) params.category = category.trim();
  if (active !== undefined) params.active = active;

  return params;
};

/**
 * All Wallpapers
 */
export const getWallpapers = async (
  query: WallpaperQuery = {},
) => {
  const response = await API.get<ApiResponse<Wallpaper[]>>(
    '/wallpapers',
    {
      params: buildParams(query),
    },
  );

  return response.data;
};

/**
 * Featured Wallpapers
 */
export const getFeaturedWallpapers = async (limit = 5) => {
  const response = await API.get<ApiResponse<Wallpaper[]>>(
    '/wallpapers/featured',
    {
      params: { limit },
    },
  );

  return response.data;
};

export const getTrendingWallpapers = async (
  limit = 20,
) => {
  const response = await API.get(
    "/wallpapers/trending",
    {
      params: { limit },
    },
  );

  return response.data;
};

/**
 * Premium Wallpapers
 */
export const getPremiumWallpapers = async (limit = 20) => {
  const response = await API.get<ApiResponse<Wallpaper[]>>(
    '/wallpapers/premium',
    {
      params: { limit },
    },
  );

  return response.data;
};

/**
 * Search Wallpapers
 */
export const searchWallpapers = async (
  search: string,
  limit = 20,
  offset = 0,
) => {
  const response = await API.get<ApiResponse<Wallpaper[]>>(
    '/wallpapers/search',
    {
      params: {
        search,
        limit,
        offset,
      },
    },
  );

  return response.data;
};

/**
 * Wallpapers by Category Slug
 */
export const getCategoryWallpapers = async (
  slug: string,
  limit = 20,
  offset = 0,
) => {
  const response = await API.get<ApiResponse<Wallpaper[]>>(
    `/wallpapers/category/${slug}`,
    {
      params: {
        limit,
        offset,
      },
    },
  );

  return response.data;
};

/**
 * Wallpaper Details
 */
export const getWallpaperById = async (id: string) => {
  const response = await API.get<ApiResponse<Wallpaper>>(
    `/wallpapers/${id}`,
  );

  return response.data;
};

/**
 * Wallpaper By Slug
 */
export const getWallpaperBySlug = async (slug: string) => {
  const response = await API.get<ApiResponse<Wallpaper>>(
    `/wallpapers/slug/${slug}`,
  );

  return response.data;
};

/**
 * Related Wallpapers
 */
export const getRelatedWallpapers = async (
  id: string,
) => {
  const response = await API.get<ApiResponse<Wallpaper[]>>(
    `/wallpapers/${id}/related`,
  );

  return response.data;
};

/**
 * Increment View Count
 */
export const incrementView = async (
  id: string,
) => {
  return API.post(`/wallpapers/${id}/view`);
};

/**
 * Increment Download Count
 */
export const incrementDownload = async (
  id: string,
) => {
  return API.post(`/wallpapers/${id}/download`);
};