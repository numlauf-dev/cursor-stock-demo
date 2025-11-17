import { createContext, useContext, useReducer, useEffect } from 'react'
import { storage } from '../utils/storage'

const PortfolioContext = createContext()

const INITIAL_CASH = 100000

const initialState = {
  cash: INITIAL_CASH,
  holdings: [], // { symbol, quantity, avgPrice }
  transactions: [], // { id, type, symbol, quantity, price, total, timestamp }
}

const portfolioReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_PORTFOLIO':
      return action.payload || initialState

    case 'BUY_STOCK': {
      const { symbol, quantity, price } = action.payload
      const total = quantity * price
      
      if (total > state.cash) {
        throw new Error('Insufficient funds')
      }

      const existingHolding = state.holdings.find(h => h.symbol === symbol)
      let newHoldings

      if (existingHolding) {
        // Update existing holding with new average price
        const totalQuantity = existingHolding.quantity + quantity
        const totalCost = (existingHolding.quantity * existingHolding.avgPrice) + total
        const newAvgPrice = totalCost / totalQuantity

        newHoldings = state.holdings.map(h =>
          h.symbol === symbol
            ? { ...h, quantity: totalQuantity, avgPrice: newAvgPrice }
            : h
        )
      } else {
        // Add new holding
        newHoldings = [...state.holdings, { symbol, quantity, avgPrice: price }]
      }

      const transaction = {
        id: Date.now(),
        type: 'BUY',
        symbol,
        quantity,
        price,
        total,
        timestamp: new Date().toISOString()
      }

      return {
        ...state,
        cash: state.cash - total,
        holdings: newHoldings,
        transactions: [transaction, ...state.transactions]
      }
    }

    case 'SELL_STOCK': {
      const { symbol, quantity, price } = action.payload
      const holding = state.holdings.find(h => h.symbol === symbol)

      if (!holding || holding.quantity < quantity) {
        throw new Error('Insufficient shares')
      }

      const total = quantity * price
      const newQuantity = holding.quantity - quantity

      const newHoldings = newQuantity > 0
        ? state.holdings.map(h =>
            h.symbol === symbol
              ? { ...h, quantity: newQuantity }
              : h
          )
        : state.holdings.filter(h => h.symbol !== symbol)

      const transaction = {
        id: Date.now(),
        type: 'SELL',
        symbol,
        quantity,
        price,
        total,
        timestamp: new Date().toISOString()
      }

      return {
        ...state,
        cash: state.cash + total,
        holdings: newHoldings,
        transactions: [transaction, ...state.transactions]
      }
    }

    case 'RESET_PORTFOLIO':
      return initialState

    default:
      return state
  }
}

export const PortfolioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(portfolioReducer, initialState)

  // Load portfolio from localStorage on mount
  useEffect(() => {
    const savedPortfolio = storage.getPortfolio()
    if (savedPortfolio) {
      dispatch({ type: 'LOAD_PORTFOLIO', payload: savedPortfolio })
    }
  }, [])

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    storage.savePortfolio(state)
  }, [state])

  const buyStock = (symbol, quantity, price) => {
    try {
      dispatch({ type: 'BUY_STOCK', payload: { symbol, quantity, price } })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const sellStock = (symbol, quantity, price) => {
    try {
      dispatch({ type: 'SELL_STOCK', payload: { symbol, quantity, price } })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const resetPortfolio = () => {
    dispatch({ type: 'RESET_PORTFOLIO' })
  }

  const getHolding = (symbol) => {
    return state.holdings.find(h => h.symbol === symbol)
  }

  return (
    <PortfolioContext.Provider value={{
      ...state,
      buyStock,
      sellStock,
      resetPortfolio,
      getHolding
    }}>
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
