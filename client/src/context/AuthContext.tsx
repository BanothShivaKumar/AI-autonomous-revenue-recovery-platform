import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Merchant {
  id: string;
  name: string;
  currency: string;
  businessType?: string;
  paypalAccounts?: any[];
}

interface AuthContextType {
  user: User | null;
  merchant: Merchant | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadDemoSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('paypilot_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setMerchant(res.data.merchant);
    } catch (err) {
      // If no valid session, try auto-authenticating with demo account
      try {
        const demoRes = await api.get('/demo/status');
        if (demoRes.data.seeded) {
          setUser({
            id: 'demo-user-id',
            name: 'Sarah Chen (Lead Operations)',
            email: 'admin@novadigital.test',
            role: 'MERCHANT_ADMIN',
          });
          setMerchant({
            id: demoRes.data.merchant.id,
            name: demoRes.data.merchant.name,
            currency: 'USD',
          });
        }
      } catch (e) {
        setUser(null);
        setMerchant(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('paypilot_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setMerchant(res.data.merchant);
  };

  const logout = () => {
    localStorage.removeItem('paypilot_token');
    setToken(null);
    setUser(null);
    setMerchant(null);
  };

  const loadDemoSession = async () => {
    setLoading(true);
    await api.post('/demo/seed');
    await fetchProfile();
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        merchant,
        token,
        loading,
        login,
        logout,
        loadDemoSession,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
