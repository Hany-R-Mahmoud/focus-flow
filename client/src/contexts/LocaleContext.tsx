import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { languageLabels, translate, type Language } from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "focusflow_language";

interface LocaleContextValue {
  language: Language;
  languageLabels: typeof languageLabels;
  setLanguage: (language: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "ar") return stored;
  } catch {
    // Local storage is optional; the browser language is a safe fallback.
  }

  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language === "ar" ? "ar" : "en";
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Language selection still applies for this session if storage is blocked.
    }
  }, [language]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      languageLabels,
      setLanguage,
      t: (key, variables) => translate(language, key, variables),
    }),
    [language]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
