import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Waves, LogIn, Menu, X,
  Users2, Award, Building2, Newspaper, PhoneCall, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChildSwitcher } from './ChildSwitcher';

export const Navbar = ({ onMenuClick, isFullWidth = false }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const [prevLocationKey, setPrevLocationKey] = useState(location.key);
  if (location.key !== prevLocationKey) {
    setPrevLocationKey(location.key);
    setMobileMenuOpen(false);
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const roleTitles = {
    ADMIN: 'مدیر آموزشگاه',
    COACH: 'میز کار مربی',
    SUPERVISOR: 'ناظر فنی',
    SWIMMER: 'شناگر',
  };

  const roleGradients = {
    ADMIN: 'from-sky-600 to-cyan-500',
    COACH: 'from-emerald-600 to-teal-500',
    SUPERVISOR: 'from-amber-600 to-orange-500',
    SWIMMER: 'from-cyan-600 to-blue-500',
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'COACH':
        return '/coach';
      case 'SUPERVISOR':
        return '/supervisor';
      case 'SWIMMER':
        return '/swimmer';
      default:
        return '/';
    }
  };

  const publicNavLinks = [
    { label: 'صفحه اصلی', href: '/', icon: Waves },
    { label: 'اصول و مزایا', href: '/#about', icon: Award },
    { label: 'کادر مربیان', href: '/#coaches', icon: Users2 },
    { label: 'امکانات استخر', href: '/#facilities', icon: Building2 },
    { label: 'اخبار و رویدادها', href: '/#news', icon: Newspaper },
  ];

  return (
    <header className={`sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors w-full overflow-x-clip ${!isFullWidth && (location.pathname === '/' || location.pathname === '/login') ? 'pool-header' : ''}`}>
      <div className={`${isFullWidth ? 'w-full px-3 sm:px-6' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8'} h-16 sm:h-[68px] flex items-center justify-between gap-2`}>
        {/* Brand & Main Navigation (Right side in RTL) */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 shrink">
          {/* Dashboard Sidebar Hamburger Button */}
          {isFullWidth && onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="p-1.5 sm:p-2 -mr-1 md:hidden text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="باز کردن منوی سایدبار"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Public Mobile Navigation Hamburger Button */}
          {!isFullWidth && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-1.5 sm:p-2 -mr-1 md:hidden text-slate-700 dark:text-slate-200 hover:text-[#087EA4] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/40"
              aria-label={mobileMenuOpen ? 'بستن منوی ناوبری' : 'باز کردن منوی ناوبری'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#087EA4]" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 text-[#083B5C] dark:text-sky-400 hover:opacity-90 transition-opacity min-w-0 shrink">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#083B5C] via-[#087EA4] to-[#16B8B0] text-white flex items-center justify-center shadow-xs shrink-0">
              <Waves className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm sm:text-lg text-[#083B5C] dark:text-white tracking-tight leading-tight truncate">
                آکادمی شنای ایران
              </span>
              <span className="text-[10px] text-[#647789] dark:text-slate-400 font-medium hidden sm:inline-block">
                مرکز تخصصی آموزش و قهرمانی
              </span>
            </div>
          </Link>

          {/* In Dashboard: Role context badge and Child Switcher for swimmers */}
          {isFullWidth && user && (
            <div className="flex items-center gap-2 mr-1">
              {user.role === 'SWIMMER' ? (
                <ChildSwitcher />
              ) : (
                <span className="hidden sm:inline-block px-3 py-1 rounded-lg text-xs sm:text-sm font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/80">
                  {roleTitles[user.role] || 'داشبورد کاربری'}
                </span>
              )}
            </div>
          )}

          {/* Public Nav Links (ONLY rendered on marketing pages, NOT in dashboard) */}
          {!isFullWidth && (
            <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-[#163247] dark:text-slate-200" aria-label="ناوبری اصلی">
              <Link
                to="/"
                className="hover:text-[#087EA4] dark:hover:text-cyan-400 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-[#087EA4] after:transition-all"
              >
                صفحه اصلی
              </Link>
              <a
                href="/#about"
                className="hover:text-[#087EA4] dark:hover:text-cyan-400 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-[#087EA4] after:transition-all"
              >
                اصول و مزایا
              </a>
              <a
                href="/#coaches"
                className="hover:text-[#087EA4] dark:hover:text-cyan-400 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-[#087EA4] after:transition-all"
              >
                کادر مربیان
              </a>
              <a
                href="/#facilities"
                className="hover:text-[#087EA4] dark:hover:text-cyan-400 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-[#087EA4] after:transition-all"
              >
                امکانات استخر
              </a>
              <a
                href="/#news"
                className="hover:text-[#087EA4] dark:hover:text-cyan-400 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-[#087EA4] after:transition-all"
              >
                اخبار و رویدادها
              </a>
            </nav>
          )}
        </div>

        {/* User Account Controls (Left side in RTL) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* On Public Website (!isFullWidth): Show Profile (if logged in) or "ورود / ثبت نام" (if not) */}
          {!isFullWidth && (
            <>
              {/* Divider */}
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              {user ? (
                <Link
                  to={getDashboardPath(user.role)}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer group"
                  title="ورود به داشبورد"
                >
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr ${roleGradients[user.role] || 'from-sky-600 to-cyan-500'} text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}>
                    {user.full_name ? user.full_name.trim().charAt(0) : 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-right leading-tight max-w-[130px] md:max-w-[160px]">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#087EA4] dark:group-hover:text-sky-400 transition-colors truncate">
                      {user.full_name || 'داشبورد کاربر'}
                    </span>
                    <span className="text-xs text-[#647789] dark:text-slate-400 truncate">
                      {roleTitles[user.role] || 'ورود به داشبورد'}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#087EA4] to-[#16B8B0] hover:from-[#066A8A] hover:to-[#129A93] rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline">ورود / ثبت‌نام</span>
                  <span className="inline sm:hidden">ورود</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Public Mobile Responsive Navigation Drawer */}
      {!isFullWidth && mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-start animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-5 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-[#647789] dark:text-slate-400">فهرست صفحات آکادمی</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col space-y-1">
              {publicNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-[#163247] dark:text-slate-200 text-sm font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#EAF5FC] dark:bg-slate-800 text-[#087EA4] dark:text-cyan-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </a>
                );
              })}
            </nav>

            {/* Quick contact in mobile menu */}
            <div className="p-3 bg-[#F8FAFC] dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-[#083B5C] dark:text-sky-300 font-bold">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>پشتیبانی و پذیرش: ۰۲۱-۸۸۸۸۸۸۸۸</span>
              </div>
              <p className="text-[11px] text-[#647789] dark:text-slate-400">
                مجموعه استخر بین‌المللی آزادی • سالن شماره ۲
              </p>
            </div>

            {/* Mobile login CTA */}
            {!user ? (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#087EA4] to-[#16B8B0] text-white font-bold text-sm rounded-xl shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود / ثبت‌نام اعضا و شناگران</span>
              </Link>
            ) : (
              <Link
                to={getDashboardPath(user.role)}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#083B5C] text-white font-bold text-sm rounded-xl shadow-xs"
              >
                <span>ورود به پیشخوان ({roleTitles[user.role] || 'کاربر'})</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

