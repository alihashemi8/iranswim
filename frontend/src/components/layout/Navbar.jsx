import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LogIn, Menu, X,
  Users2, Award, Building2, Newspaper, PhoneCall, ChevronLeft, BookOpen,
  Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationDropdown } from './NotificationDropdown';
import { ChildSwitcher } from './ChildSwitcher';

export const Navbar = ({ onMenuClick, isFullWidth = false }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { label: 'اصول و مزایا', href: '/#about', icon: Award },
    { label: 'دوره‌ها و کلاس‌ها', href: '/#courses', icon: BookOpen },
    { label: 'امکانات استخر', href: '/#facilities', icon: Building2 },
    { label: 'کادر مربیان', href: '/#coaches', icon: Users2 },
    { label: 'اخبار و رویدادها', href: '/#news', icon: Newspaper },
  ];

  const isPublicPage = !isFullWidth && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register');

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 w-full ${
          isPublicPage
            ? isScrolled
              ? 'pool-header bg-[#f0f9ff]/95 backdrop-blur-md border-b-0 shadow-[0_4px_20px_rgba(8,59,92,0.06)]'
              : 'pool-header bg-[#f0f9ff] border-b-0 shadow-none'
            : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs'
        }`}
      >
        <div
          className={`${
            isFullWidth
              ? 'w-full px-3 sm:px-6'
              : 'max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8'
          } h-16 sm:h-[68px] flex items-center justify-between gap-2 md:gap-2.5 lg:gap-4 flex-nowrap`}
        >
          {/* Brand & Main Navigation (Right side in RTL) */}
          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-4 xl:gap-8 shrink-0 flex-nowrap min-w-0">
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

            {/* Public Mobile Navigation Hamburger Button (Mobile only, hidden on tablet md and desktop) */}
            {!isFullWidth && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -mr-1.5 md:hidden text-[#083B5C] hover:text-[#087EA4] hover:bg-sky-50 rounded-xl transition-colors shrink-0 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#087EA4]/40"
                aria-label="باز کردن منوی ناوبری"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Brand Logo - 1 single line on tablet & mobile */}
            <Link
              to="/"
              className="flex items-center gap-2 md:gap-2.5 lg:gap-3 text-[#083B5C] hover:opacity-95 transition-opacity shrink-0 select-none py-1"
            >
              <img
                src="/images/logo.png"
                alt="لوگوی مدرسه شنای ایران"
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-[62px] lg:h-[62px] object-contain shrink-0 drop-shadow-sm select-none transition-transform hover:scale-105 duration-200"
              />
              <div className="flex flex-col xl:flex-col shrink-0 text-right">
                <span className="font-extrabold text-xs sm:text-sm md:text-[13px] lg:text-base text-[#083B5C] tracking-tight leading-tight whitespace-nowrap">
                  مدرسه شنای ایران
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

            {/* Public Nav Links - Visible on tablet (md) and desktop in ONE SINGLE ROW */}
            {!isFullWidth && (
              <nav
                className="hidden md:flex items-center gap-0.5 md:gap-1 lg:gap-2.5 xl:gap-5 text-[11px] md:text-[11.5px] lg:text-[13px] xl:text-sm font-semibold text-[#163247] whitespace-nowrap shrink-0"
                aria-label="ناوبری اصلی"
              >
                {publicNavLinks.map((item) => {
                  const isCurrent =
                    location.pathname === '/' &&
                    location.hash === item.href.replace('/', '');
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`px-1.5 md:px-1.5 lg:px-2.5 xl:px-3 py-1 md:py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 ${
                        isCurrent
                          ? 'text-[#087EA4] bg-sky-50 font-bold'
                          : 'text-[#163247] hover:text-[#087EA4] hover:bg-sky-50/80'
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            )}
          </div>

          {/* User Account Controls (Left side in RTL) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">
            {isFullWidth ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Messages Popover */}
                <NotificationDropdown />

                {/* Dark / Light Mode Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 hover:text-amber-500 dark:text-slate-300 dark:hover:text-amber-400 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/40"
                  aria-label={theme === 'dark' ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
                  title={theme === 'dark' ? 'حالت روز (روشن)' : 'حالت شب (تاریک)'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-400 transition-transform hover:rotate-45" />
                  ) : (
                    <Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300 transition-transform hover:-rotate-12" />
                  )}
                </button>
              </div>
            ) : (
              <>
                {/* Divider */}
                <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />

                {user ? (
                  <Link
                    to={getDashboardPath(user.role)}
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-sky-50/80 border border-slate-200/90 transition-colors cursor-pointer group shrink-0"
                    title="ورود به داشبورد"
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr ${
                        roleGradients[user.role] || 'from-sky-600 to-cyan-500'
                      } text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}
                    >
                      {user.full_name ? user.full_name.trim().charAt(0) : 'U'}
                    </div>
                    <div className="hidden sm:flex flex-col text-right leading-tight max-w-[130px] md:max-w-[160px] shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#087EA4] transition-colors truncate">
                        {user.full_name || 'داشبورد کاربر'}
                      </span>
                      <span className="text-xs text-[#647789] truncate">
                        {roleTitles[user.role] || 'ورود به داشبورد'}
                      </span>
                    </div>
                  </Link>
                ) : (location.pathname === '/login' || location.pathname === '/register') ? (
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 md:gap-1.5 lg:gap-2 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 text-xs md:text-xs lg:text-sm font-bold text-[#083B5C] bg-sky-50 hover:bg-sky-100 hover:text-[#087EA4] border border-sky-200/90 rounded-xl shadow-2xs transition-all duration-200 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 rotate-180" />
                    <span className="hidden sm:inline">بازگشت به سایت</span>
                    <span className="inline sm:hidden">صفحه اصلی</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 md:gap-1.5 lg:gap-2 px-2.5 md:px-3 lg:px-4.5 py-1.5 md:py-2 text-xs md:text-xs lg:text-sm font-bold text-white bg-gradient-to-r from-[#087EA4] to-[#16B8B0] hover:from-[#066A8A] hover:to-[#129A93] rounded-xl shadow-xs hover:shadow-md hover:shadow-cyan-500/20 transition-all duration-200 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
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

        {/* Wavy Organic Bottom Rim for Swimming Pool Navbar */}
        {isPublicPage && (
          <div
            className={`absolute top-full left-0 right-0 w-full overflow-hidden leading-none pointer-events-none select-none -mt-px z-20 transition-colors duration-300 ${
              isScrolled ? 'text-[#f0f9ff]/95' : 'text-[#f0f9ff]'
            }`}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 1440 28"
              className="w-full h-3 sm:h-4.5 lg:h-5.5 block drop-shadow-[0_4px_6px_rgba(8,59,92,0.06)]"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Layer 1: Subtle translucent secondary ripple */}
              <path
                d="M0,0 L0,8 C220,20 440,2 660,12 C880,22 1100,4 1320,14 C1380,16 1410,12 1440,10 L1440,0 Z"
                fill="currentColor"
                fillOpacity="0.45"
              />
              {/* Layer 2: Main organic navbar bottom wave contour */}
              <path
                d="M0,0 L0,14 C260,3 520,22 780,10 C1040,1 1280,18 1440,6 L1440,0 Z"
                fill="currentColor"
              />
              {/* Layer 3: Sunlit pool surface ripple highlight on the wave rim */}
              <path
                d="M0,14 C260,3 520,22 780,10 C1040,1 1280,18 1440,6"
                stroke="rgba(8, 126, 164, 0.32)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        )}
      </header>

      {/* Public Mobile Responsive Sidebar Drawer (Opens from Right on Mobile screens) */}
      {!isFullWidth && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-start" dir="rtl">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-fade-in cursor-pointer transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar Drawer Container (Sliding in from Right) */}
          <aside
            className="relative w-72 sm:w-80 max-w-[85vw] bg-white h-full flex flex-col justify-between shadow-2xl z-10 overflow-hidden animate-slide-in-right border-l border-slate-200/80"
            aria-label="منوی کناری ناوبری"
          >
            {/* Header: Logo, Title & Close Button */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-sky-50/50">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-[#083B5C] min-w-0"
              >
                <img
                  src="/images/logo.png"
                  alt="لوگوی مدرسه شنای ایران"
                  className="w-13 h-13 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-sm"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm text-[#083B5C] truncate">
                    مدرسه شنای ایران
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                aria-label="بستن منوی سایدبار"
                title="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Nav Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <span className="text-[11px] font-bold text-[#647789] px-2 block mb-2">
                  فهرست و دسترسی سریع
                </span>
                <nav className="flex flex-col space-y-1">
                  {publicNavLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-sky-50 text-[#163247] text-sm font-semibold transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#EAF5FC] text-[#087EA4] flex items-center justify-center group-hover:bg-[#087EA4] group-hover:text-white transition-colors shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-[#087EA4] group-hover:-translate-x-0.5 transition-all shrink-0" />
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Contact & Info Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#083B5C] font-bold">
                  <PhoneCall className="w-4 h-4 text-[#087EA4] shrink-0" />
                  <span>پشتیبانی و پذیرش: ۰۲۸-۳۳۶۵۰۰۰۰</span>
                </div>
                <p className="text-[11px] text-[#647789] leading-relaxed">
                  مدرسه شنای ایران • استان قزوین
                  <br />
                  برگزاری کلاس‌ها در استخرهای منتخب قزوین
                </p>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              {!user ? (
                (location.pathname === '/login' || location.pathname === '/register') ? (
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-sky-50 hover:bg-sky-100 text-[#083B5C] border border-sky-200 font-bold text-sm rounded-xl shadow-2xs transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0 rotate-180" />
                    <span>بازگشت به صفحه اصلی</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#087EA4] to-[#16B8B0] hover:from-[#066A8A] hover:to-[#129A93] text-white font-bold text-sm rounded-xl shadow-xs transition-all"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    <span>ورود / ثبت‌نام اعضا و شناگران</span>
                  </Link>
                )
              ) : (
                <Link
                  to={getDashboardPath(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between p-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl font-bold text-sm hover:bg-sky-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                        roleGradients[user.role] || 'from-sky-600 to-cyan-500'
                      } text-white flex items-center justify-center text-xs font-bold shrink-0`}
                    >
                      {user.full_name ? user.full_name.trim().charAt(0) : 'U'}
                    </div>
                    <div className="flex flex-col text-right min-w-0">
                      <span className="truncate">{user.full_name || 'کاربر'}</span>
                      <span className="text-[11px] text-sky-600 font-normal truncate">
                        {roleTitles[user.role] || 'پیشخوان کاربری'}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-sky-500 shrink-0" />
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

