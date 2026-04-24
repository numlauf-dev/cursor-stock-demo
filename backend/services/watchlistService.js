import prisma from '../config/database.js';
import { NotFoundError, ValidationError, ForbiddenError, AppError } from '../utils/errors.js';
import { getStockNews } from './stockService.js';

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
  await getWatchlistById(watchlistId, userId);

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

const dedupeNewsByUrl = (articles) => {
  const dedupedByUrl = new Map();

  articles.forEach((article) => {
    const normalizedUrl = (article.url || '').trim().toLowerCase();
    if (!normalizedUrl) {
      const uniqueKey = `${article.symbol}:${article.id}`;
      dedupedByUrl.set(uniqueKey, article);
      return;
    }

    const existingArticle = dedupedByUrl.get(normalizedUrl);
    if (!existingArticle) {
      dedupedByUrl.set(normalizedUrl, article);
      return;
    }

    const existingTimestamp = new Date(existingArticle.publishedAt).getTime();
    const candidateTimestamp = new Date(article.publishedAt).getTime();
    if (candidateTimestamp > existingTimestamp) {
      dedupedByUrl.set(normalizedUrl, article);
    }
  });

  return Array.from(dedupedByUrl.values());
};

const sortNewsByPublishedAt = (articles, sort = 'publishedAt:desc') => {
  const direction = sort.endsWith(':asc') ? 'asc' : 'desc';
  return [...articles].sort((a, b) => {
    const firstDate = new Date(a.publishedAt).getTime();
    const secondDate = new Date(b.publishedAt).getTime();
    if (direction === 'asc') {
      return firstDate - secondDate;
    }
    return secondDate - firstDate;
  });
};

export const getWatchlistNews = async (
  watchlistId,
  userId,
  { limit = 20, cursor = 0, symbol, sentiment, sort = 'publishedAt:desc' } = {}
) => {
  const watchlist = await getWatchlistById(watchlistId, userId);
  const symbols = watchlist.items.map((item) => item.symbol.toUpperCase());

  if (symbols.length === 0) {
    return {
      news: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  try {
    const perSymbolResults = await Promise.all(
      symbols.map(async (watchSymbol) => {
        const symbolFeed = await getStockNews(watchSymbol, { limit: 50, cursor: 0 });
        return symbolFeed.news.map((article) => ({
          ...article,
          symbol: watchSymbol,
        }));
      })
    );

    const mergedArticles = perSymbolResults.flat();
    const dedupedArticles = dedupeNewsByUrl(mergedArticles);

    const filteredArticles = dedupedArticles.filter((article) => {
      if (symbol && article.symbol !== symbol.toUpperCase()) {
        return false;
      }
      if (sentiment && article.sentiment !== sentiment) {
        return false;
      }
      return true;
    });

    const sortedArticles = sortNewsByPublishedAt(filteredArticles, sort);
    const parsedLimit = Number(limit);
    const parsedCursor = Number(cursor);
    const paginatedNews = sortedArticles.slice(parsedCursor, parsedCursor + parsedLimit);
    const nextCursorValue = parsedCursor + parsedLimit;
    const hasMore = nextCursorValue < sortedArticles.length;
    const nextCursor = hasMore ? String(nextCursorValue) : null;

    return {
      news: paginatedNews,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ValidationError ||
      error instanceof ForbiddenError ||
      error instanceof AppError
    ) {
      throw error;
    }
    throw new AppError('Failed to aggregate watchlist news', 500);
  }
};
