import API from './api';
import { ApiResponse, Download } from './types';

export interface DownloadQuery {
    limit?: number;
    offset?: number;
}

/**
 * User Download History
 */
export const getDownloads = async (
    query: DownloadQuery = {},
) => {
    const response = await API.get<ApiResponse<Download[]>>(
        '/downloads',
        {
            params: query,
        },
    );

    return response.data;
};

/**
 * Record Download (Logged-in User)
 */
export const recordDownload = async (
    wallpaperId: string,
) => {
    const response = await API.post<ApiResponse<Download>>(
        '/downloads',
        {
            wallpaperId,
        },
    );

    return response.data;
};

/**
 * Record Download (Guest User)
 */
export const recordPublicDownload = async (
    wallpaperId: string,
) => {
    const response = await API.post<ApiResponse<null>>(
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
export const addDownload = async (
    wallpaperId: string,
    loggedIn: boolean,
) => {
    if (loggedIn) {
        return recordDownload(wallpaperId);
    }

    return recordPublicDownload(wallpaperId);
};