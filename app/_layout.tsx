import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthGate from '../components/AuthGate';
import LoadingScreen from '../components/LoadingScreen';
import OnboardingScreen from '../components/OnboardingScreen';
import { AuthProvider } from '../contexts/AuthContext';
import { DateProvider } from '../contexts/DateContext';
import { PetProvider } from '../contexts/PetContext';
import { initApp } from '../lib/api/init';
import { getAuthTokens } from '../lib/auth/tokenStorage';
import { logger, toLogError } from '../lib/logger';
import { setupAndroidChannel } from '../lib/notifications';
import { migrateLegacyData } from '../lib/storage';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production'),
  enabled: Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
});

const ONBOARDING_KEY = 'pet-care:onboarding:completed';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  // 웹: URL을 동기적으로 확인. 네이티브: useEffect에서 비동기로 확인.
  const [isOAuthCallback, setIsOAuthCallback] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const { pathname, search, hash } = window.location;
      return (
        pathname.includes('/oauth/') ||
        hash.includes('access_token') ||
        new URLSearchParams(search).has('access_token')
      );
    }
    return false;
  });

  useEffect(() => {
    migrateLegacyData();

    // 로고 preload 후 네이티브 스플래시 해제 → LoadingScreen에 로고 즉시 표시
    Asset.fromModule(require('../assets/images/splash.png'))
      .downloadAsync()
      .catch(() => {})
      .finally(() => {
        SplashScreen.hideAsync().catch(() => {});
      });

    if (Platform.OS !== 'web') {
      void setupAndroidChannel();
    }

    // 네이티브 OAuth 딥링크 감지를 initApp과 병렬 실행
    const nativeOAuthDetect =
      Platform.OS !== 'web'
        ? Linking.getInitialURL()
            .then((url) => {
              if (url && (url.includes('/oauth/kakao') || url.includes('access_token'))) {
                setIsOAuthCallback(true);
              }
            })
            .catch(() => {})
        : Promise.resolve();

    // initApp과 OAuth 감지가 모두 완료된 뒤 appReady를 설정
    Promise.all([
      initApp().catch((e) => logger.error('app.init.failed', toLogError(e))),
      nativeOAuthDetect,
    ]).finally(() => setAppReady(true));
  }, []);

  useEffect(() => {
    if (!appReady) return;

    // OAuth 콜백 처리 중이면 온보딩을 건너뛴다
    if (isOAuthCallback) {
      setOnboardingDone(true);
      setOnboardingChecked(true);
      return;
    }

    // 온보딩 완료 여부와 인증 토큰을 함께 확인한다.
    // 이미 로그인된 사용자는 온보딩 플래그 유무와 관계없이 온보딩을 건너뛴다.
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY).catch(() => null),
      getAuthTokens().catch(() => null),
    ])
      .then(([onboardingVal, tokens]) => {
        setOnboardingDone(onboardingVal !== null || Boolean(tokens));
      })
      .catch(() => setOnboardingDone(true))
      .finally(() => setOnboardingChecked(true));
  }, [appReady, isOAuthCallback]);

  if (!appReady || !onboardingChecked) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  if (!onboardingDone) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen
          onComplete={() => {
            AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => {});
            setOnboardingDone(true);
          }}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DateProvider>
          <PetProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              {Platform.OS === 'web' && (
                <Head>
                  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                  <title>꼬리</title>
                  <meta name="description" content="반려동물의 하루를 기록하고 추억을 남겨보세요." />
                  <meta property="og:type" content="website" />
                  <meta property="og:url" content="https://kkori.co.kr" />
                  <meta property="og:title" content="꼬리" />
                  <meta property="og:description" content="반려동물의 하루를 기록하고 추억을 남겨보세요." />
                  <meta property="og:image" content="https://kkori.co.kr/og-image.png" />
                  <meta property="og:image:width" content="1080" />
                  <meta property="og:image:height" content="1080" />
                  <meta property="og:site_name" content="꼬리" />
                  <meta property="og:locale" content="ko_KR" />
                  <meta name="twitter:card" content="summary" />
                  <meta name="twitter:title" content="꼬리" />
                  <meta name="twitter:description" content="반려동물의 하루를 기록하고 추억을 남겨보세요." />
                  <meta name="twitter:image" content="https://kkori.co.kr/og-image.png" />
                  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                </Head>
              )}
              <AuthGate>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="oauth/kakao" options={{ headerShown: false }} />
                  <Stack.Screen name="photo/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="photos/[externalId]" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
              </AuthGate>
              <StatusBar style="auto" />
              <Toast />
            </ThemeProvider>
          </PetProvider>
        </DateProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
