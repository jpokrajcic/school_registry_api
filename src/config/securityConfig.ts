import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { type Express } from 'express';

// Read and split allowed origins from .env
const ALLOWED_ORIGINS = (process.env['ALLOWED_ORIGINS'] || '')
  .split(',')
  .map(origin => origin.trim());

export class SecurityConfig {
  // Rate limiting configurations
  static getAuthLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: {
        error: 'Too many authentication attempts, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  static getGeneralLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: { error: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Security middleware configuration
  static configureSecurityMiddleware(app: Express): void {
    // Helmet for security headers
    // TODO check helmet configuration for your specific needs
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );

    // CORS configuration
    app.use(
      cors({
        origin: function (origin, callback) {
          // Allow requests with no origin (like curl or Postman)
          if (!origin) return callback(null, true);
          if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
          } else {
            return callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true, // Allows cookies and Authorization headers
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      })
    );

    // General rate limiting
    app.use(this.getGeneralLimiter());
  }
}
