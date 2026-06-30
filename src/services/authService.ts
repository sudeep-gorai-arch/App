import API from './api';
import {
    ApiResponse,
    AuthRequest,
    AuthResponse,
    User,
} from './types';

/**
 * Email Login (for admin if enabled)
 */
export const login = async (data: AuthRequest) => {
    const response = await API.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        data,
    );

    return response.data;
};

/**
 * Google Login
 */
export const googleLogin = async (idToken: string) => {
    const response = await API.post<ApiResponse<AuthResponse>>(
        '/auth/google',
        {
            idToken,
        },
    );

    return response.data;
};

/**
 * Logout
 */
export const logoutUser = async () => {
    const response = await API.post<ApiResponse<null>>(
        '/auth/logout',
    );

    return response.data;
};

/**
 * Get Logged-in User
 */
export const getProfile = async () => {
    const response = await API.get<ApiResponse<User>>(
        '/users/me',
    );

    return response.data;
};