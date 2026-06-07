/**
 * Typed HTTP client for the SnapFetch API.
 *
 * Centralizes network calls and error handling: React components never touch
 * `fetch` directly, they consume these functions.
 */

import type { ApiError, MediaInfo } from "../types/media";

/**
 * Backend origin for ALL API calls.
 *
 * - Empty → relative `/api` URLs. Use this when the frontend and backend share
 *   the same origin (dev via the Vite proxy, or prod behind a single reverse
 *   proxy).
 * - Set `VITE_API_ORIGIN` to the backend origin (e.g.
 *   `https://snapfetch-server.duckdns.org`) when they live on different domains,
 *   so every request targets the backend directly. CORS must allow the frontend
 *   origin (`CLIENT_ORIGIN` on the server).
 *
 * Going direct also avoids the dev proxy dropping long download connections
 * (502) while the server prepares a large file.
 */
const API_ORIGIN: string = import.meta.env.VITE_API_ORIGIN ?? "";

/** Base for every API call. */
const API_BASE = `${API_ORIGIN}/api`;

/** Client-side application error carrying the `code` returned by the API. */
export class ApiRequestError extends Error {
  /** Machine code returned by the backend (e.g. "UNSUPPORTED_PLATFORM"). */
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
  }
}

/** Tries to read a JSON error body `{ code, message }`; otherwise generic. */
async function toApiError(res: Response): Promise<ApiRequestError> {
  try {
    const body = (await res.json()) as Partial<ApiError>;
    return new ApiRequestError(
      body.code ?? "INTERNAL",
      body.message ?? "An error occurred.",
    );
  } catch {
    return new ApiRequestError("INTERNAL", `Network error (${res.status}).`);
  }
}

/**
 * Resolves a URL into metadata + formats via `POST /api/resolve`.
 * @throws ApiRequestError if the server returns an error.
 */
export async function resolveMedia(url: string): Promise<MediaInfo> {
  const res = await fetch(`${API_BASE}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as MediaInfo;
}

/**
 * Download phases, for the visual feedback.
 * - `preparing`: the server downloads + merges the video (no byte received by
 *   the client yet) → indeterminate indicator.
 * - `downloading`: the file is being transferred → determinate bar.
 */
export type DownloadPhase = "preparing" | "downloading";

export interface DownloadHandlers {
  /** Notifies a phase change. */
  onPhase?: (phase: DownloadPhase) => void;
  /** Transfer progress; `total` may be `null` if unknown. */
  onProgress?: (receivedBytes: number, totalBytes: number | null) => void;
}

/**
 * Downloads a format via `GET /api/download` while TRACKING progress.
 *
 * We read the response as a stream (`res.body`) to report progress, then
 * assemble a `Blob` that we save. Since quality is capped at 1080p server-side,
 * the size stays reasonable for an in-memory buffer.
 *
 * Flow: `fetch` stays pending during server preparation (phase `preparing`); as
 * soon as the headers arrive, we switch to `downloading` and track the received
 * bytes.
 *
 * @throws ApiRequestError if the server returns an error (displayable in the UI).
 */
export async function downloadMedia(
  url: string,
  formatId: string,
  filename: string,
  handlers: DownloadHandlers = {},
): Promise<void> {
  handlers.onPhase?.("preparing");

  const params = new URLSearchParams({ url, formatId, filename });
  const href = `${API_BASE}/download?${params.toString()}`;

  // Awaiting this promise covers the entire server-side preparation.
  const res = await fetch(href);
  if (!res.ok) throw await toApiError(res);

  handlers.onPhase?.("downloading");

  const totalHeader = res.headers.get("Content-Length");
  const total = totalHeader ? Number.parseInt(totalHeader, 10) : null;
  const contentType = res.headers.get("Content-Type") ?? "video/mp4";

  let blob: Blob;
  const reader = res.body?.getReader();
  if (reader) {
    // Incremental read to track progress.
    const chunks: BlobPart[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      handlers.onProgress?.(received, total);
    }
    blob = new Blob(chunks, { type: contentType });
  } else {
    // Fallback if streaming is not available.
    blob = await res.blob();
  }

  saveBlob(blob, `${filename}.${extensionFor(contentType)}`);
}

/** Saves a Blob via a temporary object URL link. */
function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Deferred revocation: revoking too early can cancel the download.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/** Derives the file extension from the MIME type returned by the server. */
function extensionFor(contentType: string): string {
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("matroska")) return "mkv";
  if (contentType.includes("mpeg")) return "mp3";
  return "mp4";
}
