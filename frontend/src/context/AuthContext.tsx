import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface User { id: number; name: string; email: string; role: string; }
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, captchaToken: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) { 
      setToken(t); 
      setUser(JSON.parse(u));
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    }
    setIsInitializing(false);
  }, []);

  const login = async (email: string, password: string, captchaToken: string) => {
    const { data } = await api.post('/auth/login', { email, password, captchaToken });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    setToken(data.access_token);
    setUser(data.user);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch { /* ignore */ }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, isAuthenticated: !!token, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
