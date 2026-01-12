import axios from 'axios';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Cache TTLs (in seconds)
const CACHE_TTL = {
  NEWS: 900, // 15 minutes
  RECOMMENDATION: 3600, // 1 hour
};

const getCacheKey = (type, symbol) => `sentiment:${type}:${symbol}`;

/**
 * Fetch company news from Finnhub
 */
const fetchCompanyNews = async (symbol) => {
  if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'demo') {
    logger.info('Finnhub API key not configured, returning mock sentiment');
    return getMockSentiment(symbol);
  }

  const cacheKey = getCacheKey('news', symbol);
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
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 7); // Last 7 days
    
    const response = await axios.get(`${FINNHUB_BASE_URL}/company-news`, {
      params: {
        symbol: symbol.toUpperCase(),
        from: fromDate.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
        token: FINNHUB_API_KEY,
      },
      timeout: 10000,
    });

    const news = response.data || [];
    
    // Simple sentiment analysis based on headline keywords
    const positiveKeywords = ['up', 'gain', 'rise', 'surge', 'beat', 'exceed', 'growth', 'profit', 'bullish'];
    const negativeKeywords = ['down', 'fall', 'drop', 'decline', 'miss', 'loss', 'bearish', 'concern', 'warning'];
    
    let sentimentScore = 0;
    news.slice(0, 10).forEach((article) => {
      const headline = (article.headline || '').toLowerCase();
      positiveKeywords.forEach(keyword => {
        if (headline.includes(keyword)) sentimentScore += 1;
      });
      negativeKeywords.forEach(keyword => {
        if (headline.includes(keyword)) sentimentScore -= 1;
      });
    });

    const sentiment = {
      newsCount: news.length,
      sentimentScore,
      sentiment: sentimentScore > 2 ? 'positive' : sentimentScore < -2 ? 'negative' : 'neutral',
      recentNews: news.slice(0, 5).map(article => ({
        headline: article.headline,
        url: article.url,
        datetime: article.datetime,
      })),
    };

    // Cache result
    if (redis) {
      try {
        await redis.setEx(cacheKey, CACHE_TTL.NEWS, JSON.stringify(sentiment));
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    return sentiment;
  } catch (error) {
    logger.error(`Error fetching news for ${symbol}:`, error.message);
    return getMockSentiment(symbol);
  }
};

/**
 * Fetch analyst recommendations from Finnhub
 */
const fetchRecommendations = async (symbol) => {
  if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'demo') {
    return null;
  }

  const cacheKey = getCacheKey('recommendation', symbol);
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
    const response = await axios.get(`${FINNHUB_BASE_URL}/stock/recommendation`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: FINNHUB_API_KEY,
      },
      timeout: 10000,
    });

    const data = response.data || {};
    
    // Get most recent recommendation
    const periods = ['0', '1', '2', '3'];
    let recommendation = null;
    
    for (const period of periods) {
      if (data[period]) {
        const rec = data[period];
        const total = rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell;
        if (total > 0) {
          const buyScore = rec.strongBuy * 2 + rec.buy;
          const sellScore = rec.strongSell * 2 + rec.sell;
          
          if (buyScore > sellScore && buyScore > rec.hold) {
            recommendation = 'BUY';
          } else if (sellScore > buyScore && sellScore > rec.hold) {
            recommendation = 'SELL';
          } else {
            recommendation = 'HOLD';
          }
          break;
        }
      }
    }

    // Cache result
    if (redis && recommendation) {
      try {
        await redis.setEx(cacheKey, CACHE_TTL.RECOMMENDATION, JSON.stringify({ recommendation }));
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    return recommendation ? { recommendation } : null;
  } catch (error) {
    logger.error(`Error fetching recommendations for ${symbol}:`, error.message);
    return null;
  }
};

/**
 * Get market sentiment for a single stock
 */
export const getStockSentiment = async (symbol) => {
  try {
    const [newsSentiment, recommendation] = await Promise.all([
      fetchCompanyNews(symbol),
      fetchRecommendations(symbol),
    ]);

    return {
      ...newsSentiment,
      ...recommendation,
    };
  } catch (error) {
    logger.error(`Error getting sentiment for ${symbol}:`, error);
    return getMockSentiment(symbol);
  }
};

/**
 * Aggregate sentiment for multiple stocks
 */
export const aggregatePortfolioSentiment = async (symbols) => {
  if (!symbols || symbols.length === 0) {
    return {};
  }

  try {
    // Fetch sentiment for all symbols in parallel
    const sentimentPromises = symbols.map(symbol => 
      getStockSentiment(symbol).catch(error => {
        logger.error(`Failed to get sentiment for ${symbol}:`, error);
        return getMockSentiment(symbol);
      })
    );

    const sentiments = await Promise.all(sentimentPromises);
    
    // Create a map of symbol -> sentiment
    const sentimentMap = {};
    symbols.forEach((symbol, index) => {
      sentimentMap[symbol] = sentiments[index] || getMockSentiment(symbol);
    });

    return sentimentMap;
  } catch (error) {
    logger.error('Error aggregating portfolio sentiment:', error);
    // Return mock sentiment for all symbols
    const sentimentMap = {};
    symbols.forEach(symbol => {
      sentimentMap[symbol] = getMockSentiment(symbol);
    });
    return sentimentMap;
  }
};

/**
 * Generate mock sentiment data for development/testing
 */
const getMockSentiment = (symbol) => {
  return {
    newsCount: Math.floor(Math.random() * 10) + 1,
    sentimentScore: Math.floor(Math.random() * 6) - 3,
    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
    recommendation: ['BUY', 'HOLD', 'SELL'][Math.floor(Math.random() * 3)],
    recentNews: [],
  };
};

