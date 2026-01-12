import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;

export const connectRedis = async () => {
  // Skip Redis in development if not explicitly configured
  if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
    logger.info('Redis not configured, skipping connection');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 2000, // 2 second timeout
        reconnectStrategy: false, // Don't auto-reconnect
      },
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis Client Error (non-fatal):', err.message);
      redisClient = null; // Clear client on error
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    // Add timeout to connection
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    return redisClient;
  } catch (error) {
    logger.warn('Failed to connect to Redis (continuing without cache):', error.message);
    redisClient = null;
    // Never throw in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return null;
  }
};

export const getRedisClient = () => {
  return redisClient;
};

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
