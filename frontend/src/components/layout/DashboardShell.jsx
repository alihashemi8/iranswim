import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

export const DashboardShell = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors" dir="rtl">
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} isFullWidth={true} />

      <div className="flex flex-row flex-1 w-full" dir="rtl">
        {/* Right-docked Sidebar (Icon-only on tablet, full/collapsible on desktop) */}
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Main Workspace Content */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto overflow-x-hidden w-full min-w-0" dir="rtl">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};
