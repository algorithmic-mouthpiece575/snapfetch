/**
 * Types mirroring the backend (see `server/src/types/media.ts`).
 *
 * They must stay strictly in sync with the server's copy: this is the API
 * contract consumed by the frontend.
 */

export type Platform = "tiktok" | "twitter" | "instagram" | "youtube";

export type Quality = "hd" | "standard";

export interface Format {
  id: string;
  quality: Quality;
  ext: string;
  hasAudio: boolean;
  sizeBytes?: number;
  width?: number;
  height?: number;
  label?: string;
}

export interface MediaInfo {
  platform: Platform;
  title: string;
  author: string;
  thumbnail: string;
  durationSec?: number;
  formats: Format[];
}

/** Shape of a normalized error response returned by the API. */
export interface ApiError {
  code: string;
  message: string;
}
