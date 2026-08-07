import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), logFormat)
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

// Morgan stream for Winston
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export const requestLogger = morgan(
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :response-time ms - :res[content-length]',
  { stream: morganStream }
);

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};

export { logger };
