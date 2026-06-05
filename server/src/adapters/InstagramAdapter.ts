/**
 * Instagram adapter (Reels, video posts).
 *
 * Instagram usually exposes few resolution variants; the default behavior is
 * enough. HD threshold at 720p, consistent with Reels.
 */

import { MediaAdapter } from "./MediaAdapter";
import type { Platform } from "../types/media";

export class InstagramAdapter extends MediaAdapter {
  readonly platform: Platform = "instagram";
  protected readonly hdMinHeight: number = 720;
}
