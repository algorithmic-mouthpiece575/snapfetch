/**
 * "Star the project on GitHub" button + star counter.
 *
 * The repository is configurable via the `VITE_GITHUB_REPO` environment
 * variable (`owner/repo` format). Until it is set, the button shows but without
 * a counter; once configured, the star count is fetched live from GitHub's
 * public API.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "../i18n/context";

/** Target repository as `owner/repo`, empty if not configured. */
const GITHUB_REPO: string = (import.meta.env.VITE_GITHUB_REPO ?? "").trim();

export function GitHubStarButton() {
  const { t } = useTranslation();
  const [stars, setStars] = useState<number | null>(null);

  const repoUrl = GITHUB_REPO
    ? `https://github.com/${GITHUB_REPO}`
    : "https://github.com";

  useEffect(() => {
    if (!GITHUB_REPO) return;

    // `active` avoids updating state if the component is unmounted.
    let active = true;
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { stargazers_count?: number }) => {
        if (active && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {
        // Silent failure: keep the button, simply without a counter.
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <a
      className="gh-star"
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.github.ariaLabel}
    >
      {/* Logo GitHub */}
      <svg
        className="gh-star__logo"
        viewBox="0 0 16 16"
        width="18"
        height="18"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>

      <span className="gh-star__label">{t.github.star}</span>

      {stars !== null && (
        <span className="gh-star__count">
          {/* Star */}
          <svg
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 .25l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.6l-4.12 2.17.79-4.6L1.33 5.1l4.61-.67L8 .25z" />
          </svg>
          {formatStars(stars)}
        </span>
      )}
    </a>
  );
}

/** Formats a star count (1234 → "1.2k"). */
function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
