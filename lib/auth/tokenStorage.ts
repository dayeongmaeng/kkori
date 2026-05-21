import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'pet-care:auth:access-token';
const REFRESH_TOKEN_KEY = 'pet-care:auth:refresh-token';
const USER_KEY = 'pet-care:auth:user';
const DEVICE_ID_KEY = 'pet-care:device-id';
const SESSION_CACHE_PREFIXES = [
  'pet-care:auth:',
  'pet-care:api:',
  'pet-care:kakao:',
  'pet-care:photo-data:',
  'pet-care:log-extras:',
  'pet-care:log-photos:',
  'pet-care:pets:',
  'pet-care:current-pet-id:',
  'pet-care:caregivers:',
  'pet-care:current-caregiver-id:',
  'pet-care:daily-photos:',
  'pet-care:daily-logs:',
];
const WEB_SESSION_STORAGE_KEYS = ['pet-care:kakao:redirect-uri'];

function getStorageKey(key: string) {
  return Platform.OS === 'web' ? key : key.replaceAll(':', '.');
}

const storage = {
  getItem: (key: string) =>
    Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(getStorageKey(key)),
  setItem: (key: string, value: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(getStorageKey(key), value),
  deleteItem: (key: string) =>
    Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(getStorageKey(key)),
};

export interface AuthUser {
  externalId?: string;
  email?: string;
  name?: string;
  provider?: string;
}

export interface StoredAuthTokens {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
}

export async function getAuthTokens(): Promise<StoredAuthTokens | null> {
  const [accessToken, refreshToken, userJson] = await Promise.all([
    storage.getItem(ACCESS_TOKEN_KEY),
    storage.getItem(REFRESH_TOKEN_KEY),
    storage.getItem(USER_KEY),
  ]);

  if (!accessToken || !refreshToken) return null;

  return {
    accessToken,
    refreshToken,
    user: userJson ? (JSON.parse(userJson) as AuthUser) : undefined,
  };
}

export async function saveAuthTokens(tokens: StoredAuthTokens): Promise<void> {
  await Promise.all([
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
    tokens.user
      ? storage.setItem(USER_KEY, JSON.stringify(tokens.user))
      : storage.deleteItem(USER_KEY),
  ]);
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    storage.deleteItem(ACCESS_TOKEN_KEY),
    storage.deleteItem(REFRESH_TOKEN_KEY),
    storage.deleteItem(USER_KEY),
  ]);
}

function isSessionCacheKey(key: string) {
  if (key === DEVICE_ID_KEY) return false;
  return SESSION_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

async function clearAsyncStorageSessionCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const sessionKeys = keys.filter(isSessionCacheKey);
  if (sessionKeys.length > 0) {
    await AsyncStorage.multiRemove(sessionKeys);
  }
}

function clearWebStorageSessionCache() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  try {
    for (const key of Object.keys(window.localStorage)) {
      if (isSessionCacheKey(key)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // AsyncStorage 정리가 실패하지 않도록 웹 스토리지 접근 오류는 무시해요.
  }

  try {
    WEB_SESSION_STORAGE_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
    for (const key of Object.keys(window.sessionStorage)) {
      if (isSessionCacheKey(key)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // 일부 브라우저 모드에서는 sessionStorage 접근이 막힐 수 있어요.
  }
}

export async function clearAuthSessionCache(): Promise<void> {
  const results = await Promise.allSettled([
    clearAuthTokens(),
    clearAsyncStorageSessionCache(),
  ]);
  clearWebStorageSessionCache();

  const rejected = results.find((result) => result.status === 'rejected');
  if (rejected) {
    throw rejected.reason;
  }
}
