// Local storage utility functions
const STORAGE_KEYS = {
  PORTFOLIO: 'stock_simulator_portfolio',
  WATCHLIST: 'stock_simulator_watchlist',
  TRANSACTIONS: 'stock_simulator_transactions',
}

export const storage = {
  // Portfolio operations
  getPortfolio: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PORTFOLIO)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error loading portfolio:', error)
      return null
    }
  },

  savePortfolio: (portfolio) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio))
    } catch (error) {
      console.error('Error saving portfolio:', error)
    }
  },

  // Watchlist operations
  getWatchlist: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading watchlist:', error)
      return []
    }
  },

  saveWatchlist: (watchlist) => {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist))
    } catch (error) {
      console.error('Error saving watchlist:', error)
    }
  },

  // Transaction operations
  getTransactions: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading transactions:', error)
      return []
    }
  },

  saveTransactions: (transactions) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
    } catch (error) {
      console.error('Error saving transactions:', error)
    }
  },

  // Clear all data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }
}
