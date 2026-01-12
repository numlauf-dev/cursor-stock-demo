import { createContext, useContext, useState, useEffect } from 'react'
import { storage } from '../utils/storage'

const PortfolioContext = createContext()

const INITIAL_CASH = 100000

const initialState = {
  cash: INITIAL_CASH,
  holdings: [], // { symbol, quantity, avgPrice }
  transactions: [], // { id, type, symbol, quantity, price, total, timestamp }
}

export const PortfolioProvider = ({ children }) => {
  // Load initial state from localStorage or use defaults
  const [state, setState] = useState(() => {
    const saved = storage.getPortfolio()
    if (saved) {
      return {
        cash: saved.cash ?? INITIAL_CASH,
        holdings: saved.holdings ?? [],
        transactions: saved.transactions ?? [],
      }
    }
    return initialState
  })

  // Save to localStorage whenever state changes
  useEffect(() => {
    storage.savePortfolio(state)
  }, [state])

  const buyStock = (symbol, quantity, price) => {
    const total = quantity * price
    
    if (state.cash < total) {
      return { success: false, error: 'Insufficient funds' }
    }

    setState(prev => {
      const existingHolding = prev.holdings.find(h => h.symbol === symbol)
      let newHoldings

      if (existingHolding) {
        // Update existing holding
        const newQuantity = existingHolding.quantity + quantity
        const newAvgPrice = 
          (existingHolding.avgPrice * existingHolding.quantity + total) / newQuantity
        
        newHoldings = prev.holdings.map(h =>
          h.symbol === symbol
            ? { ...h, quantity: newQuantity, avgPrice: newAvgPrice }
            : h
        )
      } else {
        // Add new holding
        newHoldings = [...prev.holdings, {
          symbol,
          quantity,
          avgPrice: price,
        }]
      }

      const transaction = {
        id: Date.now().toString(),
        type: 'buy',
        symbol,
        quantity,
        price,
        total,
        timestamp: new Date().toISOString(),
      }

      return {
        cash: prev.cash - total,
        holdings: newHoldings,
        transactions: [transaction, ...prev.transactions],
      }
    })

    return { success: true }
  }

  const sellStock = (symbol, quantity, price) => {
    const holding = state.holdings.find(h => h.symbol === symbol)
    
    if (!holding) {
      return { success: false, error: 'No holding found' }
    }

    if (holding.quantity < quantity) {
      return { success: false, error: 'Insufficient shares' }
    }

    setState(prev => {
      const total = quantity * price
      const newQuantity = holding.quantity - quantity
      
      const newHoldings = newQuantity > 0
        ? prev.holdings.map(h =>
            h.symbol === symbol
              ? { ...h, quantity: newQuantity }
              : h
          )
        : prev.holdings.filter(h => h.symbol !== symbol)

      const transaction = {
        id: Date.now().toString(),
        type: 'sell',
        symbol,
        quantity,
        price,
        total,
        timestamp: new Date().toISOString(),
      }

      return {
        cash: prev.cash + total,
        holdings: newHoldings,
        transactions: [transaction, ...prev.transactions],
      }
    })

    return { success: true }
  }

  const resetPortfolio = () => {
    setState(initialState)
    storage.clearAll()
  }

  const getHolding = (symbol) => {
    return state.holdings.find(h => h.symbol === symbol)
  }

  const contextValue = {
    cash: state.cash,
    holdings: state.holdings,
    transactions: state.transactions,
    loading: false,
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
