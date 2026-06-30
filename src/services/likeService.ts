import API from './api';
import { ApiResponse } from './types';

export interface LikeStatus {
    isLiked: boolean;
}

/**
 * Like Wallpaper
 */
export const likeWallpaper = async (
    wallpaperId: string,
) => {
    const response = await API.post<ApiResponse<null>>(
        `/likes/${wallpaperId}`,
    );

    return response.data;
};

/**
 * Unlike Wallpaper
 */
export const unlikeWallpaper = async (
    wallpaperId: string,
) => {
    const response = await API.delete<ApiResponse<null>>(
        `/likes/${wallpaperId}`,
    );

    return response.data;
};

/**
 * Toggle Like
 */
export const toggleLike = async (
    wallpaperId: string,
    isLiked: boolean,
) => {
    if (isLiked) {
        return unlikeWallpaper(wallpaperId);
    }

    return likeWallpaper(wallpaperId);
};

/**
 * Like Status
 */
export const getLikeStatus = async (
    wallpaperId: string,
) => {
    const response = await API.get<ApiResponse<LikeStatus>>(
        `/likes/${wallpaperId}/status`,
    );

    return response.data;
};