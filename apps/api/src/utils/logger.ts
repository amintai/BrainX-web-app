import pino from 'pino';
import config from '../config';

const logger = pino(
  config.isDev
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : { level: 'info' },
);

export default logger;
