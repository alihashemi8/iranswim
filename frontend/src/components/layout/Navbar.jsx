import React from 'react';
import { Link } from 'react-router-dom';
import { Waves, UserCircle2, Menu, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar = ({ onMenuClick, isFullWidth = false }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const roleTitles = {
    ADMIN: 'پنل مدیریت آموزشگاه',
    COACH: 'میز کار مربی',
    SUPERVISOR: 'نظارت فنی و زیرساخت',
    SWIMMER: 'پرتال اختصاصی شناگر',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className={`${isFullWidth ? 'w-full px-3 sm:px-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} h-16 flex items-center justify-between`}>
        {/* Brand & Main Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 -mr-1 md:hidden text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="باز کردن منوی سایدبار"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 text-sky-700 dark:text-sky-400 hover:text-sky-800 transition-colors shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight block leading-tight">
                آموزشگاه شنای ایران
              </span>
            </div>
          </Link>

          {/* In Dashboard: Role context badge and website link */}
          {isFullWidth && user && (
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/80">
                {roleTitles[user.role] || 'داشبورد کاربری'}
              </span>
              <Link
                to="/"
                className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300 transition-colors"
                title="مشاهده صفحه اصلی وب‌سایت"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>مشاهده سایت</span>
              </Link>
            </div>
          )}

          {/* Public Nav Links (ONLY rendered on marketing pages, NOT in dashboard) */}
          {!isFullWidth && (
            <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">صفحه اصلی</Link>
              <a href="/#about" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">درباره آکادمی</a>
              <a href="/#courses" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">دوره‌ها و کلاس‌ها</a>
              <a href="/#coaches" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">مربیان ما</a>
              <a href="/#facilities" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">امکانات استخر</a>
              <a href="/#news" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">اخبار و رویدادها</a>
            </nav>
          )}
        </div>

        {/* User Account Controls & Theme Switch */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Top Bar Notifications */}
          {user && <NotificationDropdown />}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
            title={theme === 'dark' ? 'حالت روشن' : 'حالت شب / تاریک'}
            aria-label="تغییر تم"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          </button>

          {/* In Dashboard: user identity badge on tablet & desktop */}
          {isFullWidth && user && (
            <div className="hidden md:flex items-center gap-2.5 pr-2 mr-0.5 border-r border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[130px]">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {user.phone}
                </span>
              </div>
            </div>
          )}

          {!user && (
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
