import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

export interface User {
  user_id: string;
  username: string;
  full_name: string;
  role: 'AICTE_ADMIN' | 'AICTE_REGIONAL_OFFICER' | 'INSTITUTION_NODAL_OFFICER' | 'STUDENT' | 'VERIFIER';
  institution_id?: string | null;
  institution_name?: string | null;
  region?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  quickSwitchRole: (role: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('trustseat_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('trustseat_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('trustseat_user');
        localStorage.removeItem('trustseat_token');
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const data = res.data;
    setToken(data.access_token);
    setUser(data);
    localStorage.setItem('trustseat_token', data.access_token);
    localStorage.setItem('trustseat_user', JSON.stringify(data));
  };

  const quickSwitchRole = async (role: string) => {
    const res = await api.get(`/auth/quick-switch/${role}`);
    const data = res.data;
    setToken(data.access_token);
    setUser(data);
    localStorage.setItem('trustseat_token', data.access_token);
    localStorage.setItem('trustseat_user', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('trustseat_token');
    localStorage.removeItem('trustseat_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, quickSwitchRole, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
