import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { storage } from '../utils/storage'
import { api } from '../utils/api'

const WatchlistContext = createContext()

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState(() => storage.getWatchlist() || [])
  const [activeWatchlistId, setActiveWatchlistId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)

  const syncWatchlistFromApi = useCallback(async () => {
    setLoading(true)
    try {
      let watchlists = await api.getWatchlists()
      if (!watchlists || watchlists.length === 0) {
        await api.createWatchlist('My Watchlist')
        watchlists = await api.getWatchlists()
      }

      const primaryWatchlist = watchlists[0]
      const symbols = primaryWatchlist?.items?.map((item) => item.symbol) || []
      setActiveWatchlistId(primaryWatchlist?.id || null)
      setWatchlist(symbols)
      storage.saveWatchlist(symbols)
    } catch (error) {
      console.warn('Failed to sync watchlist from API, using local storage fallback:', error)
      setWatchlist(storage.getWatchlist() || [])
      setActiveWatchlistId(null)
    } finally {
      setLoading(false)
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    syncWatchlistFromApi()
  }, [syncWatchlistFromApi])

  const addToWatchlist = async (symbol) => {
    const normalizedSymbol = symbol?.toUpperCase()
    if (!normalizedSymbol || watchlist.includes(normalizedSymbol)) {
      return false
    }

    if (activeWatchlistId) {
      await api.addStockToWatchlist(activeWatchlistId, normalizedSymbol)
    }

    const nextWatchlist = [...watchlist, normalizedSymbol]
    setWatchlist(nextWatchlist)
    storage.saveWatchlist(nextWatchlist)
    return true
  }

  const removeFromWatchlist = async (symbol) => {
    const normalizedSymbol = symbol?.toUpperCase()
    if (!normalizedSymbol) {
      return
    }

    if (activeWatchlistId) {
      await api.removeStockFromWatchlist(activeWatchlistId, normalizedSymbol)
    }

    const nextWatchlist = watchlist.filter((s) => s !== normalizedSymbol)
    setWatchlist(nextWatchlist)
    storage.saveWatchlist(nextWatchlist)
  }

  const isInWatchlist = (symbol) => watchlist.includes(symbol)

  const toggleWatchlist = async (symbol) => {
    if (!symbol) {
      return false
    }

    const normalizedSymbol = symbol.toUpperCase()
    if (isInWatchlist(normalizedSymbol)) {
      await removeFromWatchlist(normalizedSymbol)
      return false
    }

    return addToWatchlist(normalizedSymbol)
  }

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      activeWatchlistId,
      loading,
      isReady,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      toggleWatchlist,
      refreshWatchlist: syncWatchlistFromApi,
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
