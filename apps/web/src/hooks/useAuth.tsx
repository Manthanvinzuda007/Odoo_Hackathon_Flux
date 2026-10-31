import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'bl_token';
const API_BASE = '/api/v1';

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session on mount
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      apiFetch('/auth/profile')
        .then((data) => {
          setUser(data);
        })
        .catch(() => {
          sessionStorage.removeItem(TOKEN_KEY);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    sessionStorage.setItem(TOKEN_KEY, data.accessToken);
    setUser(data.user);
    // Navigate based on role
    if (data.user.role === 'CUSTOMER') {
      navigate('/portal/dashboard', { replace: true });
    } else {
      navigate('/app/dashboard', { replace: true });
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Logout even if API call fails
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF',
    isCustomer: user?.role === 'CUSTOMER',
  }), [user, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
