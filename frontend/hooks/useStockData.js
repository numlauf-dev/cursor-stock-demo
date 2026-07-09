import { useState, useEffect, useCallback } from 'react'
import { stockApi } from '../services/stockApi'

const mergeArticlesById = (existingArticles, newArticles) => {
  const seenIds = new Set(existingArticles.map((article) => article.id))
  const dedupedIncoming = newArticles.filter((article) => {
    if (!article?.id || seenIds.has(article.id)) {
      return false
    }

    seenIds.add(article.id)
    return true
  })

  return [...existingArticles, ...dedupedIncoming]
}

export const useStockQuote = (symbol, refreshInterval = 5000) => {
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQuote = useCallback(async () => {
    if (!symbol) return

    try {
      setError(null)
      const data = await stockApi.getQuote(symbol)
      setQuote(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    fetchQuote()

    // Set up polling for real-time updates
    const interval = setInterval(fetchQuote, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchQuote, refreshInterval])

  return { quote, loading, error, refresh: fetchQuote }
}

export const useStockProfile = (symbol) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return

    const fetchProfile = async () => {
      try {
        setError(null)
        setLoading(true)
        const data = await stockApi.getCompanyProfile(symbol)
        setProfile(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [symbol])

  return { profile, loading, error }
}

export const useStockNews = (symbol, limit = 5) => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [loadMoreError, setLoadMoreError] = useState(null)
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (!symbol) {
      setNews([])
      setLoading(false)
      setLoadingMore(false)
      setError(null)
      setLoadMoreError(null)
      setNextCursor(null)
      setHasMore(false)
      return
    }

    const fetchNews = async () => {
      try {
        setError(null)
        setLoadMoreError(null)
        setLoading(true)
        const payload = await stockApi.getNews(symbol, limit)
        setNews(Array.isArray(payload.news) ? payload.news : [])
        setNextCursor(payload.nextCursor ?? null)
        setHasMore(Boolean(payload.hasMore))
      } catch (err) {
        setError(err.message)
        setNews([])
        setNextCursor(null)
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [symbol, limit])

  const loadMore = useCallback(async () => {
    if (!symbol || !hasMore || nextCursor === null || loadingMore) {
      return
    }

    try {
      setLoadMoreError(null)
      setLoadingMore(true)
      const payload = await stockApi.getNews(symbol, limit, nextCursor)
      setNews((previousNews) => mergeArticlesById(previousNews, Array.isArray(payload.news) ? payload.news : []))
      setNextCursor(payload.nextCursor ?? null)
      setHasMore(Boolean(payload.hasMore))
    } catch (err) {
      setLoadMoreError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }, [symbol, limit, nextCursor, hasMore, loadingMore])

  return {
    news,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
  }
}

export const useStockSearch = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = useCallback(async (query) => {
    if (!query || query.length < 1) {
      setResults([])
      return
    }

    try {
      setError(null)
      setLoading(true)
      const data = await stockApi.searchStocks(query)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, error, search }
}

export const useStockHistory = (symbol, period = '1m') => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchHistory = useCallback(async () => {
    if (!symbol) {
      setHistory([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setError(null)
      setLoading(true)
      const data = await stockApi.getHistory(symbol, period)
      setHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [symbol, period])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory, refreshKey])

  const refresh = useCallback(() => {
    setRefreshKey((previousKey) => previousKey + 1)
  }, [])

  return { history, loading, error, refresh }
}

export const useStockCandles = (symbol, _resolution = 'D', days = 30) => {
  const periodByDayRange = {
    1: '1d',
    7: '1w',
    30: '1m',
    90: '3m',
    365: '1y',
  }

  const period = periodByDayRange[days] || '1m'
  const { history, loading, error, refresh } = useStockHistory(symbol, period)

  return { candles: history, history, loading, error, refresh }
}

export const useMultipleQuotes = (symbols, refreshInterval = 5000) => {
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQuotes = useCallback(async () => {
    if (!symbols || symbols.length === 0) {
      setQuotes({})
      setLoading(false)
      setError(null)
      return
    }

    try {
      setError(null)
      // Use Promise.allSettled to handle partial failures gracefully
      const promises = symbols.map(symbol => 
        stockApi.getQuote(symbol).catch(err => {
          console.error(`Error fetching quote for ${symbol}:`, err)
          return { symbol, error: err.message }
        })
      )
      const results = await Promise.all(promises)
      
      const quotesMap = {}
      const errors = []
      
      results.forEach((result, index) => {
        if (result.error) {
          errors.push(`${symbols[index]}: ${result.error}`)
        } else if (result.symbol) {
          quotesMap[result.symbol] = result
        }
      })
      
      setQuotes(quotesMap)
      
      // Only set error if all requests failed
      if (errors.length === symbols.length) {
        setError(errors.join('; '))
      } else if (errors.length > 0) {
        // Partial failure - log but don't block UI
        console.warn('Some quotes failed to load:', errors)
      }
      
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [symbols?.join(',')])

  useEffect(() => {
    fetchQuotes()

    // Set up polling for real-time updates
    const interval = setInterval(fetchQuotes, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchQuotes, refreshInterval])

  return { quotes, loading, error, refresh: fetchQuotes }
}
