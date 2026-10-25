import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity, Bug, ShieldCheck, Zap,
  LayoutDashboard, BookOpen, Users, CreditCard, Calendar,
  ClipboardCheck, Award, Trophy, X, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!user) return null;

  const role = user.role;

  const supervisorLinks = [
    { to: '/supervisor', label: 'داشبورد سلامت و سرور', icon: Activity },
    { to: '/supervisor/errors', label: 'لاگ باگ‌ها و استک‌ترس', icon: Bug },
    { to: '/supervisor/audit', label: 'حسابرسی عملیات (Audit)', icon: ShieldCheck },
    { to: '/supervisor/test', label: 'شبیه‌ساز و تست خطا', icon: Zap },
  ];

  const adminLinks = [
    { to: '/admin', label: 'پیشخوان عملیاتی', icon: LayoutDashboard },
    { to: '/admin/courses', label: 'دوره‌ها و گروه‌ها', icon: BookOpen },
    { to: '/admin/enrollments', label: 'درخواست‌های ثبت‌نام', icon: Users },
    { to: '/admin/finance', label: 'امور مالی و اقساط', icon: CreditCard },
    { to: '/admin/sessions', label: 'زمان‌بندی و جلسات', icon: Calendar },
  ];

  const coachLinks = [
    { to: '/coach', label: 'کلاس‌های امروز و هفته', icon: Calendar },
    { to: '/coach/attendance', label: 'ثبت حضور و غیاب', icon: ClipboardCheck },
    { to: '/coach/assessments', label: 'ارزیابی مهارت و رکورد', icon: Award },
  ];

  const swimmerLinks = [
    { to: '/swimmer', label: 'پرتال و خلاصه وضعیت', icon: LayoutDashboard },
    { to: '/swimmer/schedule', label: 'برنامه کلاس‌ها و سهمیه', icon: Calendar },
    { to: '/swimmer/finance', label: 'صورتحساب و رسیدها', icon: CreditCard },
    { to: '/swimmer/progress', label: 'سوابق مهارت و لیگ', icon: Trophy },
  ];

  let links = [];
  let panelTitle = '';
  if (role === 'SUPERVISOR') {
    links = supervisorLinks;
    panelTitle = 'پنل ناظر فنی سامانه';
  } else if (role === 'ADMIN') {
    links = adminLinks;
    panelTitle = 'پنل مدیریت آموزشگاه';
  } else if (role === 'COACH') {
    links = coachLinks;
    panelTitle = 'پنل مربیان';
  } else if (role === 'SWIMMER') {
    links = swimmerLinks;
    panelTitle = 'پرتال شناگر';
  }

  const renderNavLinks = (isMobile = false) => (
    <nav className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/supervisor' || link.to === '/admin' || link.to === '/coach' || link.to === '/swimmer'}
            onClick={() => {
              if (isMobile) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  const renderBottomSection = (isMobile = false) => (
    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
      {/* User Info Bar */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          {user.full_name ? user.full_name.charAt(0) : 'U'}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user.full_name}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{user.phone}</span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={() => {
          logout();
          toast.info('با موفقیت از حساب کاربری خارج شدید.');
          navigate('/login');
          if (isMobile) onClose();
        }}
        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 transition-colors shadow-2xs cursor-pointer"
        title="خروج از حساب کاربری"
      >
        <LogOut className="w-4 h-4" />
        <span>خروج از حساب کاربری</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex-col justify-between shrink-0 transition-colors">
        <div>
          <div className="px-3 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {panelTitle}
            </span>
          </div>
          {renderNavLinks(false)}
        </div>
        {renderBottomSection(false)}
      </aside>

      {/* Mobile Drawer Overlay & Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer content pinned to the right edge */}
          <aside className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between overflow-y-auto animate-slide-in-right">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {panelTitle}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  aria-label="بستن منو"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              {renderNavLinks(true)}
            </div>

            {/* Bottom section with logout */}
            {renderBottomSection(true)}
          </aside>
        </div>
      )}
    </>
  );
};
