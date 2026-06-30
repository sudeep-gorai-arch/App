import API from './api';
import { ApiResponse, Category } from './types';

export interface CategoryQuery {
  limit?: number;
  offset?: number;
  active?: boolean;
}

/**
 * Get All Categories
 */
export const getCategories = async (
  query: CategoryQuery = {},
) => {
  const response = await API.get<ApiResponse<Category[]>>(
    '/categories',
    {
      params: query,
    },
  );

  return response.data;
};

/**
 * Get Category By Slug
 */
export const getCategoryBySlug = async (
  slug: string,
) => {
  const response = await API.get<ApiResponse<Category>>(
    `/categories/${slug}`,
  );

  return response.data;
};