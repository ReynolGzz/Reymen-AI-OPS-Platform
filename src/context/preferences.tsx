"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { updatePreferences } from "@/actions/profile";
import { strings } from "@/lib/i18n";
import type { Lang, Strings } from "@/lib/i18n";

export type { Lang, Strings };
export type Theme = "light" | "dark";

interface PreferencesContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  theme: "light",
  setTheme: () => {},
  lang: "es",
  setLang: () => {},
  t: strings.es,
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function applyLang(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  // Also set cookie so server components can read the language
  document.cookie = `reymen-lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

interface PreferencesProviderProps {
  children: ReactNode;
  initialTheme?: string | null;
  initialLang?: string | null;
}

export function PreferencesProvider({ children, initialTheme, initialLang }: PreferencesProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reymen-theme");
      if (stored === "dark" || stored === "light") return stored;
    }
    if (initialTheme === "dark") return "dark";
    return "light";
  });

  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reymen-lang");
      if (stored === "en" || stored === "es") return stored;
    }
    if (initialLang === "en") return "en";
    return "es";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("reymen-theme", theme);
  }, [theme]);

  useEffect(() => {
    applyLang(lang);
    localStorage.setItem("reymen-lang", lang);
  }, [lang]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    updatePreferences({ theme: t }).catch(() => {});
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    updatePreferences({ language: l }).catch(() => {});
  }, []);

  const t = strings[lang];

  return (
    <PreferencesContext.Provider value={{ theme, setTheme, lang, setLang, t }}>
      {children}
    </PreferencesContext.Provider>
  );
}
