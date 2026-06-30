import API from './api';
import { ApiResponse, User } from './types';

export interface UpdateProfileRequest {
    username?: string;
    bio?: string;
    avatarUrl?: string;
}

/**
 * Current User
 */
export const getMe = async () => {
    const response = await API.get<ApiResponse<User>>(
        '/users/me',
    );

    return response.data;
};

/**
 * Update Profile
 */
export const updateProfile = async (
    data: UpdateProfileRequest,
) => {
    const response = await API.put<ApiResponse<User>>(
        '/users/me',
        data,
    );

    return response.data;
};

/**
 * Delete Account
 */
export const deleteAccount = async () => {
    const response = await API.delete<ApiResponse<null>>(
        '/users/me',
    );

    return response.data;
};