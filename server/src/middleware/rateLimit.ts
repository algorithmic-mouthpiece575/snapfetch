/**
 * Per-IP rate limiting applied to the sensitive endpoints.
 *
 * Abuse guard: each IP is limited to `max` requests per sliding window. Beyond
 * that, an `AppError("RATE_LIMITED")` is returned, consistent with the rest of
 * the API.
 */

import rateLimit from "express-rate-limit";
import { config } from "../config/env";
import { AppError } from "../errors/AppError";

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true, // expose the RateLimit-* headers
  legacyHeaders: false,
  // Custom response to stay consistent with the global error format.
  handler: (_req, res) => {
    const err = new AppError(
      "RATE_LIMITED",
      "Too many requests. Please try again shortly.",
      429,
    );
    res.status(err.status).json({ code: err.code, message: err.message });
  },
});
