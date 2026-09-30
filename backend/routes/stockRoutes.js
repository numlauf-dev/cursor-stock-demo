import express from 'express';
import * as stockController from '../controllers/stockController.js';
import { stockDataLimiter } from '../middleware/rateLimiter.js';
import { searchStocksValidator, getStockHistoryValidator, getStockNewsValidator } from '../validators/stockValidators.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.get('/search', stockDataLimiter, searchStocksValidator, handleValidationErrors, stockController.searchStocks);
router.get('/trending', stockDataLimiter, stockController.getTrendingStocks);
router.get('/market/news', stockDataLimiter, stockController.getMarketNews);
router.get('/market/status', stockController.getMarketStatus);
router.get('/provider', stockController.getProviderInfo);
router.get('/:symbol', stockDataLimiter, stockController.getStockInfo);
router.get('/:symbol/quote', stockDataLimiter, stockController.getStockQuote);
router.get('/:symbol/history', stockDataLimiter, getStockHistoryValidator, handleValidationErrors, stockController.getStockHistory);
router.get('/:symbol/news', stockDataLimiter, getStockNewsValidator, handleValidationErrors, stockController.getStockNews);

export default router;
