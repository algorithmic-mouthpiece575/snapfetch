/**
 * Internationalization provider.
 *
 * Manages the current language (persisted in `localStorage`, English by
 * default) and provides the matching dictionary via context. The access hook
 * `useTranslation` lives in `./context`.
 */

import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LANG, translations, type Lang } from "./translations";
import { I18nContext } from "./context";

const STORAGE_KEY = "snapfetch.lang";

/** Reads the persisted language, or the default if missing/invalid. */
function readInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "fr" ? stored : DEFAULT_LANG;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  function setLang(next: Lang): void {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  // Keeps the <html lang> attribute up to date (accessibility / SEO).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}
