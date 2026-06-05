/**
 * Loading and validating the environment configuration.
 *
 * Reading `process.env` is centralized here so the rest of the code works with
 * a typed, immutable `config` object rather than scattered, unvalidated access
 * to environment variables.
 */

/** Reads an integer environment variable with a fallback. */
function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Reads a string environment variable with a fallback. */
function readString(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw === undefined || raw.trim() === "" ? fallback : raw;
}

/**
 * Application configuration, frozen at startup.
 * `as const` guarantees immutability at the type level.
 */
export const config = {
  port: readInt("PORT", 3001),
  clientOrigin: readString("CLIENT_ORIGIN", "http://localhost:5173"),
  ytdlpPath: readString("YTDLP_PATH", "yt-dlp"),
  resolveTimeoutMs: readInt("RESOLVE_TIMEOUT_MS", 20000),
  downloadTimeoutMs: readInt("DOWNLOAD_TIMEOUT_MS", 600000),
  // yt-dlp authentication for platforms requiring a logged-in session
  // (Instagram, sometimes X). Optional: leave empty if unused.
  // - cookiesFromBrowser: browser name (firefox, chrome, chromium, brave…)
  // - cookiesFile: path to a Netscape-format cookies file.
  cookiesFromBrowser: readString("YTDLP_COOKIES_FROM_BROWSER", ""),
  cookiesFile: readString("YTDLP_COOKIES_FILE", ""),
  rateLimit: {
    windowMs: readInt("RATE_LIMIT_WINDOW_MS", 60_000),
    max: readInt("RATE_LIMIT_MAX", 30),
  },
} as const;

export type AppConfig = typeof config;
