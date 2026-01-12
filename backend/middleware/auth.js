import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Debug logging
    console.log('[Auth] Request headers:', {
      authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'missing',
      'content-type': req.headers['content-type'],
      method: req.method,
      path: req.path,
    });

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('[Auth] Token extracted:', token ? `${token.substring(0, 20)}...` : 'none');
    }

    if (!token) {
      console.log('[Auth] No token found in request');
      throw new UnauthorizedError('Not authorized to access this route');
    }

    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('[Auth] JWT_SECRET is not set in environment variables');
        throw new UnauthorizedError('Server configuration error');
      }

      console.log('[Auth] Verifying token with secret:', jwtSecret ? 'present' : 'missing');
      const decoded = jwt.verify(token, jwtSecret);
      console.log('[Auth] Token decoded successfully:', { id: decoded.id, email: decoded.email });

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
        console.log('[Auth] User not found in database:', decoded.id);
        throw new UnauthorizedError('User not found');
      }

      console.log('[Auth] Authentication successful for user:', user.email);
      req.user = user;
      next();
    } catch (err) {
      console.error('[Auth] Token verification failed:', err.message);
      if (err.name === 'JsonWebTokenError') {
        console.error('[Auth] JWT Error:', err.message);
      } else if (err.name === 'TokenExpiredError') {
        console.error('[Auth] Token expired');
      }
      throw new UnauthorizedError('Not authorized to access this route');
    }
  } catch (error) {
    next(error);
  }
};
