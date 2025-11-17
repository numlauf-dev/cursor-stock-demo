import { createContext, useContext, useState, useEffect } from 'react'
import { storage } from '../utils/storage'

const WatchlistContext = createContext()

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([])

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const savedWatchlist = storage.getWatchlist()
    setWatchlist(savedWatchlist)
  }, [])

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    storage.saveWatchlist(watchlist)
  }, [watchlist])

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol])
      return true
    }
    return false
  }

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol))
  }

  const isInWatchlist = (symbol) => {
    return watchlist.includes(symbol)
  }

  const toggleWatchlist = (symbol) => {
    if (isInWatchlist(symbol)) {
      removeFromWatchlist(symbol)
      return false
    } else {
      addToWatchlist(symbol)
      return true
    }
  }

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      toggleWatchlist
    }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export const useWatchlist = () => {
  const context = useContext(WatchlistContext)
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider')
  }
  return context
}
