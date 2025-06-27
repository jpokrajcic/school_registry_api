import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
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

    // Redis client setup
    redisClient = new Redis({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      password: process.env['REDIS_PASSWORD'] || '',
      maxRetriesPerRequest: 3,
    });

    // Handle Redis connection events
    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    redisClient.on('error', err => {
      console.error('Redis connection error:', err);
    });
  }

  return redisClient;
}
