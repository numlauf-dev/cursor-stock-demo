import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { storage } from '../utils/storage'
import { api } from '../utils/api'

const PortfolioContext = createContext()
const PORTFOLIO_SYNC_RETRY_DELAY_MS = 1000

const INITIAL_CASH = 100000

const initialState = {
  cash: INITIAL_CASH,
  holdings: [], // { symbol, quantity, avgPrice }
  transactions: [], // { id, type, symbol, quantity, price, total, timestamp }
}

const normalizeHolding = (holding = {}) => ({
  symbol: holding.symbol?.toUpperCase?.() || '',
  quantity: Number.isFinite(Number(holding.quantity)) ? Number(holding.quantity) : 0,
  avgPrice: Number.isFinite(Number(holding.avgPrice)) ? Number(holding.avgPrice) : 0,
})

const normalizeTransaction = (transaction = {}) => {
  const quantity = Number(transaction.quantity) || 0
  const price = Number(transaction.price) || 0

  return {
    id: transaction.id ? String(transaction.id) : `${transaction.symbol || 'tx'}-${transaction.timestamp || Date.now()}`,
    type: transaction.type?.toUpperCase?.() || '',
    symbol: transaction.symbol?.toUpperCase?.() || '',
    quantity,
    price,
    total: Number.isFinite(Number(transaction.total)) ? Number(transaction.total) : quantity * price,
    timestamp: transaction.timestamp || new Date().toISOString(),
  }
}

const normalizePortfolio = (portfolio) => {
  if (!portfolio) {
    return initialState
  }

  return {
    cash: Number.isFinite(Number(portfolio.cash)) ? Number(portfolio.cash) : INITIAL_CASH,
    holdings: Array.isArray(portfolio.holdings)
      ? portfolio.holdings.map(normalizeHolding).filter((holding) => holding.symbol)
      : [],
    transactions: Array.isArray(portfolio.transactions)
      ? portfolio.transactions.map(normalizeTransaction).filter((transaction) => transaction.symbol)
      : [],
  }
}

const hasPortfolioData = (portfolio) => {
  if (!portfolio) {
    return false
  }

  return (
    portfolio.cash !== INITIAL_CASH ||
    portfolio.holdings.length > 0 ||
    portfolio.transactions.length > 0
  )
}

const isFreshServerPortfolio = (portfolio) => (
  portfolio.cash === INITIAL_CASH &&
  portfolio.holdings.length === 0 &&
  portfolio.transactions.length === 0
)

export const PortfolioProvider = ({ children }) => {
  const [state, setState] = useState(() => normalizePortfolio(storage.getPortfolio()))
  const [loading, setLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [hasRetriedSync, setHasRetriedSync] = useState(false)
  const [syncFailed, setSyncFailed] = useState(false)

  const applyPortfolioState = useCallback((portfolio) => {
    const normalizedPortfolio = normalizePortfolio(portfolio)
    setState(normalizedPortfolio)
    storage.savePortfolio(normalizedPortfolio)
    return normalizedPortfolio
  }, [])

  const syncPortfolioFromApi = useCallback(async () => {
    setLoading(true)

    try {
      const localPortfolio = normalizePortfolio(storage.getPortfolio())
      const serverPortfolio = normalizePortfolio(await api.getPortfolio())
      let nextPortfolio = serverPortfolio

      if (hasPortfolioData(localPortfolio) && isFreshServerPortfolio(serverPortfolio)) {
        const migrationResult = await api.migratePortfolio(localPortfolio)
        nextPortfolio = normalizePortfolio(migrationResult.portfolio)
      }

      applyPortfolioState(nextPortfolio)
      setSyncFailed(false)
    } catch (error) {
      applyPortfolioState(storage.getPortfolio())
      setSyncFailed(true)
    } finally {
      setLoading(false)
      setIsReady(true)
    }
  }, [applyPortfolioState])

  useEffect(() => {
    syncPortfolioFromApi()
  }, [syncPortfolioFromApi])

  useEffect(() => {
    if (!isReady || !syncFailed || hasRetriedSync) {
      return
    }

    const retryTimer = setTimeout(() => {
      setHasRetriedSync(true)
      syncPortfolioFromApi()
    }, PORTFOLIO_SYNC_RETRY_DELAY_MS)

    return () => clearTimeout(retryTimer)
  }, [hasRetriedSync, isReady, syncFailed, syncPortfolioFromApi])

  const buyStock = async (symbol, quantity, price) => {
    try {
      setLoading(true)
      const portfolio = await api.buyStock(symbol, quantity, price)
      applyPortfolioState(portfolio)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const sellStock = async (symbol, quantity, price) => {
    try {
      setLoading(true)
      const portfolio = await api.sellStock(symbol, quantity, price)
      applyPortfolioState(portfolio)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resetPortfolio = async () => {
    try {
      setLoading(true)
      const portfolio = await api.resetPortfolio()
      applyPortfolioState(portfolio)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const getHolding = (symbol) => {
    const normalizedSymbol = symbol?.toUpperCase?.()
    return state.holdings.find((holding) => holding.symbol === normalizedSymbol)
  }

  const contextValue = {
    cash: state.cash,
    holdings: state.holdings,
    transactions: state.transactions,
    loading,
    buyStock,
    sellStock,
    resetPortfolio,
    getHolding,
  }

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  )
}

export const usePortfolio = () => {
  const context = useContext(PortfolioContext)
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider')
  }
  return context
}
