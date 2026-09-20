import { describe, expect, it } from '@jest/globals';
import {
  calculatePortfolioValue,
  calculateTotalPnL,
  calculateHoldingPnL,
  calculatePnLPercentage,
} from '../frontend/utils/calculations.js';

describe('calculations', () => {
  describe('calculateHoldingPnL', () => {
    it('calculates P&L correctly for a simple holding', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 10,
        avgPrice: 100,
      };
      const currentPrice = 150;

      const pnl = calculateHoldingPnL(holding, currentPrice);

      expect(pnl).toBe(500);
    });

    it('calculates P&L correctly after partial sell', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 6,
        avgPrice: 100,
      };
      const currentPrice = 150;

      const pnl = calculateHoldingPnL(holding, currentPrice);

      expect(pnl).toBe(300);
    });

    it('calculates negative P&L correctly', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 10,
        avgPrice: 150,
      };
      const currentPrice = 100;

      const pnl = calculateHoldingPnL(holding, currentPrice);

      expect(pnl).toBe(-500);
    });
  });

  describe('calculateTotalPnL', () => {
    it('calculates total P&L correctly for multiple holdings', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 10, avgPrice: 100 },
        { symbol: 'GOOGL', quantity: 5, avgPrice: 200 },
      ];
      const currentPrices = {
        AAPL: 150,
        GOOGL: 180,
      };

      const totalPnL = calculateTotalPnL(holdings, currentPrices);

      expect(totalPnL).toBe(400);
    });

    it('calculates total P&L correctly after partial sell', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 6, avgPrice: 100 },
      ];
      const currentPrices = {
        AAPL: 150,
      };

      const totalPnL = calculateTotalPnL(holdings, currentPrices);

      expect(totalPnL).toBe(300);
    });

    it('uses avgPrice as fallback when currentPrice is missing', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 10, avgPrice: 100 },
      ];
      const currentPrices = {};

      const totalPnL = calculateTotalPnL(holdings, currentPrices);

      expect(totalPnL).toBe(0);
    });
  });

  describe('calculatePortfolioValue', () => {
    it('calculates portfolio value correctly', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 10, avgPrice: 100 },
        { symbol: 'GOOGL', quantity: 5, avgPrice: 200 },
      ];
      const currentPrices = {
        AAPL: 150,
        GOOGL: 180,
      };

      const value = calculatePortfolioValue(holdings, currentPrices);

      expect(value).toBe(2400);
    });

    it('calculates portfolio value correctly after partial sell', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 6, avgPrice: 100 },
      ];
      const currentPrices = {
        AAPL: 150,
      };

      const value = calculatePortfolioValue(holdings, currentPrices);

      expect(value).toBe(900);
    });
  });

  describe('calculatePnLPercentage', () => {
    it('calculates P&L percentage correctly', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 10,
        avgPrice: 100,
      };
      const currentPrice = 150;

      const pnlPercent = calculatePnLPercentage(holding, currentPrice);

      expect(pnlPercent).toBe(50);
    });

    it('handles zero avgPrice gracefully', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 10,
        avgPrice: 0,
      };
      const currentPrice = 150;

      const pnlPercent = calculatePnLPercentage(holding, currentPrice);

      expect(pnlPercent).toBe(0);
    });
  });

  describe('P&L calculation scenario from Issue #3', () => {
    it('calculates correct P&L after buying 100 shares and selling 25', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 75, avgPrice: 150 },
      ];
      const currentPrices = {
        AAPL: 160,
      };

      const portfolioValue = calculatePortfolioValue(holdings, currentPrices);
      const totalPnL = calculateTotalPnL(holdings, currentPrices);
      const costBasis = portfolioValue - totalPnL;
      const pnlPercent = costBasis > 0 ? (totalPnL / costBasis) * 100 : 0;

      expect(portfolioValue).toBe(12000);
      expect(totalPnL).toBe(750);
      expect(costBasis).toBe(11250);
      expect(pnlPercent).toBeCloseTo(6.67, 2);
    });
  });
});
