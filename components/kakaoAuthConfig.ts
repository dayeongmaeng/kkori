import * as AuthSession from 'expo-auth-session';
import { Linking, Platform } from 'react-native';

export const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
export const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

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

// iOS 카카오 앱 로그인 redirect URI: kakao{NATIVE_APP_KEY}://oauth
// Kakao Developers에 등록한 iOS Bundle ID와 앱의 bundleIdentifier가 일치해야 한다.
export function getKakaoIosAppRedirectUri(): string {
  return `kakao${KAKAO_NATIVE_APP_KEY}://oauth`;
}

// kakaokompassauth://authorize 로 Kakao 앱 실행 (iOS 네이티브 앱 로그인)
export function buildKakaoNativeAppAuthorizeUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: KAKAO_NATIVE_APP_KEY ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
  });
  return `kakaokompassauth://authorize?${params.toString()}`;
}

export function buildKakaoAuthorizeUrl(redirectUri: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: KAKAO_REST_API_KEY ?? '',
    redirect_uri: redirectUri,
  });

  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

// iOS: Kakao 앱 설치 여부 확인 (LSApplicationQueriesSchemes에 kakaokompassauth가 등록되어야 동작)
export async function canOpenKakaoApp(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await Linking.canOpenURL('kakaokompassauth://');
  } catch {
    return false;
  }
}

// 진단 로그: 실제 key 값은 출력하지 않는다.
// iOS에서는 Kakao Developers에 등록해야 할 redirect URI를 개발 환경에서만 출력한다.
export function logKakaoDiagnostics(): void {
  console.info('[KakaoLogin] diagnostics', {
    platform: Platform.OS,
    hasBundleIdentifier: true, // com.kkori.app (app.json 기준)
    hasNativeAppKey: Boolean(KAKAO_NATIVE_APP_KEY),
    hasRestApiKey: Boolean(KAKAO_REST_API_KEY),
  });

  if (__DEV__ && Platform.OS === 'ios' && KAKAO_NATIVE_APP_KEY) {
    // Kakao Developers > 내 애플리케이션 > 앱 설정 > 플랫폼 > iOS > Bundle ID + Redirect URI에 이 값을 등록해야 한다.
    console.info('[KakaoLogin] iOS redirectUri to register in Kakao Developers:', getKakaoIosAppRedirectUri());
  }
}
