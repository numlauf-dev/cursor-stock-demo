import express from 'express';
import * as watchlistController from '../controllers/watchlistController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  createWatchlistValidator,
  updateWatchlistValidator,
  addStockValidator,
  removeStockValidator,
  getWatchlistNewsValidator,
} from '../validators/watchlistValidators.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiLimiter);

router.get('/', watchlistController.getUserWatchlists);
router.post('/', createWatchlistValidator, handleValidationErrors, watchlistController.createWatchlist);
router.get('/:id', watchlistController.getWatchlist);
router.get('/:id/news', getWatchlistNewsValidator, handleValidationErrors, watchlistController.getWatchlistNews);
router.put('/:id', updateWatchlistValidator, handleValidationErrors, watchlistController.updateWatchlist);
router.delete('/:id', watchlistController.deleteWatchlist);
router.post('/:id/stocks', addStockValidator, handleValidationErrors, watchlistController.addStockToWatchlist);
router.delete('/:id/stocks/:symbol', removeStockValidator, handleValidationErrors, watchlistController.removeStockFromWatchlist);

export default router;
