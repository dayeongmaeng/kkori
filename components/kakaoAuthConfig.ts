import * as AuthSession from 'expo-auth-session';
import { Linking, Platform } from 'react-native';

import { logger } from '../lib/logger';

export const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
export const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

const KAKAO_WEB_REDIRECT_BASE_URL = 'https://kkori.vercel.app';
const KAKAO_DEV_REDIRECT_URI = 'http://localhost:8081/oauth/kakao';

// web 전용: localhost(__DEV__) 또는 Vercel URL. 실기기에서는 사용하지 않는다.
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

// iOS 전용: 실기기에서 접근 가능한 서비스 URL을 redirect_uri로 사용.
// localhost는 실기기에서 접근 불가하므로 __DEV__ 여부와 무관하게 Vercel URL 반환.
// Kakao Developers > REST API 키 > 리다이렉트 URI에 이 URL이 등록되어 있어야 한다.
// Vercel /oauth/kakao 페이지가 kkori://oauth/kakao 딥링크로 리다이렉트하므로
// openAuthSessionAsync(authorizeUrl, getKakaoNativeReturnUri())가 code를 캡처한다.
export function getKakaoIosRedirectUri(): string {
  const configuredRedirectUri = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI?.trim();
  if (configuredRedirectUri) {
    return configuredRedirectUri;
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

// iOS Kakao 로그인 redirect URI: kakao{NATIVE_APP_KEY}://oauth
// 앱 로그인 + Safari web fallback 모두 이 URI를 사용한다.
// Kakao Developers > 앱 설정 > 플랫폼 > iOS > Redirect URI에 등록 필요.
// KAKAO_NATIVE_APP_KEY가 없으면 호출하지 말 것 (handleKakaoLogin에서 사전 차단).
export function getKakaoIosAppRedirectUri(): string {
  if (!KAKAO_NATIVE_APP_KEY) {
    logger.warn('auth.kakao.config.native_key_missing');
    return '';
  }
  return `kakao${KAKAO_NATIVE_APP_KEY}://oauth`;
}

// redirectUri 로그 마스킹: kakao{KEY}://oauth → 'kakao****' (key 원문 보호)
export function maskKakaoScheme(redirectUri: string): string {
  return redirectUri.startsWith('kakao') ? 'kakao****' : '****';
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
  logger.info('auth.kakao.config.diagnostics', {
    platform: Platform.OS,
    hasNativeAppKey: Boolean(KAKAO_NATIVE_APP_KEY),
    hasRestApiKey: Boolean(KAKAO_REST_API_KEY),
  });

  if (__DEV__ && Platform.OS === 'ios') {
    // iOS 실기기 로그인에서 사용되는 redirect URI와 앱 복귀 URI를 진단용으로 출력한다.
    // iosAuthorizeRedirectUri: Kakao Developers에 등록된 redirect_uri (Vercel 경유)
    // nativeReturnUri: ASWebAuthenticationSession이 감지해 앱으로 복귀시키는 kkori:// 딥링크
    logger.debug('auth.kakao.config.ios_redirect_info', {
      iosAuthorizeRedirectUri: getKakaoIosRedirectUri(),
      nativeReturnUri: getKakaoNativeReturnUri(),
    });
  }

  if (__DEV__ && Platform.OS === 'ios' && KAKAO_NATIVE_APP_KEY) {
    logger.info('auth.kakao.config.ios_redirect_scheme', {
      redirectUriScheme: maskKakaoScheme(getKakaoIosAppRedirectUri()),
    });
  }
}
