import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, LogIn, KeyRound, Phone, ShieldAlert, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const LoginPage = () => {
  const [phone, setPhone] = useState('09122222222'); // Default to Supervisor for easy review
  const [password, setPassword] = useState('super123456');
  const [error, setError] = useState('');
  const { login, quickSwitch, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(phone, password);
    if (res.success) {
      redirectByRole(res.user.role);
    } else {
      setError(res.error);
    }
  };

  const handleQuick = async (role) => {
    setError('');
    const res = await quickSwitch(role);
    if (res?.success) {
      redirectByRole(res.user.role);
    }
  };

  const redirectByRole = (role) => {
    if (role === 'SUPERVISOR') navigate('/supervisor');
    else if (role === 'ADMIN') navigate('/admin');
    else if (role === 'COACH') navigate('/coach');
    else if (role === 'SWIMMER') navigate('/swimmer');
    else navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="text-center">
          <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xs mb-3">
            <Waves className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">ورود به سامانه IranSwim</h2>
          <p className="text-xs text-slate-500 mt-1">شماره همراه و رمز عبور خود را وارد نمایید</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">شماره تلفن همراه:</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09121111111"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-9 pl-3 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">رمز عبور:</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-9 pl-3 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full py-2.5 text-sm gap-2 mt-2">
            <LogIn className="w-4 h-4" />
            <span>ورود به حساب</span>
          </Button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="pt-6 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center mb-3">
            ورود سریع با یک کلیک (ویژه آزمون سامانه):
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuick('SUPERVISOR')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl font-medium transition-colors text-right flex items-center justify-between"
            >
              <div>
                <span className="block font-bold">ناظر فنی سامانه</span>
                <span className="text-[10px] text-amber-700">پایش باگ و سرور</span>
              </div>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </button>

            <button
              onClick={() => handleQuick('ADMIN')}
              className="p-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 rounded-xl font-medium transition-colors text-right flex items-center justify-between"
            >
              <div>
                <span className="block font-bold">مدیر آموزشگاه</span>
                <span className="text-[10px] text-sky-700">مدیریت کامل و مالی</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-sky-600" />
            </button>

            <button
              onClick={() => handleQuick('COACH')}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl font-medium transition-colors text-right flex items-center justify-between"
            >
              <div>
                <span className="block font-bold">مربی</span>
                <span className="text-[10px] text-emerald-700">حضور و غیاب و مهارت</span>
              </div>
              <User className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={() => handleQuick('SWIMMER')}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl font-medium transition-colors text-right flex items-center justify-between"
            >
              <div>
                <span className="block font-bold">شناگر</span>
                <span className="text-[10px] text-indigo-700">پرتال و سهمیه کلاس</span>
              </div>
              <Waves className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
