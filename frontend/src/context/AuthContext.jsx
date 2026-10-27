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

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

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

  const sendOtp = async (phone, purpose = 'LOGIN') => {
    try {
      const res = await api.post('/auth/otp/send/', { phone, purpose });
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.detail || 'خطا در ارسال کد تأیید پیامکی.';
      return { success: false, error: msg };
    }
  };

  const loginWithOtp = async (phone, code) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/verify-login/', { phone, code });
      const { access, refresh, user: userData } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'کد تأیید نامعتبر یا منقضی شده است.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const registerWithOtp = async ({ phone, code, first_name, last_name, national_id }) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register-otp/', {
        phone,
        code,
        first_name,
        last_name,
        national_id,
      });
      const { access, refresh, user: userData } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const data = err.response?.data;
      let msg = 'خطا در ثبت‌نام. لطفاً اطلاعات ورودی را بررسی نمایید.';
      if (typeof data === 'string') {
        msg = data;
      } else if (data && typeof data === 'object') {
        if (data.detail) msg = data.detail;
        else if (data.phone) msg = `شماره موبایل: ${Array.isArray(data.phone) ? data.phone.join(' ') : data.phone}`;
        else if (data.national_id) msg = `کد ملی: ${Array.isArray(data.national_id) ? data.national_id.join(' ') : data.national_id}`;
        else if (data.code) msg = `کد تأیید: ${Array.isArray(data.code) ? data.code.join(' ') : data.code}`;
        else {
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          msg = `${firstKey}: ${Array.isArray(val) ? val.join(' ') : val}`;
        }
      }
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ phone, password, first_name, last_name, national_id, role = 'SWIMMER' }) => {

    setLoading(true);
    try {
      await api.post('/auth/register/', {
        phone,
        password,
        first_name,
        last_name,
        national_id,
        role,
      });
      return await login(phone, password);
    } catch (err) {
      const data = err.response?.data;
      let msg = 'خطا در ثبت نام. لطفاً ورودی‌های خود را بررسی نمایید.';
      if (typeof data === 'string') {
        msg = data;
      } else if (data && typeof data === 'object') {
        if (data.detail) msg = data.detail;
        else if (data.phone) msg = `شماره موبایل: ${Array.isArray(data.phone) ? data.phone.join(' ') : data.phone}`;
        else if (data.national_id) msg = `کد ملی: ${Array.isArray(data.national_id) ? data.national_id.join(' ') : data.national_id}`;
        else {
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          msg = `${firstKey}: ${Array.isArray(val) ? val.join(' ') : val}`;
        }
      }
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

  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      if (updatedFields.first_name || updatedFields.last_name) {
        next.full_name = `${next.first_name || ''} ${next.last_name || ''}`.trim() || next.phone;
      }
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      sendOtp,
      loginWithOtp,
      registerWithOtp,
      register,
      logout,
      quickSwitch,
      updateUserData,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
