import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.debug('Authentication request missing bearer token', {
        method: req.method,
        path: req.path,
      });
      throw new UnauthorizedError('Not authorized to access this route');
    }

    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT secret missing from environment');
        throw new UnauthorizedError('Server configuration error');
      }

      const decoded = jwt.verify(token, jwtSecret);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        logger.debug('Authenticated user not found', {
          method: req.method,
          path: req.path,
        });
        throw new UnauthorizedError('User not found');
      }

      logger.debug('Authentication successful', {
        method: req.method,
        path: req.path,
      });
      req.user = user;
      next();
    } catch (err) {
      logger.warn('Authentication failed', {
        method: req.method,
        path: req.path,
        errorName: err.name,
        message: err.message,
      });
      throw new UnauthorizedError('Not authorized to access this route');
    }
  } catch (error) {
    next(error);
  }
};
