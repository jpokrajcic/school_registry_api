import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
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
