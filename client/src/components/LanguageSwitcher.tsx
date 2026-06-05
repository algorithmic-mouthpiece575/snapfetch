/**
 * Segmented language switcher (EN / FR).
 * Shown to the left of the GitHub button in the top bar.
 */

import { useTranslation } from "../i18n/context";
import { LANGS, LANG_LABELS } from "../i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useTranslation();

  return (
    <div
      className="lang-switch"
      role="group"
      aria-label={t.language.ariaLabel}
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-switch__btn${
            code === lang ? " lang-switch__btn--active" : ""
          }`}
          aria-pressed={code === lang}
          onClick={() => setLang(code)}
        >
          {LANG_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
