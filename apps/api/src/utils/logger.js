import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.logLevel,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.apiKey', '*.serviceRoleKey'],
    censor: '[REDACTED]',
  },
  transport: config.nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined,
});
