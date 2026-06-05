/**
 * YouTube adapter.
 *
 * YouTube often splits video and audio into separate streams (DASH formats);
 * audio merging is handled generically by the base class
 * ({@link MediaAdapter.toFormat}). Here we only cap the quality.
 */

import { MediaAdapter } from "./MediaAdapter";
import type { Platform } from "../types/media";

export class YouTubeAdapter extends MediaAdapter {
  readonly platform: Platform = "youtube";
  protected readonly hdMinHeight: number = 1080;
  // Cap at 1080p: beyond that (1440p/4K) files balloon (often > 1 GB in VP9)
  // and preparation takes too long. 1080p is still "HD" and yields a real
  // H.264 mp4 that plays everywhere, ready in ~30s.
  protected readonly maxHeight: number = 1080;
}
