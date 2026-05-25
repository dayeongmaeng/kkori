import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { loginWithOAuth } from '../lib/api/auth';
import {
  getGoogleClientId,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
  logGoogleAuthDiagnostics,
} from './googleAuthConfig';
import {
  buildKakaoAuthorizeUrl,
  getKakaoNativeReturnUri,
  getKakaoRedirectUri,
  KAKAO_REST_API_KEY,
} from './kakaoAuthConfig';
import { s } from './AuthScreen.styles';

WebBrowser.maybeCompleteAuthSession();

// id_token + access_token을 동시에 받기 위해 implicit hybrid flow를 사용한다.
// useIdTokenAuthRequest는 response_type=id_token만 고정이라 access_token을 받을 수 없다.
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};

// response_type에 id_token이 포함되면 Google이 nonce를 요구한다.
function generateGoogleNonce(): string {
  const bytes = Crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

const LOGIN_TIMEOUT_MS = 30000;
const KAKAO_REDIRECT_URI_STORAGE_KEY = 'pet-care:kakao:redirect-uri';
type LoginProvider = 'GOOGLE' | 'KAKAO';

function requireGoogleClientId() {
  if (getGoogleClientId()) return null;
  if (Platform.OS === 'ios') return 'Google iOS 클라이언트 ID 설정이 필요해요.';
  if (Platform.OS === 'android') return 'Google Android 클라이언트 ID 설정이 필요해요.';
  return 'Google Web 클라이언트 ID 설정이 필요해요.';
}

function saveKakaoRedirectUri(redirectUri: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(KAKAO_REDIRECT_URI_STORAGE_KEY, redirectUri);
  } catch {
    // sessionStorage를 사용할 수 없는 환경에서는 동일한 생성 함수로 다시 계산해요.
  }
}

function getSavedKakaoRedirectUri() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return getKakaoRedirectUri();
  }

  try {
    return window.sessionStorage.getItem(KAKAO_REDIRECT_URI_STORAGE_KEY) ?? getKakaoRedirectUri();
  } catch {
    return getKakaoRedirectUri();
  }
}

export default function AuthScreen() {
  const { markLoggedIn } = useAuth();
  const router = useRouter();
  const [loginProvider, setLoginProvider] = useState<LoginProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kakaoCallbackHandledRef = useRef(false);
  const kakaoLatestCallbackUrlRef = useRef<string | null>(null);
  const kakaoBrowserOpenRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const missingMessage = requireGoogleClientId();
  const isLoggingIn = loginProvider !== null;

  // web: id_token + access_token implicit hybrid flow
  const webNonce = useMemo(() => generateGoogleNonce(), []);
  const webGoogleConfig = useMemo(() => ({
    clientId: GOOGLE_WEB_CLIENT_ID ?? '',
    responseType: 'id_token token',
    scopes: ['openid', 'profile', 'email'],
    redirectUri: GOOGLE_REDIRECT_URI,
    usePKCE: false,
    nonce: webNonce,
    // nonce를 extraParams에도 넣어야 authorization URL 쿼리 파라미터에 실제로 포함된다.
    extraParams: { nonce: webNonce },
  }), [webNonce]);
  const [webRequest, webResponse, webPromptAsync] = AuthSession.useAuthRequest(webGoogleConfig, GOOGLE_DISCOVERY);

  // iOS: code + PKCE flow. Google provider가 자동으로 code exchange 후 params.id_token을 반환한다.
  // webClientId는 web 환경에서 invariantClientId 오류를 방지하기 위해 전달한다.
  const [iosRequest, iosResponse, iosPromptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI,
    scopes: ['openid', 'profile', 'email'],
  });

  const clearLoginTimeout = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const stopWithError = useCallback((message: string) => {
    clearLoginTimeout();
    setLoginProvider(null);
    setErrorMessage(message);
  }, [clearLoginTimeout]);

  const startLoginTimeout = useCallback(() => {
    clearLoginTimeout();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setLoginProvider(null);
      setErrorMessage('로그인이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.');
    }, LOGIN_TIMEOUT_MS);
  }, [clearLoginTimeout]);

  const completeKakaoLogin = useCallback(async (code: string, redirectUri: string) => {
    try {
      console.info('[KakaoLogin] server login request', {
        provider: 'KAKAO',
        serverRequestRedirectUri: redirectUri,
      });
      await loginWithOAuth('KAKAO', { code, redirectUri });
      markLoggedIn();
      router.replace('/');
    } catch {
      setErrorMessage('카카오 로그인에 실패했어요');
    } finally {
      clearLoginTimeout();
      setLoginProvider(null);
      kakaoLatestCallbackUrlRef.current = null;
    }
  }, [clearLoginTimeout, markLoggedIn, router]);

  const dismissKakaoBrowserSafely = useCallback(async () => {
    if (!kakaoBrowserOpenRef.current) return;
    kakaoBrowserOpenRef.current = false;

    try {
      await WebBrowser.dismissBrowser();
    } catch (error) {
      console.warn('[KakaoLogin] dismissBrowser skipped', error);
    }
  }, []);

  const handleKakaoCallbackUrl = useCallback(async (url: string, redirectUri: string) => {
    if (!url.startsWith('kkori://oauth/kakao') && !url.startsWith('kkori:///oauth/kakao')) {
      return false;
    }
    if (kakaoLatestCallbackUrlRef.current === url) return true;
    if (kakaoCallbackHandledRef.current) return true;
    kakaoLatestCallbackUrlRef.current = url;
    kakaoCallbackHandledRef.current = true;

    let code: string | null = null;
    let error: string | null = null;
    try {
      const callbackUrl = new URL(url);
      code = callbackUrl.searchParams.get('code');
      error = callbackUrl.searchParams.get('error');
    } catch (parseError) {
      console.warn('[KakaoLogin] callback URL parse failed', parseError);
      stopWithError('카카오 로그인에 실패했어요');
      return true;
    }

    if (error) {
      clearLoginTimeout();
      setLoginProvider(null);
      setErrorMessage('카카오 로그인이 취소되었어요');
      await dismissKakaoBrowserSafely();
      return true;
    }

    if (!code) {
      stopWithError('카카오 로그인에 실패했어요');
      await dismissKakaoBrowserSafely();
      return true;
    }

    await dismissKakaoBrowserSafely();
    await completeKakaoLogin(code, redirectUri);
    return true;
  }, [clearLoginTimeout, completeKakaoLogin, dismissKakaoBrowserSafely, stopWithError]);

  // 마운트 시 1회 Google auth 환경변수 진단 로그
  useEffect(() => {
    logGoogleAuthDiagnostics();
  }, []);

  // client ID가 없는 경우 원인 파악용 안전 로그
  useEffect(() => {
    if (!missingMessage) return;
    const hostname =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.hostname
        : 'native';
    console.warn('[GoogleAuth] client ID missing — check Vercel build-time env vars', {
      platform: Platform.OS,
      hostname,
      isDev: __DEV__,
      message: missingMessage,
      hint: 'EXPO_PUBLIC_* 변수는 expo export 실행 시점에 Vercel 환경변수로 주입되어야 합니다. 런타임에는 변경되지 않아요.',
    });
  }, [missingMessage]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();

    return () => clearLoginTimeout();
  }, [clearLoginTimeout, fadeAnim, floatAnim]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (kakaoCallbackHandledRef.current) return;
    if (window.location.pathname !== '/oauth/kakao') return;

    kakaoCallbackHandledRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      setErrorMessage('카카오 로그인이 취소되었어요');
      router.replace('/');
      return;
    }

    if (!code) {
      setErrorMessage('카카오 로그인에 실패했어요');
      router.replace('/');
      return;
    }

    setErrorMessage(null);
    setLoginProvider('KAKAO');
    startLoginTimeout();
    void completeKakaoLogin(code, getSavedKakaoRedirectUri());
  }, [completeKakaoLogin, router, startLoginTimeout]);

  // web Google 로그인 응답 처리 (id_token + access_token implicit hybrid flow)
  useEffect(() => {
    if (!webResponse || Platform.OS !== 'web') return;

    const idToken = webResponse.type === 'success' ? webResponse.params.id_token : undefined;
    console.info('[GoogleLogin] web auth response', {
      platform: Platform.OS,
      selectedClientType: 'WEB',
      responseType: 'id_token token',
      hasClientId: Boolean(GOOGLE_WEB_CLIENT_ID),
      hasIdToken: Boolean(idToken),
      hasAccessToken: Boolean(webResponse.type === 'success' && webResponse.params.access_token),
      type: webResponse.type,
    });

    if (webResponse.type === 'cancel' || webResponse.type === 'dismiss') {
      clearLoginTimeout();
      setLoginProvider(null);
      return;
    }

    if (webResponse.type === 'error') {
      stopWithError('Google 인증 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
      return;
    }

    if (webResponse.type !== 'success') return;

    if (!idToken) {
      stopWithError('Google 인증 정보를 가져오지 못했어요. 다시 한 번 시도해 주세요.');
      return;
    }

    const googleOAuthAccessToken = webResponse.params.access_token || undefined;
    const googleRefreshToken = webResponse.params.refresh_token || undefined;
    console.info('[GoogleLogin] web oauth token from response', {
      hasGoogleOAuthAccessToken: Boolean(googleOAuthAccessToken),
      hasGoogleRefreshToken: Boolean(googleRefreshToken),
    });

    console.info('[GoogleLogin] server login request', { provider: 'GOOGLE' });
    loginWithOAuth('GOOGLE', { idToken, googleOAuthAccessToken, googleRefreshToken })
      .then(markLoggedIn)
      .catch(() => setErrorMessage('로그인을 완료하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.'))
      .finally(() => {
        clearLoginTimeout();
        setLoginProvider(null);
      });
  }, [clearLoginTimeout, markLoggedIn, webResponse, stopWithError]);

  // iOS Google 로그인 응답 처리 (code + PKCE → Google provider 자동 code exchange → id_token)
  useEffect(() => {
    if (!iosResponse || Platform.OS !== 'ios') return;

    const idToken = iosResponse.type === 'success' ? iosResponse.params.id_token : undefined;
    console.info('[GoogleLogin] ios auth response', {
      platform: Platform.OS,
      selectedClientType: 'IOS',
      responseType: 'code',
      hasClientId: Boolean(GOOGLE_IOS_CLIENT_ID),
      hasIdToken: Boolean(idToken),
      hasAccessToken: Boolean(iosResponse.type === 'success' && iosResponse.params.access_token),
      type: iosResponse.type,
    });

    if (iosResponse.type === 'cancel' || iosResponse.type === 'dismiss') {
      clearLoginTimeout();
      setLoginProvider(null);
      return;
    }

    if (iosResponse.type === 'error') {
      stopWithError('Google 인증 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
      return;
    }

    if (iosResponse.type !== 'success') return;

    if (!idToken) {
      stopWithError('Google 인증 정보를 가져오지 못했어요. 다시 한 번 시도해 주세요.');
      return;
    }

    console.info('[GoogleLogin] server login request', { provider: 'GOOGLE' });
    loginWithOAuth('GOOGLE', { idToken })
      .then(markLoggedIn)
      .catch(() => setErrorMessage('로그인을 완료하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.'))
      .finally(() => {
        clearLoginTimeout();
        setLoginProvider(null);
      });
  }, [clearLoginTimeout, iosResponse, markLoggedIn, stopWithError]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleKakaoCallbackUrl(url, getKakaoRedirectUri());
    });

    return () => subscription.remove();
  }, [handleKakaoCallbackUrl]);

  async function handleGoogleLogin() {
    if (isLoggingIn) return;
    if (missingMessage) {
      setErrorMessage(missingMessage);
      return;
    }

    const isIOS = Platform.OS === 'ios';
    const selectedClientType = isIOS ? 'IOS' : 'WEB';
    const responseType = isIOS ? 'code' : 'id_token token';
    const activeRequest = isIOS ? iosRequest : webRequest;
    const activePromptAsync = isIOS ? iosPromptAsync : webPromptAsync;

    try {
      console.info('[GoogleLogin] config', {
        platform: Platform.OS,
        selectedClientType,
        responseType,
        hasClientId: Boolean(isIOS ? GOOGLE_IOS_CLIENT_ID : GOOGLE_WEB_CLIENT_ID),
      });

      if (__DEV__ && activeRequest) {
        try {
          const authorizeUrl = await activeRequest.makeAuthUrlAsync(GOOGLE_DISCOVERY);
          let parsed: URL | null = null;
          try { parsed = new URL(authorizeUrl); } catch {}
          const authUrlClientId = parsed?.searchParams.get('client_id');
          console.info('[GoogleLogin] authorize URL params', {
            authUrlResponseType: parsed?.searchParams.get('response_type'),
            authUrlHasNonce: Boolean(parsed?.searchParams.get('nonce')),
            authUrlClientIdMatched: authUrlClientId === (isIOS ? GOOGLE_IOS_CLIENT_ID : GOOGLE_WEB_CLIENT_ID),
            hasRedirectUri: Boolean(parsed?.searchParams.get('redirect_uri')),
          });
        } catch (logErr) {
          console.warn('[GoogleLogin] authorize URL inspection failed', logErr);
        }
      }

      setErrorMessage(null);
      setLoginProvider('GOOGLE');
      startLoginTimeout();
      const result = await activePromptAsync();
      console.info('[GoogleLogin] prompt result', { type: result.type });
      if (result.type === 'cancel' || result.type === 'dismiss') {
        clearLoginTimeout();
        setLoginProvider(null);
        return;
      }
      if (result.type === 'error') stopWithError('Google 인증 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
      if (result.type !== 'success' && result.type !== 'opened' && result.type !== 'error') {
        clearLoginTimeout();
        setLoginProvider(null);
      }
    } catch {
      stopWithError('Google 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }

  async function handleKakaoLogin() {
    if (isLoggingIn) return;
    if (!KAKAO_REST_API_KEY) {
      setErrorMessage('카카오 REST API 키 설정이 필요해요.');
      return;
    }

    try {
      setErrorMessage(null);
      setLoginProvider('KAKAO');
      kakaoCallbackHandledRef.current = false;
      kakaoLatestCallbackUrlRef.current = null;
      startLoginTimeout();
      const authorizeRedirectUri = getKakaoRedirectUri();
      const browserReturnUri = getKakaoNativeReturnUri();
      const authorizeUrl = buildKakaoAuthorizeUrl(authorizeRedirectUri);
      saveKakaoRedirectUri(authorizeRedirectUri);
      if (__DEV__) {
        console.info('[KakaoLogin] authorize request', {
          provider: 'KAKAO',
          authorizeRedirectUri,
          browserReturnUri,
          authorizeUrl,
        });
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.assign(authorizeUrl);
        return;
      }

      kakaoBrowserOpenRef.current = true;
      let result: WebBrowser.WebBrowserAuthSessionResult;
      try {
        result = await WebBrowser.openAuthSessionAsync(authorizeUrl, browserReturnUri);
      } finally {
        kakaoBrowserOpenRef.current = false;
      }
      if (result.type === 'cancel' || result.type === 'dismiss') {
        clearLoginTimeout();
        setLoginProvider(null);
        return;
      }

      if (result.type !== 'success') {
        stopWithError('카카오 로그인에 실패했어요');
        return;
      }

      if (!(await handleKakaoCallbackUrl(result.url, authorizeRedirectUri))) {
        stopWithError('카카오 로그인에 실패했어요');
      }
    } catch {
      stopWithError('카카오 로그인에 실패했어요');
    }
  }

  const logoTransform = {
    transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <Animated.View style={[s.screen, { opacity: fadeAnim }]}>
        <View style={s.titleArea}>
          <Text style={s.headline}>꼬리에{'\n'}오신 것을 환영해요</Text>
          <Text style={s.subhead}>특별한 날보다, 평범한 오늘을 남겨요{'\n'}더 많이 남겨둘걸 후회했던 마음에서,{'\n'}꼬리는 시작됐어요</Text>
        </View>

        <View style={s.logoArea}>
          <Animated.View style={[s.logo, logoTransform]}>
            <Image source={require('../assets/logo.png')} style={s.logoImage} contentFit="contain" />
          </Animated.View>
          <Text style={s.logoCaption}>17년의 시간을 기억하며</Text>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.kakaoButton, isLoggingIn && s.buttonDisabled]} onPress={handleKakaoLogin} disabled={isLoggingIn} activeOpacity={0.82}>
            {loginProvider === 'KAKAO'
              ? <ActivityIndicator color="#191919" style={s.buttonIcon} />
              : <MessageCircle size={19} color="#191919" style={s.buttonIcon} />}
            <Text style={s.kakaoText}>{loginProvider === 'KAKAO' ? '로그인 중이에요' : '카카오로 시작하기'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.googleButton, (!(Platform.OS === 'ios' ? iosRequest : webRequest) || isLoggingIn) && s.buttonDisabled]} onPress={handleGoogleLogin} disabled={!(Platform.OS === 'ios' ? iosRequest : webRequest) || isLoggingIn} activeOpacity={0.86}>
            {loginProvider === 'GOOGLE' ? <ActivityIndicator color={colors.textPrimary} style={s.buttonIcon} /> : <Text style={s.googleMark}>G</Text>}
            <Text style={s.googleText}>{loginProvider === 'GOOGLE' ? '로그인 중이에요' : 'Google로 시작하기'}</Text>
          </TouchableOpacity>
          {errorMessage ? <Text style={s.errorText}>{errorMessage}</Text> : null}
          <Text style={s.termsText}>계속하면 이용약관 및 개인정보처리방침에 동의한 것으로 간주돼요</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
