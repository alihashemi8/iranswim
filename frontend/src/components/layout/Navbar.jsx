import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Waves, LogOut, UserCircle2, LayoutDashboard, ShieldCheck, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleTitles = {
    ADMIN: 'مدیر آموزشگاه',
    SUPERVISOR: 'ناظر فنی سامانه',
    COACH: 'مربی آکادمی',
    SWIMMER: 'شناگر',
  };

  const roleVariants = {
    ADMIN: 'info',
    SUPERVISOR: 'warning',
    COACH: 'success',
    SWIMMER: 'neutral',
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'SUPERVISOR':
        return '/supervisor';
      case 'ADMIN':
        return '/admin';
      case 'COACH':
        return '/coach';
      case 'SWIMMER':
        return '/swimmer';
      default:
        return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Main Navigation */}
        <div className="flex items-center gap-2 sm:gap-8">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 -mr-1 md:hidden text-slate-700 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              aria-label="باز کردن منوی سایدبار"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 text-sky-700 hover:text-sky-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 text-white flex items-center justify-center shadow-xs">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">آموزشگاه شنای ایران</span>
              <span className="text-[10px] text-slate-500 block leading-tight">آکادمی تخصصی و ورزش‌های آبی</span>
            </div>
          </Link>

          {/* Public Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-sky-600 transition-colors">صفحه اصلی</Link>
            <a href="/#about" className="hover:text-sky-600 transition-colors">درباره آکادمی</a>
            <a href="/#courses" className="hover:text-sky-600 transition-colors">دوره‌ها و کلاس‌ها</a>
            <a href="/#coaches" className="hover:text-sky-600 transition-colors">مربیان ما</a>
            <a href="/#facilities" className="hover:text-sky-600 transition-colors">امکانات استخر</a>
            <a href="/#news" className="hover:text-sky-600 transition-colors">اخبار و رویدادها</a>
          </nav>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 text-right">{user.full_name}</span>
                <span className="text-[10px] text-slate-500 text-right">{roleTitles[user.role] || user.role}</span>
              </div>

              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>ورود به پیشخوان</span>
              </Link>

              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="inline-flex items-center gap-1 p-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                title="خروج از حساب کاربری"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
              >
                <UserCircle2 className="w-4 h-4" />
                <span>ورود به پرتال</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
