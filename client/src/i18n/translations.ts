/**
 * UI translation dictionaries (EN by default, FR).
 *
 * Only the UI text is translated — never the media data (title, author, etc.),
 * which stays as returned by the API.
 *
 * The `Translation` type is derived from the English dictionary: every other
 * language must therefore provide exactly the same keys (otherwise a TypeScript
 * error). The French dictionary stays in French — it is the locale data.
 */

export type Lang = "en" | "fr";

/** Application default language. */
export const DEFAULT_LANG: Lang = "en";

/** Available languages (display order in the switcher). */
export const LANGS: Lang[] = ["en", "fr"];

// No `as const`: we want `string` types (not literals) so other languages can
// provide their own strings.
const en = {
  tagline: "Paste a link. We detect the source, you download.",
  form: {
    placeholder: "Paste a TikTok, Twitter/X, Instagram or YouTube link…",
    ariaLabel: "Media link to download",
    analyze: "Analyze",
    analyzing: "Analyzing…",
  },
  preview: {
    hd: "Download in HD",
    standard: "Standard quality",
    preparing: "Preparing…",
    preparingSub: "Fetching your video",
    downloading: "Downloading…",
  },
  newVideo: "Download a new video",
  errors: {
    network: "Could not reach the server. Check your connection.",
  },
  footer:
    "SnapFetch is intended for downloading content you own the rights to or are authorized to download.",
  github: {
    star: "Give me a star",
    ariaLabel: "Give me a star on GitHub",
  },
  language: {
    ariaLabel: "Change language",
  },
};

/** Shape shared by every language. */
export type Translation = typeof en;

const fr: Translation = {
  tagline: "Collez un lien. On détecte la source, vous téléchargez.",
  form: {
    placeholder: "Collez un lien TikTok, Twitter/X, Instagram ou YouTube…",
    ariaLabel: "Lien du média à télécharger",
    analyze: "Analyser",
    analyzing: "Analyse…",
  },
  preview: {
    hd: "Télécharger en HD",
    standard: "Qualité standard",
    preparing: "Préparation…",
    preparingSub: "On récupère ta vidéo",
    downloading: "Téléchargement…",
  },
  newVideo: "Télécharger une nouvelle vidéo",
  errors: {
    network: "Impossible de contacter le serveur. Vérifiez votre connexion.",
  },
  footer:
    "SnapFetch est destiné au téléchargement de contenus dont vous détenez les droits ou dont le téléchargement est autorisé.",
  github: {
    star: "Star le projet",
    ariaLabel: "Mettre une étoile au projet sur GitHub",
  },
  language: {
    ariaLabel: "Changer de langue",
  },
};

/** Short language labels, for the switcher. */
export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  fr: "FR",
};

export const translations: Record<Lang, Translation> = { en, fr };
