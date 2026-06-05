/**
 * Download service: prepares a media file ready to be streamed.
 *
 * Like `ResolveService`, it detects the platform and delegates to the adapter.
 * The actual HTTP delivery (headers, pipe, cleanup) is handled by the controller.
 */

import { detectPlatform } from "../lib/detectPlatform";
import { AppError } from "../errors/AppError";
import type { AdapterRegistry } from "../adapters/AdapterRegistry";
import type { DownloadedFile } from "../lib/YtDlp";

export class DownloadService {
  constructor(private readonly registry: AdapterRegistry) {}

  /**
   * Prepares the download file for `url` + `formatId` (already validated).
   *
   * @returns a {@link DownloadedFile}; the caller MUST invoke `cleanup()`.
   * @throws AppError("UNSUPPORTED_PLATFORM") if the URL is not supported.
   */
  prepare(url: string, formatId: string): Promise<DownloadedFile> {
    const platform = detectPlatform(url);
    if (!platform) {
      throw new AppError(
        "UNSUPPORTED_PLATFORM",
        "This platform is not supported.",
        400,
      );
    }

    const adapter = this.registry.get(platform);
    if (!adapter) {
      throw new AppError(
        "UNSUPPORTED_PLATFORM",
        `No adapter available for "${platform}".`,
        500,
      );
    }

    return adapter.download(url, formatId);
  }
}
