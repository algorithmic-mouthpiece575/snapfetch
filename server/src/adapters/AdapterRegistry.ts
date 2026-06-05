/**
 * Adapter registry: maps each `Platform` to its instance.
 *
 * Central extension point: to add a platform, register its adapter here. The
 * services query the registry without knowing the concrete classes (loose
 * coupling).
 */

import type { Platform } from "../types/media";
import type { YtDlp } from "../lib/YtDlp";
import { MediaAdapter } from "./MediaAdapter";
import { TikTokAdapter } from "./TikTokAdapter";
import { TwitterAdapter } from "./TwitterAdapter";
import { InstagramAdapter } from "./InstagramAdapter";
import { YouTubeAdapter } from "./YouTubeAdapter";

export class AdapterRegistry {
  private readonly adapters: Map<Platform, MediaAdapter>;

  /**
   * Instantiates every adapter, injecting the shared yt-dlp wrapper. They are
   * created once at startup and reused.
   */
  constructor(ytdlp: YtDlp) {
    this.adapters = new Map<Platform, MediaAdapter>([
      ["tiktok", new TikTokAdapter(ytdlp)],
      ["twitter", new TwitterAdapter(ytdlp)],
      ["instagram", new InstagramAdapter(ytdlp)],
      ["youtube", new YouTubeAdapter(ytdlp)],
    ]);
  }

  /**
   * Returns the adapter for a platform.
   * @returns the adapter, or `undefined` if not registered.
   */
  get(platform: Platform): MediaAdapter | undefined {
    return this.adapters.get(platform);
  }
}
