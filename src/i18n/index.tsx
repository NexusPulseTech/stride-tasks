import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Language, Translations } from './types';
import { vi } from './vi';
import { en } from './en';

const LANGUAGE_KEY = 'stride_tasks_language';

const translationsMap: Record<Language, Translations> = {
  vi,
  en,
};

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  t: vi,
  setLanguage: () => {},
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_KEY);
      if (stored === 'en' || stored === 'vi') return stored;
      // Phát hiện ngôn ngữ trình duyệt nếu chưa đặt
      if (typeof navigator !== 'undefined' && navigator.language?.startsWith('en')) {
        return 'en';
      }
    } catch (e) {}
    return 'vi';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  }, [language, setLanguage]);

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (e) {}
  }, [language]);

  const value = {
    language,
    t: translationsMap[language],
    setLanguage,
    toggleLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export * from './types';
