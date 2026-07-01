import API from './api';
import { ApiResponse, Download } from './types';

export interface DownloadQuery {
  limit?: number;
  offset?: number;
}

export interface PublicDownloadResponse {
  wallpaperId?: string;
  downloadUrl?: string;
  url?: string;
  imageUrl?: string;
  image_url?: string;
  downloadCount?: number;
  download_count?: number;
  downloads?: number;
  wallpaper?: any;
}

/**
 * User Download History
 *
 * Used by:
 * - DownloadsScreen
 * - ProfileScreen Recent Downloads
 */
export const getDownloads = async (query: DownloadQuery = {}) => {
  const response = await API.get<ApiResponse<Download[]>>('/downloads', {
    params: query,
  });

  return response.data;
};

/**
 * Record Download - Logged-in User
 *
 * Keep returning response.data because WallpaperDetailsScreen safely reads:
 * response.data.data / response.data
 */
export const recordDownload = async (wallpaperId: string) => {
  const response = await API.post<ApiResponse<Download>>('/downloads', {
    wallpaperId,
  });

  return response.data;
};

/**
 * Record Download - Guest/Public User
 *
 * Keep returning response.data because backend may return:
 * - downloadUrl
 * - imageUrl
 * - downloadCount
 * - wallpaper
 */
export const recordPublicDownload = async (wallpaperId: string) => {
  const response = await API.post<ApiResponse<PublicDownloadResponse>>(
    '/downloads/public',
    {
      wallpaperId,
    },
  );

  return response.data;
};

/**
 * Smart Download Recorder
 */
export const addDownload = async (wallpaperId: string, loggedIn: boolean) => {
  if (loggedIn) {
    return recordDownload(wallpaperId);
  }

  return recordPublicDownload(wallpaperId);
};