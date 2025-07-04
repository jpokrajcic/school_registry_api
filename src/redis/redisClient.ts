import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { getEnvironmentPath } from '../utils/pathUtils';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const envPath: string = getEnvironmentPath();

    dotenv.config({ path: path.resolve(process.cwd(), envPath) });

    // Redis client setup
    // redisClient = new Redis({
    //   host: process.env['REDIS_HOST'] || 'localhost',
    //   port: parseInt(process.env['REDIS_PORT'] || '6379'),
    //   password: process.env['REDIS_PASSWORD'] || '',
    //   maxRetriesPerRequest: 3,
    // });

    redisClient = new Redis(process.env['REDIS_URL'] + '?family=0');

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
