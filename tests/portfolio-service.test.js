import { afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { loadTestPrisma } from './helpers/testConfig.js';

describe('portfolioService', () => {
  let prisma;
  let portfolioService;
  const createdUserIds = [];
  const FIXED_NOW = new Date('2024-01-31T12:00:00.000Z');

  const createTestUser = async () => {
    const user = await prisma.user.create({
      data: {
        email: `portfolio-service-${Date.now()}-${Math.random()}@example.com`,
        password: 'test-password',
      },
    });

    createdUserIds.push(user.id);
    return user;
  };

  beforeAll(async () => {
    prisma = await loadTestPrisma();
    portfolioService = await import('../backend/services/portfolioService.js');
  });

  afterEach(async () => {
    if (createdUserIds.length === 0) {
      return;
    }

    await prisma.user.deleteMany({
      where: {
        id: {
          in: createdUserIds.splice(0, createdUserIds.length),
        },
      },
    });
  });

  it('buys a new holding and creates a BUY transaction', async () => {
    const user = await createTestUser();

    const result = await portfolioService.buyStock(user.id, 'aapl', 10, 100);
    const portfolio = await portfolioService.getUserPortfolio(user.id);

    expect(result.portfolio.cash).toBe(99000);
    expect(result.holding).toMatchObject({
      symbol: 'AAPL',
      quantity: 10,
      avgPrice: 100,
    });
    expect(result.transaction).toMatchObject({
      type: 'BUY',
      symbol: 'AAPL',
      quantity: 10,
      price: 100,
      total: 1000,
    });
    expect(portfolio.cash).toBe(99000);
    expect(portfolio.holdings).toHaveLength(1);
    expect(portfolio.transactions).toHaveLength(1);
  });

  it('averages into an existing holding on subsequent buys', async () => {
    const user = await createTestUser();

    await portfolioService.buyStock(user.id, 'AAPL', 10, 100);
    const result = await portfolioService.buyStock(user.id, 'AAPL', 5, 130);

    expect(result.holding).toMatchObject({
      symbol: 'AAPL',
      quantity: 15,
      avgPrice: 110,
    });
    expect(result.portfolio.cash).toBe(98350);
  });

  it('rejects buys when the user has insufficient funds', async () => {
    const user = await createTestUser();

    await expect(
      portfolioService.buyStock(user.id, 'AAPL', 2000, 100)
    ).rejects.toMatchObject({
      message: 'Insufficient funds',
      statusCode: 400,
    });
  });

  it('supports fractional buys and sells without truncating the quantity', async () => {
    const user = await createTestUser();

    await portfolioService.buyStock(user.id, 'AAPL', 1.5, 100);
    const averagedBuy = await portfolioService.buyStock(user.id, 'AAPL', 0.5, 130);
    const sellResult = await portfolioService.sellStock(user.id, 'AAPL', 0.75, 140);

    expect(averagedBuy.holding.quantity).toBeCloseTo(2);
    expect(averagedBuy.holding.avgPrice).toBeCloseTo(107.5);
    expect(sellResult.holding.quantity).toBeCloseTo(1.25);
    expect(sellResult.holding.avgPrice).toBeCloseTo(107.5);
    expect(sellResult.transaction).toMatchObject({
      type: 'SELL',
      symbol: 'AAPL',
      quantity: 0.75,
      price: 140,
      total: 105,
    });
    expect(sellResult.portfolio.cash).toBeCloseTo(99890);
  });

  it('supports partial sells without changing average price', async () => {
    const user = await createTestUser();

    await portfolioService.buyStock(user.id, 'AAPL', 10, 100);
    const result = await portfolioService.sellStock(user.id, 'AAPL', 4, 150);

    expect(result.portfolio.cash).toBe(99600);
    expect(result.holding).toMatchObject({
      symbol: 'AAPL',
      quantity: 6,
      avgPrice: 100,
    });
    expect(result.transaction).toMatchObject({
      type: 'SELL',
      symbol: 'AAPL',
      quantity: 4,
      price: 150,
      total: 600,
    });
  });

  it('removes a holding when a sell fully liquidates it', async () => {
    const user = await createTestUser();

    await portfolioService.buyStock(user.id, 'AAPL', 3, 100);
    const result = await portfolioService.sellStock(user.id, 'AAPL', 3, 150);
    const portfolio = await portfolioService.getUserPortfolio(user.id);

    expect(result.holding).toBeNull();
    expect(portfolio.cash).toBe(100150);
    expect(portfolio.holdings).toHaveLength(0);
    expect(portfolio.transactions).toHaveLength(2);
  });

  it('rejects sells when the user tries to sell more shares than owned', async () => {
    const user = await createTestUser();

    await portfolioService.buyStock(user.id, 'AAPL', 2, 100);

    await expect(
      portfolioService.sellStock(user.id, 'AAPL', 3, 150)
    ).rejects.toMatchObject({
      message: 'Insufficient shares',
      statusCode: 400,
    });
  });

  it('resets holdings, transactions, and cash back to the initial state', async () => {
    const user = await createTestUser();

    await portfolioService.buyStock(user.id, 'AAPL', 5, 100);
    await portfolioService.resetPortfolio(user.id);

    const portfolio = await portfolioService.getUserPortfolio(user.id);

    expect(portfolio.cash).toBe(100000);
    expect(portfolio.holdings).toHaveLength(0);
    expect(portfolio.transactions).toHaveLength(0);
  });

  it('migrates legacy localStorage data once and keeps it idempotent', async () => {
    const user = await createTestUser();
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

    const firstMigration = await portfolioService.migrateLocalStorageData(user.id, portfolioData);
    const afterFirstMigration = await portfolioService.getUserPortfolio(user.id);
    const secondMigration = await portfolioService.migrateLocalStorageData(user.id, portfolioData);
    const afterSecondMigration = await portfolioService.getUserPortfolio(user.id);

    expect(firstMigration.cash).toBe(99750);
    expect(afterFirstMigration.holdings).toHaveLength(1);
    expect(afterFirstMigration.holdings[0]).toMatchObject({
      symbol: 'MSFT',
      quantity: 5,
      avgPrice: 50,
    });
    expect(afterFirstMigration.transactions).toHaveLength(1);
    expect(afterFirstMigration.transactions[0]).toMatchObject({
      type: 'BUY',
      symbol: 'MSFT',
      quantity: 5,
      price: 50,
      total: 250,
    });
    expect(secondMigration).toBeNull();
    expect(afterSecondMigration.holdings).toHaveLength(1);
    expect(afterSecondMigration.transactions).toHaveLength(1);
  });

  it('returns an empty performance series when the portfolio has no transactions', async () => {
    const user = await createTestUser();

    const performance = await portfolioService.getPortfolioPerformance(user.id, '1m', {
      now: FIXED_NOW,
      getHistory: async () => [],
    });

    expect(performance).toEqual({
      period: '1m',
      series: [],
    });
  });

  it('reconstructs a single buy and shows the portfolio value rising after the trade date', async () => {
    const user = await createTestUser();
    await portfolioService.migrateLocalStorageData(user.id, {
      cash: 99000,
      holdings: [
        { symbol: 'AAPL', quantity: 10, avgPrice: 100 },
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
    });

    const performance = await portfolioService.getPortfolioPerformance(user.id, '1m', {
      now: FIXED_NOW,
      getHistory: async () => [
        { date: '2024-01-10T00:00:00.000Z', close: 110 },
        { date: '2024-01-11T00:00:00.000Z', close: 112 },
      ],
    });

    const beforeBuy = performance.series.find((point) => point.date.startsWith('2024-01-09'));
    const buyDay = performance.series.find((point) => point.date.startsWith('2024-01-10'));

    expect(beforeBuy).toMatchObject({
      totalValue: 100000,
      cash: 100000,
      holdingsValue: 0,
      pnl: 0,
    });
    expect(buyDay).toMatchObject({
      totalValue: 100100,
      cash: 99000,
      holdingsValue: 1100,
      pnl: 100,
    });
  });

  it('reconstructs cash and holdings correctly after a buy followed by a sell', async () => {
    const user = await createTestUser();
    await portfolioService.migrateLocalStorageData(user.id, {
      cash: 99600,
      holdings: [
        { symbol: 'AAPL', quantity: 6, avgPrice: 100 },
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
        {
          type: 'SELL',
          symbol: 'AAPL',
          quantity: 4,
          price: 150,
          total: 600,
          timestamp: '2024-01-20T10:00:00.000Z',
        },
      ],
    });

    const performance = await portfolioService.getPortfolioPerformance(user.id, '1m', {
      now: FIXED_NOW,
      getHistory: async () => [
        { date: '2024-01-10T00:00:00.000Z', close: 100 },
        { date: '2024-01-20T00:00:00.000Z', close: 150 },
      ],
    });

    const buyDay = performance.series.find((point) => point.date.startsWith('2024-01-10'));
    const sellDay = performance.series.find((point) => point.date.startsWith('2024-01-20'));

    expect(buyDay).toMatchObject({
      totalValue: 100000,
      cash: 99000,
      holdingsValue: 1000,
      pnl: 0,
    });
    expect(sellDay).toMatchObject({
      totalValue: 100500,
      cash: 99600,
      holdingsValue: 900,
      pnl: 500,
    });
  });

  it('filters performance samples to the requested period while replaying older transactions into the opening state', async () => {
    const user = await createTestUser();
    await portfolioService.migrateLocalStorageData(user.id, {
      cash: 99000,
      holdings: [
        { symbol: 'AAPL', quantity: 10, avgPrice: 100 },
      ],
      transactions: [
        {
          type: 'BUY',
          symbol: 'AAPL',
          quantity: 10,
          price: 100,
          total: 1000,
          timestamp: '2023-12-20T10:00:00.000Z',
        },
      ],
    });

    const performance = await portfolioService.getPortfolioPerformance(user.id, '1w', {
      now: FIXED_NOW,
      getHistory: async () => [
        { date: '2024-01-25T00:00:00.000Z', close: 120 },
        { date: '2024-01-31T00:00:00.000Z', close: 125 },
      ],
    });

    expect(performance.period).toBe('1w');
    expect(performance.series).toHaveLength(7);
    expect(performance.series[0].date).toBe('2024-01-25T23:59:59.999Z');
    expect(performance.series[0]).toMatchObject({
      cash: 99000,
      holdingsValue: 1200,
      totalValue: 100200,
    });
  });

  it('uses a deterministic fallback price when historical candles are unavailable', async () => {
    const user = await createTestUser();
    await portfolioService.migrateLocalStorageData(user.id, {
      cash: 99900,
      holdings: [
        { symbol: 'MSFT', quantity: 1, avgPrice: 100 },
      ],
      transactions: [
        {
          type: 'BUY',
          symbol: 'MSFT',
          quantity: 1,
          price: 100,
          total: 100,
          timestamp: '2024-01-30T10:00:00.000Z',
        },
      ],
    });

    const firstPerformance = await portfolioService.getPortfolioPerformance(user.id, '1w', {
      now: FIXED_NOW,
      getHistory: async () => [],
    });
    const secondPerformance = await portfolioService.getPortfolioPerformance(user.id, '1w', {
      now: FIXED_NOW,
      getHistory: async () => [],
    });

    expect(firstPerformance.series).toEqual(secondPerformance.series);
    expect(firstPerformance.series[firstPerformance.series.length - 1].holdingsValue).toBeGreaterThan(0);
  });
});
