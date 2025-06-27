import express, { type Request, type Response, type Express } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import { roleRoutes } from './routes/roleRoutes';
import { userRoutes } from './routes/userRoutes';
import { regionRoutes } from './routes/regionRoutes';
import { schoolRoutes } from './routes/schoolRoutes';
import { Server } from 'http';
import { db } from './config/database';
import { SecurityConfig } from './config/securityConfig';
import { LoggingConfig } from './config/loggingConfig';
import { ParsingConfig } from './config/parsingConfig';
import { getRedisClient } from './redis/redisClient';
import { authRoutes } from './routes/authRoutes';
import { studentRoutes } from './routes/studentRoutes';

let server: Server;

// Load correct environment variables based on NODE_ENV
let envPath: string;
switch (process.env['NODE_ENV']) {
  case 'production':
    envPath = '.env.production';
    break;
  case 'development':
    envPath = '.env.development';
    break;
  case 'test':
    envPath = '.env.test';
    break;
  default:
    envPath = '.env';
}

dotenv.config({ path: path.resolve(process.cwd(), envPath) });

// Create Express app
const app: Express = express();
const PORT = process.env['PORT'] || 3000;
const redis = getRedisClient();

/******************************/
//  MIDDLEWARE CONFIGURATION  //
/*****************************/

// Configure security middleware (helmet, CORS, limiters)
SecurityConfig.configureSecurityMiddleware(app);

// Configure body parsers
ParsingConfig.configureParsingMiddleware(app);

// Logging middleware (Morgan and Winston)
LoggingConfig.configureLoggingMiddleware(app);

app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'],
    version: process.env['APP_VERSION'],
  });
});

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    console.log('Connected to database');

    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log('Shutting down gracefully...');

  // Stop accepting new HTTP requests
  server.close(async (err?: Error) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
      process.exit(1);
    }

    try {
      console.log('Closing Redis connection...');
      await redis.quit();
      console.log('Redis closed.');
    } catch (redisErr) {
      console.error('Error closing Redis:', redisErr);
    }

    try {
      console.log('Closing PostgreSQL connection...');
      await db.destroy(); // ✅ Kysely .destroy() calls pool.end()
      console.log('PostgreSQL connection closed.');
    } catch (dbErr) {
      console.error('Error closing database:', dbErr);
    }

    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
