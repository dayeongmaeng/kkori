import React, { createContext, useContext, useEffect, useState } from 'react';

import { clearAuthSessionCache, getAuthTokens } from '../lib/auth/tokenStorage';
import { deleteAccount as deleteAccountFromServer, logoutFromServer } from '../lib/api/auth';
import { syncServerSessionData } from '../lib/api/sessionSync';
import { logger, toLogError } from '../lib/logger';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSessionLoading: boolean;
  sessionDataVersion: number;
  markLoggedIn: () => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isAuthLoading: true,
  isSessionLoading: false,
  sessionDataVersion: 0,
  markLoggedIn: () => {},
  logout: async () => {},
  deleteAccount: async () => {},
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
      .catch((error) => logger.warn('auth.session.sync.failed', toLogError(error)))
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
    logger.info('auth.logout.start', {
      provider: tokens?.user?.provider,
      userId: tokens?.user?.externalId,
    });

    try {
      await logoutFromServer();
      logger.info('auth.logout.api.success');
    } catch (error) {
      logger.warn('auth.logout.api.failed', toLogError(error));
    } finally {
      try {
        await clearAuthSessionCache();
        logger.debug('auth.logout.local.cleared');
      } catch (error) {
        logger.warn('auth.logout.local.failed', toLogError(error));
      }
      setIsAuthenticated(false);
      setSessionDataVersion((version) => version + 1);
      logger.info('auth.logout.complete');
    }
  }

  async function deleteAccount() {
    // API 실패 시 로컬 토큰을 건드리지 않아야 하므로 await가 throws하면 그대로 전파한다.
    await deleteAccountFromServer();
    try {
      await clearAuthSessionCache();
    } catch (error) {
      logger.warn('auth.delete_account.local.failed', toLogError(error));
    }
    setIsAuthenticated(false);
    setSessionDataVersion((version) => version + 1);
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
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
