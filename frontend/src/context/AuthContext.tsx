import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'retailer';
  phone?: string;
  location?: { lat: number | null; lng: number | null; city: string };
  farmSize?: string;
  cropTypes?: string[];
  shopName?: string;
  shopAddress?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateLocation: (lat: number, lng: number, city: string) => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'farmer' | 'retailer';
  phone?: string;
  farmSize?: string;
  cropTypes?: string[];
  shopName?: string;
  shopAddress?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('agri_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  useEffect(() => {
    const verify = async () => {
      if (!token) { setIsLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('agri_token');
          setToken(null);
        }
      } catch {
        localStorage.removeItem('agri_token');
        setToken(null);
      }
      setIsLoading(false);
    };
    verify();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('agri_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (registerData: RegisterData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('agri_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('agri_token');
    setToken(null);
    setUser(null);
  };

  const updateLocation = async (lat: number, lng: number, city: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/auth/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lat, lng, city }),
      });
      setUser(prev => prev ? { ...prev, location: { lat, lng, city } } : prev);
    } catch (e) {
      console.error('Failed to update location', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user, token, isLoading,
        isAuthenticated: !!user,
        login, register, logout,
        updateLocation, authFetch,
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