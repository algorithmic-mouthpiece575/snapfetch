/**
 * Client-side platform detection — ONLY for visual convenience (showing an
 * instant badge while typing).
 *
 * The AUTHORITATIVE detection stays on the server: we never send the platform
 * to the backend, which recomputes it from the URL itself.
 */

import type { Platform } from "../types/media";

const PLATFORM_HOSTS: Record<Platform, string[]> = {
  tiktok: ["tiktok.com"],
  twitter: ["twitter.com", "x.com", "t.co"],
  instagram: ["instagram.com", "instagr.am"],
  youtube: ["youtube.com", "youtu.be"],
};

/** Returns the platform guessed from the URL, or `null` if undetermined. */
export function detectPlatform(rawUrl: string): Platform | null {
  let host: string;
  try {
    host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  for (const platform of Object.keys(PLATFORM_HOSTS) as Platform[]) {
    if (
      PLATFORM_HOSTS[platform].some(
        (d) => host === d || host.endsWith(`.${d}`),
      )
    ) {
      return platform;
    }
  }
  return null;
}
