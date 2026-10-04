import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, registerUnauthorizedHandler, setAuthToken, unwrap } from '@/lib/api-client';
import type { ApiResponse, LoginResponse, UserRole } from '@/lib/types/api';

// LoginResponseDto الحقيقي مبيرجّعش id ولا username -- بس fullName و role.
// الـ AuthenticatedUser هنا بيعكس ده بالظبط، مش نوع مُتخيَّل بحقول زيادة.
export interface AuthenticatedUser {
  fullName: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await unwrap<LoginResponse>(
        apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { username, password })
      );
      setAuthToken(result.token);
      setUser({ fullName: result.fullName, role: result.role });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
