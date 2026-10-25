import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Waves, LogIn, KeyRound, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const [phone, setPhone] = useState('09045911122'); // Default to supervisor
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // If already authenticated, redirect to their role dashboard
  useEffect(() => {
    if (user) {
      redirectByRole(user.role);
    }
  }, [user]);

  const redirectByRole = (role) => {
    switch (role) {
      case 'SUPERVISOR':
        navigate('/supervisor');
        break;
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'COACH':
        navigate('/coach');
        break;
      case 'SWIMMER':
        navigate('/swimmer');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(phone, password);
    if (res.success) {
      toast.success(`خوش آمدید! ورود به عنوان ${res.user.full_name} با موفقیت انجام شد.`);
      redirectByRole(res.user.role);
    } else {
      setError(res.error);
      toast.error(res.error || 'ورود ناموفق بود.');
    }
  };

  const fillCredentials = (p) => {
    setPhone(p);
    setPassword('12345678');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-3 hover:scale-105 transition-transform">
              <Waves className="w-8 h-8" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ورود به پرتال آموزشگاه شنای ایران</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">جهت دسترسی به پنل اختصاصی خود، شماره همراه و رمز عبور را وارد نمایید</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">شماره تلفن همراه (نام کاربری):</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09045911122"
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">رمز عبور:</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full py-3 text-sm font-bold gap-2 mt-2">
            <LogIn className="w-4 h-4" />
            <span>ورود و انتقال به پیشخوان</span>
          </Button>
        </form>

        {/* Informative credentials reminder as requested by user */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2 text-right">
            کاربران تعریف‌شده سامانه (رمز عبور همگی: <code className="font-mono text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1 py-0.5 rounded">12345678</code>):
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('09045911122')}
              className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-right border border-slate-200/70 dark:border-slate-700 transition-colors"
            >
              <span className="font-bold text-amber-700 dark:text-amber-400 block">ناظر فنی (شما):</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">09045911122</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('09111111111')}
              className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-right border border-slate-200/70 dark:border-slate-700 transition-colors"
            >
              <span className="font-bold text-sky-700 dark:text-sky-400 block">مدیر آموزشگاه:</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">09111111111</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('09222222222')}
              className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-right border border-slate-200/70 dark:border-slate-700 transition-colors"
            >
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">مربی:</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">09222222222</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('09333333333')}
              className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-right border border-slate-200/70 dark:border-slate-700 transition-colors"
            >
              <span className="font-bold text-indigo-700 dark:text-indigo-400 block">شاگرد / شناگر:</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">09333333333</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium inline-flex items-center gap-1">
            <span>بازگشت به صفحه اصلی آکادمی</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
