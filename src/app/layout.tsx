import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { PreferencesProvider } from "@/context/preferences";
import { auth } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reymen AI Ops Platform",
  description: "Automatización inteligente para hacer crecer tu negocio.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);

  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-slate-50`}>
        <SessionProvider>
          <PreferencesProvider
            initialTheme={session?.user?.theme}
            initialLang={session?.user?.language}
          >
            {children}
            <Toaster position="top-right" richColors />
          </PreferencesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
