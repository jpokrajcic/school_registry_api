import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import logger from './logger';
import path from 'path';
import { roleRoutes } from './routes/roleRoutes';
import { userRoutes } from './routes/userRoutes';
import { regionRoutes } from './routes/regionRoutes';
import { schoolRoutes } from './routes/schoolRoutes';

// Load correct environment variables based on NODE_ENV
const envPath =
  process.env['NODE_ENV'] === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envPath) });

// Create Express app
const app = express();
const PORT = process.env['PORT'] || 3000;

// Read and split allowed origins from .env
const ALLOWED_ORIGINS = (process.env['ALLOWED_ORIGINS'] || '')
  .split(',')
  .map(origin => origin.trim());

// Middleware

// Security headers
app.use(helmet());

// CORS settings
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
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request body parsers
// Parse incoming requests with a Content-Type: application/json header
app.use(express.json());
// Parse incoming requests with a Content-Type: application/x-www-form-urlencoded header (form submissions)
app.use(express.urlencoded({ extended: true }));

// Wire Morgan with Winston for logging
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

// Routes
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to the API!',
    status: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/schools', schoolRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'],
    version: process.env['APP_VERSION'],
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log('Received shutdown signal, closing server...');
  // disconnect from database
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // connect to database
    console.log('Connected to database');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
