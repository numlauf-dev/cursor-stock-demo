import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { loadTestApp } from './helpers/testConfig.js';

describe('Stock API', () => {
  let app;

  beforeAll(async () => {
    app = await loadTestApp();
  });

  describe('GET /api/v1/stocks/:symbol/history', () => {
    it('should return history for valid symbol (AAPL)', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
      expect(Array.isArray(response.body.data.history)).toBe(true);
      
      // Check history item structure
      if (response.body.data.history.length > 0) {
        const historyItem = response.body.data.history[0];
        expect(historyItem).toHaveProperty('date');
        expect(historyItem).toHaveProperty('open');
        expect(historyItem).toHaveProperty('high');
        expect(historyItem).toHaveProperty('low');
        expect(historyItem).toHaveProperty('close');
        expect(historyItem).toHaveProperty('volume');
      }
    });

    it('should return history with valid period query param (1w)', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history')
        .query({ period: '1w' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
      expect(Array.isArray(response.body.data.history)).toBe(true);
    });

    it('should return history with valid period query param (1m)', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history')
        .query({ period: '1m' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
    });

    it('should return history with valid period query param (3m)', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history')
        .query({ period: '3m' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
    });

    it('should return history with valid period query param (1y)', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history')
        .query({ period: '1y' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
    });

    it('should reject invalid symbol format with special characters', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL@/history');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid symbol format with spaces', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAP L/history');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid period value', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history')
        .query({ period: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject period value not in enum', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history')
        .query({ period: '2m' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle lowercase symbol', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/aapl/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
    });
  });

  describe('GET /api/v1/stocks/:symbol/news', () => {
    it('should return first page with pagination contract and sentiment enum', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/news')
        .query({ limit: 3 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('news');
      expect(response.body.data).toHaveProperty('nextCursor');
      expect(response.body.data).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.data.news)).toBe(true);
      expect(response.body.data.news.length).toBe(3);
      expect(response.body.data.hasMore).toBe(true);
      expect(response.body.data.nextCursor).toBe('3');

      if (response.body.data.news.length > 0) {
        const article = response.body.data.news[0];
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('headline');
        expect(article).toHaveProperty('url');
        expect(article).toHaveProperty('source');
        expect(article).toHaveProperty('publishedAt');
        expect(article).toHaveProperty('sentiment');
        expect(['positive', 'neutral', 'negative']).toContain(article.sentiment);
      }
    });

    it('should return second page using cursor and appendable cursor contract', async () => {
      const firstPage = await request(app)
        .get('/api/v1/stocks/MSFT/news')
        .query({ limit: 4 });

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.hasMore).toBe(true);
      expect(firstPage.body.data.nextCursor).toBe('4');

      const secondPage = await request(app)
        .get('/api/v1/stocks/MSFT/news')
        .query({ limit: 4, cursor: firstPage.body.data.nextCursor });

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.success).toBe(true);
      expect(Array.isArray(secondPage.body.data.news)).toBe(true);
      expect(secondPage.body.data.news.length).toBeGreaterThan(0);
      expect(secondPage.body.data.news.length).toBeLessThanOrEqual(4);

      secondPage.body.data.news.forEach((article) => {
        expect(['positive', 'neutral', 'negative']).toContain(article.sentiment);
      });
    });

    it('should return hasMore false and nextCursor null at end of results', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/news')
        .query({ limit: 20, cursor: 8 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasMore).toBe(false);
      expect(response.body.data.nextCursor).toBeNull();
    });

    it('should reject invalid symbol format', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AA@PL/news');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/news')
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid cursor', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/news')
        .query({ cursor: 'bad-cursor' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 500 for unsupported provider', async () => {
      process.env.STOCK_NEWS_PROVIDER = 'unsupported';

      const response = await request(app)
        .get('/api/v1/stocks/ERRT/news')
        .query({ limit: 1 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      process.env.STOCK_NEWS_PROVIDER = 'mock';
    });
  });
});

