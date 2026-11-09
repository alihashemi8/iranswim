import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { DashboardSkeleton } from '../common/Skeleton';

export const DashboardShell = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isCoachPanel = location.pathname.startsWith('/coach') || user?.role === 'COACH';

  useEffect(() => {
    if (isCoachPanel) {
      document.body.classList.add('coach-panel');
      document.body.setAttribute('data-panel', 'coach');

      // Convert any Persian/Arabic Unicode digits in text nodes to Latin/English digits
      const convertDigits = (node) => {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
          if (/[۰-۹٠-٩]/.test(node.nodeValue)) {
            node.nodeValue = node.nodeValue
              .replace(/[۰-۹]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 1728))
              .replace(/[٠-٩]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 1584));
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
          for (let child = node.firstChild; child; child = child.nextSibling) {
            convertDigits(child);
          }
        }
      };

      convertDigits(document.body);

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData') {
            convertDigits(mutation.target);
          } else if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((n) => convertDigits(n));
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
        document.body.classList.remove('coach-panel');
        document.body.removeAttribute('data-panel');
      };
    } else {
      document.body.classList.remove('coach-panel');
      document.body.removeAttribute('data-panel');
    }
  }, [isCoachPanel, location.pathname]);

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors ${
        isCoachPanel ? 'coach-panel' : ''
      }`}
      data-panel={isCoachPanel ? 'coach' : undefined}
      dir="rtl"
    >
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} isFullWidth={true} />

      <div className="flex flex-row flex-1 w-full" dir="rtl">
        {/* Right-docked Sidebar (Icon-only on tablet, full/collapsible on desktop) */}
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Main Workspace Content */}
        <main
          className={`flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto overflow-x-hidden w-full min-w-0 ${
            isCoachPanel ? 'coach-panel' : ''
          }`}
          dir="rtl"
        >
          <Suspense fallback={<DashboardSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};
