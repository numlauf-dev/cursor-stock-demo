import { body } from 'express-validator';

export const analyzePortfolioValidator = [
  body('holdings')
    .isArray({ min: 1, max: 50 })
    .withMessage('Holdings must be an array with 1-50 items')
    .custom((holdings) => {
      if (!Array.isArray(holdings)) {
        throw new Error('Holdings must be an array');
      }
      
      for (const holding of holdings) {
        if (!holding.symbol || typeof holding.symbol !== 'string' || holding.symbol.trim().length === 0) {
          throw new Error('Each holding must have a valid symbol');
        }
        if (typeof holding.quantity !== 'number' || holding.quantity <= 0) {
          throw new Error('Each holding must have a valid quantity > 0');
        }
        if (typeof holding.avgPrice !== 'number' || holding.avgPrice <= 0) {
          throw new Error('Each holding must have a valid avgPrice > 0');
        }
      }
      
      return true;
    }),
];

