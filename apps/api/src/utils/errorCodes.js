// code -> default HTTP status. Used by the error handler and available to any
// module that needs to raise an AppError with a known code.
export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 400,
  INVALID_JSON: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  AI_NOT_CONFIGURED: 500,
  AI_PROVIDER_ERROR: 502,
  AI_OUTPUT_INVALID: 502,
});
