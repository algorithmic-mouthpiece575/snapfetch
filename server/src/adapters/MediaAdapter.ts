/**
 * Abstract base class for the platform adapters.
 *
 * Each platform (TikTok, Twitter, Instagram, YouTube) is represented by a
 * subclass. The shared logic — querying yt-dlp, turning raw formats into
 * `MediaInfo`, opening a download stream — is factored out here. Subclasses only
 * need to declare their `platform` and, if needed, refine the format mapping.
 *
 * Adding a fifth platform = create a subclass + register it in the registry,
 * without touching the rest of the code.
 */

import type { Format, MediaInfo, Platform, Quality } from "../types/media";
import type {
  DownloadedFile,
  YtDlp,
  YtDlpRawFormat,
  YtDlpRawInfo,
} from "../lib/YtDlp";
import { AppError } from "../errors/AppError";

export abstract class MediaAdapter {
  /** Platform handled by the adapter (set by each subclass). */
  abstract readonly platform: Platform;

  /**
   * Height threshold (in px) above which a format is considered "HD".
   * Overridable per platform (e.g. TikTok rarely goes 1080p+).
   */
  protected readonly hdMinHeight: number = 1080;

  /**
   * Maximum considered height (px). Caps the offered quality to avoid oversized
   * files and overly long preparation times (e.g. YouTube 4K in VP9 exceeds
   * 1 GB). `Infinity` = no cap.
   */
  protected readonly maxHeight: number = Infinity;

  /** Injects the shared yt-dlp dependency (a single reused wrapper). */
  constructor(protected readonly ytdlp: YtDlp) {}

  /**
   * Resolves a URL into metadata + normalized formats.
   * The default implementation is enough for most platforms; a subclass may
   * override it for specific behavior.
   */
  async resolve(url: string): Promise<MediaInfo> {
    const info = await this.ytdlp.getInfo(url);
    const formats = this.mapFormats(info.formats ?? []);

    if (formats.length === 0) {
      throw new AppError(
        "RESOLVE_FAILED",
        "No downloadable format found for this media.",
        422,
      );
    }

    return {
      platform: this.platform,
      title: info.title?.trim() || "Untitled",
      author: this.pickAuthor(info),
      thumbnail: info.thumbnail ?? "",
      durationSec: info.duration ?? undefined,
      formats,
    };
  }

  /**
   * Prepares the download of the requested format.
   * Delegates to the yt-dlp wrapper, which downloads to a temporary file (to
   * produce a valid container, including for merged formats) then exposes a
   * stream. The caller MUST invoke `cleanup()`.
   */
  download(url: string, formatId: string): Promise<DownloadedFile> {
    return this.ytdlp.downloadToFile(url, formatId);
  }

  /**
   * Turns raw yt-dlp formats into the `Format[]` exposed to the client.
   *
   * Strategy: keep only video tracks (under the height cap), deduplicate by
   * height keeping the MOST COMPATIBLE format (H.264 mp4 preferred, then AV1,
   * then VP9; at equal codec, the best bitrate), then select an "HD" and a
   * "standard" representative.
   *
   * Why favor compatibility over raw bitrate: at 2160p the VP9 variant can weigh
   * 1 GB (webm), whereas AV1/H.264 gives a real mp4 that is half the size and
   * plays everywhere — better for the user.
   */
  protected mapFormats(raw: YtDlpRawFormat[]): Format[] {
    // 1) Video tracks, under the configured height cap.
    const videoFormats = raw.filter(
      (f) =>
        this.hasVideo(f) &&
        !!f.format_id &&
        (f.height ?? 0) <= this.maxHeight,
    );

    // 2) Keep the best format per height according to the preference order.
    const bestByHeight = new Map<number, YtDlpRawFormat>();
    for (const f of videoFormats) {
      const h = f.height ?? 0;
      const current = bestByHeight.get(h);
      if (!current || this.isPreferred(f, current)) {
        bestByHeight.set(h, f);
      }
    }

    // 3) Sort by descending height (best quality first).
    const sorted = [...bestByHeight.values()].sort(
      (a, b) => (b.height ?? 0) - (a.height ?? 0),
    );
    if (sorted.length === 0) return [];

    // 4) Pick an HD candidate (the best one ≥ threshold) and a standard one.
    const hd = sorted.find((f) => (f.height ?? 0) >= this.hdMinHeight);
    const standard =
      [...sorted].reverse().find((f) => f !== hd) ?? sorted[sorted.length - 1];

    const chosen: Array<{ raw: YtDlpRawFormat; quality: Quality }> = [];
    if (hd) chosen.push({ raw: hd, quality: "hd" });
    if (standard && standard !== hd) {
      chosen.push({ raw: standard, quality: "standard" });
    }
    // Degenerate case: a single format available → expose it as-is.
    if (chosen.length === 0) {
      chosen.push({ raw: sorted[0], quality: this.classify(sorted[0]) });
    }

    return chosen.map(({ raw: f, quality }) => this.toFormat(f, quality));
  }

  /**
   * Converts a raw format + a decided quality into a public `Format`.
   *
   * If the video track is "silent" (video-only, audio in a separate track —
   * common on YouTube AND Twitter/X), we merge the best audio track via the
   * yt-dlp selector `id+bestaudio`. The `/id` fallback avoids a failure if the
   * video is genuinely silent (no audio track available).
   */
  protected toFormat(f: YtDlpRawFormat, quality: Quality): Format {
    const height = f.height ?? undefined;
    const videoOnly = !this.hasAudio(f);
    return {
      id: videoOnly ? `${f.format_id}+bestaudio/${f.format_id}` : f.format_id,
      quality,
      // After merging, the output container is forced to mp4 (see wrapper).
      ext: videoOnly ? "mp4" : f.ext,
      hasAudio: true,
      sizeBytes: f.filesize ?? f.filesize_approx ?? undefined,
      width: f.width ?? undefined,
      height,
      label: height ? `${height}p` : f.format_note,
    };
  }

  /** Classifies a single format as HD/standard based on the height threshold. */
  protected classify(f: YtDlpRawFormat): Quality {
    return (f.height ?? 0) >= this.hdMinHeight ? "hd" : "standard";
  }

  /** Picks the best available author label. */
  protected pickAuthor(info: YtDlpRawInfo): string {
    return (
      info.uploader?.trim() ||
      info.channel?.trim() ||
      info.uploader_id?.trim() ||
      "Unknown"
    );
  }

  protected hasVideo(f: YtDlpRawFormat): boolean {
    return f.vcodec !== undefined && f.vcodec !== "none";
  }

  protected hasAudio(f: YtDlpRawFormat): boolean {
    return f.acodec !== undefined && f.acodec !== "none";
  }

  /** Bitrate used as a tie-breaker (fallback: 0). */
  protected bitrate(f: YtDlpRawFormat): number {
    return f.tbr ?? 0;
  }

  /**
   * Is `candidate` preferable to `current` (at equal height)?
   * Order: most compatible codec, then fastest protocol (DASH https rather than
   * HLS/m3u8, often heavier and segmented), then best bitrate.
   */
  protected isPreferred(
    candidate: YtDlpRawFormat,
    current: YtDlpRawFormat,
  ): boolean {
    const rc = this.codecRank(candidate);
    const rr = this.codecRank(current);
    if (rc !== rr) return rc < rr; // lower rank = more compatible

    const pc = this.protocolRank(candidate);
    const pr = this.protocolRank(current);
    if (pc !== pr) return pc < pr; // https/DASH before HLS

    return this.bitrate(candidate) > this.bitrate(current);
  }

  /** Protocol rank (lower = preferred): https/DASH before HLS. */
  protected protocolRank(f: YtDlpRawFormat): number {
    const p = (f.protocol ?? "").toLowerCase();
    if (p.includes("m3u8") || p.includes("hls")) return 1;
    return 0;
  }

  /**
   * Compatibility rank of a video codec (lower = more universal).
   * H.264 (avc1) plays everywhere; AV1 is efficient and fits in mp4;
   * VP9 forces a webm/mkv container → less convenient.
   */
  protected codecRank(f: YtDlpRawFormat): number {
    const v = (f.vcodec ?? "").toLowerCase();
    if (v.startsWith("avc") || v.startsWith("h264")) return 0;
    if (v.startsWith("av01") || v.startsWith("av1")) return 1;
    if (v.startsWith("vp9") || v.startsWith("vp09")) return 2;
    return 3;
  }
}
