import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity, Bug, ShieldCheck, Zap,
  LayoutDashboard, BookOpen, Users, CreditCard, Calendar,
  ClipboardCheck, Award, Timer, Trophy, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user } = useAuth();

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
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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

  const renderStatusCard = () => (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-500">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="font-medium text-slate-700">اتصال سرور فعال</span>
      </div>
      <span>نسخه سامانه: ۱.۰.۰ تولید</span>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-l border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex-col justify-between shrink-0">
        <div>
          <div className="px-3 pb-3 mb-2 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {panelTitle}
            </span>
          </div>
          {renderNavLinks(false)}
        </div>
        {renderStatusCard()}
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
          <aside className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] h-full bg-white shadow-2xl border-l border-slate-200/80 p-4 flex flex-col justify-between overflow-y-auto animate-slide-in-right">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-2 pb-3 mb-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">
                  {panelTitle}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="بستن منو"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              {renderNavLinks(true)}
            </div>

            {/* Bottom info */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              {renderStatusCard()}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
