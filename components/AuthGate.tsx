import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from './AuthScreen';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthLoading, isSessionLoading } = useAuth();

  if (isAuthLoading || (isAuthenticated && isSessionLoading)) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color={colors.accent} />
        <Text style={s.loadingText}>로그인 상태를 확인하고 있어요.</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return children;
}

const s = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
