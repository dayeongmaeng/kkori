import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'pet-care:auth:access-token';
const REFRESH_TOKEN_KEY = 'pet-care:auth:refresh-token';
const USER_KEY = 'pet-care:auth:user';

const storage = {
  getItem: (key: string) =>
    Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  deleteItem: (key: string) =>
    Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
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
