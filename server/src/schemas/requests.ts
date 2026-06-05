/**
 * Zod schemas validating HTTP input.
 *
 * Every external value (URL, formatId) is validated here BEFORE it reaches the
 * business layer or yt-dlp. This is the first line of defense against malformed
 * or malicious input.
 */

import { z } from "zod";

/**
 * Validates a string as an http(s) URL.
 * Schemes other than http/https (e.g. `file:`) are explicitly rejected.
 */
const httpUrl = z
  .string()
  .trim()
  .min(1, "Missing URL.")
  .max(2048, "URL too long.")
  .refine(
    (value) => {
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Invalid URL: only http(s) is accepted." },
  );

/** Body expected by `POST /api/resolve`. */
export const resolveSchema = z.object({
  url: httpUrl,
});

/**
 * Parameters expected by `GET /api/download` (native browser download via query
 * string) or `POST /api/download` (JSON body).
 */
export const downloadSchema = z.object({
  url: httpUrl,
  // yt-dlp format selector: id(s) + merge/fallback separators
  // (e.g. "299+bestaudio/299"). Kept to a restricted character set.
  formatId: z
    .string()
    .trim()
    .min(1, "Missing formatId.")
    .max(64, "formatId too long.")
    .regex(/^[A-Za-z0-9_+\-./]+$/, "Invalid formatId."),
  // Desired file name (optional); sanitized before use in the controller.
  filename: z.string().trim().max(200).optional(),
});

/** Inferred types, reused by the controllers. */
export type ResolveInput = z.infer<typeof resolveSchema>;
export type DownloadInput = z.infer<typeof downloadSchema>;
