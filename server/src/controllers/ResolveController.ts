/**
 * Controller for the `POST /api/resolve` endpoint.
 *
 * Strictly limited role: validate the request (Zod), call the service, and
 * format the response. No business logic or yt-dlp calls here.
 */

import type { Request, Response, NextFunction } from "express";
import { resolveSchema } from "../schemas/requests";
import { AppError } from "../errors/AppError";
import type { ResolveService } from "../services/ResolveService";

export class ResolveController {
  constructor(private readonly service: ResolveService) {
    // Bind `handle` so it can be passed directly as an Express handler.
    this.handle = this.handle.bind(this);
  }

  /** Express handler: `req` → MediaInfo JSON. */
  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1) Validate the external input.
      const parsed = resolveSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          "INVALID_INPUT",
          parsed.error.issues[0]?.message ?? "Invalid input.",
          400,
        );
      }

      // 2) Delegate to the service.
      const info = await this.service.resolve(parsed.data.url);

      // 3) Respond.
      res.json(info);
    } catch (err) {
      // Let the dedicated middleware translate this into an error response.
      next(err);
    }
  }
}
