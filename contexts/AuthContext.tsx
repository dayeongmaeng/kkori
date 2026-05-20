import React, { createContext, useContext, useEffect, useState } from 'react';

import { clearAuthTokens, getAuthTokens } from '../lib/auth/tokenStorage';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  markLoggedIn: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isAuthLoading: true,
  markLoggedIn: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    getAuthTokens()
      .then((tokens) => setIsAuthenticated(Boolean(tokens)))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthLoading(false));
  }, []);

  async function logout() {
    await clearAuthTokens();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        markLoggedIn: () => setIsAuthenticated(true),
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
