import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { Language, Translations } from './types';
import { vi } from './vi';
import { en } from './en';
import { LANGUAGE_KEY, detectInitialLanguage } from './detectLanguage';

export { detectInitialLanguage } from './detectLanguage';

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
  language: 'en',
  t: en,
  setLanguage: () => {},
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

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

/**
 * Ref luôn trỏ tới bản dịch của ngôn ngữ HIỆN TẠI, dùng trong callback memo hóa / timer / effect chạy một lần,
 * nơi đọc trực tiếp `t` sẽ bị đóng băng ở ngôn ngữ lúc tạo callback.
 */
export function useTranslationRef() {
  const { t } = useContext(LanguageContext);
  const ref = useRef<Translations>(t);
  ref.current = t;
  return ref;
}

/** Thay các placeholder dạng {name} trong chuỗi dịch, VD: formatMessage(t.store.buyButton, { price: '$19' }) */
export function formatMessage(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  );
}

/** Chọn dạng số ít hoặc số nhiều rồi thay {count}. Tiếng Anh: đúng 1 là số ít; tiếng Việt hai dạng giống nhau. */
export function pluralize(
  count: number,
  one: string,
  other: string,
  vars: Record<string, string | number> = {}
): string {
  return formatMessage(count === 1 ? one : other, { ...vars, count });
}

export * from './types';
