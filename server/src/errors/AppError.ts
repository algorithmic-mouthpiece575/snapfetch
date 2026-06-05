/**
 * Unified application error type.
 *
 * Every "business" error in the backend flows through this class so the error
 * middleware can produce a consistent JSON response (`{ code, message }`) and
 * pick the right HTTP status, without leaking technical details to the client.
 */

/** Stable error codes, shared with the frontend. */
export type AppErrorCode =
  | "UNSUPPORTED_PLATFORM"
  | "INVALID_INPUT"
  | "RESOLVE_FAILED"
  | "FORMAT_NOT_FOUND"
  | "DOWNLOAD_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  /** Machine code meant for the client (never a stack trace). */
  public readonly code: AppErrorCode;
  /** HTTP status to return. */
  public readonly status: number;

  constructor(code: AppErrorCode, message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    // Restore the prototype chain (required in TS targeting ES5/ES2022).
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** Convenience type guard to tell our errors from native ones. */
  static is(err: unknown): err is AppError {
    return err instanceof AppError;
  }
}
