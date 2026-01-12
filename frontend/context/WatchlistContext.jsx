import { createContext, useContext, useState, useEffect } from 'react'
import { storage } from '../utils/storage'

const WatchlistContext = createContext()

export const WatchlistProvider = ({ children }) => {
  // Load initial watchlist from localStorage or use empty array
  const [watchlist, setWatchlist] = useState(() => {
    return storage.getWatchlist() || []
  })

  // Save to localStorage whenever watchlist changes
  useEffect(() => {
    storage.saveWatchlist(watchlist)
  }, [watchlist])

  const addToWatchlist = (symbol) => {
    if (watchlist.includes(symbol)) {
      return false
    }

    setWatchlist([...watchlist, symbol])
    return true
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
      const added = addToWatchlist(symbol)
      return added
    }
  }

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      loading: false,
      isReady: true,
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
