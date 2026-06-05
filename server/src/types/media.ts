/**
 * Shared types describing a media item and its formats.
 *
 * These types form the "contract" exchanged between the backend and the
 * frontend: they must stay strictly aligned with the client's copy.
 */

/** Platforms supported by SnapFetch (detected from the URL only). */
export type Platform = "tiktok" | "twitter" | "instagram" | "youtube";

/** Normalized format quality, exposed to the end user. */
export type Quality = "hd" | "standard";

/**
 * A concrete downloadable format, derived from a raw yt-dlp format.
 * `id` maps to the yt-dlp `format_id` and is the key used for downloading.
 */
export interface Format {
  id: string;
  quality: Quality;
  ext: string; // container: mp4, webm, ...
  hasAudio: boolean;
  sizeBytes?: number; // estimated size when known
  width?: number;
  height?: number;
  label?: string; // human-readable label (e.g. "1080p"), handy in the UI
}

/**
 * Media metadata + the list of offered formats.
 * Returned as-is by `POST /api/resolve`.
 */
export interface MediaInfo {
  platform: Platform;
  title: string;
  author: string;
  thumbnail: string;
  durationSec?: number;
  formats: Format[]; // at least one HD + one standard when available
}
