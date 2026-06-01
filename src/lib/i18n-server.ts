import { cookies } from "next/headers";
import { strings } from "./i18n";
import type { Lang, Strings } from "./i18n";

export async function getServerLang(): Promise<Lang> {
  try {
    const store = await cookies();
    const lang = store.get("reymen-lang")?.value;
    if (lang === "en") return "en";
  } catch {
    // Outside request context (static generation, etc.)
  }
  return "es";
}

export async function getServerT(): Promise<Strings> {
  const lang = await getServerLang();
  return strings[lang];
}
