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
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PortfolioContext.jsx:101',message:'RESET_PORTFOLIO reducer executing',data:{beforeState:{cash:state.cash,holdingsCount:state.holdings.length,transactionsCount:state.transactions.length},initialState:{cash:initialState.cash,holdingsCount:initialState.holdings.length,transactionsCount:initialState.transactions.length}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PortfolioContext.jsx:113',message:'load effect running',data:{savedPortfolio,hasData:!!savedPortfolio},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (savedPortfolio) {
      dispatch({ type: 'LOAD_PORTFOLIO', payload: savedPortfolio })
    }
  }, [])

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PortfolioContext.jsx:121',message:'save effect running',data:{state:{cash:state.cash,holdingsCount:state.holdings.length,transactionsCount:state.transactions.length},localStorageBefore:storage.getPortfolio()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    storage.savePortfolio(state)
    // #region agent log
    const afterSave = storage.getPortfolio()
    fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PortfolioContext.jsx:123',message:'save effect completed',data:{localStorageAfter:afterSave},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PortfolioContext.jsx:143',message:'resetPortfolio called',data:{currentState:{cash:state.cash,holdingsCount:state.holdings.length,transactionsCount:state.transactions.length}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    dispatch({ type: 'RESET_PORTFOLIO' })
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PortfolioContext.jsx:145',message:'RESET_PORTFOLIO dispatched',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
