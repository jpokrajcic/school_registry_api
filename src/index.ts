import express, { type Request, type Response, type Express } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { roleRoutes } from './routes/roleRoutes.js';
import { userRoutes } from './routes/userRoutes';
import { regionRoutes } from './routes/regionRoutes';
import { schoolRoutes } from './routes/schoolRoutes';
import { Server } from 'http';
import http from 'http';
import { db } from './config/database';
import { SecurityConfig } from './config/securityConfig';
import { LoggingConfig } from './config/loggingConfig';
import { ParsingConfig } from './config/parsingConfig';
import { getRedisClient } from './redis/redisClient';
import { authRoutes } from './routes/authRoutes';
import { studentRoutes } from './routes/studentRoutes';
import { teacherRoutes } from './routes/teacherRoutes';
import { subjectRoutes } from './routes/subjectRoutes.js';
import type { AppConfig, HealthResponse } from './types/general';
import { getEnvironmentPath } from './utils/pathUtils';
import { testDatabaseConnection } from './utils/databaseUtils';
import { RailwayConfig } from './config/railwayConfig.js';

let server: Server;
let redisClient: ReturnType<typeof getRedisClient>;

// Environment configuration
const loadEnvironmentConfig = (): void => {
  const envPath = getEnvironmentPath();
  const result = dotenv.config({ path: path.resolve(process.cwd(), envPath) });

  if (result.error) {
    console.warn(
      `Warning: Could not load environment file ${envPath}:`,
      result.error.message
    );
  }
};

// Application configuration
const getAppConfig = (): AppConfig => {
  const port = parseInt(process.env['PORT'] || '3000', 10);
  const environment = process.env['NODE_ENV'] || 'development';
  const sslKeyPath = process.env['SSL_KEY_PATH'] || '';
  const sslCertPath = process.env['SSL_CERT_PATH'] || '';
  const sslEnabled = !!(sslKeyPath && sslCertPath);

  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port number: ${process.env['PORT']}`);
  }

  return {
    port,
    environment,
    sslEnabled,
    sslKeyPath,
    sslCertPath,
    appVersion: process.env['APP_VERSION'] || '',
  };
};

// SSL configuration
const getSSLCredentials = (
  config: AppConfig
): { key: string; cert: string } | null => {
  if (!config.sslEnabled || !config.sslKeyPath || !config.sslCertPath) {
    return null;
  }

  try {
    return {
      key: fs.readFileSync(path.resolve(config.sslKeyPath), 'utf8'),
      cert: fs.readFileSync(path.resolve(config.sslCertPath), 'utf8'),
    };
  } catch (error) {
    throw new Error(
      `Failed to load SSL certificates: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Application setup
const createApp = (config: AppConfig): Express => {
  const app: Express = express();

  // Railway middleware for HTTPS redirection
  RailwayConfig.configureRailwayMiddleware(app, config);

  // Configure security middleware (helmet, CORS, limiters)
  SecurityConfig.configureSecurityMiddleware(app);

  // Configure body parsers
  ParsingConfig.configureParsingMiddleware(app);

  // Logging middleware (Morgan and Winston)
  LoggingConfig.configureLoggingMiddleware(app);

  // Cookie parser
  app.use(cookieParser());

  return app;
};

// Route configuration
const configureRoutes = (app: Express): void => {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/regions', regionRoutes);
  app.use('/api/schools', schoolRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/teachers', teacherRoutes);
  app.use('/api/subjects', subjectRoutes);

  // Health check endpoint
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const healthResponse: HealthResponse = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development',
        version: process.env['APP_VERSION'] || '',
        services: {
          database: 'connected', // You might want to add actual health checks
          redis: 'connected',
        },
      };

      res.json(healthResponse);
    } catch (error) {
      const errorResponse: HealthResponse = {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development',
      };

      res.status(503).json(errorResponse);
    }
  });

  // 404 handler - should be last
  app.use('*', (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      timestamp: new Date().toISOString(),
    });
  });
};

// Server creation
// NOTE: since app is deployed using Railway, we don't need to handle HTTPS certificates manually in production environment because Railway provides several built-in options for HTTPS.
const createServer = (app: Express, config: AppConfig): Server => {
  if (process.env['NODE_ENV'] !== 'production') {
    const credentials = getSSLCredentials(config);
    if (credentials) {
      console.log('Creating HTTPS server...');
      return https.createServer(credentials, app);
    } else {
      console.log('Creating HTTP server...');
      return http.createServer(app);
    }
  } else {
    console.log('Creating HTTP server...');
    return http.createServer(app);
  }
};

// Database and Redis initialization
const initializeServices = async (): Promise<void> => {
  try {
    // Initialize Redis client
    redisClient = getRedisClient();

    // Test database connection
    testDatabaseConnection();
    console.log('Database connection established');

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

// Server startup
const startServer = async (): Promise<void> => {
  try {
    const config = getAppConfig();

    // Initialize services first
    await initializeServices();

    // Create and configure app
    const app = createApp(config);
    configureRoutes(app);

    // Create server
    server = createServer(app, config);

    // Start listening
    server.listen(config.port, () => {
      const protocol = config.sslEnabled ? 'HTTPS' : 'HTTP';
      console.log(`${protocol} server is running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Version: ${config.appVersion || 'unknown'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await cleanup();
    process.exit(1);
  }
};

// Cleanup function
const cleanup = async (): Promise<void> => {
  const cleanupPromises: Promise<void>[] = [];

  // Close Redis connection
  if (redisClient) {
    cleanupPromises.push(
      redisClient
        .quit()
        .then(() => {})
        .catch(err => {
          console.error('Error closing Redis:', err);
        })
    );
  }

  // Close database connection
  cleanupPromises.push(
    db.destroy().catch(err => {
      console.error('Error closing database:', err);
    })
  );

  // Wait for all cleanup operations with timeout
  try {
    await Promise.race([
      Promise.all(cleanupPromises),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cleanup timeout')), 5000)
      ),
    ]);
    console.log('All connections closed successfully');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  // Stop accepting new connections
  if (server) {
    server.close(async (err?: Error) => {
      if (err) {
        console.error('Error closing server:', err);
      }

      await cleanup();
      process.exit(err ? 1 : 0);
    });

    // Force close after timeout
    setTimeout(() => {
      console.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  } else {
    await cleanup();
    process.exit(0);
  }
};

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Load environment and start server
loadEnvironmentConfig();
startServer();
