import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { loadTestApp } from './helpers/testConfig.js';

describe('Portfolio API', () => {
  let app;
  let authToken;
  let requestCounter = 0;

  const nextIp = () => `203.0.113.${++requestCounter}`;

  const portfolioRequest = (method, url) => request(app)[method](url)
    .set('Authorization', `Bearer ${authToken}`)
    .set('X-Forwarded-For', nextIp());

  beforeAll(async () => {
    app = await loadTestApp();

    const authResponse = await request(app)
      .post('/api/v1/auth/default')
      .set('X-Forwarded-For', nextIp());

    authToken = authResponse.body.data.token;
  });

  beforeEach(async () => {
    await portfolioRequest('post', '/api/v1/portfolio/reset').send({});
  });

  it('returns the initial portfolio shape from GET /api/v1/portfolio', async () => {
    const response = await portfolioRequest('get', '/api/v1/portfolio');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.portfolio).toEqual({
      cash: 100000,
      holdings: [],
      transactions: [],
    });
  });

  it('returns the full updated portfolio after buy requests, including averaged holdings', async () => {
    await portfolioRequest('post', '/api/v1/portfolio/buy').send({
      symbol: 'aapl',
      quantity: 4,
      price: 100,
    });

    const response = await portfolioRequest('post', '/api/v1/portfolio/buy').send({
      symbol: 'AAPL',
      quantity: 2,
      price: 160,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.portfolio.cash).toBe(99280);
    expect(response.body.data.portfolio.holdings).toEqual([
      {
        symbol: 'AAPL',
        quantity: 6,
        avgPrice: 120,
      },
    ]);
    expect(response.body.data.portfolio.transactions).toHaveLength(2);
    expect(response.body.data.portfolio.transactions[0]).toMatchObject({
      type: 'BUY',
      symbol: 'AAPL',
      quantity: 2,
      price: 160,
      total: 320,
    });
  });

  it('returns the full updated portfolio after sells and rejects insufficient shares', async () => {
    await portfolioRequest('post', '/api/v1/portfolio/buy').send({
      symbol: 'AAPL',
      quantity: 5,
      price: 100,
    });

    const sellResponse = await portfolioRequest('post', '/api/v1/portfolio/sell').send({
      symbol: 'AAPL',
      quantity: 2,
      price: 150,
    });

    expect(sellResponse.status).toBe(200);
    expect(sellResponse.body.data.portfolio.cash).toBe(99800);
    expect(sellResponse.body.data.portfolio.holdings).toEqual([
      {
        symbol: 'AAPL',
        quantity: 3,
        avgPrice: 100,
      },
    ]);
    expect(sellResponse.body.data.portfolio.transactions[0]).toMatchObject({
      type: 'SELL',
      symbol: 'AAPL',
      quantity: 2,
      price: 150,
      total: 300,
    });

    const insufficientSharesResponse = await portfolioRequest('post', '/api/v1/portfolio/sell').send({
      symbol: 'AAPL',
      quantity: 10,
      price: 150,
    });

    expect(insufficientSharesResponse.status).toBe(400);
    expect(insufficientSharesResponse.body).toMatchObject({
      success: false,
      error: 'Insufficient shares',
    });
  });

  it('preserves fractional quantities through the buy and sell API flow', async () => {
    const firstBuy = await portfolioRequest('post', '/api/v1/portfolio/buy').send({
      symbol: 'AAPL',
      quantity: 1.5,
      price: 100,
    });

    expect(firstBuy.status).toBe(200);
    expect(firstBuy.body.data.portfolio.holdings).toEqual([
      {
        symbol: 'AAPL',
        quantity: 1.5,
        avgPrice: 100,
      },
    ]);

    const sellResponse = await portfolioRequest('post', '/api/v1/portfolio/sell').send({
      symbol: 'AAPL',
      quantity: 0.25,
      price: 140,
    });

    expect(sellResponse.status).toBe(200);
    expect(sellResponse.body.data.portfolio.cash).toBeCloseTo(99885);
    expect(sellResponse.body.data.portfolio.holdings).toEqual([
      {
        symbol: 'AAPL',
        quantity: 1.25,
        avgPrice: 100,
      },
    ]);
    expect(sellResponse.body.data.portfolio.transactions[0]).toMatchObject({
      type: 'SELL',
      symbol: 'AAPL',
      quantity: 0.25,
      price: 140,
      total: 35,
    });
    expect(sellResponse.body.data.portfolio.transactions[1]).toMatchObject({
      type: 'BUY',
      symbol: 'AAPL',
      quantity: 1.5,
      price: 100,
      total: 150,
    });
  });

  it('migrates legacy localStorage data once and reports subsequent migrations as no-ops', async () => {
    const portfolioData = {
      cash: 99750,
      holdings: [
        {
          symbol: 'msft',
          quantity: 5,
          avgPrice: 50,
        },
      ],
      transactions: [
        {
          type: 'buy',
          symbol: 'msft',
          quantity: 5,
          price: 50,
          total: 250,
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    const firstResponse = await portfolioRequest('post', '/api/v1/portfolio/migrate').send({
      portfolioData,
    });
    const secondResponse = await portfolioRequest('post', '/api/v1/portfolio/migrate').send({
      portfolioData,
    });

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.data).toMatchObject({
      migrated: true,
    });
    expect(firstResponse.body.data.portfolio.holdings).toEqual([
      {
        symbol: 'MSFT',
        quantity: 5,
        avgPrice: 50,
      },
    ]);
    expect(firstResponse.body.data.portfolio.transactions[0]).toMatchObject({
      type: 'BUY',
      symbol: 'MSFT',
      quantity: 5,
      price: 50,
      total: 250,
    });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.data.migrated).toBe(false);
    expect(secondResponse.body.data.portfolio.holdings).toHaveLength(1);
    expect(secondResponse.body.data.portfolio.transactions).toHaveLength(1);
  });

  it('returns a fresh portfolio from POST /api/v1/portfolio/reset', async () => {
    await portfolioRequest('post', '/api/v1/portfolio/buy').send({
      symbol: 'AAPL',
      quantity: 5,
      price: 100,
    });

    const response = await portfolioRequest('post', '/api/v1/portfolio/reset').send({});

    expect(response.status).toBe(200);
    expect(response.body.data.portfolio).toEqual({
      cash: 100000,
      holdings: [],
      transactions: [],
    });
  });

  it('returns the reconstructed performance series from GET /api/v1/portfolio/performance', async () => {
    await portfolioRequest('post', '/api/v1/portfolio/migrate').send({
      portfolioData: {
        cash: 99000,
        holdings: [
          {
            symbol: 'AAPL',
            quantity: 10,
            avgPrice: 100,
          },
        ],
        transactions: [
          {
            type: 'BUY',
            symbol: 'AAPL',
            quantity: 10,
            price: 100,
            total: 1000,
            timestamp: '2024-01-10T10:00:00.000Z',
          },
        ],
      },
    });

    const response = await portfolioRequest('get', '/api/v1/portfolio/performance?period=1m');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.period).toBe('1m');
    expect(Array.isArray(response.body.data.series)).toBe(true);
    expect(response.body.data.series.length).toBeGreaterThan(0);
    expect(response.body.data.series[response.body.data.series.length - 1]).toEqual(
      expect.objectContaining({
        date: expect.any(String),
        totalValue: expect.any(Number),
        cash: expect.any(Number),
        holdingsValue: expect.any(Number),
        pnl: expect.any(Number),
      })
    );
  });
});
