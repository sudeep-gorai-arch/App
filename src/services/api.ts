import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = axios.create({
  // baseURL:'http://localhost:5000/api',
  baseURL:'https://backend-trail-6u5m.onrender.com/api',
  timeout:10000,
});

API.interceptors.request.use(async config=>{
 const token = await AsyncStorage.getItem('token');
 if(token) config.headers.Authorization=`Bearer ${token}`;
 return config;
});

export default API;
