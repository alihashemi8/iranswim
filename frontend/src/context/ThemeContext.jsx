import React, { createContext, useContext, useLayoutEffect } from 'react';

const ThemeContext = createContext({ theme: 'light' });

export const ThemeProvider = ({ children }) => {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    try {
      localStorage.setItem('iranswim_theme', 'light');
    } catch {
      // The app remains light even when browser storage is unavailable.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
