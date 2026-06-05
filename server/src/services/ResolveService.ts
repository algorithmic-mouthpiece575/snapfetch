/**
 * Resolve service: URL → metadata + formats.
 *
 * Orchestrates platform detection and delegation to the right adapter. It holds
 * no HTTP logic (that's the controller's job) and no direct extraction (that's
 * the adapter's job): it ties the two together.
 */

import type { MediaInfo } from "../types/media";
import { detectPlatform } from "../lib/detectPlatform";
import { AppError } from "../errors/AppError";
import type { AdapterRegistry } from "../adapters/AdapterRegistry";

export class ResolveService {
  constructor(private readonly registry: AdapterRegistry) {}

  /**
   * Resolves an already-validated (by Zod) URL into `MediaInfo`.
   *
   * @throws AppError("UNSUPPORTED_PLATFORM") if the URL matches no supported
   *         platform.
   */
  async resolve(url: string): Promise<MediaInfo> {
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
      // Platform detected but no adapter: configuration inconsistency.
      throw new AppError(
        "UNSUPPORTED_PLATFORM",
        `No adapter available for "${platform}".`,
        500,
      );
    }

    return adapter.resolve(url);
  }
}
