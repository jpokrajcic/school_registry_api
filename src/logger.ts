import { createLogger, format, transports } from 'winston';
import path from 'path';
import { getSrcDirname } from './utils/path';

const { combine, timestamp, errors, colorize, printf } = format;

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    colorize(),
    printf(info => {
      const { timestamp, level, message, stack } = info;
      return stack
        ? `[${timestamp}] ${level}: ${message} - ${stack}`
        : `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(getSrcDirname(), 'logs', 'combined.log'),
      level: 'info',
    }),
    new transports.File({
      filename: path.join(getSrcDirname(), 'logs', 'error.log'),
      level: 'error',
    }),
  ],
});

export default logger;
