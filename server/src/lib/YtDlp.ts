/**
 * Object-oriented wrapper around the `yt-dlp` executable.
 *
 * SECURITY: every argument is passed to `spawn` as an **array** (never a
 * concatenated shell string), which eliminates any risk of argument injection
 * via the user URL. We never enable `shell: true`.
 *
 * This class knows nothing about platforms: it is a simple, reusable tool for
 * the adapters.
 */

import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import type { Readable } from "node:stream";
import { AppError } from "../errors/AppError";

/**
 * Partial shape of the JSON returned by `yt-dlp -J` (dump-single-json).
 * Only the fields actually consumed by the adapters are declared.
 */
export interface YtDlpRawFormat {
  format_id: string;
  ext: string;
  acodec?: string; // "none" if no audio
  vcodec?: string; // "none" if no video
  width?: number | null;
  height?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  format_note?: string;
  tbr?: number | null; // total bitrate, used as a tie-breaker
  protocol?: string; // "https", "m3u8_native", ... — affects speed
}

export interface YtDlpRawInfo {
  id: string;
  title?: string;
  uploader?: string;
  channel?: string;
  uploader_id?: string;
  thumbnail?: string;
  duration?: number | null;
  formats?: YtDlpRawFormat[];
}

export interface YtDlpOptions {
  /** Path to the executable (from the config). */
  binaryPath: string;
  /** Max execution time for metadata operations (resolution). */
  timeoutMs: number;
  /** Max execution time for a full download. */
  downloadTimeoutMs: number;
  /** Browser to read cookies from (e.g. "firefox"). Empty = disabled. */
  cookiesFromBrowser?: string;
  /** Path to a Netscape cookies file. Empty = disabled. */
  cookiesFile?: string;
}

/**
 * Temporary media file ready to be streamed to the client.
 * `cleanup()` MUST be called after delivery (or on abort) to remove the
 * temporary file from disk.
 */
export interface DownloadedFile {
  stream: Readable;
  fileName: string; // real name with the correct extension (mp4, webm, ...)
  contentType: string; // MIME type derived from the extension
  sizeBytes: number; // for the Content-Length header
  cleanup: () => Promise<void>;
}

export class YtDlp {
  private readonly binaryPath: string;
  private readonly timeoutMs: number;
  private readonly downloadTimeoutMs: number;
  private readonly cookiesFromBrowser: string;
  private readonly cookiesFile: string;

  constructor(options: YtDlpOptions) {
    this.binaryPath = options.binaryPath;
    this.timeoutMs = options.timeoutMs;
    this.downloadTimeoutMs = options.downloadTimeoutMs;
    this.cookiesFromBrowser = options.cookiesFromBrowser ?? "";
    this.cookiesFile = options.cookiesFile ?? "";
  }

  /**
   * Cookie authentication arguments, added to every invocation. Required for
   * platforms that demand a logged-in session (Instagram). The cookies file is
   * preferred when provided, otherwise the browser.
   *
   * Guard: if a file is configured but missing, we ignore it (with a warning)
   * instead of passing an invalid path to yt-dlp, which would make EVERY
   * platform fail (including YouTube/TikTok).
   */
  private cookieArgs(): string[] {
    if (this.cookiesFile) {
      if (existsSync(this.cookiesFile)) {
        return ["--cookies", this.cookiesFile];
      }
      console.warn(
        `[YtDlp] Cookies file not found: ${this.cookiesFile} — ignored.`,
      );
    }
    if (this.cookiesFromBrowser) {
      return ["--cookies-from-browser", this.cookiesFromBrowser];
    }
    return [];
  }

  /**
   * Fetches a URL's metadata + formats as JSON, without downloading the media.
   * Equivalent to `yt-dlp -J --no-playlist <url>`.
   *
   * @throws AppError("RESOLVE_FAILED") on failure, timeout, or invalid JSON.
   */
  async getInfo(url: string): Promise<YtDlpRawInfo> {
    const args = [
      "-J", // dump-single-json
      "--no-playlist", // resolve a single media only
      "--no-warnings",
      ...this.cookieArgs(),
      url,
    ];

    const { stdout } = await this.run(args, this.timeoutMs);

    try {
      return JSON.parse(stdout) as YtDlpRawInfo;
    } catch {
      throw new AppError(
        "RESOLVE_FAILED",
        "Unreadable yt-dlp response (invalid JSON).",
        502,
      );
    }
  }

  /**
   * Downloads a format to a temporary file, then exposes a read stream ready to
   * be streamed to the client.
   *
   * WHY a temporary file instead of streaming directly to stdout: for merged
   * formats (video-only + audio-only, typical of YouTube HD in DASH), ffmpeg
   * needs a "seekable" output to write a valid MP4 (the moov atom is written at
   * the end of the file). On a stdout pipe, ffmpeg falls back to malformed
   * MPEG-TS. Writing a real file guarantees a correct container; we then delete
   * it (no durable storage).
   *
   * @returns a {@link DownloadedFile}; the caller MUST invoke `cleanup()`.
   * @throws AppError("DOWNLOAD_FAILED") if yt-dlp fails or times out.
   */
  async downloadToFile(url: string, formatId: string): Promise<DownloadedFile> {
    // Temporary directory isolated per download (cleaned up via cleanup).
    const dir = await mkdtemp(join(tmpdir(), "snapfetch-"));
    const cleanup = () => rm(dir, { recursive: true, force: true });

    try {
      const args = [
        "-f",
        formatId,
        "--no-playlist",
        "--no-warnings",
        ...this.cookieArgs(),
        // Prefer AAC/m4a audio when `bestaudio` is involved: H.264 + AAC yields
        // an mp4 that plays EVERYWHERE (including Safari/QuickTime), whereas
        // opus muxed into mp4 stays silent in some players.
        "--format-sort",
        "aext:m4a",
        // Merge separate tracks into an MP4 container (requires ffmpeg).
        "--merge-output-format",
        "mp4",
        "-o",
        // Output template; yt-dlp picks the real extension (.mp4/.webm...).
        join(dir, "%(id)s.%(ext)s"),
        url,
      ];

      await this.run(args, this.downloadTimeoutMs, "DOWNLOAD_FAILED");

      // yt-dlp may have produced an intermediate file; keep the largest one
      // (the final media), in case fragments are left behind.
      const files = await readdir(dir);
      if (files.length === 0) {
        throw new AppError(
          "DOWNLOAD_FAILED",
          "yt-dlp produced no file.",
          502,
        );
      }
      const sizes = await Promise.all(
        files.map(async (f) => ({
          path: join(dir, f),
          name: f,
          size: (await stat(join(dir, f))).size,
        })),
      );
      const biggest = sizes.reduce((a, b) => (b.size > a.size ? b : a));

      return {
        stream: createReadStream(biggest.path),
        fileName: biggest.name,
        contentType: this.contentTypeFor(biggest.name),
        sizeBytes: biggest.size,
        cleanup,
      };
    } catch (err) {
      // On failure, clean up immediately before propagating the error.
      await cleanup();
      throw err;
    }
  }

  /** Derives a MIME type from the file extension. */
  private contentTypeFor(fileName: string): string {
    switch (extname(fileName).toLowerCase()) {
      case ".mp4":
      case ".m4v":
        return "video/mp4";
      case ".webm":
        return "video/webm";
      case ".mkv":
        return "video/x-matroska";
      case ".mp3":
        return "audio/mpeg";
      case ".m4a":
        return "audio/mp4";
      default:
        return "application/octet-stream";
    }
  }

  /**
   * Runs yt-dlp with an array of arguments and collects stdout/stderr.
   * Internal method: applies a timeout and kills the process if exceeded.
   */
  private run(
    args: string[],
    timeoutMs: number,
    // Error code applied on failure: differs by operation
    // (metadata resolution vs download).
    failCode: "RESOLVE_FAILED" | "DOWNLOAD_FAILED" = "RESOLVE_FAILED",
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.binaryPath, args, { shell: false });

      let stdout = "";
      let stderr = "";
      let settled = false;

      // Anti-hang guard: bound the execution time.
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill("SIGKILL");
        reject(new AppError(failCode, "yt-dlp timed out.", 504));
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(
          new AppError(failCode, `Could not start yt-dlp: ${err.message}`, 500),
        );
      });

      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(
            new AppError(
              failCode,
              this.summarizeStderr(stderr) ??
                `yt-dlp failed (code ${code ?? "unknown"}).`,
              502,
            ),
          );
        }
      });
    });
  }

  /**
   * Extracts a readable error line from yt-dlp's stderr output, to provide a
   * useful message without exposing the whole trace.
   */
  private summarizeStderr(stderr: string): string | null {
    const line = stderr
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("ERROR:"));
    return line ? line.replace(/^ERROR:\s*/, "") : null;
  }
}
