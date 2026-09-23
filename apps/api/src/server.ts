import { config as loadEnv } from 'dotenv';
loadEnv();

import { validateEnv } from './utils/env';
import logger from './utils/logger';

// Validate env before anything else — fail fast with a clear message
try {
  validateEnv();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

import app from './app';
import config from './config';

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'BrainX API server started');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection — shutting down');
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception — shutting down');
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default server;
