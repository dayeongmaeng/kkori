import { ReactNode } from 'react';

import { useAuth } from '../contexts/AuthContext';
import AuthScreen from './AuthScreen';
import LoadingScreen from './LoadingScreen';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthLoading, isSessionLoading } = useAuth();

  if (isAuthLoading || (isAuthenticated && isSessionLoading)) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return children;
}
