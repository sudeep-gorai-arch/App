import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { getStoredToken, invalidateSessionForToken } from './authSessionStorage';

// ===============================
// CHANGE THIS ONLY
// ===============================
 //const BASE_URL = 'http://192.168.1.11:5000/api'

 const BASE_URL = 'https://flexiwalls.onrender.com/api';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Every API request reads the current session; do not cache auth headers.
// The login endpoint must not carry an older account's JWT.
API.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (config.url === '/auth/google' || config.url === '/auth/login') {
      delete config.headers.Authorization;
      return config;
    }
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  error => Promise.reject(error),
);

// A 401 only invalidates the exact session that made the failed request.
// Rejected responses from old requests cannot sign out a fresh login.
API.interceptors.response.use(
  response => response,
  async (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      const authorization = String(error.config?.headers?.Authorization ?? '');
      const rejectedToken = authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length).trim()
        : '';
      if (rejectedToken) {
        await invalidateSessionForToken(rejectedToken);
      }
    }

    let message = 'Something went wrong';
    if (error.response?.data) {
      const data: any = error.response.data;
      message = data.message || data.error || message;
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    });
  },
);

export default API;
export { BASE_URL };
