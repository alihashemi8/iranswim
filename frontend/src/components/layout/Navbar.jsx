import React from 'react';
import { Link } from 'react-router-dom';
import { Waves, UserCircle2, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const roleTitles = {
    ADMIN: 'مدیر آموزشگاه',
    SUPERVISOR: 'ناظر فنی سامانه',
    COACH: 'مربی آکادمی',
    SWIMMER: 'شناگر',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Main Navigation */}
        <div className="flex items-center gap-2 sm:gap-8">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 -mr-1 md:hidden text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
              aria-label="باز کردن منوی سایدبار"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 text-sky-700 dark:text-sky-400 hover:text-sky-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 text-white flex items-center justify-center shadow-xs">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight block leading-tight">آموزشگاه شنای ایران</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">آکادمی تخصصی و ورزش‌های آبی</span>
            </div>
          </Link>

          {/* Public Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">صفحه اصلی</Link>
            <a href="/#about" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">درباره آکادمی</a>
            <a href="/#courses" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">دوره‌ها و کلاس‌ها</a>
            <a href="/#coaches" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">مربیان ما</a>
            <a href="/#facilities" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">امکانات استخر</a>
            <a href="/#news" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">اخبار و رویدادها</a>
          </nav>
        </div>

        {/* User Account Controls & Theme Switch */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80"
            title={theme === 'dark' ? 'حالت روشن' : 'حالت شب / تاریک'}
            aria-label="تغییر تم"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {user.full_name ? user.full_name.charAt(0) : <UserCircle2 className="w-4 h-4" />}
              </div>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.full_name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">{roleTitles[user.role] || user.role}</span>
              </div>
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
