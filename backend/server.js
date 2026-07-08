import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import app from './app.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    // Connect to Redis (optional, will continue without it in development)
    // Don't await - let it connect in background, server will start regardless
    connectRedis().catch(() => {
      logger.warn('Redis connection failed, continuing without cache');
    });

    // Start Express server immediately
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API available at http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();
