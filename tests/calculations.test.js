import { describe, expect, it } from '@jest/globals';
import {
  calculatePortfolioValue,
  calculateTotalPnL,
  calculateHoldingPnL,
  calculatePnLPercentage,
  formatCurrency,
  formatPercentage,
  formatNumber,
} from '../frontend/utils/calculations.js';

const holdings = [
  { symbol: 'AAPL', quantity: 10, avgPrice: 150 },
  { symbol: 'MSFT', quantity: 4, avgPrice: 300 },
];

describe('calculatePortfolioValue', () => {
  it('values every holding at its current price', () => {
    expect(calculatePortfolioValue(holdings, { AAPL: 160, MSFT: 310 })).toBe(2840);
  });

  it('falls back to the average price for a symbol with no quote', () => {
    expect(calculatePortfolioValue(holdings, { AAPL: 160 })).toBe(2800);
  });

  it('returns zero for an empty portfolio', () => {
    expect(calculatePortfolioValue([], {})).toBe(0);
  });
});

describe('calculateTotalPnL', () => {
  it('sums gains and losses across holdings', () => {
    expect(calculateTotalPnL(holdings, { AAPL: 160, MSFT: 275 })).toBe(0);
  });

  it('returns zero when no quotes are available', () => {
    expect(calculateTotalPnL(holdings, {})).toBe(0);
  });
});

describe('calculateHoldingPnL', () => {
  it('returns the gain on a profitable position', () => {
    expect(calculateHoldingPnL({ quantity: 10, avgPrice: 150 }, 160)).toBe(100);
  });

  it('returns a negative value on a losing position', () => {
    expect(calculateHoldingPnL({ quantity: 10, avgPrice: 150 }, 140)).toBe(-100);
  });
});

describe('calculatePnLPercentage', () => {
  it('returns the percentage move from the average price', () => {
    expect(calculatePnLPercentage({ avgPrice: 150 }, 165)).toBe(10);
  });

  it('returns zero when the average price is zero', () => {
    expect(calculatePnLPercentage({ avgPrice: 0 }, 165)).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats with a thousands separator and two decimals', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-42)).toBe('-$42.00');
  });

  it('rounds to the nearest cent', () => {
    expect(formatCurrency(0.005)).toBe('$0.01');
  });
});

describe('formatPercentage', () => {
  it('prefixes gains with a plus sign', () => {
    expect(formatPercentage(3.456)).toBe('+3.46%');
  });

  it('keeps the minus sign on losses', () => {
    expect(formatPercentage(-3.456)).toBe('-3.46%');
  });

  it('treats zero as non-negative', () => {
    expect(formatPercentage(0)).toBe('+0.00%');
  });
});

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('preserves fractional share quantities', () => {
    expect(formatNumber(1.25)).toBe('1.25');
  });
});
