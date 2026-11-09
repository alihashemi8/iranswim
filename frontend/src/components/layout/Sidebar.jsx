import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity, Bug, ShieldCheck, Zap,
  LayoutDashboard, BookOpen, Users, CreditCard, Calendar,
  ClipboardCheck, Award, Trophy, Bell,
  UserCheck, X, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, MessageSquareQuote, FileText, Settings,
  MessageSquare, Globe, Server, Radio, GitBranch, Database, Sliders, Whistle
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import api from '../../api/client';
import { LogoutModal } from '../common/LogoutModal';
import { CourseLogoIcon } from '../common/AquaticIcons';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Badge notification counts for admin
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchBadges = async () => {
        try {
          const reqRes = await api.get('/education/requests/?status=PENDING');
          const reqs = reqRes.data.results || reqRes.data;
          setPendingRequestsCount(reqs.length || 0);
        } catch {
          // Non-critical badge fetch
        }
      };
      fetchBadges();
    }
  }, [user]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bulletproof body scroll lock preventing underlying movement on mobile
  useBodyScrollLock(isOpen);

  if (!user) return null;

  const role = user.role;

  const roleTitles = {
    ADMIN: 'مدیر آموزشگاه',
    COACH: 'مربی',
    SUPERVISOR: 'ناظر فنی',
    SWIMMER: 'شناگر',
  };

  const roleGradients = {
    ADMIN: 'from-sky-600 to-cyan-500',
    COACH: 'from-emerald-600 to-teal-500',
    SUPERVISOR: 'from-amber-600 to-orange-500',
    SWIMMER: 'from-blue-600 via-sky-600 to-teal-500',
  };

  // Admin Grouped Navigation
  const adminGroups = [
    {
      groupTitle: '',
      items: [
        {
          to: '/admin',
          label: 'داشبورد عملیاتی',
          icon: LayoutDashboard,
          end: true,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
          badgeColor: 'bg-rose-500 text-white',
        },
      ],
    },
    {
      groupTitle: 'امور مالی',
      items: [
        {
          to: '/admin/finance',
          label: 'شهریه و مطالبات',
          icon: CreditCard,
        },
      ],
    },
    {
      groupTitle: 'مدیریت آموزشی',
      items: [
        {
          to: '/admin/swimmers',
          label: 'شناگران و پرونده‌ها',
          icon: Users,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
          badgeColor: 'bg-sky-500 text-white',
        },
        { to: '/admin/coaches', label: 'کادر مربیان', icon: Whistle },
        { to: '/admin/courses', label: 'کلاس‌ها و دوره‌ها', icon: CourseLogoIcon },
        { to: '/admin/attendance', label: 'حضور و غیاب', icon: ClipboardCheck },
      ],
    },
    {
      groupTitle: 'عملکرد و رقابت',
      items: [
        { to: '/admin/assessments', label: 'ارزیابی و رکوردها', icon: Award },
        { to: '/admin/leagues', label: 'لیگ و مسابقات', icon: Trophy },
      ],
    },
    {
      groupTitle: 'محتوا و ارتباطات',
      items: [
        { to: '/admin/website', label: 'مدیریت وبسایت', icon: Globe },
        { to: '/admin/announcements', label: 'پیام‌ها و اعلان‌ها', icon: Bell },
      ],
    },
  ];

  // Supervisor Navigation (10 Technical Operations Hub modules)
  const supervisorGroups = [
    {
      groupTitle: 'پایش و عملیات زنده',
      items: [
        { to: '/supervisor', label: 'داشبورد عملیات (Overview)', icon: Activity, end: true },
        { to: '/supervisor/infrastructure', label: 'زیرساخت سرور و داکر', icon: Server },
        { to: '/supervisor/services', label: 'وضعیت سرویس‌ها و SSL', icon: Radio },
      ],
    },
    {
      groupTitle: 'خطایابی و استقرار',
      items: [
        { to: '/supervisor/errors', label: 'مدیریت باگ‌ها و استک‌ترس', icon: Bug },
        { to: '/supervisor/deployments', label: 'استقرار و CI/CD', icon: GitBranch },
        { to: '/supervisor/backups', label: 'پشتیبان‌گیری (Backup)', icon: Database },
      ],
    },
    {
      groupTitle: 'امنیت و تنظیمات',
      items: [
        { to: '/supervisor/activity', label: 'نشست‌ها و امنیت کاربران', icon: Users },
        { to: '/supervisor/audit', label: 'حسابرسی عملیات (Audit)', icon: ShieldCheck },
        { to: '/supervisor/config', label: 'تنظیمات فنی و Flagها', icon: Sliders },
        { to: '/supervisor/test', label: 'شبیه‌ساز و تست خطا', icon: Zap },
      ],
    },
  ];

  // Coach Navigation (9 modules in 4 logical workflow groups)
  const coachGroups = [
    {
      groupTitle: 'مدیریت و کلاس‌های روزانه',
      items: [
        { to: '/coach', label: 'پیشخوان مربی', icon: LayoutDashboard, end: true },
        { to: '/coach/classes', label: 'کلاس‌های من', icon: BookOpen },
        { to: '/coach/attendance', label: 'ثبت حضور و غیاب', icon: ClipboardCheck },
      ],
    },
    {
      groupTitle: 'سنجش و پیشرفت ورزشی',
      items: [
        { to: '/coach/progress', label: 'ارزیابی و مهارت‌ها', icon: TrendingUp },
        { to: '/coach/exams', label: 'آزمون‌ها و سطح‌بندی', icon: Award },
      ],
    },
    {
      groupTitle: 'آموزش و تمرین',
      items: [
        { to: '/coach/workouts', label: 'برنامه‌های تمرین', icon: Calendar },
      ],
    },
    {
      groupTitle: 'ارتباطات و حساب فردی',
      items: [
        { to: '/coach/messages', label: 'پیام‌ها و اطلاعیه‌ها', icon: MessageSquare },
        { to: '/coach/profile', label: 'پروفایل و تنظیمات', icon: Settings },
      ],
    },
  ];


  // Swimmer & Parent Navigation (4 visual groups, 10 modules)
  const swimmerGroups = [
    {
      groupTitle: 'خانه',
      items: [
        { to: '/swimmer', label: 'داشبورد و وضعیت کلی', icon: LayoutDashboard, end: true },
      ],
    },
    {
      groupTitle: 'فعالیت ورزشی',
      items: [
        { to: '/swimmer/schedule', label: 'برنامه کلاس‌ها', icon: Calendar },
        { to: '/swimmer/progress', label: 'پیشرفت ورزشی', icon: TrendingUp },
        { to: '/swimmer/league', label: 'لیگ و رتبه‌بندی', icon: Trophy },
        { to: '/swimmer/attendance', label: 'حضور و غیاب', icon: ClipboardCheck },
      ],
    },
    {
      groupTitle: 'مالی و ارتباطات',
      items: [
        { to: '/swimmer/finance', label: 'امور مالی و اقساط', icon: CreditCard },
        { to: '/swimmer/announcements', label: 'اطلاعیه‌ها و اخبار', icon: Bell },
        { to: '/swimmer/support', label: 'پشتیبانی و ارتباط', icon: MessageSquareQuote },
      ],
    },
    {
      groupTitle: 'حساب کاربری',
      items: [
        { to: '/swimmer/documents', label: 'پرونده و مدارک', icon: FileText },
        { to: '/swimmer/settings', label: 'تنظیمات حساب', icon: Settings },
      ],
    },
  ];

  let activeNavigationGroups = [];
  if (role === 'ADMIN') {
    activeNavigationGroups = adminGroups;
  } else if (role === 'SUPERVISOR') {
    activeNavigationGroups = supervisorGroups;
  } else if (role === 'COACH') {
    activeNavigationGroups = coachGroups;
  } else if (role === 'SWIMMER') {
    activeNavigationGroups = swimmerGroups;
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.info('با موفقیت از حساب کاربری خارج شدید.');
    navigate('/login');
    if (onClose) onClose();
  };

  // Fixed Top User Profile Header (Click navigates directly to user's page without dropdown)
  const renderTopProfile = (isMobile = false) => {
    const profilePath = user.role === 'ADMIN' ? '/admin/profile' :
      user.role === 'COACH' ? '/coach' :
      user.role === 'SWIMMER' ? '/swimmer' :
      user.role === 'SUPERVISOR' ? '/supervisor' : '/';

    if (isMobile) {
      return (
        <div className="shrink-0 p-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <NavLink
              to={profilePath}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 min-w-0 flex-1 p-1 -m-1 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`
              }
              title={user.role === 'ADMIN' ? 'مشاهده صفحه پروفایل مدیر' : 'مشاهده پروفایل'}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${roleGradients[user.role] || 'from-blue-600 via-sky-600 to-teal-500'} text-white flex items-center justify-center font-black text-base shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-base font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {user.full_name}
                </span>
                <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold truncate">
                  {roleTitles[user.role] || 'کاربر سیستم'}
                </span>
              </div>
            </NavLink>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              aria-label="بستن منو"
              title="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    // Desktop & Tablet
    return (
      <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Full card on desktop xl when not collapsed */}
        <div
          className={`p-3 xl:p-3.5 flex items-center justify-between gap-2.5 ${
            collapsed ? 'hidden' : 'hidden xl:flex'
          }`}
        >
          <NavLink
            to={profilePath}
            className={({ isActive }) =>
              `flex items-center gap-3 min-w-0 flex-1 p-1.5 -m-1.5 rounded-xl transition-all group ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border-r-3 border-blue-600 shadow-2xs'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`
            }
            title={user.role === 'ADMIN' ? 'مشاهده صفحه پروفایل مدیر' : 'مشاهده پروفایل'}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${roleGradients[user.role] || 'from-blue-600 via-sky-600 to-teal-500'} text-white flex items-center justify-center font-black text-base shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
              {user.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm xl:text-[15px] font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {user.full_name}
              </span>
              <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold truncate">
                {roleTitles[user.role] || 'کاربر سیستم'}
              </span>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shrink-0"
            title="جمع کردن سایدبار"
            aria-label="جمع کردن سایدبار"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Compact View on tablet or when collapsed */}
        <div
          className={`p-2.5 flex-col items-center gap-2 ${
            collapsed ? 'flex' : 'flex xl:hidden'
          }`}
        >
          <NavLink
            to={profilePath}
            className="relative group flex justify-center cursor-pointer"
            title={`${user.full_name || 'کاربر'} (${roleTitles[user.role] || ''})`}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${roleGradients[user.role] || 'from-sky-600 to-cyan-500'} text-white flex items-center justify-center font-black text-base shrink-0 shadow-2xs hover:ring-2 hover:ring-sky-400 transition-all`}>
              {user.full_name ? user.full_name.charAt(0) : 'U'}
            </div>

            {/* Tooltip in icon-only mode */}
            <div
              role="tooltip"
              className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 backdrop-blur-xs"
            >
              <div className="font-black text-sm">{user.full_name}</div>
              <div className="text-xs font-bold text-sky-400 mt-0.5">{roleTitles[user.role] || 'کاربر سیستم'}</div>
              {user.phone && <div className="text-xs text-slate-300 font-mono mt-0.5">{user.phone}</div>}
              <div className="text-xs text-slate-300 border-t border-slate-700/60 mt-1 pt-1 font-medium">
                کلیک برای ورود به صفحه
              </div>
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-slate-900/95 dark:border-l-slate-800/95" />
            </div>
          </NavLink>

          {/* Expand button on desktop xl when collapsed */}
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="hidden xl:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="گسترش سایدبار"
              aria-label="گسترش سایدبار"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderNavSection = (isMobile = false) => (
    <nav className="space-y-3.5">
      {activeNavigationGroups.map((grp, gIdx) => (
        <div key={gIdx} className="space-y-1.5">
          {/* Section Group Title: shown on mobile and on desktop xl (when not collapsed), hidden on tablet */}
          {grp.groupTitle && (
            <div
              className={`px-3 text-xs sm:text-sm font-extrabold text-slate-400 dark:text-slate-500 tracking-wider mb-2 ${
                isMobile ? 'block' : collapsed ? 'hidden' : 'hidden xl:block'
              }`}
            >
              {grp.groupTitle}
            </div>
          )}

          {/* Group Divider in icon-only mode (tablet or collapsed desktop) */}
          {gIdx > 0 && !isMobile && (
            <div
              className={`h-px bg-slate-100 dark:bg-slate-800 my-2.5 mx-1.5 ${
                collapsed ? 'block' : 'block xl:hidden'
              }`}
            />
          )}

          {grp.items.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => {
                  if (isMobile) onClose();
                }}
                title={link.label}
                aria-label={link.label}
                className={({ isActive }) =>
                  `relative flex items-center rounded-xl text-sm xl:text-[15px] font-bold transition-all group ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-black border-r-3 border-blue-600 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  } ${
                    isMobile
                      ? 'justify-between px-3.5 py-3 w-full'
                      : collapsed
                      ? 'justify-center px-2 py-2.5 w-full'
                      : 'justify-center xl:justify-between px-2 xl:px-3.5 py-2.5 xl:py-3 w-full'
                  }`
                }
              >
                <div
                  className={`flex items-center min-w-0 ${
                    isMobile ? 'gap-3' : collapsed ? 'justify-center' : 'justify-center xl:justify-start xl:gap-3'
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />

                    {/* Badge in icon-only mode (on tablet or when collapsed) */}
                    {!isMobile && link.badge && (
                      <span
                        className={`absolute -top-1.5 -right-2 min-w-4.5 h-4.5 px-1 rounded-full text-[11px] font-mono font-bold flex items-center justify-center shadow-xs ${
                          link.badgeColor || 'bg-sky-600 text-white'
                        } ${collapsed ? 'flex' : 'flex xl:hidden'}`}
                      >
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                  </div>

                  {/* Label text: hidden on tablet (icon-only), visible on desktop xl unless collapsed, and visible on mobile */}
                  <span
                    className={`truncate ${
                      isMobile
                        ? 'inline'
                        : collapsed
                        ? 'hidden'
                        : 'hidden xl:inline'
                    }`}
                  >
                    {link.label}
                  </span>
                </div>

                {/* Desktop Full Badge: visible only on desktop xl when not collapsed */}
                {link.badge && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black shrink-0 shadow-2xs ${
                      link.badgeColor || 'bg-sky-600 text-white'
                    } ${
                      isMobile
                        ? 'inline-block'
                        : collapsed
                        ? 'hidden'
                        : 'hidden xl:inline-block'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}

                {/* Floating Tooltip in icon-only mode (tablet or collapsed desktop) */}
                {!isMobile && (
                  <div
                    role="tooltip"
                    className={`absolute right-full mr-2.5 px-3 py-2 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 backdrop-blur-xs ${
                      collapsed ? 'block' : 'block xl:hidden'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="mr-1.5 px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white font-mono font-bold">
                        {link.badge}
                      </span>
                    )}
                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-slate-900/95 dark:border-l-slate-800/95" />
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const renderBottomSection = (isMobile = false) => (
    <div className="shrink-0 p-3 xl:p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <button
        type="button"
        onClick={handleLogoutClick}
        className={`w-full flex items-center justify-center rounded-xl text-sm xl:text-[15px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 transition-colors shadow-2xs cursor-pointer group relative ${
          isMobile
            ? 'gap-2 px-3.5 py-3'
            : collapsed
            ? 'p-2.5'
            : 'p-2.5 xl:px-3.5 xl:py-3 xl:gap-2.5'
        }`}
        title="خروج از حساب کاربری"
        aria-label="خروج از حساب کاربری"
      >
        <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
        <span className={isMobile ? 'inline' : collapsed ? 'hidden' : 'hidden xl:inline'}>
          خروج از حساب
        </span>

        {/* Tooltip in icon-only mode */}
        {!isMobile && (
          <div
            role="tooltip"
            className={`absolute right-full mr-2.5 px-3 py-2 bg-rose-950 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 backdrop-blur-xs ${
              collapsed ? 'block' : 'block xl:hidden'
            }`}
          >
            <span>خروج از حساب</span>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-rose-950" />
          </div>
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Docked Sidebar (Icon-only on tablet w-20, full w-68 on desktop xl or collapsible) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 sticky top-16 h-[calc(100vh-4rem)] transition-all duration-200 overflow-hidden ${
          collapsed ? 'w-20' : 'w-20 xl:w-68'
        }`}
      >
        {/* Fixed Top User Profile Header */}
        {renderTopProfile(false)}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-2 xl:px-3 py-3">
          {renderNavSection(false)}
        </div>

        {/* Fixed Bottom Section (Logout) */}
        {renderBottomSection(false)}
      </aside>

      {/* Mobile Drawer (Overlay + Slide-over on the Right) */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-[100dvh] z-[9999] md:hidden flex justify-start overflow-hidden select-none"
          dir="rtl"
          style={{ overscrollBehavior: 'none', touchAction: 'none' }}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-[100dvh] bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            onTouchMove={(e) => e.preventDefault()}
            style={{ touchAction: 'none' }}
          />

          {/* Drawer Content */}
          <div
            className="relative w-72 sm:w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-[100dvh] max-h-[100dvh] flex flex-col justify-between shadow-2xl z-10 overflow-hidden animate-slide-in-right border-l border-slate-200/80 dark:border-slate-800"
            style={{ overscrollBehavior: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Top User Profile with Close Button */}
            <div
              className="shrink-0 select-none"
              style={{ touchAction: 'none' }}
              onTouchMove={(e) => e.preventDefault()}
            >
              {renderTopProfile(true)}
            </div>

            {/* Scrollable Mobile Nav Links */}
            <div
              className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 overscroll-contain"
              style={{
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {renderNavSection(true)}
            </div>

            {/* Fixed Mobile Bottom Section */}
            <div
              className="shrink-0 select-none"
              style={{ touchAction: 'none' }}
              onTouchMove={(e) => e.preventDefault()}
            >
              {renderBottomSection(true)}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        userName={user?.full_name}
        userRole={roleTitles[user?.role]}
      />
    </>
  );
};
