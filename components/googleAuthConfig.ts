import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

function getGoogleRedirectUri() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/oauth/google`;
  }

  return AuthSession.makeRedirectUri({
    scheme: 'kkori',
    path: 'oauth/google',
  });
}

export function maskClientId(clientId?: string) {
  if (!clientId) return 'missing';
  return `${clientId.slice(0, 12)}...${clientId.slice(-12)}`;
}

export const GOOGLE_REDIRECT_URI = getGoogleRedirectUri();
