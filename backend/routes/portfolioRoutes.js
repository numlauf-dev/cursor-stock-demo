import express from 'express';
import * as portfolioController from '../controllers/portfolioController.js';
import { authenticate } from '../middleware/auth.js';
import { portfolioLimiter } from '../middleware/rateLimiter.js';
import {
  analyzePortfolioValidator,
  getPortfolioPerformanceValidator,
} from '../validators/portfolioValidators.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', portfolioController.getPortfolio);
router.get(
  '/performance',
  getPortfolioPerformanceValidator,
  handleValidationErrors,
  portfolioController.getPortfolioPerformance
);
router.post('/buy', portfolioController.buyStock);
router.post('/sell', portfolioController.sellStock);
router.post('/migrate', portfolioController.migratePortfolio);
router.post('/reset', portfolioController.resetPortfolio);
router.post(
  '/analyze',
  portfolioLimiter,
  analyzePortfolioValidator,
  handleValidationErrors,
  portfolioController.analyzePortfolio
);

export default router;
