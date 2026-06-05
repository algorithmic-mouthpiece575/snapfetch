/**
 * Centralized error-handling middleware.
 *
 * Every `next(err)` ends up here. `AppError`s are translated into JSON
 * `{ code, message }` responses with the right status, and unexpected errors
 * are hidden behind a generic `INTERNAL` (no stack leakage).
 */

import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // If the response already started (e.g. streaming began), we can no longer
  // send a JSON error: close the connection.
  if (res.headersSent) {
    res.destroy();
    return;
  }

  if (AppError.is(err)) {
    res.status(err.status).json({ code: err.code, message: err.message });
    return;
  }

  // Unhandled error: log it server-side, stay generic toward the client.
  console.error("[errorHandler] Unhandled error:", err);
  res.status(500).json({
    code: "INTERNAL",
    message: "An internal error occurred.",
  });
};
