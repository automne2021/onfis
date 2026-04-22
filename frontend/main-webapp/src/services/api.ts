import axios, { type AxiosInstance, type InternalAxiosRequestConfig, AxiosError } from 'axios';
import { getAccessToken } from './auth';
import { getTenantFromPath } from '../utils/tenant';
// import { supabase } from './supabaseClient';

const ROOT_URL: string = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const api: AxiosInstance = axios.create({
  baseURL: ROOT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // cookie/session
  withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    const tenant = getTenantFromPath();

    if (tenant) {
      config.baseURL = `${ROOT_URL}/${tenant}/api`;
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized API response', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default api;