import { body, param } from 'express-validator';

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
