import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { logger } from '../utils/logger.js';

function toEnvelope(err) {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message };
  }

  if (err instanceof ZodError) {
    const paths = err.issues.map((issue) => issue.path.join('.') || '(root)');
    return {
      status: ERROR_CODES.VALIDATION_ERROR,
      code: 'VALIDATION_ERROR',
      message: `Invalid input: ${paths.join(', ')}`,
    };
  }

  if (err && err.type === 'entity.too.large') {
    return {
      status: ERROR_CODES.PAYLOAD_TOO_LARGE,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request payload exceeds the 1MB limit.',
    };
  }

  if (err && err.type === 'entity.parse.failed') {
    return {
      status: ERROR_CODES.INVALID_JSON,
      code: 'INVALID_JSON',
      message: 'Request body is not valid JSON.',
    };
  }

  return {
    status: ERROR_CODES.INTERNAL_ERROR,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  };
}

// Express requires 4-arity for error middleware; _next is intentionally unused
// (matches the node block's argsIgnorePattern in eslint.config.js).
export function errorHandler(err, req, res, _next) {
  const envelope = toEnvelope(err);

  if (envelope.status >= 500) {
    logger.error({ err, reqId: req.id }, 'Unhandled error');
  } else {
    logger.warn(
      { err: { message: err.message, code: envelope.code }, reqId: req.id },
      'Request error',
    );
  }

  res.status(envelope.status).json({
    success: false,
    error: { code: envelope.code, message: envelope.message },
  });
}
