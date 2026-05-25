import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '../auth/tokenStorage';
import { ApiError, ApiResponse } from './types';

const DEV_API_BASE_URL = 'http://localhost:8080';
const PROD_API_BASE_URL = 'https://api.kkori.co.kr';
export const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://kkori.vercel.app';

// EXPO_PUBLIC_API_URL 최우선. 없으면 web 개발 환경만 localhost, 그 외(실기기 포함)는 운영 URL.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ && Platform.OS === 'web' ? DEV_API_BASE_URL : PROD_API_BASE_URL);

if (__DEV__) {
  console.log('[API] baseURL:', API_BASE_URL);
}

const DEVICE_ID_KEY = 'pet-care:device-id';
const AUTH_REFRESH_PATH = '/api/v1/auth/refresh';

async function getDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_ID_KEY);
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

async function buildBaseHeaders(skipDeviceId = false, skipAuth = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  if (!skipDeviceId) {
    const deviceId = await getDeviceId();
    if (deviceId) {
      headers['X-Device-Id'] = deviceId;
    }
  }

  if (!skipAuth) {
    const tokens = await getAuthTokens();
    if (tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  }

  return headers;
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getAuthTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const headers = await buildBaseHeaders();
    headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}${AUTH_REFRESH_PATH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!res.ok) {
      await clearAuthTokens();
      return null;
    }

    const json: ApiResponse<RefreshResponse> = await res.json();
    if (!json.success || !json.data?.accessToken) {
      await clearAuthTokens();
      return null;
    }

    const nextTokens = {
      accessToken: json.data.accessToken,
      refreshToken: json.data.refreshToken ?? tokens.refreshToken,
      user: tokens.user,
    };
    await saveAuthTokens(nextTokens);
    return nextTokens.accessToken;
  } catch {
    await clearAuthTokens();
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  skipDeviceId = false,
  skipAuth = false,
): Promise<T> {
  const headers = await buildBaseHeaders(skipDeviceId, skipAuth);
  headers['Content-Type'] = 'application/json';

  let res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuth && path !== AUTH_REFRESH_PATH) {
    const accessToken = await refreshAccessToken();
    if (accessToken) {
      const retryHeaders = await buildBaseHeaders(skipDeviceId, skipAuth);
      retryHeaders['Content-Type'] = 'application/json';
      retryHeaders.Authorization = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }
  }

  const contentLength = res.headers.get('Content-Length');
  const hasBody = res.status !== 204 && contentLength !== '0';

  if (!hasBody) {
    if (!res.ok) {
      throw new ApiError(res.status, { code: 'UNKNOWN', message: '알 수 없는 오류' });
    }
    return null as T;
  }

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(
      res.status,
      json.error ?? { code: 'UNKNOWN', message: '알 수 없는 오류' },
    );
  }

  return json.data;
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  let headers = await buildBaseHeaders();

  let res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    const accessToken = await refreshAccessToken();
    if (accessToken) {
      headers = await buildBaseHeaders();
      headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    }
  }

  const contentLength = res.headers.get('Content-Length');
  const hasBody = res.status !== 204 && contentLength !== '0';

  if (!hasBody) {
    if (!res.ok) throw new ApiError(res.status, { code: 'UNKNOWN', message: '알 수 없는 오류' });
    return null as T;
  }

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error ?? { code: 'UNKNOWN', message: '알 수 없는 오류' });
  }
  return json.data;
}

export const api = {
  get: <T>(path: string, skipDeviceId = false) =>
    request<T>('GET', path, undefined, skipDeviceId),
  post: <T>(path: string, body: unknown, skipDeviceId = false, skipAuth = false) =>
    request<T>('POST', path, body, skipDeviceId, skipAuth),
  put: <T>(path: string, body: unknown) =>
    request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) =>
    request<T>('PATCH', path, body),
  delete: <T>(path: string) =>
    request<T>('DELETE', path),
  postFormData: <T>(path: string, formData: FormData) =>
    requestFormData<T>(path, formData),
};
