import * as AuthSession from 'expo-auth-session';

export const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_WEB_REDIRECT_BASE_URL = 'https://kkori.vercel.app';
const KAKAO_DEV_REDIRECT_URI = 'http://localhost:8081/oauth/kakao';

export function getKakaoRedirectUri() {
  const configuredRedirectUri = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI?.trim();
  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  if (__DEV__) {
    return KAKAO_DEV_REDIRECT_URI;
  }

  const webBaseUrl = process.env.EXPO_PUBLIC_WEB_URL ?? KAKAO_WEB_REDIRECT_BASE_URL;
  return `${webBaseUrl.replace(/\/$/, '')}/oauth/kakao`;
}

export function getKakaoNativeReturnUri() {
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
