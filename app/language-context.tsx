"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "ar" | "en";

type LanguageContextValue = {
  language: Language;
  arabic: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "mashhour-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  // Read saved preference once on first mount (client only).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") setLanguageState(stored);
  }, []);

  // Keep <html lang dir> in sync so RTL/LTR styling follows the chosen language everywhere.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const toggleLanguage = () => setLanguage(language === "ar" ? "en" : "ar");

  return (
    <LanguageContext.Provider value={{ language, arabic: language === "ar", setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return context;
}
