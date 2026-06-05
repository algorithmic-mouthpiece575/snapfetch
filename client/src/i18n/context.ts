/**
 * i18n context and access hook — kept separate from the `I18nProvider`
 * component to honor the "a component file only exports components" rule
 * (Fast Refresh).
 */

import { createContext, useContext } from "react";
import type { Lang, Translation } from "./translations";

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Dictionary for the current language. */
  t: Translation;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

/** Access to the current language and translations. */
export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an <I18nProvider>.");
  }
  return ctx;
}
