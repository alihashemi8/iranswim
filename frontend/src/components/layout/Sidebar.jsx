import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity, Bug, ShieldCheck, Zap,
  LayoutDashboard, BookOpen, Users, CreditCard, Calendar,
  ClipboardCheck, Award, Trophy, Newspaper, Bell, BarChart3,
  Sliders, ShieldAlert, UserCheck, X, LogOut, ChevronLeft, ChevronRight,
  Waves
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);

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

  // Admin Grouped Navigation
  const adminGroups = [
    {
      groupTitle: 'پیشخوان',
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
    {
      groupTitle: 'سیستم و امنیت',
      items: [
        { to: '/admin/settings', label: 'تنظیمات آموزشگاه', icon: Sliders },
        { to: '/admin/security', label: 'کاربران و امنیت', icon: ShieldAlert },
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
  let panelSubtitle = '';
  if (role === 'ADMIN') {
    activeNavigationGroups = adminGroups;
    panelSubtitle = 'پنل مدیریت آموزشگاه';
  } else if (role === 'SUPERVISOR') {
    activeNavigationGroups = supervisorGroups;
    panelSubtitle = 'پنل ناظر فنی سامانه';
  } else if (role === 'COACH') {
    activeNavigationGroups = coachGroups;
    panelSubtitle = 'پنل مربیان آکادمی';
  } else if (role === 'SWIMMER') {
    activeNavigationGroups = swimmerGroups;
    panelSubtitle = 'پرتال شناگر';
  }

  const renderNavSection = (isMobile = false) => (
    <nav className="space-y-4">
      {activeNavigationGroups.map((grp, gIdx) => (
        <div key={gIdx} className="space-y-1">
          {(!collapsed || isMobile) && (
            <div className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              {grp.groupTitle}
            </div>
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
                title={collapsed && !isMobile ? link.label : undefined}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border-r-3 border-sky-600 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{link.label}</span>
                  )}
                </div>

                {(!collapsed || isMobile) && link.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 shadow-2xs ${link.badgeColor || 'bg-sky-600 text-white'}`}
                  >
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const renderBottomSection = (isMobile = false) => (
    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
      {/* User Info Card */}
      {(!collapsed || isMobile) && (
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {user.full_name ? user.full_name.charAt(0) : 'U'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {user.full_name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate">
              {user.phone}
            </span>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        type="button"
        onClick={() => {
          logout();
          toast.info('با موفقیت از حساب کاربری خارج شدید.');
          navigate('/login');
          if (isMobile) onClose();
        }}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 transition-colors shadow-2xs cursor-pointer"
        title="خروج از حساب کاربری"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        {(!collapsed || isMobile) && <span>خروج از حساب</span>}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Right-aligned, 260px wide or collapsible) */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-3 transition-all duration-200 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Header Panel Title */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                    {panelSubtitle}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    IranSwim v1.0
                  </span>
                </div>
              </div>
            )}

            {/* Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-auto"
              title={collapsed ? 'گسترش سایدبار' : 'جمع کردن سایدبار'}
            >
              {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items */}
          {renderNavSection(false)}
        </div>

        {/* Footer User Info */}
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
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto animate-slide-in-right">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {panelSubtitle}
                    </span>
                    <span className="text-[10px] text-slate-400">IranSwim Portal</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              {renderNavSection(true)}
            </div>

            {/* Mobile Bottom Section */}
            {renderBottomSection(true)}
          </div>
        </div>
      )}
    </>
  );
};
