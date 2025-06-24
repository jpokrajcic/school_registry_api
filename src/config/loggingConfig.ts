import { type Express } from 'express';
import morgan from 'morgan';
import logger from '../logger';

export class LoggingConfig {
  // Logging configuration
  static configureLoggingMiddleware(app: Express): void {
    // Wire Morgan with Winston for logging
    app.use(
      morgan('combined', {
        stream: {
          write: message => logger.info(message.trim()),
        },
      })
    );
  }
}
