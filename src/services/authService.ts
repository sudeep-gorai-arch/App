import API from './api';
import { AuthRequest, AuthResponse, ApiResponse } from './types';

export const login = (data: AuthRequest) =>
    API.post<ApiResponse<AuthResponse>>('/auth/login', data).then(r => r.data);

export const register = (data: AuthRequest) =>
    API.post<ApiResponse<AuthResponse>>('/auth/register', data).then(r => r.data);

export const googleLogin = async (idToken: string) => {
    console.log("Sending Google Token to Backend");

    const response = await API.post("/auth/google", {
        idToken,
    });

    console.log("Backend Response", response.data);

    return response.data;
};