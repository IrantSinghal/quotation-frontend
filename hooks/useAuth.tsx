'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import type { User, Workspace } from '@/types';

interface AuthContextValue {
  user: User | null;
  workspace: Workspace | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, workspace: Workspace, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(
    (u: User, w: Workspace, accessToken: string, refreshToken: string) => {
      api.setTokens(accessToken, refreshToken);
      Cookies.set('workspace_slug', w.slug, { expires: 30, sameSite: 'strict' });
      setUser(u);
      setWorkspace(w);
    },
    []
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setWorkspace(null);
    window.location.href = '/login';
  }, []);

  const refreshWorkspace = useCallback(async () => {
    const res = await api.getWorkspace();
    if (res.success) setWorkspace(res.data);
  }, []);

  // On mount: restore session from token if present
  useEffect(() => {
    const restore = async () => {
      const token = Cookies.get('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const [meRes, wsRes] = await Promise.all([api.getMe(), api.getWorkspace()]);
        if (meRes.success && wsRes.success) {
          // Reconstruct a minimal User object from /me response
          setUser({
            id: meRes.data.user_id,
            email: meRes.data.email,
            workspace_id: meRes.data.workspace_id,
            role: meRes.data.role as User['role'],
            full_name: '',
            phone_number: null,
            phone_verified: false,
            is_active: true,
            last_login_at: null,
            created_at: '',
          });
          setWorkspace(wsRes.data);
        } else {
          api.clearAuth();
        }
      } catch {
        api.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
