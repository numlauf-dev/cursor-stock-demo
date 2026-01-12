import rateLimit from 'express-rate-limit';

// Rate limiter for auth endpoints (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiter for default user endpoint (single-user demo mode)
// In development, skip rate limiting entirely since it's auto-called on app load
export const defaultUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 30, // Very lenient in dev, normal in prod
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting entirely in development mode
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
});

// Rate limiter for stock data endpoints
export const stockDataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for portfolio analysis endpoints (prevents API cost abuse)
export const portfolioLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many portfolio analysis requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
