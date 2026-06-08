import API from './api';
import {AuthRequest,AuthResponse,ApiResponse} from './types';

export const login=(data:AuthRequest)=>
 API.post<ApiResponse<AuthResponse>>('/auth/login',data).then(r=>r.data);

export const register=(data:AuthRequest)=>
 API.post<ApiResponse<AuthResponse>>('/auth/register',data).then(r=>r.data);
