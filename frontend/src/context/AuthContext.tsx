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
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.role) parsed.role = 'AICTE_ADMIN';
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch {
        localStorage.removeItem('trustseat_user');
        localStorage.removeItem('trustseat_token');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [token]);

const DEMO_AUTH_USERS: Record<string, User & { access_token: string; default_pw: string }> = {
  aicte_admin: {
    user_id: "demo-admin",
    username: "aicte_admin",
    full_name: "Dr. Rameshwar Rao (AICTE Admin)",
    role: "AICTE_ADMIN",
    default_pw: "Admin@TrustSeat2026",
    access_token: "mock-jwt-token-aicte-admin"
  },
  ro_western: {
    user_id: "demo-ro",
    username: "ro_western",
    full_name: "S. K. Kulkarni (Regional Officer)",
    role: "AICTE_REGIONAL_OFFICER",
    region: "Western",
    default_pw: "Admin@TrustSeat2026",
    access_token: "mock-jwt-token-ro-western"
  },
  nodal_meerut: {
    user_id: "demo-nodal",
    username: "nodal_meerut",
    full_name: "Prof. Rajesh Sharma (Nodal Officer)",
    role: "INSTITUTION_NODAL_OFFICER",
    institution_id: "1",
    institution_name: "Institute of Technology & Advanced Management, Meerut",
    default_pw: "Admin@TrustSeat2026",
    access_token: "mock-jwt-token-nodal"
  },
  verifier_tcs: {
    user_id: "demo-verifier",
    username: "verifier_tcs",
    full_name: "TCS Background Verification Cell",
    role: "VERIFIER",
    default_pw: "Admin@TrustSeat2026",
    access_token: "mock-jwt-token-verifier"
  }
};

const ROLE_TO_USER: Record<string, string> = {
  AICTE_ADMIN: 'aicte_admin',
  AICTE_REGIONAL_OFFICER: 'ro_western',
  INSTITUTION_NODAL_OFFICER: 'nodal_meerut',
  VERIFIER: 'verifier_tcs'
};

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const data = res.data;
      setToken(data.access_token);
      setUser(data);
      localStorage.setItem('trustseat_token', data.access_token);
      localStorage.setItem('trustseat_user', JSON.stringify(data));
    } catch (err) {
      // Offline fallback for Vercel static demonstration
      const demo = DEMO_AUTH_USERS[username.trim()];
      if (demo && (password === demo.default_pw || password === 'admin' || password === 'password')) {
        setToken(demo.access_token);
        setUser(demo);
        localStorage.setItem('trustseat_token', demo.access_token);
        localStorage.setItem('trustseat_user', JSON.stringify(demo));
        return;
      }
      throw err;
    }
  };

  const quickSwitchRole = async (role: string) => {
    try {
      const res = await api.get(`/auth/quick-switch/${role}`);
      const data = res.data;
      setToken(data.access_token);
      setUser(data);
      localStorage.setItem('trustseat_token', data.access_token);
      localStorage.setItem('trustseat_user', JSON.stringify(data));
    } catch (err) {
      // Offline fallback for Vercel static demonstration
      const username = ROLE_TO_USER[role] || 'aicte_admin';
      const demo = DEMO_AUTH_USERS[username];
      if (demo) {
        setToken(demo.access_token);
        setUser(demo);
        localStorage.setItem('trustseat_token', demo.access_token);
        localStorage.setItem('trustseat_user', JSON.stringify(demo));
      }
    }
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
