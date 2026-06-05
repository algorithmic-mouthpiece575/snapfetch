/**
 * Single input field + "Analyze" button.
 *
 * Product guiding principle: one input, invisible detection. The component
 * bubbles the submitted URL up to the parent; it also shows a platform badge
 * guessed in real time (UX convenience, not authoritative).
 */

import { useState, type FormEvent } from "react";
import { detectPlatform } from "../lib/detectPlatform";
import { PlatformBadge } from "./PlatformBadge";
import { useTranslation } from "../i18n/context";

interface Props {
  /** Called when the user submits a non-empty URL. */
  onSubmit: (url: string) => void;
  /** Disables the form while a resolution is in progress. */
  loading: boolean;
}

export function UrlForm({ onSubmit, loading }: Props) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");

  // Instant local detection to show the badge while typing.
  const detected = detectPlatform(url);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed && !loading) onSubmit(trimmed);
  }

  return (
    <form className="url-form" onSubmit={handleSubmit}>
      <div className="url-form__field">
        <input
          type="url"
          className="url-form__input"
          placeholder={t.form.placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          autoFocus
          aria-label={t.form.ariaLabel}
        />
        {detected && <PlatformBadge platform={detected} />}
      </div>
      <button
        type="submit"
        className="url-form__submit"
        disabled={loading || url.trim() === ""}
      >
        {loading ? t.form.analyzing : t.form.analyze}
      </button>
    </form>
  );
}
