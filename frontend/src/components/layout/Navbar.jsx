import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Waves, ShieldAlert, LogOut, UserCircle2, ArrowRightLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const Navbar = () => {
  const { user, logout, quickSwitch } = useAuth();
  const navigate = useNavigate();

  const roleTitles = {
    ADMIN: 'مدیر آموزشگاه',
    SUPERVISOR: 'ناظر فنی سامانه',
    COACH: 'مربی',
    SWIMMER: 'شناگر',
  };

  const roleVariants = {
    ADMIN: 'info',
    SUPERVISOR: 'warning',
    COACH: 'success',
    SWIMMER: 'neutral',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 text-sky-700 hover:text-sky-800 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-xs">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">IranSwim</span>
              <span className="text-[10px] text-slate-500 block leading-tight">آموزشگاه تخصصی شنا</span>
            </div>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-1.5 mr-4 pr-4 border-r border-slate-200">
              <Badge variant={roleVariants[user.role] || 'info'}>
                {roleTitles[user.role] || user.role}
              </Badge>
              {user.role === 'SUPERVISOR' && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200/60">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  حالت مانیتورینگ زنده فعال
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Quick Role Tester Pills for convenient instant testing */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-slate-400 px-1.5 flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3" />
              تغییر سریع نقش:
            </span>
            <button
              onClick={() => { quickSwitch('SUPERVISOR'); navigate('/supervisor'); }}
              className={`px-2 py-1 rounded transition-colors ${user?.role === 'SUPERVISOR' ? 'bg-amber-500 text-white font-medium shadow-xs' : 'hover:bg-slate-200 text-slate-700'}`}
            >
              ناظر
            </button>
            <button
              onClick={() => { quickSwitch('ADMIN'); navigate('/admin'); }}
              className={`px-2 py-1 rounded transition-colors ${user?.role === 'ADMIN' ? 'bg-sky-600 text-white font-medium shadow-xs' : 'hover:bg-slate-200 text-slate-700'}`}
            >
              مدیر
            </button>
            <button
              onClick={() => { quickSwitch('COACH'); navigate('/coach'); }}
              className={`px-2 py-1 rounded transition-colors ${user?.role === 'COACH' ? 'bg-emerald-600 text-white font-medium shadow-xs' : 'hover:bg-slate-200 text-slate-700'}`}
            >
              مربی
            </button>
            <button
              onClick={() => { quickSwitch('SWIMMER'); navigate('/swimmer'); }}
              className={`px-2 py-1 rounded transition-colors ${user?.role === 'SWIMMER' ? 'bg-indigo-600 text-white font-medium shadow-xs' : 'hover:bg-slate-200 text-slate-700'}`}
            >
              شناگر
            </button>
          </div>

          <Link
            to="/"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="صفحه اصلی سایت"
          >
            <Home className="w-5 h-5" />
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-sm font-medium text-slate-700">
                {user.full_name}
              </span>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                title="خروج از حساب"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
            >
              <UserCircle2 className="w-4 h-4" />
              <span>ورود به سامانه</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
