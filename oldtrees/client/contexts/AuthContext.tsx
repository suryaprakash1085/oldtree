import { createContext, useContext, ReactNode, useCallback, useState, useEffect, useMemo } from 'react';
import { getAuthToken, clearAuthToken, setAuthToken, getCurrentUser, setCurrentUser, logout as logoutAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  tenantId: string;
  companyName?: string;
  role?: string;
  firstName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  login: (token: string, user: User) => void;
  handleTokenError: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const storedToken = getAuthToken();
    const storedUser = getCurrentUser();
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Always clear local state even if API fails
      setUser(null);
      setToken(null);
    }
  }, []);

  const handleTokenError = useCallback(() => {
    logout();
  }, [logout]);

  const login = useCallback((newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setCurrentUser(newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const onSetUser = useCallback((newUser: User | null) => {
    if (newUser) {
      setCurrentUser(newUser);
    } else {
      clearAuthToken();
    }
    setUser(newUser);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    logout,
    login,
    handleTokenError,
    setUser: onSetUser,
  }), [user, token, isLoading, logout, login, handleTokenError, onSetUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
