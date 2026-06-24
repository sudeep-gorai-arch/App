import API from './api';
import { Wallpaper, ApiResponse } from './types';

const buildWallpaperParams = (
  limit: number,
  offset: number,
  search?: string,
  category?: string,
) => {
  const params: Record<string, string | number> = {
    limit,
    offset,
  };

  const cleanSearch = search?.trim();
  const cleanCategory = category?.trim();

  if (cleanSearch) {
    params.search = cleanSearch;
  }

  if (cleanCategory) {
    params.category = cleanCategory;
  }

  return params;
};

export const getWallpapers = (
  limit = 10,
  offset = 0,
  search?: string,
  category?: string,
) =>
  API.get<ApiResponse<Wallpaper[]>>('/wallpapers', {
    params: buildWallpaperParams(limit, offset, search, category),
  }).then(r => r.data);

export const getFeaturedWallpapers = (limit = 5) =>
  API.get<ApiResponse<Wallpaper[]>>('/wallpapers/featured', {
    params: { limit },
  }).then(r => r.data);

export const getTrendingWallpapers = (limit = 10) =>
  API.get<ApiResponse<Wallpaper[]>>('/wallpapers/trending', {
    params: { limit },
  }).then(r => r.data);

export const getWallpaperById = (id: string) =>
  API.get<ApiResponse<Wallpaper>>(`/wallpapers/${id}`).then(r => r.data);