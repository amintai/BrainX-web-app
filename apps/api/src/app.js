import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config as defaultConfig } from './config/env.js';
import { logger as defaultLogger } from './utils/logger.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { createRequireAuth } from './middleware/requireAuth.js';
import { authService as defaultAuthService } from './services/auth.service.js';
import { createV1Router } from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import {
  createRequestLogger,
  requestLogger as sharedRequestLogger,
} from './middleware/requestLogger.js';

/**
 * Builds an Express app instance with the full middleware stack wired.
 * Never calls listen() — see server.js. Injection points let tests swap
 * config, logger, authService, and rateLimit options without a live
 * Supabase instance or a bound port (ADR-5).
 *
 * Middleware order is load-bearing (see plan.md "Middleware order in
 * createApp()") — do not reorder without re-reading that section:
 *   1. requestLogger  2. helmet  3. cors  4. rateLimiter
 *   5. express.json({limit:'1mb'})  6. /api/v1 router
 *   7. notFound  8. errorHandler
 */
export function createApp(deps = {}) {
  const config = deps.config ?? defaultConfig;
  const logger = deps.logger ?? defaultLogger;
  const authService = deps.authService ?? defaultAuthService;
  const rateLimitOptions = deps.rateLimit ?? config.rateLimit;

  const app = express();

  // Trust the configured proxy hop count/flag so req.ip and req.secure are
  // correct behind Render/Railway/Cloud Run's load balancer, and so
  // express-rate-limit keys on the real client IP instead of the proxy's.
  app.set('trust proxy', config.trustProxy);

  // 1. Structured request logging first, so 413/429/404 responses are logged too.
  app.use(deps.logger ? createRequestLogger(logger) : sharedRequestLogger);

  // 2. Security headers on every response, including errors.
  app.use(helmet());

  // 3. CORS before the rate limiter so 429 responses remain readable by the browser.
  app.use(cors({ origin: config.corsOrigin }));

  // 4. Rate limiting before body parsing, so floods are never parsed.
  app.use(createRateLimiter(rateLimitOptions));

  // 5. JSON body parsing with the 1MB payload limit.
  app.use(express.json({ limit: '1mb' }));

  // 6. All application routes under /api/v1.
  const requireAuth = createRequireAuth(authService);
  app.use('/api/v1', createV1Router({ requireAuth }));

  // 7. Anything unmatched (including unprefixed routes) is a 404.
  app.use(notFound);

  // 8. Centralised error handling — the only place that writes error bodies.
  app.use(errorHandler);

  return app;
}
