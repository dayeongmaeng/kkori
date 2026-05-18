import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, ApiResponse } from './types';

const FALLBACK_API_BASE_URL = 'https://api.kkori.co.kr';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? FALLBACK_API_BASE_URL;

const DEVICE_ID_KEY = 'pet-care:device-id';

async function getDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_ID_KEY);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  skipDeviceId = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipDeviceId) {
    const deviceId = await getDeviceId();
    if (deviceId) {
      headers['X-Device-Id'] = deviceId;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
  const headers: Record<string, string> = {};
  const deviceId = await getDeviceId();
  if (deviceId) headers['X-Device-Id'] = deviceId;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

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
  post: <T>(path: string, body: unknown, skipDeviceId = false) =>
    request<T>('POST', path, body, skipDeviceId),
  put: <T>(path: string, body: unknown) =>
    request<T>('PUT', path, body),
  delete: <T>(path: string) =>
    request<T>('DELETE', path),
  postFormData: <T>(path: string, formData: FormData) =>
    requestFormData<T>(path, formData),
};
