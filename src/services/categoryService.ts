import API from './api';
import { Category, Wallpaper, ApiResponse } from './types';

export const getCategories = () =>
  API.get<ApiResponse<Category[]>>('/categories').then(r => r.data);

/**
 * Backend returns: { success, data: { category, wallpapers }, pagination }
 * (NOT a bare Wallpaper[]). Read `res.data.wallpapers` in the UI.
 */
export interface CategoryWallpapers {
  category: Pick<Category, 'id' | 'name' | 'slug' | 'icon'>;
  wallpapers: Wallpaper[];
}

export const getCategoryWallpapers = (slug: string, limit = 20, offset = 0) =>
  API.get<ApiResponse<CategoryWallpapers>>(`/categories/${slug}/wallpapers`, {
    params: { limit, offset },
  }).then(r => r.data);
