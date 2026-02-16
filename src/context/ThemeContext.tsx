import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateProfile } = useAuth();
  
  // Initialization from localStorage or default
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hmo-theme') as Theme;
      if (saved) return saved;
      // Default to dark
      return 'dark';
    }
    return 'dark';
  });

  // Apply theme class to <html>
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('hmo-theme', theme);
  }, [theme]);

  // Sync with Firestore preference change
  useEffect(() => {
    if (user?.preferences?.theme && user.preferences.theme !== theme) {
      setThemeState(user.preferences.theme);
    }
  }, [user?.preferences?.theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    // 1. Update React state immediately for instant UI response
    setThemeState(newTheme);
    
    // 2. Persist to Firestore as background task
    if (user) {
      updateProfile({
        preferences: {
          ...user.preferences,
          theme: newTheme
        }
      }).catch(err => {
        console.error("Theme persistence failed:", err);
      });
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (user) {
      updateProfile({
        preferences: {
          ...user.preferences,
          theme: newTheme
        }
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
