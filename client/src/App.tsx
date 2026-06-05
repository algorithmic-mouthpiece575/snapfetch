/**
 * SnapFetch root component.
 *
 * Orchestrates the user journey:
 *   URL input → resolution → preview → HD/standard download.
 * State (resolved media, loading, error) is managed locally; network calls are
 * delegated to `lib/api`.
 */

import { useState } from "react";
import { UrlForm } from "./components/UrlForm";
import { MediaPreview } from "./components/MediaPreview";
import { GitHubStarButton } from "./components/GitHubStarButton";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useTranslation } from "./i18n/context";
import {
  resolveMedia,
  downloadMedia,
  ApiRequestError,
  type DownloadPhase,
} from "./lib/api";
import type { Format, MediaInfo } from "./types/media";
import "./App.css";

/** State of an in-progress download, shared with the preview for display. */
export interface DownloadStatus {
  format: Format;
  phase: DownloadPhase;
  received: number;
  total: number | null;
}

function App() {
  const { t } = useTranslation();
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // In-progress download (phase + progress), or null if none.
  const [download, setDownload] = useState<DownloadStatus | null>(null);
  // Bumped on each reset to remount the form (clears the input field).
  const [formKey, setFormKey] = useState(0);

  /** Step 1: resolve the URL into metadata + formats. */
  async function handleResolve(url: string) {
    setLoading(true);
    setError(null);
    setMedia(null);
    setCurrentUrl(url);
    try {
      const info = await resolveMedia(url);
      setMedia(info);
    } catch (err) {
      setError(messageFromError(err, t.errors.network));
    } finally {
      setLoading(false);
    }
  }

  /** Step 2: download the chosen format (HD or standard), with tracking. */
  async function handleDownload(format: Format) {
    if (!media || download) return;
    setError(null);
    setDownload({ format, phase: "preparing", received: 0, total: null });

    try {
      await downloadMedia(currentUrl, format.id, buildBaseName(media), {
        // Update the state across phases to animate the right button.
        onPhase: (phase) =>
          setDownload((d) => (d ? { ...d, phase } : d)),
        onProgress: (received, total) =>
          setDownload((d) => (d ? { ...d, received, total } : d)),
      });
    } catch (err) {
      setError(messageFromError(err, t.errors.network));
    } finally {
      setDownload(null);
    }
  }

  /** Resets everything to start over with a new link (input field cleared). */
  function handleReset() {
    if (download) return; // do not interrupt an in-progress download
    setMedia(null);
    setError(null);
    setCurrentUrl("");
    setFormKey((k) => k + 1); // remount UrlForm → empty field + focus
  }

  return (
    <main className="app">
      <div className="app__topbar">
        <LanguageSwitcher />
        <GitHubStarButton />
      </div>

      <header className="app__header">
        <h1 className="app__logo">
          Snap<span>Fetch</span>
        </h1>
        <p className="app__tagline">{t.tagline}</p>
      </header>

      <UrlForm key={formKey} onSubmit={handleResolve} loading={loading} />

      {error && (
        <div className="app__error" role="alert">
          {error}
        </div>
      )}

      {media && (
        <>
          <MediaPreview
            media={media}
            onDownload={handleDownload}
            download={download}
          />
          <button
            type="button"
            className="app__reset"
            onClick={handleReset}
            disabled={download !== null}
          >
            {t.newVideo}
          </button>
        </>
      )}

      <footer className="app__footer">{t.footer}</footer>
    </main>
  );
}

/**
 * Builds a base file name (without extension) from the title.
 * The real extension is added server-side based on the produced container.
 */
function buildBaseName(media: MediaInfo): string {
  return (
    media.title
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "snapfetch"
  );
}

/**
 * Converts an error into a readable message. Application errors already carry a
 * message returned by the backend; otherwise a translated network message
 * (`networkMessage`) is shown.
 */
function messageFromError(err: unknown, networkMessage: string): string {
  if (err instanceof ApiRequestError) {
    return err.message;
  }
  return networkMessage;
}

export default App;
