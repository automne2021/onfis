import axios, { type AxiosInstance, type InternalAxiosRequestConfig, AxiosError } from 'axios';
import { getAccessToken } from './auth';
import { getTenantFromPath } from '../utils/tenant';
// import { supabase } from './supabaseClient';

const DOCKER_INTERNAL_HOSTS = new Set([
  'api-gateway',
  'admin-service',
  'user-service',
  'project-service',
  'position-service',
  'chat-service',
  'announcement-service',
]);

function resolveRootUrl(): string {
  const rawValue = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? '';
  if (!rawValue) {
    return '';
  }

  try {
    const parsedUrl = new URL(rawValue);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Browser cannot resolve Docker internal service names.
    if (DOCKER_INTERNAL_HOSTS.has(hostname)) {
      return '';
    }

    return parsedUrl.origin;
  } catch {
    return '';
  }
}

const ROOT_URL: string = resolveRootUrl();

function buildTenantApiBase(tenant: string): string {
  return ROOT_URL ? `${ROOT_URL}/${tenant}/api` : `/${tenant}/api`;
}

const api: AxiosInstance = axios.create({
  baseURL: ROOT_URL || '/',
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
      config.baseURL = buildTenantApiBase(tenant);
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