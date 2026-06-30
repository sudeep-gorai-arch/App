import API from './api';
import { ApiResponse, Favorite } from './types';

export interface FavoriteQuery {
    limit?: number;
    offset?: number;
}

/**
 * Get User Favorites
 */
export const getFavorites = async (
    query: FavoriteQuery = {},
) => {
    const response = await API.get<ApiResponse<Favorite[]>>(
        '/favorites',
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
) => {
    const response = await API.post<ApiResponse<Favorite>>(
        '/favorites',
        {
            wallpaperId,
        },
    );

    return response.data;
};

/**
 * Remove Favorite
 */
export const removeFavorite = async (
    wallpaperId: string,
) => {
    const response = await API.delete<ApiResponse<null>>(
        `/favorites/${wallpaperId}`,
    );

    return response.data;
};

/**
 * Toggle Favorite
 */
export const toggleFavorite = async (
    wallpaperId: string,
) => {
    const response = await API.post<
        ApiResponse<{
            isFavorite: boolean;
        }>
    >(`/favorites/${wallpaperId}/toggle`);

    return response.data;
};

/**
 * Favorite Status
 */
export const getFavoriteStatus = async (
    wallpaperId: string,
) => {
    const response = await API.get<
        ApiResponse<{
            isFavorite: boolean;
        }>
    >(`/favorites/${wallpaperId}/status`);

    return response.data;
};