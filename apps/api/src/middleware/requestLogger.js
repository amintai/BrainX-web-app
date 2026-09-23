import crypto from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';

/**
 * Structured request logging (FR-003). Honours an incoming x-request-id so
 * requests can be correlated across services; otherwise generates a UUID.
 */
export function createRequestLogger(baseLogger = logger) {
  return pinoHttp({
    logger: baseLogger,
    genReqId: (req, res) => {
      const existing = req.headers['x-request-id'];
      if (existing) {
        res.setHeader('x-request-id', existing);
        return existing;
      }
      const id = crypto.randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
  });
}

export const requestLogger = createRequestLogger();
