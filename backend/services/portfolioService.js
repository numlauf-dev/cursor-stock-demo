import prisma from '../config/database.js';
import { ValidationError } from '../utils/errors.js';

const INITIAL_CASH = 100000;
const PORTFOLIO_TRANSACTION_TYPES = new Set(['BUY', 'SELL']);

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
 * Buy stock - create/update holding, add transaction, deduct cash
 */
export const buyStock = async (userId, symbol, quantity, price) => {
  if (!symbol || typeof symbol !== 'string') {
    throw new ValidationError('Symbol is required');
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new ValidationError('Quantity must be greater than 0');
  }
  if (typeof price !== 'number' || price <= 0) {
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
  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new ValidationError('Quantity must be greater than 0');
  }
  if (typeof price !== 'number' || price <= 0) {
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
