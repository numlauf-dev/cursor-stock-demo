import { afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { loadTestPrisma } from './helpers/testConfig.js';

describe('portfolioService', () => {
  let prisma;
  let portfolioService;
  const createdUserIds = [];

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
});
