import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../utils/i18n';

interface PortalSettingsContextType {
  language: Language;
  toggleLanguage: () => void;
  t: typeof translations['en'];
  fontSize: 'sm' | 'md' | 'lg';
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const PortalSettingsContext = createContext<PortalSettingsContextType | null>(null);

export const PortalSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('trustseat_theme');
    if (saved) return saved === 'dark';
    return true; // Default to Matte Charcoal Dark Mode per design system
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('trustseat_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('trustseat_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    document.body.className = `font-${fontSize} ${highContrast ? 'high-contrast' : ''}`;
  }, [fontSize, highContrast]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const t = translations[language];

  return (
    <PortalSettingsContext.Provider
      value={{
        language,
        toggleLanguage,
        t,
        fontSize,
        setFontSize,
        highContrast,
        toggleHighContrast,
        isDark,
        toggleTheme
      }}
    >
      {children}
    </PortalSettingsContext.Provider>
  );
};

export const usePortalSettings = () => {
  const context = useContext(PortalSettingsContext);
  if (!context) throw new Error('usePortalSettings must be used within PortalSettingsProvider');
  return context;
};
