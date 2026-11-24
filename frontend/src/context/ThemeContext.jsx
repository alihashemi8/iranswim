import React, { createContext, useContext, useState, useLayoutEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export const isDashboardRoute = (pathname) => {
  if (!pathname) return false;
  return (
    pathname === '/admin' || pathname.startsWith('/admin/') ||
    pathname === '/female-admin' || pathname.startsWith('/female-admin/') ||
    pathname === '/coach' || pathname.startsWith('/coach/') ||
    pathname === '/supervisor' || pathname.startsWith('/supervisor/') ||
    pathname === '/swimmer' || pathname.startsWith('/swimmer/')
  );
};

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  isDashboard: false,
  isDarkMode: false,
});

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const locationPathname = location?.pathname || '/';
  const isDashboard = isDashboardRoute(locationPathname);

  // Panel/dashboard theme preference (default 'light')
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('iranswim_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Fallback if browser storage is not accessible
    }
    return 'light';
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    // The landing page and public pages MUST strictly remain in light mode!
    // In panels and dashboards, apply the user's selected theme (dark or light).
    if (isDashboard && theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDashboard, theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('iranswim_theme', next);
      } catch {
        // Storage unavailable
      }
      return next;
    });
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
      try {
        localStorage.setItem('iranswim_theme', newTheme);
      } catch {
        // Storage unavailable
      }
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDashboard,
        isDarkMode: isDashboard && theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
