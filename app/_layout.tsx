import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthGate from '../components/AuthGate';
import { AuthProvider } from '../contexts/AuthContext';
import { DateProvider } from '../contexts/DateContext';
import { PetProvider } from '../contexts/PetContext';
import { initApp } from '../lib/api/init';
import { migrateLegacyData } from '../lib/storage';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    migrateLegacyData();
    initApp().catch((e) => console.error('[Init] 초기화 실패:', e));
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DateProvider>
          <PetProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              {Platform.OS === 'web' && (
                <Head>
                  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                </Head>
              )}
              <AuthGate>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
