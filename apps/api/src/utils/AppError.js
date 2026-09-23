/**
 * Application-level error carrying an HTTP status and a machine-readable code.
 * `cause` is never serialised into an HTTP response — it exists purely for
 * server-side logging context.
 */
export class AppError extends Error {
  constructor(status, code, message, cause) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}
