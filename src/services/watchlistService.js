import prisma from '../config/database.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';

export const getUserWatchlists = async (userId) => {
  const watchlists = await prisma.watchlist.findMany({
    where: { userId },
    include: {
      items: {
        orderBy: { addedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return watchlists;
};

export const getWatchlistById = async (watchlistId, userId) => {
  const watchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: {
      items: {
        orderBy: { addedAt: 'desc' },
      },
    },
  });

  if (!watchlist) {
    throw new NotFoundError('Watchlist');
  }

  if (watchlist.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this watchlist');
  }

  return watchlist;
};

export const createWatchlist = async (userId, name) => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Watchlist name is required');
  }

  const watchlist = await prisma.watchlist.create({
    data: {
      userId,
      name: name.trim(),
    },
    include: {
      items: true,
    },
  });

  return watchlist;
};

export const updateWatchlist = async (watchlistId, userId, name) => {
  // Verify ownership
  const existingWatchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
  });

  if (!existingWatchlist) {
    throw new NotFoundError('Watchlist');
  }

  if (existingWatchlist.userId !== userId) {
    throw new ForbiddenError('Not authorized to update this watchlist');
  }

  if (!name || name.trim().length === 0) {
    throw new ValidationError('Watchlist name is required');
  }

  const watchlist = await prisma.watchlist.update({
    where: { id: watchlistId },
    data: {
      name: name.trim(),
    },
    include: {
      items: {
        orderBy: { addedAt: 'desc' },
      },
    },
  });

  return watchlist;
};

export const deleteWatchlist = async (watchlistId, userId) => {
  // Verify ownership
  const existingWatchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
  });

  if (!existingWatchlist) {
    throw new NotFoundError('Watchlist');
  }

  if (existingWatchlist.userId !== userId) {
    throw new ForbiddenError('Not authorized to delete this watchlist');
  }

  await prisma.watchlist.delete({
    where: { id: watchlistId },
  });
};

export const addStockToWatchlist = async (watchlistId, userId, symbol) => {
  // Verify ownership
  const watchlist = await getWatchlistById(watchlistId, userId);

  if (!symbol || symbol.trim().length === 0) {
    throw new ValidationError('Stock symbol is required');
  }

  const normalizedSymbol = symbol.trim().toUpperCase();

  // Check if stock already exists in watchlist
  const existingItem = await prisma.watchlistItem.findUnique({
    where: {
      watchlistId_symbol: {
        watchlistId,
        symbol: normalizedSymbol,
      },
    },
  });

  if (existingItem) {
    throw new ValidationError('Stock already exists in watchlist');
  }

  const item = await prisma.watchlistItem.create({
    data: {
      watchlistId,
      symbol: normalizedSymbol,
    },
  });

  return item;
};

export const removeStockFromWatchlist = async (watchlistId, userId, symbol) => {
  // Verify ownership
  await getWatchlistById(watchlistId, userId);

  const normalizedSymbol = symbol.trim().toUpperCase();

  const item = await prisma.watchlistItem.findUnique({
    where: {
      watchlistId_symbol: {
        watchlistId,
        symbol: normalizedSymbol,
      },
    },
  });

  if (!item) {
    throw new NotFoundError('Stock not found in watchlist');
  }

  await prisma.watchlistItem.delete({
    where: {
      watchlistId_symbol: {
        watchlistId,
        symbol: normalizedSymbol,
      },
    },
  });
};
