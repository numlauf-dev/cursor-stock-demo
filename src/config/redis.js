import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;

export const connectRedis = async () => {
  // Skip Redis in development if REDIS_URL is not set
  if (!process.env.REDIS_URL && process.env.NODE_ENV !== 'production') {
    logger.warn('Redis URL not configured, continuing without cache');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000, // 5 second timeout
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Max Redis reconnection attempts reached, continuing without cache');
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 1000);
        }
      }
    });

    redisClient.on('error', (err) => {
      // Only log once, not repeatedly
      if (!redisClient._errorLogged) {
        logger.warn('Redis unavailable, continuing without cache');
        redisClient._errorLogged = true;
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn('Failed to connect to Redis, continuing without cache');
    redisClient = null;
    return null;
  }
};

export const getRedisClient = () => {
  return redisClient;
};

export const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (e) {
      // Ignore disconnect errors
    }
    redisClient = null;
  }
};
