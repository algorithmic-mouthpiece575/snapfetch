/**
 * Controller for the `/api/download` endpoint (GET and POST).
 *
 * Validates the request, prepares the file via the service, streams it to the
 * client as `Content-Disposition: attachment`, then deletes the temporary file
 * — whatever the outcome (success, error, client disconnect).
 *
 * GET is used for native browser downloads (direct streaming to disk, native
 * progress bar); POST stays available for programmatic API use.
 */

import type { Request, Response, NextFunction } from "express";
import { downloadSchema } from "../schemas/requests";
import { AppError } from "../errors/AppError";
import type { DownloadService } from "../services/DownloadService";

export class DownloadController {
  constructor(private readonly service: DownloadService) {
    this.handle = this.handle.bind(this);
  }

  /** Shared GET/POST Express handler. */
  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    // On GET the params come from the query string, on POST from the JSON body.
    const source = req.method === "GET" ? req.query : req.body;
    const parsed = downloadSchema.safeParse(source);
    if (!parsed.success) {
      next(
        new AppError(
          "INVALID_INPUT",
          parsed.error.issues[0]?.message ?? "Invalid input.",
          400,
        ),
      );
      return;
    }

    // Preparation can be long (download + ffmpeg merge).
    let file;
    try {
      file = await this.service.prepare(parsed.data.url, parsed.data.formatId);
    } catch (err) {
      next(err);
      return;
    }

    // From here a temporary file exists: we must ALWAYS clean up.
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      void file.cleanup();
    };

    // Final file name: sanitized base provided by the client + the real
    // extension determined by yt-dlp.
    const downloadName = this.buildFilename(parsed.data.filename, file.fileName);

    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Length", file.sizeBytes);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName}"`,
    );

    // Error while reading the temp file → stop and clean up.
    file.stream.on("error", () => {
      cleanup();
      if (!res.headersSent) {
        next(new AppError("DOWNLOAD_FAILED", "Failed to send the file.", 500));
      } else {
        res.destroy();
      }
    });

    // Response end (success OR client disconnect) → delete the temp file.
    res.on("close", cleanup);

    file.stream.pipe(res);
  }

  /**
   * Builds a download file name: keeps the real extension (from yt-dlp) and
   * sanitizes the base provided by the client.
   */
  private buildFilename(requested: string | undefined, realName: string): string {
    const ext = realName.includes(".")
      ? realName.slice(realName.lastIndexOf("."))
      : "";
    const base = (requested ?? realName.replace(ext, "") ?? "snapfetch")
      // Strip any character problematic for a header / file system.
      .replace(/[^\w.-]+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80)
      .replace(/^_+|_+$/g, "");
    return `${base || "snapfetch"}${ext}`;
  }
}
