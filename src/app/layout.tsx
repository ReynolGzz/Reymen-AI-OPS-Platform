import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { cookies } from "next/headers";
import { PreferencesProvider } from "@/context/preferences";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reymen AI Ops Platform",
  description: "Automatización inteligente para hacer crecer tu negocio.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read from cookies so the server-rendered HTML always matches what the client expects.
  // This avoids the hydration mismatch caused by useState reading localStorage.
  const store = await cookies();
  const initialLang = store.get("reymen-lang")?.value === "en" ? "en" : "es";
  const initialTheme = store.get("reymen-theme")?.value === "dark" ? "dark" : "light";

  return (
    <html lang={initialLang} className={initialTheme === "dark" ? "dark" : ""}>
      <body className={`${inter.className} antialiased bg-slate-50`}>
        <SessionProvider>
          <PreferencesProvider initialTheme={initialTheme} initialLang={initialLang}>
            {children}
            <Toaster position="top-right" richColors />
          </PreferencesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
