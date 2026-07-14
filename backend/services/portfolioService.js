import prisma from '../config/database.js';
import * as stockService from './stockService.js';
import { ValidationError } from '../utils/errors.js';

export const INITIAL_CASH = 100000;
const PORTFOLIO_TRANSACTION_TYPES = new Set(['BUY', 'SELL']);
const DAY_MS = 24 * 60 * 60 * 1000;
const PERFORMANCE_PERIODS = {
  '1w': { stepDays: 1, rangeDays: 7, historyPeriod: '1w' },
  '1m': { stepDays: 1, rangeDays: 30, historyPeriod: '1m' },
  '3m': { stepDays: 1, rangeDays: 90, historyPeriod: '3m' },
  '1y': { stepDays: 7, rangeDays: 365, historyPeriod: '1y' },
  all: { stepDays: 7, rangeDays: null, historyPeriod: 'all' },
};

const normalizeMigratedHolding = (holding) => ({
  symbol: holding.symbol?.trim().toUpperCase(),
  quantity: Number(holding.quantity),
  avgPrice: Number(holding.avgPrice),
});

const normalizeMigratedTransaction = (transaction) => {
  const quantity = Number(transaction.quantity);
  const price = Number(transaction.price);

  return {
    type: transaction.type?.toUpperCase?.(),
    symbol: transaction.symbol?.trim().toUpperCase(),
    quantity,
    price,
    total: Number(transaction.total) || quantity * price,
    timestamp: transaction.timestamp ? new Date(transaction.timestamp) : new Date(),
  };
};

const roundCurrency = (value) => Number(value.toFixed(2));

const startOfUtcDay = (date) => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

const endOfUtcDay = (date) => {
  const normalized = new Date(date);
  normalized.setUTCHours(23, 59, 59, 999);
  return normalized;
};

const resolvePerformancePeriod = (period = '1m') => (
  PERFORMANCE_PERIODS[period] ? period : '1m'
);

const buildPerformanceSampleDates = ({ period, firstTransactionAt, portfolioCreatedAt, now }) => {
  const config = PERFORMANCE_PERIODS[period];
  const normalizedNow = new Date(now);
  const endDate = new Date(normalizedNow);

  let startDate;
  if (period === 'all') {
    startDate = startOfUtcDay(firstTransactionAt || portfolioCreatedAt || normalizedNow);
  } else {
    startDate = startOfUtcDay(
      new Date(normalizedNow.getTime() - ((config.rangeDays - 1) * DAY_MS))
    );
  }

  if (startDate.getTime() > endDate.getTime()) {
    return [];
  }

  const sampleDates = [];
  let cursor = new Date(startDate);

  while (cursor.getTime() <= endDate.getTime()) {
    const sampleDate = endOfUtcDay(cursor);
    sampleDates.push(
      new Date(Math.min(sampleDate.getTime(), endDate.getTime()))
    );
    cursor = new Date(cursor.getTime() + (config.stepDays * DAY_MS));
  }

  const lastSampleDate = sampleDates[sampleDates.length - 1];
  if (!lastSampleDate || lastSampleDate.getTime() !== endDate.getTime()) {
    sampleDates.push(endDate);
  }

  return sampleDates;
};

const applyTransactionToState = (state, transaction) => {
  const symbol = transaction.symbol.toUpperCase();
  const existingHolding = state.holdings.get(symbol);

  if (transaction.type === 'BUY') {
    if (existingHolding) {
      const totalQuantity = existingHolding.quantity + transaction.quantity;
      const totalCost = (
        existingHolding.quantity * existingHolding.avgPrice
      ) + transaction.total;

      state.holdings.set(symbol, {
        quantity: totalQuantity,
        avgPrice: totalCost / totalQuantity,
      });
    } else {
      state.holdings.set(symbol, {
        quantity: transaction.quantity,
        avgPrice: transaction.price,
      });
    }

    state.cash -= transaction.total;
    return;
  }

  if (!existingHolding) {
    return;
  }

  const remainingQuantity = existingHolding.quantity - transaction.quantity;
  state.cash += transaction.total;

  if (remainingQuantity > 0) {
    state.holdings.set(symbol, {
      quantity: remainingQuantity,
      avgPrice: existingHolding.avgPrice,
    });
  } else {
    state.holdings.delete(symbol);
  }
};

const buildHistoryTracker = (history = []) => ({
  candles: [...history]
    .filter((candle) => candle?.date && Number.isFinite(Number(candle.close)))
    .map((candle) => ({
      time: new Date(candle.date).getTime(),
      close: Number(candle.close),
    }))
    .filter((candle) => Number.isFinite(candle.time))
    .sort((left, right) => left.time - right.time),
  index: -1,
  lastClose: null,
});

export const getDeterministicFallbackPrice = (symbol, date, anchorPrice = 100) => {
  const normalizedSymbol = symbol.toUpperCase();
  const basePrice = Number.isFinite(anchorPrice) && anchorPrice > 0
    ? anchorPrice
    : 100;
  const dayIndex = Math.floor(startOfUtcDay(date).getTime() / DAY_MS);
  const symbolSeed = [...normalizedSymbol].reduce(
    (seed, character) => seed + character.charCodeAt(0),
    0
  );
  const trend = (((dayIndex + symbolSeed) % 29) - 14) * 0.0025;
  const cycle = Math.sin((dayIndex + symbolSeed) / 8) * 0.03;
  return roundCurrency(Math.max(1, basePrice * (1 + trend + cycle)));
};

const advanceHistoryTracker = (tracker, sampleTimestamp) => {
  if (!tracker) {
    return null;
  }

  while (
    tracker.index + 1 < tracker.candles.length &&
    tracker.candles[tracker.index + 1].time <= sampleTimestamp
  ) {
    tracker.index += 1;
    tracker.lastClose = tracker.candles[tracker.index].close;
  }

  return tracker.lastClose;
};

/**
 * Get or create portfolio for a user
 */
export const getOrCreatePortfolio = async (userId) => {
  let portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: {
      holdings: {
        orderBy: { symbol: 'asc' },
      },
      transactions: {
        orderBy: { timestamp: 'desc' },
      },
    },
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        userId,
        cash: INITIAL_CASH,
      },
      include: {
        holdings: true,
        transactions: true,
      },
    });
  }

  return portfolio;
};

/**
 * Get user's portfolio with all related data
 */
export const getUserPortfolio = async (userId) => {
  return getOrCreatePortfolio(userId);
};

/**
 * Reconstruct portfolio performance over time from transactions and historical prices.
 */
export const getPortfolioPerformance = async (
  userId,
  period = '1m',
  {
    now = new Date(),
    getHistory = stockService.getStockHistory,
  } = {}
) => {
  const resolvedPeriod = resolvePerformancePeriod(period);
  const portfolio = await getOrCreatePortfolio(userId);
  const transactions = await prisma.transaction.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { timestamp: 'asc' },
  });

  if (transactions.length === 0) {
    return {
      period: resolvedPeriod,
      series: [],
    };
  }

  const sampleDates = buildPerformanceSampleDates({
    period: resolvedPeriod,
    firstTransactionAt: transactions[0].timestamp,
    portfolioCreatedAt: portfolio.createdAt,
    now,
  });
  const symbols = [...new Set(transactions.map((transaction) => transaction.symbol.toUpperCase()))];
  const historyPeriod = PERFORMANCE_PERIODS[resolvedPeriod].historyPeriod;
  const historyEntries = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const history = await getHistory(symbol, historyPeriod);
        return [symbol, buildHistoryTracker(history)];
      } catch (_error) {
        return [symbol, buildHistoryTracker([])];
      }
    })
  );
  const historyTrackers = new Map(historyEntries);
  const state = {
    cash: INITIAL_CASH,
    holdings: new Map(),
  };
  const series = [];
  let transactionIndex = 0;

  for (const sampleDate of sampleDates) {
    const sampleTimestamp = sampleDate.getTime();

    while (
      transactionIndex < transactions.length &&
      new Date(transactions[transactionIndex].timestamp).getTime() <= sampleTimestamp
    ) {
      applyTransactionToState(state, transactions[transactionIndex]);
      transactionIndex += 1;
    }

    let holdingsValue = 0;
    for (const [symbol, holding] of state.holdings.entries()) {
      const tracker = historyTrackers.get(symbol);
      const historicalClose = advanceHistoryTracker(tracker, sampleTimestamp);
      const valuationPrice = historicalClose ?? getDeterministicFallbackPrice(
        symbol,
        sampleDate,
        holding.avgPrice
      );
      holdingsValue += holding.quantity * valuationPrice;
    }

    const totalValue = state.cash + holdingsValue;
    series.push({
      date: sampleDate.toISOString(),
      totalValue: roundCurrency(totalValue),
      cash: roundCurrency(state.cash),
      holdingsValue: roundCurrency(holdingsValue),
      pnl: roundCurrency(totalValue - INITIAL_CASH),
    });
  }

  return {
    period: resolvedPeriod,
    series,
  };
};

/**
 * Buy stock - create/update holding, add transaction, deduct cash
 */
export const buyStock = async (userId, symbol, quantity, price) => {
  if (!symbol || typeof symbol !== 'string') {
    throw new ValidationError('Symbol is required');
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new ValidationError('Quantity must be greater than 0');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new ValidationError('Price must be greater than 0');
  }

  const normalizedSymbol = symbol.trim().toUpperCase();
  const total = quantity * price;

  // Get or create portfolio
  const portfolio = await getOrCreatePortfolio(userId);

  // Check sufficient funds
  if (total > portfolio.cash) {
    throw new ValidationError('Insufficient funds');
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Find existing holding
    const existingHolding = await tx.holding.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId: portfolio.id,
          symbol: normalizedSymbol,
        },
      },
    });

    let holding;
    if (existingHolding) {
      // Update existing holding with new average price
      const totalQuantity = existingHolding.quantity + quantity;
      const totalCost = existingHolding.quantity * existingHolding.avgPrice + total;
      const newAvgPrice = totalCost / totalQuantity;

      holding = await tx.holding.update({
        where: { id: existingHolding.id },
        data: {
          quantity: totalQuantity,
          avgPrice: newAvgPrice,
        },
      });
    } else {
      // Create new holding
      holding = await tx.holding.create({
        data: {
          portfolioId: portfolio.id,
          symbol: normalizedSymbol,
          quantity,
          avgPrice: price,
        },
      });
    }

    // Update portfolio cash
    const updatedPortfolio = await tx.portfolio.update({
      where: { id: portfolio.id },
      data: {
        cash: portfolio.cash - total,
      },
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        portfolioId: portfolio.id,
        type: 'BUY',
        symbol: normalizedSymbol,
        quantity,
        price,
        total,
      },
    });

    return {
      portfolio: updatedPortfolio,
      holding,
      transaction,
    };
  });

  return result;
};

/**
 * Sell stock - update/remove holding, add transaction, add cash
 */
export const sellStock = async (userId, symbol, quantity, price) => {
  if (!symbol || typeof symbol !== 'string') {
    throw new ValidationError('Symbol is required');
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new ValidationError('Quantity must be greater than 0');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new ValidationError('Price must be greater than 0');
  }

  const normalizedSymbol = symbol.trim().toUpperCase();
  const total = quantity * price;

  // Get portfolio
  const portfolio = await getOrCreatePortfolio(userId);

  // Find holding
  const holding = await prisma.holding.findUnique({
    where: {
      portfolioId_symbol: {
        portfolioId: portfolio.id,
        symbol: normalizedSymbol,
      },
    },
  });

  if (!holding) {
    throw new ValidationError('You do not own this stock');
  }

  if (holding.quantity < quantity) {
    throw new ValidationError('Insufficient shares');
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    const newQuantity = holding.quantity - quantity;

    // Update or delete holding
    let updatedHolding;
    if (newQuantity > 0) {
      updatedHolding = await tx.holding.update({
        where: { id: holding.id },
        data: { quantity: newQuantity },
      });
    } else {
      await tx.holding.delete({
        where: { id: holding.id },
      });
      updatedHolding = null;
    }

    // Update portfolio cash
    const updatedPortfolio = await tx.portfolio.update({
      where: { id: portfolio.id },
      data: {
        cash: portfolio.cash + total,
      },
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        portfolioId: portfolio.id,
        type: 'SELL',
        symbol: normalizedSymbol,
        quantity,
        price,
        total,
      },
    });

    return {
      portfolio: updatedPortfolio,
      holding: updatedHolding,
      transaction,
    };
  });

  return result;
};

/**
 * Migrate localStorage data to database
 */
export const migrateLocalStorageData = async (userId, portfolioData) => {
  if (!portfolioData) {
    return null;
  }

  const { cash, holdings = [], transactions = [] } = portfolioData;
  const normalizedCash = typeof cash === 'number' ? cash : Number(cash);
  const normalizedHoldings = holdings.map(normalizeMigratedHolding);
  const normalizedTransactions = transactions.map(normalizeMigratedTransaction);

  for (const holding of normalizedHoldings) {
    if (!holding.symbol) {
      throw new ValidationError('Holding symbol is required');
    }
    if (Number.isNaN(holding.quantity) || holding.quantity <= 0) {
      throw new ValidationError('Holding quantity must be greater than 0');
    }
    if (Number.isNaN(holding.avgPrice) || holding.avgPrice <= 0) {
      throw new ValidationError('Holding avgPrice must be greater than 0');
    }
  }

  for (const transaction of normalizedTransactions) {
    if (!PORTFOLIO_TRANSACTION_TYPES.has(transaction.type)) {
      throw new ValidationError('Transaction type must be BUY or SELL');
    }
    if (!transaction.symbol) {
      throw new ValidationError('Transaction symbol is required');
    }
    if (Number.isNaN(transaction.quantity) || transaction.quantity <= 0) {
      throw new ValidationError('Transaction quantity must be greater than 0');
    }
    if (Number.isNaN(transaction.price) || transaction.price <= 0) {
      throw new ValidationError('Transaction price must be greater than 0');
    }
    if (Number.isNaN(transaction.total) || transaction.total <= 0) {
      throw new ValidationError('Transaction total must be greater than 0');
    }
    if (Number.isNaN(transaction.timestamp.getTime())) {
      throw new ValidationError('Transaction timestamp must be valid');
    }
  }

  // Get or create portfolio
  const portfolio = await getOrCreatePortfolio(userId);

  // Check if portfolio already has data (don't overwrite)
  const existingHoldings = await prisma.holding.count({
    where: { portfolioId: portfolio.id },
  });

  const existingTransactions = await prisma.transaction.count({
    where: { portfolioId: portfolio.id },
  });

  if (existingHoldings > 0 || existingTransactions > 0) {
    // Portfolio already has data, skip migration
    return null;
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update cash
    const updatedPortfolio = await tx.portfolio.update({
      where: { id: portfolio.id },
      data: { cash: Number.isFinite(normalizedCash) ? normalizedCash : INITIAL_CASH },
    });

    // Create holdings
    if (normalizedHoldings.length > 0) {
      await tx.holding.createMany({
        data: normalizedHoldings.map((holding) => ({
          portfolioId: portfolio.id,
          symbol: holding.symbol,
          quantity: holding.quantity,
          avgPrice: holding.avgPrice,
        })),
      });
    }

    // Create transactions
    if (normalizedTransactions.length > 0) {
      await tx.transaction.createMany({
        data: normalizedTransactions.map((transaction) => ({
          portfolioId: portfolio.id,
          type: transaction.type,
          symbol: transaction.symbol,
          quantity: transaction.quantity,
          price: transaction.price,
          total: transaction.total,
          timestamp: transaction.timestamp,
        })),
      });
    }

    return updatedPortfolio;
  });

  return result;
};

/**
 * Reset portfolio to initial state
 */
export const resetPortfolio = async (userId) => {
  const portfolio = await getOrCreatePortfolio(userId);

  await prisma.$transaction(async (tx) => {
    // Delete all holdings
    await tx.holding.deleteMany({
      where: { portfolioId: portfolio.id },
    });

    // Delete all transactions
    await tx.transaction.deleteMany({
      where: { portfolioId: portfolio.id },
    });

    // Reset cash
    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: { cash: INITIAL_CASH },
    });
  });
};
