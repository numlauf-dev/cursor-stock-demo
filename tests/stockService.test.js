import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const alphaVantageGetMock = jest.fn();
const axiosGetMock = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: alphaVantageGetMock,
    })),
    get: axiosGetMock,
  },
}));

const stockService = await import('../backend/services/stockService.js');

const {
  formatFinnhubQuote,
  getStockHistory,
  getStockQuote,
  resolveStockApiConfig,
  searchStocks,
} = stockService;

const originalEnv = { ...process.env };

describe('stockService Finnhub provider resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.STOCK_API_PROVIDER;
    delete process.env.STOCK_API_KEY;
    delete process.env.FINNHUB_API_KEY;
    delete process.env.VITE_FINNHUB_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('prefers Finnhub when a real Finnhub key is available', () => {
    process.env.FINNHUB_API_KEY = 'real-finnhub-key';
    process.env.VITE_FINNHUB_API_KEY = 'demo';

    expect(resolveStockApiConfig()).toEqual({
      provider: 'finnhub',
      apiKey: 'real-finnhub-key',
    });
  });

  it('keeps the explicit mock provider for offline and test runs', () => {
    process.env.STOCK_API_PROVIDER = 'mock';
    process.env.FINNHUB_API_KEY = 'real-finnhub-key';
    process.env.STOCK_API_KEY = 'real-alpha-key';

    expect(resolveStockApiConfig()).toEqual({
      provider: 'mock',
      apiKey: null,
    });
  });

  it('falls back to Finnhub when Alpha Vantage is selected without a usable key', () => {
    process.env.STOCK_API_PROVIDER = 'alphavantage';
    process.env.STOCK_API_KEY = 'demo';
    process.env.FINNHUB_API_KEY = 'real-finnhub-key';

    expect(resolveStockApiConfig()).toEqual({
      provider: 'finnhub',
      apiKey: 'real-finnhub-key',
    });
  });

  it('falls back to mock when no real provider key exists', () => {
    process.env.STOCK_API_PROVIDER = 'finnhub';
    process.env.FINNHUB_API_KEY = 'demo';
    process.env.VITE_FINNHUB_API_KEY = 'demo';

    expect(resolveStockApiConfig()).toEqual({
      provider: 'mock',
      apiKey: null,
    });
  });
});

describe('stockService Finnhub adapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STOCK_API_PROVIDER = 'finnhub';
    process.env.FINNHUB_API_KEY = 'real-finnhub-key';
    delete process.env.VITE_FINNHUB_API_KEY;
    delete process.env.STOCK_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('formats Finnhub quote data into the backend quote shape', async () => {
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

    const quote = await getStockQuote('aapl');

    expect(axiosGetMock).toHaveBeenCalledWith('https://finnhub.io/api/v1/quote', {
      params: {
        symbol: 'AAPL',
        token: 'real-finnhub-key',
      },
      timeout: 10000,
    });
    expect(quote).toEqual({
      symbol: 'AAPL',
      open: 180,
      high: 184.5,
      low: 179.1,
      price: 181.23,
      volume: 0,
      latestTradingDay: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      previousClose: 178.5,
      change: 2.73,
      changePercent: 1.53,
    });
  });

  it('adapts Finnhub search results into the existing backend result shape', async () => {
    axiosGetMock.mockResolvedValue({
      data: {
        result: [
          {
            symbol: 'AAPL',
            displaySymbol: 'AAPL',
            description: 'Apple Inc',
            type: 'Common Stock',
          },
        ],
      },
    });

    const results = await searchStocks('apple');

    expect(axiosGetMock).toHaveBeenCalledWith('https://finnhub.io/api/v1/search', {
      params: {
        q: 'apple',
        token: 'real-finnhub-key',
      },
      timeout: 10000,
    });
    expect(results).toEqual([
      {
        '1. symbol': 'AAPL',
        '2. name': 'Apple Inc',
        '3. type': 'Common Stock',
        '4. region': '',
        '5. marketOpen': '',
        '6. marketClose': '',
        '7. timezone': '',
        '8. currency': '',
        '9. matchScore': '',
      },
    ]);
  });

  it('falls back to mock history when Finnhub candles are unavailable', async () => {
    axiosGetMock.mockResolvedValue({
      data: {
        s: 'no_data',
      },
    });

    const history = await getStockHistory('AAPL', '1m');

    expect(axiosGetMock).toHaveBeenCalledWith('https://finnhub.io/api/v1/stock/candle', {
      params: expect.objectContaining({
        symbol: 'AAPL',
        resolution: 'D',
        token: 'real-finnhub-key',
      }),
      timeout: 10000,
    });
    expect(Array.isArray(history)).toBe(true);
    expect(history).toHaveLength(30);
    expect(history[0]).toMatchObject({
      open: expect.any(Number),
      high: expect.any(Number),
      low: expect.any(Number),
      close: expect.any(Number),
      volume: expect.any(Number),
    });
    expect(new Date(history[0].date).getTime()).toBeLessThan(new Date(history[history.length - 1].date).getTime());
  });

  it('returns multiple intraday points for 1d fallback history', async () => {
    axiosGetMock.mockResolvedValue({
      data: {
        s: 'no_data',
      },
    });

    const history = await getStockHistory('AAPL', '1d');

    expect(history).toHaveLength(7);
    history.forEach((candle) => {
      expect(candle).toMatchObject({
        date: expect.any(String),
        open: expect.any(Number),
        high: expect.any(Number),
        low: expect.any(Number),
        close: expect.any(Number),
        volume: expect.any(Number),
      });
    });
  });

  it('supports all-time fallback history for longer-lived portfolio charts', async () => {
    axiosGetMock.mockResolvedValue({
      data: {
        s: 'no_data',
      },
    });

    const history = await getStockHistory('AAPL', 'all');

    expect(history).toHaveLength(260);
    expect(new Date(history[0].date).getTime()).toBeLessThan(new Date(history[history.length - 1].date).getTime());
  });

  it('rejects unusable Finnhub quote payloads', () => {
    expect(() => formatFinnhubQuote('AAPL', { c: 0 })).toThrow('Stock quote not found for symbol: AAPL');
  });
});
