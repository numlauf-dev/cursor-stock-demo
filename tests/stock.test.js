import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Stock API', () => {
  let app;

  beforeAll(async () => {
    // Initialize test app
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.STOCK_API_PROVIDER = 'mock'; // Use mock data for tests
    process.env.STOCK_API_KEY = 'test-key';
    
    // Import app after env vars are set
    const { default: testApp } = await import('../backend/server.js');
    app = testApp;
  });

  afterAll(async () => {
    // Cleanup
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

    it('should return history with valid period query param (6m)', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history')
        .query({ period: '6m' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
    });

    it('should return history with valid period query param (all)', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/AAPL/history')
        .query({ period: 'all' });

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
});

