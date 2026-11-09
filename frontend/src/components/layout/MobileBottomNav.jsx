import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, CreditCard, TrendingUp,
  UserCheck, BookOpen, ClipboardCheck, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CourseLogoIcon } from '../common/AquaticIcons';


export const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const currentPath = location.pathname;

  // Swimmer Mobile Bottom Navigation (5 items)
  if (user.role === 'SWIMMER' && currentPath.startsWith('/swimmer')) {
    const isHome = currentPath === '/swimmer';
    const isSchedule = currentPath.startsWith('/swimmer/schedule');
    const isProgress = currentPath.startsWith('/swimmer/progress') || currentPath.startsWith('/swimmer/league');
    const isFinance = currentPath.startsWith('/swimmer/finance');
    const isAccount = currentPath.startsWith('/swimmer/documents') || currentPath.startsWith('/swimmer/settings') || currentPath.startsWith('/swimmer/complete-profile');

    const swimmerNavItems = [
      { to: '/swimmer', label: 'خانه', icon: LayoutDashboard, active: isHome, end: true },
      { to: '/swimmer/schedule', label: 'برنامه', icon: Calendar, active: isSchedule },
      { to: '/swimmer/progress', label: 'پیشرفت', icon: TrendingUp, active: isProgress },
      { to: '/swimmer/finance', label: 'مالی', icon: CreditCard, active: isFinance },
      { to: '/swimmer/documents', label: 'حساب من', icon: UserCheck, active: isAccount },
    ];

    return (
      <nav
        dir="rtl"
        aria-label="ناوبری اصلی همراه شناگر"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-colors"
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1 items-center">
          {swimmerNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center justify-center h-full py-1 px-1 transition-colors group select-none"
                aria-label={item.label}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    item.active
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 scale-105'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs tracking-tight leading-tight mt-0.5 truncate max-w-full ${
                    item.active
                      ? 'font-bold text-blue-600 dark:text-blue-400'
                      : 'font-semibold text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    );
  }

  // Admin Mobile Bottom Navigation (4 items)
  if (user.role === 'ADMIN' && currentPath.startsWith('/admin')) {
    const isHomeActive = currentPath === '/admin';
    const isSwimmersActive = currentPath.startsWith('/admin/swimmers');
    const isCoursesActive =
      currentPath.startsWith('/admin/courses') ||
      currentPath.startsWith('/admin/classes') ||
      currentPath.startsWith('/admin/sessions');
    const isFinanceActive = currentPath.startsWith('/admin/finance');

    return (
      <nav
        dir="rtl"
        aria-label="ناوبری اصلی همراه مدیریت"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-colors"
      >
        <div className="grid grid-cols-4 h-16 max-w-md mx-auto px-2 items-center">
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
              className={`text-xs tracking-tight leading-tight mt-0.5 truncate max-w-full ${
                isHomeActive
                  ? 'font-bold text-sky-600 dark:text-sky-400'
                  : 'font-semibold text-slate-500 dark:text-slate-400'
              }`}
            >
              خانه
            </span>
          </NavLink>

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
              className={`text-xs tracking-tight leading-tight mt-0.5 truncate max-w-full ${
                isSwimmersActive
                  ? 'font-bold text-sky-600 dark:text-sky-400'
                  : 'font-semibold text-slate-500 dark:text-slate-400'
              }`}
            >
              شناگران
            </span>
          </NavLink>

          <NavLink
            to="/admin/courses"
            className="flex flex-col items-center justify-center h-full py-1 px-1 transition-colors group select-none"
            aria-label="دوره‌ها و کلاس‌ها"
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isCoursesActive
                  ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 scale-105'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              }`}
            >
              <CourseLogoIcon className="w-5 h-5" />
            </div>
            <span
              className={`text-xs tracking-tight leading-tight mt-0.5 truncate max-w-full ${
                isCoursesActive
                  ? 'font-bold text-sky-600 dark:text-sky-400'
                  : 'font-semibold text-slate-500 dark:text-slate-400'
              }`}
            >
              دوره‌ها
            </span>
          </NavLink>

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
              className={`text-xs tracking-tight leading-tight mt-0.5 truncate max-w-full ${
                isFinanceActive
                  ? 'font-bold text-sky-600 dark:text-sky-400'
                  : 'font-semibold text-slate-500 dark:text-slate-400'
              }`}
            >
              مالی
            </span>
          </NavLink>
        </div>
      </nav>
    );
  }

  // Coach Mobile Bottom Navigation (5 high-frequency daily items)
  if (user.role === 'COACH' && currentPath.startsWith('/coach')) {
    const isHome = currentPath === '/coach';
    const isClasses = currentPath.startsWith('/coach/classes');
    const isAttendance = currentPath.startsWith('/coach/attendance');
    const isProgress = currentPath.startsWith('/coach/progress') || currentPath.startsWith('/coach/exams');
    const isMessages = currentPath.startsWith('/coach/messages');

    const coachNavItems = [
      { to: '/coach', label: 'خانه', icon: LayoutDashboard, active: isHome, end: true },
      { to: '/coach/classes', label: 'کلاس‌ها', icon: BookOpen, active: isClasses },
      { to: '/coach/attendance', label: 'حضور', icon: ClipboardCheck, active: isAttendance },
      { to: '/coach/progress', label: 'پیشرفت', icon: TrendingUp, active: isProgress },
      { to: '/coach/messages', label: 'پیام‌ها', icon: MessageSquare, active: isMessages },
    ];

    return (
      <nav
        dir="rtl"
        aria-label="ناوبری اصلی همراه مربی"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        className="coach-panel fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-colors"
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1 items-center">
          {coachNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center justify-center h-full py-1 px-1 transition-colors group select-none"
                aria-label={item.label}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    item.active
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 scale-105'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs tracking-tight leading-tight mt-0.5 truncate max-w-full ${
                    item.active
                      ? 'font-bold text-emerald-600 dark:text-emerald-400'
                      : 'font-semibold text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    );
  }

  return null;
};
