import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  is_superadmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGateway: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const LOGIN_PAGE_URL = 'https://login.mukminullah.my.id/login';
const GATEWAY_URL = 'https://login-api.mukminullah.my.id';
const CLIENT_ID = 'r2art_linktree';
const APP_NAME = 'R2Art Linktree Dynamic Links';
const TOKEN_KEY = 'r2art_linktree_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    const returnTo = `${window.location.origin}/callback`;
    const redirectUrl = `${LOGIN_PAGE_URL}?return_to=${encodeURIComponent(returnTo)}&client_id=${CLIENT_ID}&app_name=${encodeURIComponent(APP_NAME)}`;
    window.location.href = redirectUrl;
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token') || url.searchParams.get('jwt');

      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        // Clean URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const savedToken = localStorage.getItem(TOKEN_KEY);
      const headers: Record<string, string> = {};
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }

      // Check current session via our backend
      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setProfile(data.profile);
          setLoading(false);
          return;
        }
      }

      setUser(null);
      setProfile(null);
    } catch (err) {
      console.warn('Auth check error:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginWithGateway = useCallback(() => {
    redirectToLogin();
  }, [redirectToLogin]);

  const logout = async () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      document.cookie = 'r2art_sso_session=; Path=/; Domain=.mukminullah.my.id; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'r2art_sso_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';

      try {
        await fetch(`${GATEWAY_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (e) {
        console.warn('Logout API error:', e);
      }

      setUser(null);
      setProfile(null);
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGateway,
        logout,
        checkAuth,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
