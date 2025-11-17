import * as watchlistService from '../services/watchlistService.js';

export const getUserWatchlists = async (req, res, next) => {
  try {
    const watchlists = await watchlistService.getUserWatchlists(req.user.id);

    res.status(200).json({
      success: true,
      data: { watchlists },
    });
  } catch (error) {
    next(error);
  }
};

export const getWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const watchlist = await watchlistService.getWatchlistById(id, req.user.id);

    res.status(200).json({
      success: true,
      data: { watchlist },
    });
  } catch (error) {
    next(error);
  }
};

export const createWatchlist = async (req, res, next) => {
  try {
    const { name } = req.body;
    const watchlist = await watchlistService.createWatchlist(req.user.id, name);

    res.status(201).json({
      success: true,
      data: { watchlist },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const watchlist = await watchlistService.updateWatchlist(id, req.user.id, name);

    res.status(200).json({
      success: true,
      data: { watchlist },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    await watchlistService.deleteWatchlist(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Watchlist deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addStockToWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { symbol } = req.body;
    const item = await watchlistService.addStockToWatchlist(id, req.user.id, symbol);

    res.status(201).json({
      success: true,
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

export const removeStockFromWatchlist = async (req, res, next) => {
  try {
    const { id, symbol } = req.params;
    await watchlistService.removeStockFromWatchlist(id, req.user.id, symbol);

    res.status(200).json({
      success: true,
      message: 'Stock removed from watchlist successfully',
    });
  } catch (error) {
    next(error);
  }
};
