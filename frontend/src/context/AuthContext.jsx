import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (phone, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login/', { phone, password });
      const { access, refresh, user: userData } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'شماره موبایل یا رمز عبور اشتباه است.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const quickSwitch = async (role) => {
    const credentials = {
      SUPERVISOR: { phone: '09045911122', pass: '12345678' },
      ADMIN: { phone: '09111111111', pass: '12345678' },
      COACH: { phone: '09222222222', pass: '12345678' },
      SWIMMER: { phone: '09333333333', pass: '12345678' },
    };
    const cred = credentials[role];
    if (cred) {
      return await login(cred.phone, cred.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, quickSwitch, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
