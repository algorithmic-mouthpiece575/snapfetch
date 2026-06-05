/**
 * TikTok adapter.
 *
 * TikTok videos rarely exceed 1080p, so we lower the "HD" threshold to 720p so
 * the user always has a real HD / standard choice.
 */

import { MediaAdapter } from "./MediaAdapter";
import type { Platform } from "../types/media";

export class TikTokAdapter extends MediaAdapter {
  readonly platform: Platform = "tiktok";
  protected readonly hdMinHeight: number = 720;
}
