import { body, param, query } from 'express-validator';

export const createWatchlistValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Watchlist name is required')
    .isLength({ max: 100 })
    .withMessage('Watchlist name must be less than 100 characters'),
];

export const updateWatchlistValidator = [
  param('id').isUUID().withMessage('Invalid watchlist ID'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Watchlist name is required')
    .isLength({ max: 100 })
    .withMessage('Watchlist name must be less than 100 characters'),
];

export const addStockValidator = [
  param('id').isUUID().withMessage('Invalid watchlist ID'),
  body('symbol')
    .trim()
    .notEmpty()
    .withMessage('Stock symbol is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Stock symbol must be between 1 and 10 characters')
    .matches(/^[A-Z0-9.]+$/)
    .withMessage('Stock symbol must contain only uppercase letters, numbers, and dots'),
];

export const removeStockValidator = [
  param('id').isUUID().withMessage('Invalid watchlist ID'),
  param('symbol')
    .trim()
    .notEmpty()
    .withMessage('Stock symbol is required'),
];

export const getWatchlistNewsValidator = [
  param('id').isUUID().withMessage('Invalid watchlist ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50'),
  query('cursor')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Cursor must be an integer between 0 and 10000'),
  query('symbol')
    .optional()
    .trim()
    .matches(/^[A-Za-z0-9.]+$/)
    .withMessage('Symbol must contain only letters, numbers, and dots'),
  query('sentiment')
    .optional()
    .isIn(['positive', 'neutral', 'negative'])
    .withMessage('Sentiment must be one of: positive, neutral, negative'),
  query('sort')
    .optional()
    .matches(/^publishedAt:(asc|desc)$/)
    .withMessage('Sort must be one of: publishedAt:asc, publishedAt:desc'),
];
