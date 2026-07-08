import * as stockService from '../services/stockService.js';
import * as portfolioService from '../services/portfolioService.js';
import { aggregatePortfolioSentiment } from '../services/marketSentimentService.js';
import { analyzePortfolio as analyzePortfolioAI } from '../services/openaiService.js';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import crypto from 'crypto';

const serializePortfolio = (portfolio) => ({
  cash: portfolio.cash,
  holdings: portfolio.holdings.map((holding) => ({
    symbol: holding.symbol,
    quantity: holding.quantity,
    avgPrice: holding.avgPrice,
  })),
  transactions: portfolio.transactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    symbol: transaction.symbol,
    quantity: transaction.quantity,
    price: transaction.price,
    total: transaction.total,
    timestamp: transaction.timestamp.toISOString(),
  })),
});

/**
 * Generate cache key from holdings data
 */
const generateCacheKey = (holdings) => {
  const holdingsStr = JSON.stringify(holdings.map(h => ({
    symbol: h.symbol,
    quantity: h.quantity,
    avgPrice: h.avgPrice,
  })));
  return `portfolio:analysis:${crypto.createHash('md5').update(holdingsStr).digest('hex')}`;
};

/**
 * Analyze portfolio and return AI-generated recommendations
 */
export const analyzePortfolio = async (req, res, next) => {
  try {
    const { holdings } = req.body;

    // Validate holdings
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      throw new ValidationError('Holdings array is required and must not be empty');
    }

    if (holdings.length > 50) {
      throw new ValidationError('Maximum 50 holdings allowed per analysis');
    }

    // Validate each holding
    for (const holding of holdings) {
      if (!holding.symbol || typeof holding.symbol !== 'string') {
        throw new ValidationError('Each holding must have a valid symbol');
      }
      if (typeof holding.quantity !== 'number' || holding.quantity <= 0) {
        throw new ValidationError('Each holding must have a valid quantity > 0');
      }
      if (typeof holding.avgPrice !== 'number' || holding.avgPrice <= 0) {
        throw new ValidationError('Each holding must have a valid avgPrice > 0');
      }
    }

    // Check cache first
    const cacheKey = generateCacheKey(holdings);
    const redis = getRedisClient();
    let cached = false;

    if (redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          return res.status(200).json({
            success: true,
            analysis: parsed.analysis,
            timestamp: parsed.timestamp,
            cached: true,
          });
        }
      } catch (error) {
        logger.warn('Redis cache read error:', error);
      }
    }

    // Fetch current quotes for all holdings
    const symbols = holdings.map(h => h.symbol.toUpperCase());
    logger.info(`Fetching quotes for ${symbols.length} symbols`);

    const quotePromises = symbols.map(symbol =>
      stockService.getStockQuote(symbol).catch(error => {
        logger.warn(`Failed to fetch quote for ${symbol}:`, error.message);
        return null;
      })
    );

    const quotesArray = await Promise.all(quotePromises);
    
    // Create quotes map
    const quotes = {};
    quotesArray.forEach((quote, index) => {
      if (quote) {
        quotes[symbols[index]] = quote;
      }
    });

    // Fetch market sentiment for all holdings
    logger.info(`Fetching market sentiment for ${symbols.length} symbols`);
    const marketSentiment = await aggregatePortfolioSentiment(symbols);

    // Call OpenAI service for analysis
    logger.info('Generating AI analysis');
    const analysis = await analyzePortfolioAI(holdings, quotes, marketSentiment);

    // Cache the result (10 minutes)
    if (redis) {
      try {
        const cacheData = {
          analysis,
          timestamp: new Date().toISOString(),
        };
        await redis.setEx(cacheKey, 600, JSON.stringify(cacheData)); // 10 min TTL
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    res.status(200).json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's portfolio
 */
export const getPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.getUserPortfolio(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        portfolio: serializePortfolio(portfolio),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buy stock
 */
export const buyStock = async (req, res, next) => {
  try {
    const { symbol, quantity, price } = req.body;

    if (!symbol || !quantity || !price) {
      throw new ValidationError('Symbol, quantity, and price are required');
    }

    await portfolioService.buyStock(
      req.user.id,
      symbol,
      parseFloat(quantity),
      parseFloat(price)
    );
    const portfolio = await portfolioService.getUserPortfolio(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        portfolio: serializePortfolio(portfolio),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sell stock
 */
export const sellStock = async (req, res, next) => {
  try {
    const { symbol, quantity, price } = req.body;

    if (!symbol || !quantity || !price) {
      throw new ValidationError('Symbol, quantity, and price are required');
    }

    await portfolioService.sellStock(
      req.user.id,
      symbol,
      parseFloat(quantity),
      parseFloat(price)
    );
    const portfolio = await portfolioService.getUserPortfolio(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        portfolio: serializePortfolio(portfolio),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Migrate localStorage data
 */
export const migratePortfolio = async (req, res, next) => {
  try {
    const { portfolioData } = req.body;

    const result = await portfolioService.migrateLocalStorageData(
      req.user.id,
      portfolioData
    );
    const portfolio = await portfolioService.getUserPortfolio(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        migrated: result !== null,
        portfolio: serializePortfolio(portfolio),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset portfolio
 */
export const resetPortfolio = async (req, res, next) => {
  try {
    await portfolioService.resetPortfolio(req.user.id);
    const portfolio = await portfolioService.getUserPortfolio(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        portfolio: serializePortfolio(portfolio),
      },
    });
  } catch (error) {
    next(error);
  }
};

