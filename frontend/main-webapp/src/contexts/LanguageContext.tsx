import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import viMessages from "../locales/vi.json";

export type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { dbUser, isLoading } = useAuth();

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("onfis_language");
    return (saved === "vi" || saved === "en") ? saved : "en";
  });

  // Sync language from backend once auth resolves
  useEffect(() => {
    if (!isLoading && dbUser?.language) {
      const serverLang: Language = dbUser.language === "vi" ? "vi" : "en";
      setLanguageState(serverLang);
      localStorage.setItem("onfis_language", serverLang);
    }
  }, [isLoading, dbUser?.language]);

  const setLanguage = (lang: Language): void => {
    setLanguageState(lang);
    localStorage.setItem("onfis_language", lang);
    // Persist to backend (fire-and-forget)
    void api.put("/users/me/profile", { language: lang }).catch((err: unknown) => {
      console.warn("Failed to save language preference:", err);
    });
  };

  const t = (key: string): string => {
    if (language === "en") return key;
    return (viMessages as Record<string, string>)[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
