import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthGate from '../components/AuthGate';
import LoadingScreen from '../components/LoadingScreen';
import { AuthProvider } from '../contexts/AuthContext';
import { DateProvider } from '../contexts/DateContext';
import { PetProvider } from '../contexts/PetContext';
import { initApp } from '../lib/api/init';
import { logger, toLogError } from '../lib/logger';
import { setupAndroidChannel } from '../lib/notifications';
import { migrateLegacyData } from '../lib/storage';

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    migrateLegacyData();

    // 로고 preload 후 네이티브 스플래시 해제 → LoadingScreen에 로고 즉시 표시
    Asset.fromModule(require('../assets/images/splash-icon.png'))
      .downloadAsync()
      .catch(() => {})
      .finally(() => {
        SplashScreen.hideAsync().catch(() => {});
      });

    if (Platform.OS !== 'web') {
      void setupAndroidChannel();
    }

    // initApp은 로고 preload와 병렬 실행
    initApp()
      .catch((e) => logger.error('app.init.failed', toLogError(e)))
      .finally(() => setAppReady(true));
  }, []);

  if (!appReady) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
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
