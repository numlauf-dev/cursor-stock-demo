import axios from 'axios';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

const STOCK_API_PROVIDER = process.env.STOCK_API_PROVIDER || 'alphavantage';
const STOCK_API_KEY = process.env.STOCK_API_KEY;

// Cache TTLs (in seconds)
const CACHE_TTL = {
  QUOTE: 300, // 5 minutes
  SEARCH: 3600, // 1 hour
  HISTORY: 86400, // 24 hours
};

const getCacheKey = (type, symbol) => `stock:${type}:${symbol}`;

// Alpha Vantage API client
const alphaVantageClient = axios.create({
  baseURL: 'https://www.alphavantage.co/query',
  timeout: 10000,
});

const fetchFromAlphaVantage = async (params) => {
  try {
    const response = await alphaVantageClient.get('', {
      params: {
        ...params,
        apikey: STOCK_API_KEY,
      },
    });

    if (response.data['Error Message'] || response.data['Note']) {
      throw new Error(response.data['Error Message'] || response.data['Note']);
    }

    return response.data;
  } catch (error) {
    logger.error('Alpha Vantage API Error:', error);
    throw error;
  }
};

// Mock data for development/testing when API key is not available
const getMockStockData = (symbol) => ({
  'Global Quote': {
    '01. symbol': symbol,
    '02. open': '150.00',
    '03. high': '155.00',
    '04. low': '149.00',
    '05. price': '152.50',
    '06. volume': '1000000',
    '07. latest trading day': new Date().toISOString().split('T')[0],
    '08. previous close': '150.00',
    '09. change': '2.50',
    '10. change percent': '1.67%',
  },
});

export const searchStocks = async (query) => {
  const cacheKey = getCacheKey('search', query.toLowerCase());
  const redis = getRedisClient();

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }
  }

  try {
    let data;

    if (!STOCK_API_KEY || STOCK_API_PROVIDER === 'mock') {
      // Mock data for development
      logger.info('Using mock data for stock search');
      data = {
        bestMatches: [
          {
            '1. symbol': query.toUpperCase(),
            '2. name': `${query.toUpperCase()} Inc.`,
            '3. type': 'Equity',
            '4. region': 'United States',
            '5. marketOpen': '09:30',
            '6. marketClose': '16:00',
            '7. timezone': 'UTC-5',
            '8. currency': 'USD',
            '9. matchScore': '1.0000',
          },
        ],
      };
    } else {
      data = await fetchFromAlphaVantage({
        function: 'SYMBOL_SEARCH',
        keywords: query,
      });
    }

    const results = data.bestMatches || [];

    // Cache results
    if (redis && results.length > 0) {
      try {
        await redis.setEx(cacheKey, CACHE_TTL.SEARCH, JSON.stringify(results));
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Stock search error:', error);
    throw new NotFoundError('Failed to search stocks');
  }
};

export const getStockQuote = async (symbol) => {
  const cacheKey = getCacheKey('quote', symbol.toUpperCase());
  const redis = getRedisClient();

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }
  }

  try {
    let data;

    if (!STOCK_API_KEY || STOCK_API_PROVIDER === 'mock') {
      // Mock data for development
      logger.info('Using mock data for stock quote');
      data = getMockStockData(symbol.toUpperCase());
    } else {
      data = await fetchFromAlphaVantage({
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase(),
      });
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      throw new NotFoundError(`Stock quote not found for symbol: ${symbol}`);
    }

    const formattedQuote = {
      symbol: quote['01. symbol'],
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      price: parseFloat(quote['05. price']),
      volume: parseInt(quote['06. volume']),
      latestTradingDay: quote['07. latest trading day'],
      previousClose: parseFloat(quote['08. previous close']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    };

    // Cache result
    if (redis) {
      try {
        await redis.setEx(cacheKey, CACHE_TTL.QUOTE, JSON.stringify(formattedQuote));
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    return formattedQuote;
  } catch (error) {
    logger.error('Get stock quote error:', error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new NotFoundError(`Failed to get stock quote for symbol: ${symbol}`);
  }
};

export const getStockHistory = async (symbol, period = '1m') => {
  const cacheKey = getCacheKey('history', `${symbol.toUpperCase()}:${period}`);
  const redis = getRedisClient();

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }
  }

  try {
    // Map period to Alpha Vantage function
    const functionMap = {
      '1d': 'TIME_SERIES_INTRADAY',
      '1w': 'TIME_SERIES_DAILY',
      '1m': 'TIME_SERIES_DAILY',
      '3m': 'TIME_SERIES_DAILY',
      '6m': 'TIME_SERIES_DAILY',
      '1y': 'TIME_SERIES_DAILY',
      'all': 'TIME_SERIES_DAILY',
    };

    const functionName = functionMap[period] || 'TIME_SERIES_DAILY';

    let data;

    if (!STOCK_API_KEY || STOCK_API_PROVIDER === 'mock') {
      // Mock historical data
      logger.info('Using mock data for stock history');
      const dates = [];
      const now = new Date();
      const days = period === '1d' ? 1 : period === '1w' ? 7 : period === '1m' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : period === 'all' ? 730 : 365;

      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      data = {
        'Time Series (Daily)': dates.reduce((acc, date) => {
          acc[date] = {
            '1. open': '150.00',
            '2. high': '155.00',
            '3. low': '149.00',
            '4. close': '152.50',
            '5. volume': '1000000',
          };
          return acc;
        }, {}),
      };
    } else {
      data = await fetchFromAlphaVantage({
        function: functionName,
        symbol: symbol.toUpperCase(),
        ...(functionName === 'TIME_SERIES_INTRADAY' && { interval: '60min' }),
        outputsize: (period === '1y' || period === 'all' || period === '6m') ? 'full' : 'compact',
      });
    }

    const timeSeriesKey = Object.keys(data).find((key) => key.includes('Time Series'));
    if (!timeSeriesKey || !data[timeSeriesKey]) {
      throw new NotFoundError(`Historical data not found for symbol: ${symbol}`);
    }

    const history = Object.entries(data[timeSeriesKey]).map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open'] || values['1. open']),
      high: parseFloat(values['2. high'] || values['2. high']),
      low: parseFloat(values['3. low'] || values['3. low']),
      close: parseFloat(values['4. close'] || values['4. close']),
      volume: parseInt(values['5. volume'] || values['5. volume']),
    }));

    // Cache result
    if (redis) {
      try {
        await redis.setEx(cacheKey, CACHE_TTL.HISTORY, JSON.stringify(history));
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    return history;
  } catch (error) {
    logger.error('Get stock history error:', error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new NotFoundError(`Failed to get historical data for symbol: ${symbol}`);
  }
};

export const getTrendingStocks = async () => {
  // Return popular stocks (can be enhanced with actual trending logic)
  const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];
  const quotes = await Promise.all(
    popularSymbols.map((symbol) => getStockQuote(symbol).catch(() => null))
  );

  return quotes.filter((quote) => quote !== null);
};
