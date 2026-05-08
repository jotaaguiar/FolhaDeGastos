import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface AuthUser { id: string; username: string; }
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fluxo_token');
    if (token) {
      api.me()
        .then(u => { setUser(u); setLoading(false); })
        .catch(() => { localStorage.removeItem('fluxo_token'); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await api.login(username, password);
    localStorage.setItem('fluxo_token', token);
    setUser(u);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await api.register(username, password);
    localStorage.setItem('fluxo_token', token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fluxo_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
