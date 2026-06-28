import API from './api';
import { Category, Wallpaper, ApiResponse } from './types';

export const getCategories = () =>
  API.get<ApiResponse<Category[]>>('/categories').then(r => r.data);

export interface CategoryWallpapers {
  category: Pick<
    Category,
    'id' | 'name' | 'slug' | 'thumbnailUrl'
  >;

  wallpapers: Wallpaper[];
}

export const getCategoryWallpapers = (
  slug: string,
  limit = 20,
  offset = 0,
) =>
  API
    .get<ApiResponse<CategoryWallpapers>>(
      `/categories/${slug}/wallpapers`,
      {
        params: {
          limit,
          offset,
        },
      },
    )
    .then(r => r.data);