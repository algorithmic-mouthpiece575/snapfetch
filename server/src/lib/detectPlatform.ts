/**
 * Platform detection from the URL — the SINGLE source of truth.
 *
 * Per the project conventions, detection relies solely on the *hostname*
 * (no scraping, no network request). All of the host → platform mapping logic
 * lives here and nowhere else.
 */

import type { Platform } from "../types/media";

/** Maps each platform to the list of hostnames it recognizes. */
const PLATFORM_HOSTS: Record<Platform, string[]> = {
  tiktok: ["tiktok.com", "vm.tiktok.com"],
  twitter: ["twitter.com", "x.com", "t.co"],
  instagram: ["instagram.com", "instagr.am"],
  youtube: ["youtube.com", "youtu.be", "m.youtube.com"],
};

/**
 * Normalizes a hostname by stripping an optional `www.` prefix and
 * lowercasing it, for reliable comparisons.
 */
function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * Returns whether `host` matches `domain`, either exactly or as a subdomain
 * (e.g. `cdn.youtube.com` matches `youtube.com`).
 */
function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/**
 * Detects the platform of a URL.
 *
 * @returns the recognized `Platform`, or `null` if the URL is invalid or
 *          unsupported. No exception is thrown here: the caller decides whether
 *          to turn it into `AppError("UNSUPPORTED_PLATFORM")`.
 */
export function detectPlatform(rawUrl: string): Platform | null {
  let host: string;
  try {
    host = normalizeHost(new URL(rawUrl).hostname);
  } catch {
    // Unparseable URL → unsupported.
    return null;
  }

  for (const platform of Object.keys(PLATFORM_HOSTS) as Platform[]) {
    if (PLATFORM_HOSTS[platform].some((domain) => hostMatches(host, domain))) {
      return platform;
    }
  }
  return null;
}
