import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, CreditCard, TrendingUp,
  UserCheck, BookOpen, ClipboardCheck, Activity, Server, Bug, Radio,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CourseLogoIcon } from '../common/AquaticIcons';


export const MobileBottomNav = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const currentPath = location.pathname;

  // Swimmer Mobile Bottom Navigation (5 items)
  if (user.role === 'SWIMMER' && currentPath.startsWith('/swimmer')) {
    const isHome = currentPath === '/swimmer';
    const isCourses = currentPath.startsWith('/swimmer/courses') || currentPath.startsWith('/swimmer/schedule') || currentPath.startsWith('/swimmer/plans');
    const isAttendance = currentPath.startsWith('/swimmer/attendance');
    const isProgress = currentPath.startsWith('/swimmer/progress') || currentPath.startsWith('/swimmer/league');
    const isFinance = currentPath.startsWith('/swimmer/finance');

    const swimmerNavItems = [
      { to: '/swimmer', label: 'خانه', icon: LayoutDashboard, active: isHome, end: true },
      { to: '/swimmer/courses', label: 'دوره‌ها', icon: BookOpen, active: isCourses },
      { to: '/swimmer/attendance', label: 'حضور', icon: ClipboardCheck, active: isAttendance },
      { to: '/swimmer/progress', label: 'پیشرفت', icon: TrendingUp, active: isProgress },
      { to: '/swimmer/finance', label: 'مالی', icon: CreditCard, active: isFinance },
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

  // Admin Mobile Bottom Navigation (5 items)
  if (user.role === 'ADMIN' && currentPath.startsWith('/admin')) {
    const isHomeActive = currentPath === '/admin';
    const isSwimmersActive = currentPath.startsWith('/admin/swimmers');
    const isCoursesActive =
      currentPath.startsWith('/admin/courses') ||
      currentPath.startsWith('/admin/classes') ||
      currentPath.startsWith('/admin/sessions');
    const isFinanceActive = currentPath.startsWith('/admin/finance');
    const isOtherActive =
      !isHomeActive &&
      !isSwimmersActive &&
      !isCoursesActive &&
      !isFinanceActive;

    return (
      <nav
        dir="rtl"
        aria-label="ناوبری اصلی همراه مدیریت"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-colors"
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1 items-center">
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

          <button
            type="button"
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center h-full py-1 px-1 transition-colors group select-none cursor-pointer"
            aria-label="منوی سایر بخش‌های مدیریت"
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isOtherActive
                  ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 scale-105'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              }`}
            >
              <Menu className="w-5 h-5" />
            </div>
            <span
              className={`text-xs tracking-tight leading-tight mt-0.5 truncate max-w-full ${
                isOtherActive
                  ? 'font-bold text-sky-600 dark:text-sky-400'
                  : 'font-semibold text-slate-500 dark:text-slate-400'
              }`}
            >
              منو
            </span>
          </button>
        </div>
      </nav>
    );
  }

  // Coach Mobile Bottom Navigation (5 high-frequency daily items)
  if (currentPath.startsWith('/coach')) {
    const isHome = currentPath === '/coach';
    const isClasses = currentPath.startsWith('/coach/classes');
    const isSwimmers = currentPath.startsWith('/coach/swimmers');
    const isAttendance = currentPath.startsWith('/coach/attendance');
    const isProgress =
      currentPath.startsWith('/coach/progress') ||
      currentPath.startsWith('/coach/exams') ||
      currentPath.startsWith('/coach/records') ||
      currentPath.startsWith('/coach/skills');

    const coachNavItems = [
      { to: '/coach', label: 'خانه', icon: LayoutDashboard, active: isHome, end: true },
      { to: '/coach/classes', label: 'کلاس‌ها', icon: BookOpen, active: isClasses },
      { to: '/coach/swimmers', label: 'شناگران', icon: Users, active: isSwimmers },
      { to: '/coach/attendance', label: 'حضور', icon: ClipboardCheck, active: isAttendance },
      { to: '/coach/progress', label: 'پیشرفت', icon: TrendingUp, active: isProgress },
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

  // Supervisor Mobile Bottom Navigation (5 technical hubs)
  if (user.role === 'SUPERVISOR' && currentPath.startsWith('/supervisor')) {
    const isDashboard = currentPath === '/supervisor';
    const isInfrastructure = currentPath.startsWith('/supervisor/infrastructure');
    const isErrors = currentPath.startsWith('/supervisor/errors');
    const isServices = currentPath.startsWith('/supervisor/services');
    const isActivity = currentPath.startsWith('/supervisor/activity') || currentPath.startsWith('/supervisor/users');

    const supervisorNavItems = [
      { to: '/supervisor', label: 'داشبورد', icon: Activity, active: isDashboard, end: true },
      { to: '/supervisor/infrastructure', label: 'زیرساخت', icon: Server, active: isInfrastructure },
      { to: '/supervisor/errors', label: 'خطاها', icon: Bug, active: isErrors },
      { to: '/supervisor/services', label: 'سرویس‌ها', icon: Radio, active: isServices },
      { to: '/supervisor/activity', label: 'امنیت', icon: Users, active: isActivity },
    ];

    return (
      <nav
        dir="rtl"
        aria-label="ناوبری اصلی همراه ناظر فنی"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-colors"
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1 items-center">
          {supervisorNavItems.map((item) => {
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
                      ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 scale-105'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs tracking-tight leading-tight mt-0.5 truncate max-w-full ${
                    item.active
                      ? 'font-bold text-amber-600 dark:text-amber-400'
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
