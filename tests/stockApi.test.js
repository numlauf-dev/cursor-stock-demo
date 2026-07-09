import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { __testables, stockApi } from '../frontend/services/stockApi.js';

const stripTimestamp = (quote) => {
  const { timestamp, ...rest } = quote;
  return rest;
};

describe('frontend stockApi quote handling', () => {
  beforeEach(() => {
    __testables.clearCache();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('maps backend quote.price into the frontend currentPrice shape', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          quote: {
            symbol: 'AAPL',
            open: 180,
            high: 184.5,
            low: 179.1,
            price: 181.23,
            volume: 1234567,
            latestTradingDay: '2026-07-09',
            previousClose: 178.5,
            change: 2.73,
            changePercent: 1.53,
          },
        },
      }),
    });

    const quote = await stockApi.getQuote('AAPL');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/stocks/AAPL/quote');
    expect(quote).toMatchObject({
      symbol: 'AAPL',
      currentPrice: 181.23,
      price: 181.23,
      change: 2.73,
      changePercent: 1.53,
      high: 184.5,
      low: 179.1,
      open: 180,
      previousClose: 178.5,
      volume: 1234567,
      latestTradingDay: '2026-07-09',
    });
    expect(quote.timestamp).toEqual(expect.any(Number));
  });

  it('returns a deterministic fallback quote when the backend request fails', async () => {
    global.fetch.mockRejectedValue(new Error('backend unavailable'));

    const firstQuote = await stockApi.getQuote('BKKT');
    __testables.clearCache();
    const secondQuote = await stockApi.getQuote('BKKT');
    __testables.clearCache();
    const otherSymbolQuote = await stockApi.getQuote('AAPL');

    expect(stripTimestamp(firstQuote)).toEqual(stripTimestamp(secondQuote));
    expect(firstQuote.currentPrice).not.toBe(otherSymbolQuote.currentPrice);
    expect(firstQuote.change).toBe(secondQuote.change);
    expect(firstQuote.changePercent).toBe(secondQuote.changePercent);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
