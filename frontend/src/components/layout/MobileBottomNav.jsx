import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Only display for authenticated ADMIN inside /admin paths on mobile
  if (!user || user.role !== 'ADMIN' || !location.pathname.startsWith('/admin')) {
    return null;
  }

  const currentPath = location.pathname;

  const isHomeActive = currentPath === '/admin';
  const isSwimmersActive = currentPath.startsWith('/admin/swimmers');
  const isScheduleActive =
    currentPath.startsWith('/admin/sessions') || currentPath.startsWith('/admin/courses');
  const isFinanceActive = currentPath.startsWith('/admin/finance');

  return (
    <nav
      dir="rtl"
      aria-label="ناوبری اصلی همراه"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-colors"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto px-2 items-center">
        {/* 1. خانه (Home / Admin Dashboard) */}
        <NavLink
          to="/admin"
          end
          className="flex flex-col items-center justify-center h-full py-1 px-1 transition-colors group select-none"
          aria-label="داشبورد و خانه"
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              isHomeActive
                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 scale-105'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span
            className={`text-[11px] tracking-tight leading-tight mt-0.5 truncate max-w-full ${
              isHomeActive
                ? 'font-bold text-sky-600 dark:text-sky-400'
                : 'font-medium text-slate-500 dark:text-slate-400'
            }`}
          >
            خانه
          </span>
        </NavLink>

        {/* 2. شناگران (Swimmers) */}
        <NavLink
          to="/admin/swimmers"
          className="flex flex-col items-center justify-center h-full py-1 px-1 transition-colors group select-none"
          aria-label="شناگران"
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              isSwimmersActive
                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 scale-105'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <span
            className={`text-[11px] tracking-tight leading-tight mt-0.5 truncate max-w-full ${
              isSwimmersActive
                ? 'font-bold text-sky-600 dark:text-sky-400'
                : 'font-medium text-slate-500 dark:text-slate-400'
            }`}
          >
            شناگران
          </span>
        </NavLink>

        {/* 3. برنامه (Classes & Schedule) */}
        <NavLink
          to="/admin/sessions"
          className="flex flex-col items-center justify-center h-full py-1 px-1 transition-colors group select-none"
          aria-label="برنامه و سانس‌ها"
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              isScheduleActive
                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 scale-105'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <span
            className={`text-[11px] tracking-tight leading-tight mt-0.5 truncate max-w-full ${
              isScheduleActive
                ? 'font-bold text-sky-600 dark:text-sky-400'
                : 'font-medium text-slate-500 dark:text-slate-400'
            }`}
          >
            برنامه
          </span>
        </NavLink>

        {/* 4. مالی (Finance) */}
        <NavLink
          to="/admin/finance"
          className="flex flex-col items-center justify-center h-full py-1 px-1 transition-colors group select-none"
          aria-label="امور مالی و شهریه"
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              isFinanceActive
                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 scale-105'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <span
            className={`text-[11px] tracking-tight leading-tight mt-0.5 truncate max-w-full ${
              isFinanceActive
                ? 'font-bold text-sky-600 dark:text-sky-400'
                : 'font-medium text-slate-500 dark:text-slate-400'
            }`}
          >
            مالی
          </span>
        </NavLink>
      </div>
    </nav>
  );
};
