import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity, Bug, ShieldCheck, Zap,
  LayoutDashboard, BookOpen, Users, CreditCard, Calendar,
  ClipboardCheck, Award, Trophy, Newspaper, Bell, BarChart3,
  ShieldAlert, UserCheck, X, LogOut, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Settings, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [adminProfileExpanded, setAdminProfileExpanded] = useState(false);

  // Auto-expand admin profile submenu when on profile page
  useEffect(() => {
    if (location.pathname.startsWith('/admin/profile')) {
      setAdminProfileExpanded(true);
    }
  }, [location.pathname]);

  // Badge notification counts for admin
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchBadges = async () => {
        try {
          const [reqRes, finRes] = await Promise.all([
            api.get('/education/requests/?status=PENDING'),
            api.get('/finance/summary/'),
          ]);
          const reqs = reqRes.data.results || reqRes.data;
          setPendingRequestsCount(reqs.length || 0);
          setOverdueCount(finRes.data?.overdue_installments_count || 0);
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
    SWIMMER: 'from-cyan-600 to-blue-500',
  };

  const isProfilePage = location.pathname.startsWith('/admin/profile');
  const currentTab = new URLSearchParams(location.search).get('tab')?.toLowerCase() || 'profile';

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
          badge: (pendingRequestsCount + overdueCount) > 0 ? (pendingRequestsCount + overdueCount) : null,
          badgeColor: 'bg-rose-500 text-white',
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
        { to: '/admin/coaches', label: 'کادر مربیان', icon: UserCheck },
        { to: '/admin/courses', label: 'کلاس‌ها و دوره‌ها', icon: BookOpen },
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
      groupTitle: 'امور مالی',
      items: [
        {
          to: '/admin/finance',
          label: 'شهریه و مطالبات',
          icon: CreditCard,
          badge: overdueCount > 0 ? overdueCount : null,
          badgeColor: 'bg-rose-500 text-white',
        },
      ],
    },
    {
      groupTitle: 'محتوا و ارتباطات',
      items: [
        { to: '/admin/news', label: 'وب‌سایت و اخبار', icon: Newspaper },
        { to: '/admin/announcements', label: 'پیام‌ها و اعلان‌ها', icon: Bell },
      ],
    },
    {
      groupTitle: 'گزارش‌ها و تحلیل',
      items: [
        { to: '/admin/reports', label: 'گزارش‌های جامع', icon: BarChart3 },
      ],
    },
  ];

  // Supervisor Navigation
  const supervisorGroups = [
    {
      groupTitle: 'نظارت فنی و زیرساخت',
      items: [
        { to: '/supervisor', label: 'داشبورد سلامت و سرور', icon: Activity, end: true },
        { to: '/supervisor/errors', label: 'لاگ باگ‌ها و استک‌ترس', icon: Bug },
        { to: '/supervisor/audit', label: 'حسابرسی عملیات (Audit)', icon: ShieldCheck },
        { to: '/supervisor/test', label: 'شبیه‌ساز و تست خطا', icon: Zap },
      ],
    },
  ];

  // Coach Navigation
  const coachGroups = [
    {
      groupTitle: 'میز کار مربی',
      items: [
        { to: '/coach', label: 'کلاس‌های امروز و هفته', icon: Calendar, end: true },
        { to: '/coach/attendance', label: 'ثبت حضور و غیاب', icon: ClipboardCheck },
        { to: '/coach/assessments', label: 'ارزیابی مهارت و رکورد', icon: Award },
      ],
    },
  ];

  // Swimmer Navigation
  const swimmerGroups = [
    {
      groupTitle: 'پرتال من',
      items: [
        { to: '/swimmer', label: 'پرتال و خلاصه وضعیت', icon: LayoutDashboard, end: true },
        { to: '/swimmer/schedule', label: 'برنامه کلاس‌ها و سهمیه', icon: Calendar },
        { to: '/swimmer/finance', label: 'صورتحساب و رسیدها', icon: CreditCard },
        { to: '/swimmer/progress', label: 'سوابق مهارت و لیگ', icon: Trophy },
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

  const handleLogout = (isMobile = false) => {
    logout();
    toast.info('با موفقیت از حساب کاربری خارج شدید.');
    navigate('/login');
    if (isMobile) onClose();
  };

  // Fixed Top User Profile Header
  const renderTopProfile = (isMobile = false) => {
    if (isMobile) {
      return (
        <div className="shrink-0 p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2.5">
            {user.role === 'ADMIN' ? (
              <NavLink
                to="/admin/profile"
                onClick={onClose}
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                title="مشاهده صفحه پروفایل مدیر"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user.full_name}
                  </span>
                  <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                    مدیر آموزشگاه
                  </span>
                </div>
              </NavLink>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${roleGradients[user.role] || 'from-sky-600 to-cyan-500'} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}>
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user.full_name}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-sky-600 dark:text-sky-400 font-semibold text-[11px] truncate">
                      {roleTitles[user.role] || 'کاربر سیستم'}
                    </span>
                    {user.phone && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-400 font-mono text-[11px] truncate">{user.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0">
              {user.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => setAdminProfileExpanded(!adminProfileExpanded)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  aria-label="تغییر وضعیت نمایش منوی پروفایل"
                  title={adminProfileExpanded ? 'بستن منوی پروفایل' : 'باز کردن منوی پروفایل'}
                >
                  {adminProfileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}

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

          {/* Admin Profile Quick Links Submenu in Mobile */}
          {user.role === 'ADMIN' && adminProfileExpanded && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 animate-fade-in">
              <NavLink
                to="/admin/profile?tab=profile"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isProfilePage && currentTab === 'profile'
                    ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-2 border-sky-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>مشخصات و اطلاعات</span>
              </NavLink>

              <NavLink
                to="/admin/profile?tab=settings"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  (isProfilePage && currentTab === 'settings') || location.pathname.startsWith('/admin/settings')
                    ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-2 border-sky-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>تنظیمات آموزشگاه</span>
              </NavLink>

              <NavLink
                to="/admin/profile?tab=users"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  (isProfilePage && currentTab === 'users') || location.pathname.startsWith('/admin/security')
                    ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-2 border-sky-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>کاربران و امنیت</span>
              </NavLink>
            </div>
          )}
        </div>
      );
    }

    // Desktop & Tablet
    return (
      <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Full card on desktop xl when not collapsed */}
        <div
          className={`p-2.5 xl:p-3 flex-col ${
            collapsed ? 'hidden' : 'hidden xl:flex'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            {user.role === 'ADMIN' ? (
              <NavLink
                to="/admin/profile"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 min-w-0 flex-1 p-1.5 -m-1.5 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-3 border-sky-600 shadow-2xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`
                }
                title="مشاهده صفحه پروفایل مدیر"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {user.full_name}
                  </span>
                  <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold truncate">
                    مدیر آموزشگاه
                  </span>
                </div>
              </NavLink>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${roleGradients[user.role] || 'from-sky-600 to-cyan-500'} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}>
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user.full_name}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-sky-600 dark:text-sky-400 font-semibold text-[11px] truncate">
                      {roleTitles[user.role] || 'کاربر سیستم'}
                    </span>
                    {user.phone && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-400 font-mono text-[11px] truncate">{user.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-0.5 shrink-0">
              {user.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => setAdminProfileExpanded(!adminProfileExpanded)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  title={adminProfileExpanded ? 'بستن منوی پروفایل' : 'باز کردن منوی پروفایل'}
                  aria-label="تغییر وضعیت نمایش منوی پروفایل"
                >
                  {adminProfileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                title="جمع کردن سایدبار"
                aria-label="جمع کردن سایدبار"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Profile Submenu on Desktop */}
          {user.role === 'ADMIN' && adminProfileExpanded && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 animate-fade-in">
              <NavLink
                to="/admin/profile?tab=profile"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${
                  isProfilePage && currentTab === 'profile'
                    ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-2 border-sky-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400 transition-transform group-hover:scale-110" />
                <span>مشخصات و اطلاعات</span>
              </NavLink>

              <NavLink
                to="/admin/profile?tab=settings"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${
                  (isProfilePage && currentTab === 'settings') || location.pathname.startsWith('/admin/settings')
                    ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-2 border-sky-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400 transition-transform group-hover:scale-110" />
                <span>تنظیمات آموزشگاه</span>
              </NavLink>

              <NavLink
                to="/admin/profile?tab=users"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${
                  (isProfilePage && currentTab === 'users') || location.pathname.startsWith('/admin/security')
                    ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-2 border-sky-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400 transition-transform group-hover:scale-110" />
                <span>کاربران و امنیت</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Compact View on tablet or when collapsed */}
        <div
          className={`p-2.5 flex-col items-center gap-2 ${
            collapsed ? 'flex' : 'flex xl:hidden'
          }`}
        >
          <div className="relative group flex justify-center">
            {user.role === 'ADMIN' ? (
              <NavLink
                to="/admin/profile"
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs hover:ring-2 hover:ring-sky-400 transition-all cursor-pointer"
                title={`${user.full_name || 'مدیر'} (پروفایل مدیر)`}
              >
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </NavLink>
            ) : (
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${roleGradients[user.role] || 'from-sky-600 to-cyan-500'} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs hover:ring-2 hover:ring-sky-400 transition-all cursor-default`}
                title={`${user.full_name || 'کاربر'} (${roleTitles[user.role] || ''})`}
              >
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
            )}

            {/* Tooltip in icon-only mode */}
            <div
              role="tooltip"
              className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 backdrop-blur-xs"
            >
              <div className="font-bold">{user.full_name}</div>
              <div className="text-[11px] text-sky-400">{roleTitles[user.role] || 'کاربر سیستم'}</div>
              {user.phone && <div className="text-[10px] text-slate-400 font-mono">{user.phone}</div>}
              {user.role === 'ADMIN' && (
                <div className="text-[10px] text-slate-300 border-t border-slate-700/60 mt-1 pt-0.5">
                  کلیک برای صفحه پروفایل
                </div>
              )}
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-slate-900/95 dark:border-l-slate-800/95" />
            </div>
          </div>

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
    <nav className="space-y-3">
      {activeNavigationGroups.map((grp, gIdx) => (
        <div key={gIdx} className="space-y-1">
          {/* Section Group Title: shown on mobile and on desktop xl (when not collapsed), hidden on tablet */}
          {grp.groupTitle && (
            <div
              className={`px-3 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5 ${
                isMobile ? 'block' : collapsed ? 'hidden' : 'hidden xl:block'
              }`}
            >
              {grp.groupTitle}
            </div>
          )}

          {/* Group Divider in icon-only mode (tablet or collapsed desktop) */}
          {gIdx > 0 && !isMobile && (
            <div
              className={`h-px bg-slate-100 dark:bg-slate-800 my-2 mx-1.5 ${
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
                  `relative flex items-center rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-3 border-sky-600 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  } ${
                    isMobile
                      ? 'justify-between px-3.5 py-2.5 w-full'
                      : collapsed
                      ? 'justify-center px-2 py-2.5 w-full'
                      : 'justify-center xl:justify-between px-2 xl:px-3.5 py-2.5 w-full'
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
                        className={`absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shadow-xs ${
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
                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 shadow-2xs ${
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
                    className={`absolute right-full mr-2.5 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 backdrop-blur-xs ${
                      collapsed ? 'block' : 'block xl:hidden'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="mr-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
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
    <div className="shrink-0 p-2.5 xl:p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <button
        type="button"
        onClick={() => handleLogout(isMobile)}
        className={`w-full flex items-center justify-center rounded-xl text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 transition-colors shadow-2xs cursor-pointer group relative ${
          isMobile
            ? 'gap-2 px-3.5 py-2.5'
            : collapsed
            ? 'p-2.5'
            : 'p-2.5 xl:px-3.5 xl:py-2.5 xl:gap-2'
        }`}
        title="خروج از حساب کاربری"
        aria-label="خروج از حساب کاربری"
      >
        <LogOut className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110" />
        <span className={isMobile ? 'inline' : collapsed ? 'hidden' : 'hidden xl:inline'}>
          خروج از حساب
        </span>

        {/* Tooltip in icon-only mode */}
        {!isMobile && (
          <div
            role="tooltip"
            className={`absolute right-full mr-2.5 px-2.5 py-1.5 bg-rose-950 text-white text-xs font-semibold rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 backdrop-blur-xs ${
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
      {/* Docked Sidebar (Icon-only on tablet w-20, full w-64 on desktop xl or collapsible) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 sticky top-16 h-[calc(100vh-4rem)] transition-all duration-200 overflow-hidden ${
          collapsed ? 'w-20' : 'w-20 xl:w-64'
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
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-start" dir="rtl">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full flex flex-col justify-between shadow-2xl z-10 overflow-hidden animate-slide-in-right">
            {/* Fixed Top User Profile with Close Button */}
            {renderTopProfile(true)}

            {/* Scrollable Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3">
              {renderNavSection(true)}
            </div>

            {/* Fixed Mobile Bottom Section */}
            {renderBottomSection(true)}
          </div>
        </div>
      )}
    </>
  );
};
