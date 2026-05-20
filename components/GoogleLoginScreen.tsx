import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { PawPrint } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { loginWithOAuth } from '../lib/api/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const LOGIN_TIMEOUT_MS = 30000;
export const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'kkori',
  path: 'oauth/google',
});

function requireGoogleClientId() {
  if (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID) return 'Google iOS 클라이언트 ID 설정이 필요해요.';
  if (Platform.OS === 'android' && !GOOGLE_ANDROID_CLIENT_ID) return 'Google Android 클라이언트 ID 설정이 필요해요.';
  if (Platform.OS === 'web' && !GOOGLE_WEB_CLIENT_ID) return 'Google Web 클라이언트 ID 설정이 필요해요.';
  return null;
}

export default function GoogleLoginScreen() {
  const { markLoggedIn } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    return () => clearLoginTimeout();
  }, []);

  useEffect(() => {
    if (!response) return;

    const idToken = response.type === 'success' ? response.params.id_token : undefined;
    console.info('[GoogleLogin] auth response', {
      type: response.type,
      hasIdToken: Boolean(idToken),
    });

    if (response.type === 'cancel' || response.type === 'dismiss') {
      clearLoginTimeout();
      setIsLoggingIn(false);
      return;
    }

    if (response.type === 'error') {
      clearLoginTimeout();
      setIsLoggingIn(false);
      Alert.alert('로그인 실패', 'Google 인증 중 오류가 발생했어요.');
      return;
    }

    if (response.type !== 'success') return;

    if (!idToken) {
      clearLoginTimeout();
      setIsLoggingIn(false);
      Alert.alert('로그인 실패', 'Google 인증 정보를 가져오지 못했어요.');
      return;
    }

    console.info('[GoogleLogin] server login request', { provider: 'GOOGLE' });
    loginWithOAuth('GOOGLE', { idToken })
      .then(() => {
        markLoggedIn();
      })
      .catch(() => {
        Alert.alert('로그인 실패', 'Google 로그인을 완료하지 못했어요.');
      })
      .finally(() => {
        clearLoginTimeout();
        setIsLoggingIn(false);
      });
  }, [markLoggedIn, response]);

  function clearLoginTimeout() {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function startLoginTimeout() {
    clearLoginTimeout();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setIsLoggingIn(false);
      Alert.alert('로그인 지연', '로그인이 완료되지 않았어요. 잠시 후 다시 시도해 주세요.');
    }, LOGIN_TIMEOUT_MS);
  }

  async function handleGoogleLogin() {
    if (missingMessage) {
      Alert.alert('로그인 설정 필요', missingMessage);
      return;
    }

    try {
      setIsLoggingIn(true);
      startLoginTimeout();
      const result = await promptAsync();
      console.info('[GoogleLogin] prompt result', { type: result.type });
      if (result.type === 'cancel' || result.type === 'dismiss') {
        clearLoginTimeout();
        setIsLoggingIn(false);
      } else if (result.type === 'error') {
        clearLoginTimeout();
        setIsLoggingIn(false);
        Alert.alert('로그인 실패', 'Google 인증 중 오류가 발생했어요.');
      } else if (result.type !== 'success' && result.type !== 'opened') {
        clearLoginTimeout();
        setIsLoggingIn(false);
      }
    } catch {
      clearLoginTimeout();
      setIsLoggingIn(false);
      Alert.alert('로그인 실패', 'Google 로그인을 시작하지 못했어요.');
    }
  }

  return (
    <View style={s.container}>
      <View style={s.brand}>
        <View style={s.logo}>
          <PawPrint size={30} color={colors.accent} />
        </View>
        <Text style={s.title}>꼬리</Text>
        <Text style={s.subtitle}>반려동물의 모든 순간을 안전하게 기록해요.</Text>
      </View>

      <View style={s.panel}>
        <TouchableOpacity
          style={[s.googleButton, (!request || isLoggingIn) && s.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={!request || isLoggingIn}
          activeOpacity={0.85}
        >
          <Text style={s.googleButtonText}>{isLoggingIn ? 'Google 로그인 중...' : 'Google로 계속하기'}</Text>
        </TouchableOpacity>
        {missingMessage ? <Text style={s.notice}>{missingMessage}</Text> : null}
        <Text style={s.redirectLabel}>Google Console redirect URI</Text>
        <Text selectable style={s.redirectValue}>{GOOGLE_REDIRECT_URI}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  brand: { alignItems: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginBottom: spacing.md,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.textPrimary },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  googleButton: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textPrimary,
  },
  buttonDisabled: { opacity: 0.5 },
  googleButtonText: { fontSize: 15, fontWeight: '700', color: colors.textOnPrimary },
  notice: { fontSize: 12, color: colors.danger, lineHeight: 18 },
  redirectLabel: { fontSize: 12, color: colors.textTertiary },
  redirectValue: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
});
