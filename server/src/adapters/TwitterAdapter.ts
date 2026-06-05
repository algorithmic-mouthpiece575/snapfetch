/**
 * Twitter / X adapter.
 *
 * Twitter videos are served as several HLS variants; the default format mapping
 * (best bitrate per height) works well. HD threshold at 720p.
 */

import { MediaAdapter } from "./MediaAdapter";
import type { Platform } from "../types/media";

export class TwitterAdapter extends MediaAdapter {
  readonly platform: Platform = "twitter";
  protected readonly hdMinHeight: number = 720;
}
