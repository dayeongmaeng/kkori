import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_WEB_REDIRECT_BASE_URL = 'https://test-kkori.vercel.app';

export function getKakaoRedirectUri() {
  if (Platform.OS === 'web') {
    if (__DEV__) {
      return 'http://localhost:8081/oauth/kakao';
    }

    const webBaseUrl = process.env.EXPO_PUBLIC_WEB_URL ?? KAKAO_WEB_REDIRECT_BASE_URL;
    return `${webBaseUrl.replace(/\/$/, '')}/oauth/kakao`;
  }

  return AuthSession.makeRedirectUri({
    scheme: 'kkori',
    path: 'oauth/kakao',
  });
}

export function buildKakaoAuthorizeUrl(redirectUri: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: KAKAO_REST_API_KEY ?? '',
    redirect_uri: redirectUri,
  });

  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}
