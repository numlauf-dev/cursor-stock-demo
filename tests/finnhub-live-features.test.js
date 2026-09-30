import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const axiosGetMock = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
    })),
    get: axiosGetMock,
  },
}));

const stockService = await import('../backend/services/stockService.js');

const {
  getStockQuote,
  getStockHistory,
  getStockNews,
  getMarketStatus,
  resolveStockApiConfig,
} = stockService;

const originalEnv = { ...process.env };

describe('Synthetic history anchored to live quotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STOCK_API_PROVIDER = 'finnhub';
    process.env.FINNHUB_API_KEY = 'test-finnhub-key';
    delete process.env.VITE_FINNHUB_API_KEY;
    delete process.env.STOCK_API_KEY;
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-30T15:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = { ...originalEnv };
  });

  it('generates synthetic history that ends at current price from live quote', async () => {
    axiosGetMock.mockResolvedValueOnce({
      data: {
        c: 181.23,
        h: 184.5,
        l: 179.1,
        o: 180.0,
        pc: 178.5,
        d: 2.73,
        dp: 1.53,
      },
    });

    const history = await getStockHistory('AAPL', '1m');

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(30);
    
    const lastCandle = history[history.length - 1];
    expect(lastCandle.close).toBe(178.5);
  });

  it('generates synthetic 1d intraday history passing through live open/high/low', async () => {
    axiosGetMock.mockResolvedValueOnce({
      data: {
        c: 182.0,
        h: 185.0,
        l: 179.0,
        o: 180.5,
        pc: 178.0,
        d: 4.0,
        dp: 2.25,
      },
    });

    const history = await getStockHistory('AAPL', '1d');

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(7);
    
    const lastCandle = history[history.length - 1];
    expect(lastCandle.close).toBe(182.0);
    
    const firstCandle = history[0];
    expect(firstCandle.close).toBe(178.0);
  });

  it('generates deterministic synthetic history for same symbol and day', async () => {
    axiosGetMock.mockResolvedValue({
      data: {
        c: 181.23,
        h: 184.5,
        l: 179.1,
        o: 180.0,
        pc: 178.5,
        d: 2.73,
        dp: 1.53,
      },
    });

    const history1 = await getStockHistory('AAPL', '1m');
    const history2 = await getStockHistory('AAPL', '1m');

    expect(history1).toEqual(history2);
  });
});

describe('News fallback and caching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STOCK_API_PROVIDER = 'auto';
    process.env.FINNHUB_API_KEY = 'test-finnhub-key';
    delete process.env.VITE_FINNHUB_API_KEY;
    delete process.env.STOCK_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns mock news silently when Finnhub returns empty array', async () => {
    axiosGetMock.mockResolvedValueOnce({
      data: [],
    });

    const result = await getStockNews('AAPL', { limit: 5 });

    expect(result.news).toBeDefined();
    expect(Array.isArray(result.news)).toBe(true);
    expect(result.news.length).toBeGreaterThan(0);
  });

  it('returns mock news when Finnhub returns non-array response', async () => {
    axiosGetMock.mockResolvedValueOnce({
      data: { error: 'Invalid symbol' },
    });

    const result = await getStockNews('AAPL', { limit: 5 });

    expect(result.news).toBeDefined();
    expect(Array.isArray(result.news)).toBe(true);
  });

  it('returns mock news when Finnhub key is demo', async () => {
    process.env.FINNHUB_API_KEY = 'demo';

    const result = await getStockNews('AAPL', { limit: 5 });

    expect(result.news).toBeDefined();
    expect(Array.isArray(result.news)).toBe(true);
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('handles Finnhub news fetch errors gracefully and returns mock news', async () => {
    axiosGetMock.mockRejectedValueOnce(new Error('Network error'));

    const result = await getStockNews('AAPL', { limit: 5 });

    expect(result.news).toBeDefined();
    expect(Array.isArray(result.news)).toBe(true);
    expect(result.news.length).toBeGreaterThan(0);
  });
});

describe('Rate limit handling (429 errors)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STOCK_API_PROVIDER = 'finnhub';
    process.env.FINNHUB_API_KEY = 'test-finnhub-key';
    delete process.env.VITE_FINNHUB_API_KEY;
    delete process.env.STOCK_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns mock news on 429 rate limit for news endpoint', async () => {
    const rateLimitError = new Error('Too Many Requests');
    rateLimitError.response = { status: 429 };
    axiosGetMock.mockRejectedValueOnce(rateLimitError);

    const result = await getStockNews('AAPL', { limit: 5 });

    expect(result.news).toBeDefined();
    expect(Array.isArray(result.news)).toBe(true);
    expect(result.news.length).toBeGreaterThan(0);
  });
});

describe('News provider defaults to Finnhub when key exists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.STOCK_NEWS_PROVIDER;
    delete process.env.STOCK_API_PROVIDER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to Finnhub for news when key is available', async () => {
    process.env.FINNHUB_API_KEY = 'real-key';

    axiosGetMock.mockResolvedValueOnce({
      data: [
        {
          category: 'company news',
          datetime: Math.floor(Date.now() / 1000) - 3600,
          headline: 'Apple announces new product',
          id: 123,
          image: '',
          related: 'AAPL',
          source: 'Reuters',
          summary: 'Apple revealed new product line',
          url: 'https://example.com/news',
        },
      ],
    });

    const result = await getStockNews('AAPL', { limit: 5 });

    expect(axiosGetMock).toHaveBeenCalled();
    expect(result.news).toBeDefined();
    expect(result.news.length).toBeGreaterThan(0);
  });

  it('uses mock news when Finnhub key is demo', async () => {
    process.env.FINNHUB_API_KEY = 'demo';

    const result = await getStockNews('AAPL', { limit: 5 });

    expect(axiosGetMock).not.toHaveBeenCalled();
    expect(result.news).toBeDefined();
  });
});

describe('Market status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns market open status during market hours', () => {
    jest.setSystemTime(new Date('2026-09-30T15:00:00Z'));

    const status = getMarketStatus();

    expect(status).toBeDefined();
    expect(status.isOpen).toBe(true);
    expect(status.timestamp).toBeDefined();
  });

  it('returns market closed status outside market hours', () => {
    jest.setSystemTime(new Date('2026-09-30T05:00:00Z'));

    const status = getMarketStatus();

    expect(status).toBeDefined();
    expect(status.isOpen).toBe(false);
  });

  it('returns market closed status on weekends', () => {
    jest.setSystemTime(new Date('2026-10-03T15:00:00Z'));

    const status = getMarketStatus();

    expect(status).toBeDefined();
    expect(status.isOpen).toBe(false);
  });
});

describe('Error resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STOCK_API_PROVIDER = 'finnhub';
    process.env.FINNHUB_API_KEY = 'test-finnhub-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('handles connection reset errors gracefully', async () => {
    const resetError = new Error('Connection reset');
    resetError.code = 'ECONNRESET';
    axiosGetMock.mockRejectedValueOnce(resetError);

    await expect(getStockQuote('MSFT')).rejects.toThrow();
  });
});
