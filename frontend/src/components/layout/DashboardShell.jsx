import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Menu, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DashboardShell = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const roleTitles = {
    ADMIN: 'مدیریت آموزشگاه',
    SUPERVISOR: 'ناظر فنی سامانه',
    COACH: 'پنل مربیان',
    SWIMMER: 'پرتال شناگر',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Mobile Top Action Bar for Quick Sidebar Access */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200/90 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold transition-colors border border-sky-100"
          aria-label="مشاهده منوی ناوبری"
        >
          <Menu className="w-4 h-4" />
          <span>منوی بخش‌ها</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>{user ? (roleTitles[user.role] || user.role) : 'پنل کاربر'}</span>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
