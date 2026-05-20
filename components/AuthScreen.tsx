import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { MessageCircle } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { loginWithOAuth } from '../lib/api/auth';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
  maskClientId,
} from './googleAuthConfig';
import { s } from './AuthScreen.styles';

WebBrowser.maybeCompleteAuthSession();

const LOGIN_TIMEOUT_MS = 30000;

function requireGoogleClientId() {
  if (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID) return 'Google iOS 클라이언트 ID 설정이 필요해요.';
  if (Platform.OS === 'android' && !GOOGLE_ANDROID_CLIENT_ID) return 'Google Android 클라이언트 ID 설정이 필요해요.';
  if (Platform.OS === 'web' && !GOOGLE_WEB_CLIENT_ID) return 'Google Web 클라이언트 ID 설정이 필요해요.';
  return null;
}

export default function AuthScreen() {
  const { markLoggedIn } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const missingMessage = requireGoogleClientId();

  const googleConfig = useMemo(() => ({
    iosClientId: GOOGLE_IOS_CLIENT_ID ?? 'missing-google-ios-client-id',
    androidClientId: GOOGLE_ANDROID_CLIENT_ID ?? 'missing-google-android-client-id',
    webClientId: GOOGLE_WEB_CLIENT_ID ?? 'missing-google-web-client-id',
    redirectUri: GOOGLE_REDIRECT_URI,
    scopes: ['openid', 'profile', 'email'],
  }), []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleConfig, {
    scheme: 'kkori',
    path: 'oauth/google',
  });

  const clearLoginTimeout = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const stopWithError = useCallback((message: string) => {
    clearLoginTimeout();
    setIsLoggingIn(false);
    setErrorMessage(message);
  }, [clearLoginTimeout]);

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
    if (!response) return;

    const idToken = response.type === 'success' ? response.params.id_token : undefined;
    console.info('[GoogleLogin] auth response', { type: response.type, hasIdToken: Boolean(idToken) });

    if (response.type === 'cancel' || response.type === 'dismiss') {
      clearLoginTimeout();
      setIsLoggingIn(false);
      return;
    }

    if (response.type === 'error') {
      stopWithError('Google 인증 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
      return;
    }

    if (response.type !== 'success') return;

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
        setIsLoggingIn(false);
      });
  }, [clearLoginTimeout, markLoggedIn, response, stopWithError]);

  function startLoginTimeout() {
    clearLoginTimeout();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setIsLoggingIn(false);
      setErrorMessage('로그인이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.');
    }, LOGIN_TIMEOUT_MS);
  }

  async function handleGoogleLogin() {
    if (isLoggingIn) return;
    if (missingMessage) {
      setErrorMessage(missingMessage);
      return;
    }

    try {
      console.info('[GoogleLogin] config', {
        platform: Platform.OS,
        redirectUri: GOOGLE_REDIRECT_URI,
        webClientId: maskClientId(GOOGLE_WEB_CLIENT_ID),
      });
      setErrorMessage(null);
      setIsLoggingIn(true);
      startLoginTimeout();
      const result = await promptAsync();
      console.info('[GoogleLogin] prompt result', { type: result.type });
      if (result.type === 'cancel' || result.type === 'dismiss') {
        clearLoginTimeout();
        setIsLoggingIn(false);
        return;
      }
      if (result.type === 'error') stopWithError('Google 인증 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
      if (result.type !== 'success' && result.type !== 'opened' && result.type !== 'error') {
        clearLoginTimeout();
        setIsLoggingIn(false);
      }
    } catch {
      stopWithError('Google 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }

  function handleKakaoLogin() {
    if (!isLoggingIn) setErrorMessage('카카오 로그인은 곧 지원할게요.');
  }

  const logoTransform = {
    transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <Animated.View style={[s.screen, { opacity: fadeAnim }]}>
        <View style={s.titleArea}>
          <Text style={s.headline}>꼬리에{'\n'}오신 것을 환영해요</Text>
          <Text style={s.subhead}>기록부터 건강 관리까지,{'\n'}소중한 시간을 함께 저장해요</Text>
        </View>

        <View style={s.logoArea}>
          <Animated.View style={[s.logo, logoTransform]}>
            <Image source={require('../assets/logo.png')} style={s.logoImage} contentFit="contain" />
          </Animated.View>
          <Text style={s.logoCaption}>17년의 추억에서 시작된 기록 앱</Text>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.kakaoButton, isLoggingIn && s.buttonDisabled]} onPress={handleKakaoLogin} disabled={isLoggingIn} activeOpacity={0.82}>
            <MessageCircle size={19} color="#191919" style={s.buttonIcon} />
            <Text style={s.kakaoText}>카카오로 시작하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.googleButton, (!request || isLoggingIn) && s.buttonDisabled]} onPress={handleGoogleLogin} disabled={!request || isLoggingIn} activeOpacity={0.86}>
            {isLoggingIn ? <ActivityIndicator color={colors.textPrimary} style={s.buttonIcon} /> : <Text style={s.googleMark}>G</Text>}
            <Text style={s.googleText}>{isLoggingIn ? '로그인 중이에요' : 'Google로 시작하기'}</Text>
          </TouchableOpacity>
          {errorMessage ? <Text style={s.errorText}>{errorMessage}</Text> : null}
          <Text style={s.termsText}>계속하면 이용약관 및 개인정보처리방침에 동의한 것으로 간주돼요</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
