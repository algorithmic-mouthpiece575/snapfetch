/**
 * Small formatting helpers for display (duration, size, labels).
 * Pure and dependency-free — easy to test.
 */

import type { Platform } from "../types/media";

/** Formats a duration in seconds to `m:ss` or `h:mm:ss`. */
export function formatDuration(totalSec?: number): string {
  if (totalSec === undefined || !Number.isFinite(totalSec)) return "";
  const s = Math.floor(totalSec % 60);
  const m = Math.floor((totalSec / 60) % 60);
  const h = Math.floor(totalSec / 3600);
  const mm = m.toString().padStart(h > 0 ? 2 : 1, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Formats a size in bytes to a readable unit (KB, MB, GB). */
export function formatSize(bytes?: number): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Human-readable label for a platform. */
export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  twitter: "Twitter / X",
  instagram: "Instagram",
  youtube: "YouTube",
};
