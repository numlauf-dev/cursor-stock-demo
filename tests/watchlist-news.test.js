import request from 'supertest';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { loadTestApp, loadTestPrisma } from './helpers/testConfig.js';

describe('Watchlist News API', () => {
  let app;
  let prisma;
  let authHeader;
  let watchlistId;

  beforeAll(async () => {
    app = await loadTestApp();
    prisma = await loadTestPrisma();

    const defaultAuthResponse = await request(app)
      .post('/api/v1/auth/default')
      .send({});

    expect(defaultAuthResponse.status).toBe(200);
    authHeader = `Bearer ${defaultAuthResponse.body.data.token}`;
    const userId = defaultAuthResponse.body.data.user.id;

    await prisma.watchlistItem.deleteMany({
      where: {
        watchlist: {
          userId,
        },
      },
    });

    await prisma.watchlist.deleteMany({
      where: { userId },
    });

    const watchlistResponse = await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', authHeader)
      .send({ name: 'DEMO-21 Test Watchlist' });

    expect(watchlistResponse.status).toBe(201);
    watchlistId = watchlistResponse.body.data.watchlist.id;

    for (const symbol of ['AAPL', 'MSFT', 'TSLA']) {
      const addResponse = await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/stocks`)
        .set('Authorization', authHeader)
        .send({ symbol });

      expect(addResponse.status).toBe(201);
    }
  });

  describe('GET /api/v1/watchlists/:id/news', () => {
    it('returns aggregated, deduped, and sorted feed newest first by default', async () => {
      const response = await request(app)
        .get(`/api/v1/watchlists/${watchlistId}/news`)
        .set('Authorization', authHeader)
        .query({ limit: 50 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.news)).toBe(true);
      expect(response.body.data.news.length).toBeGreaterThan(0);

      const allowedSymbols = new Set(['AAPL', 'MSFT', 'TSLA']);
      const uniqueUrls = new Set();
      response.body.data.news.forEach((article) => {
        expect(allowedSymbols.has(article.symbol)).toBe(true);
        expect(['positive', 'neutral', 'negative']).toContain(article.sentiment);
        expect(typeof article.url).toBe('string');
        if (article.url) {
          expect(uniqueUrls.has(article.url)).toBe(false);
          uniqueUrls.add(article.url);
        }
      });

      for (let index = 1; index < response.body.data.news.length; index += 1) {
        const previousTimestamp = new Date(response.body.data.news[index - 1].publishedAt).getTime();
        const currentTimestamp = new Date(response.body.data.news[index].publishedAt).getTime();
        expect(previousTimestamp).toBeGreaterThanOrEqual(currentTimestamp);
      }
    });

    it('supports pagination contract across pages', async () => {
      const firstPage = await request(app)
        .get(`/api/v1/watchlists/${watchlistId}/news`)
        .set('Authorization', authHeader)
        .query({ limit: 4 });

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.news.length).toBe(4);
      expect(firstPage.body.data.hasMore).toBe(true);
      expect(firstPage.body.data.nextCursor).toBe('4');

      const secondPage = await request(app)
        .get(`/api/v1/watchlists/${watchlistId}/news`)
        .set('Authorization', authHeader)
        .query({ limit: 4, cursor: firstPage.body.data.nextCursor });

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.success).toBe(true);
      expect(secondPage.body.data.news.length).toBeGreaterThan(0);
      expect(secondPage.body.data.news.length).toBeLessThanOrEqual(4);
      expect(['positive', 'neutral', 'negative']).toContain(secondPage.body.data.news[0].sentiment);
    });

    it('filters by symbol and sentiment and supports sort override', async () => {
      const response = await request(app)
        .get(`/api/v1/watchlists/${watchlistId}/news`)
        .set('Authorization', authHeader)
        .query({
          limit: 20,
          symbol: 'AAPL',
          sentiment: 'negative',
          sort: 'publishedAt:asc',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.news.forEach((article) => {
        expect(article.symbol).toBe('AAPL');
        expect(article.sentiment).toBe('negative');
      });

      for (let index = 1; index < response.body.data.news.length; index += 1) {
        const previousTimestamp = new Date(response.body.data.news[index - 1].publishedAt).getTime();
        const currentTimestamp = new Date(response.body.data.news[index].publishedAt).getTime();
        expect(previousTimestamp).toBeLessThanOrEqual(currentTimestamp);
      }
    });

    it('returns 400 for invalid sort and sentiment filters', async () => {
      const invalidSortResponse = await request(app)
        .get(`/api/v1/watchlists/${watchlistId}/news`)
        .set('Authorization', authHeader)
        .query({ sort: 'invalid-sort' });

      expect(invalidSortResponse.status).toBe(400);
      expect(invalidSortResponse.body.success).toBe(false);

      const invalidSentimentResponse = await request(app)
        .get(`/api/v1/watchlists/${watchlistId}/news`)
        .set('Authorization', authHeader)
        .query({ sentiment: 'very-positive' });

      expect(invalidSentimentResponse.status).toBe(400);
      expect(invalidSentimentResponse.body.success).toBe(false);
    });

    it('returns 400 for invalid watchlist id', async () => {
      const response = await request(app)
        .get('/api/v1/watchlists/not-a-uuid/news')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
