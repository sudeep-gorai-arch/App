import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===============================
// CHANGE THIS ONLY
// ===============================
const BASE_URL = __DEV__
  ? 'http://192.168.1.3:5000/api' // Local backend
  : 'https://backend-trail-6u5m.onrender.com/api'; // Production backend

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ===============================
// REQUEST INTERCEPTOR
// ===============================
API.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error),
);

// ===============================
// RESPONSE INTERCEPTOR
// ===============================
API.interceptors.response.use(
  response => response,
  async (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // Invalid/expired token
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }

    let message = 'Something went wrong';

    if (error.response?.data) {
      const data: any = error.response.data;

      message =
        data.message ||
        data.error ||
        message;
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