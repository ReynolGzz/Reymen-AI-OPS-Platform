"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { updatePreferences } from "@/actions/profile";

export type Theme = "light" | "dark";
export type Lang = "es" | "en";

const strings = {
  es: {
    dashboard: "Dashboard",
    leads: "Leads",
    automations: "Automatizaciones",
    whatsapp: "WhatsApp AI",
    conversations: "Conversaciones",
    knowledgeBase: "Base de Conocimiento",
    prompts: "Prompts",
    appointments: "Citas",
    reports: "Reportes",
    templates: "Templates",
    requests: "Solicitudes",
    settings: "Configuración",
    signOut: "Cerrar sesión",
    notifications: "Notificaciones",
    noNotifications: "Sin notificaciones",
    myProfile: "Mi Perfil",
    changeAvatar: "Cambiar avatar",
    preferences: "Preferencias",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    language: "Idioma",
    changePassword: "Cambiar contraseña",
    switchAccount: "Cambiar de cuenta",
    changeAvatarTitle: "Cambiar Avatar",
    imageUrl: "URL de la imagen",
    save: "Guardar",
    cancel: "Cancelar",
    changePasswordTitle: "Cambiar Contraseña",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    orgLogoTitle: "Logo de la Organización",
    logoUrl: "URL del logotipo",
    removeLogo: "Eliminar logo",
    clickToChangeLogo: "Clic para cambiar logo",
    currentAccount: "Cuenta actual",
    switchAccountInfo: "Para usar otra cuenta, cierra sesión e inicia con otras credenciales.",
    close: "Cerrar",
    saving: "Guardando...",
    aiOps: "AI Ops",
    success: "¡Listo!",
    error: "Error",
  },
  en: {
    dashboard: "Dashboard",
    leads: "Leads",
    automations: "Automations",
    whatsapp: "WhatsApp AI",
    conversations: "Conversations",
    knowledgeBase: "Knowledge Base",
    prompts: "Prompts",
    appointments: "Appointments",
    reports: "Reports",
    templates: "Templates",
    requests: "Requests",
    settings: "Settings",
    signOut: "Sign out",
    notifications: "Notifications",
    noNotifications: "No notifications",
    myProfile: "My Profile",
    changeAvatar: "Change avatar",
    preferences: "Preferences",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    language: "Language",
    changePassword: "Change password",
    switchAccount: "Switch account",
    changeAvatarTitle: "Change Avatar",
    imageUrl: "Image URL",
    save: "Save",
    cancel: "Cancel",
    changePasswordTitle: "Change Password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    orgLogoTitle: "Organization Logo",
    logoUrl: "Logo URL",
    removeLogo: "Remove logo",
    clickToChangeLogo: "Click to change logo",
    currentAccount: "Current account",
    switchAccountInfo: "To use a different account, sign out and sign in with other credentials.",
    close: "Close",
    saving: "Saving...",
    aiOps: "AI Ops",
    success: "Done!",
    error: "Error",
  },
} as const;

export type Strings = Record<keyof (typeof strings)["es"], string>;

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
