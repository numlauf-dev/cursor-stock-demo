import * as stockService from '../services/stockService.js';

export const searchStocks = async (req, res, next) => {
  try {
    const { query } = req.query;
    const results = await stockService.searchStocks(query);

    res.status(200).json({
      success: true,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};

export const getStockQuote = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await stockService.getStockQuote(symbol);

    res.status(200).json({
      success: true,
      data: { quote },
    });
  } catch (error) {
    next(error);
  }
};

export const getStockInfo = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await stockService.getStockQuote(symbol);

    res.status(200).json({
      success: true,
      data: { stock: quote },
    });
  } catch (error) {
    next(error);
  }
};

export const getStockHistory = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period = '1m' } = req.query;
    const history = await stockService.getStockHistory(symbol, period);

    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingStocks = async (req, res, next) => {
  try {
    const stocks = await stockService.getTrendingStocks();

    res.status(200).json({
      success: true,
      data: { stocks },
    });
  } catch (error) {
    next(error);
  }
};
