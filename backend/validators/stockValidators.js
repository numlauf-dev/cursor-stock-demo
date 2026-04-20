import { query, param } from 'express-validator';

export const searchStocksValidator = [
  query('query')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters'),
];

export const getStockHistoryValidator = [
  param('symbol')
    .trim()
    .notEmpty()
    .withMessage('Stock symbol is required')
    .matches(/^[A-Z0-9.]+$/)
    .withMessage('Invalid stock symbol format'),
  query('period')
    .optional()
    .isIn(['1d', '1w', '1m', '3m', '1y'])
    .withMessage('Period must be one of: 1d, 1w, 1m, 3m, 1y'),
];

export const getStockNewsValidator = [
  param('symbol')
    .trim()
    .notEmpty()
    .withMessage('Stock symbol is required')
    .matches(/^[A-Za-z0-9.]+$/)
    .withMessage('Invalid stock symbol format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be an integer between 1 and 20'),
];
