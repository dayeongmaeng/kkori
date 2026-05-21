import React, { createContext, useContext, useEffect, useState } from 'react';

import { clearAuthSessionCache, getAuthTokens } from '../lib/auth/tokenStorage';
import { logoutFromServer } from '../lib/api/auth';
import { syncServerSessionData } from '../lib/api/sessionSync';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSessionLoading: boolean;
  sessionDataVersion: number;
  markLoggedIn: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isAuthLoading: true,
  isSessionLoading: false,
  sessionDataVersion: 0,
  markLoggedIn: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [sessionDataVersion, setSessionDataVersion] = useState(0);

  useEffect(() => {
    getAuthTokens()
      .then((tokens) => {
        const hasTokens = Boolean(tokens);
        setIsAuthenticated(hasTokens);
        if (hasTokens) setIsSessionLoading(true);
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsSessionLoading(false);
      return;
    }

    let cancelled = false;
    setIsSessionLoading(true);

    syncServerSessionData()
      .catch((error) => console.warn('[Auth] session data sync failed:', error))
      .finally(() => {
        if (cancelled) return;
        setSessionDataVersion((version) => version + 1);
        setIsSessionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  function markLoggedIn() {
    setIsSessionLoading(true);
    setIsAuthenticated(true);
  }

  async function logout() {
    const tokens = await getAuthTokens();
    console.log({
      provider: tokens?.user?.provider,
      userId: tokens?.user?.externalId,
    });

    try {
      await logoutFromServer();
      console.log('logout api success');
    } catch (error) {
      console.warn('[Auth] logout api failed:', error);
    } finally {
      try {
        await clearAuthSessionCache();
        console.log('local auth cleared');
      } catch (error) {
        console.warn('[Auth] local auth clear failed:', error);
      }
      setIsAuthenticated(false);
      setSessionDataVersion((version) => version + 1);
      console.log('logout complete');
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        isSessionLoading,
        sessionDataVersion,
        markLoggedIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
