import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { apiReference } from '@scalar/express-api-reference';
import config from './config';
import logger from './utils/logger';
import { sendError } from './utils/response';
import { errorHandler } from './middleware/error.middleware';
import apiRoutes from './routes';
import { openApiSpec } from './docs/openapi';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later' },
      429,
    );
  },
});
app.use(limiter);

// Request ID
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as Request & { id: string }).id = (req.headers['x-request-id'] as string) || uuidv4();
  next();
});

// HTTP request logging
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({ requestId: (req as Request & { id: string }).id }),
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    autoLogging: { ignore: (req) => req.url === '/health' },
  }),
);

// Body parsing — 1 MB limit per FR-004
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// API docs (all environments — disable in prod if needed)
app.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});
app.use(
  '/docs',
  apiReference({
    spec: { url: '/openapi.json' },
    theme: 'default',
  }),
);

// API routes
app.use('/api/v1', apiRoutes);

// 404
app.use((_req: Request, res: Response) => {
  sendError(res, { code: 'NOT_FOUND', message: 'Route not found' }, 404);
});

// Centralised error handler
app.use(errorHandler);

export default app;
