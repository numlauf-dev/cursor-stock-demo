import { useState, useEffect, useCallback } from 'react'
import { stockApi } from '../services/stockApi'

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
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) {
      setNews([])
      setLoading(false)
      setError(null)
      return
    }

    const fetchNews = async () => {
      try {
        setError(null)
        setLoading(true)
        const data = await stockApi.getNews(symbol, limit)
        setNews(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
        setNews([])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [symbol, limit])

  return { news, loading, error }
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

export const useStockCandles = (symbol, resolution = 'D', days = 30) => {
  const [candles, setCandles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return

    const fetchCandles = async () => {
      try {
        setError(null)
        setLoading(true)
        const to = Math.floor(Date.now() / 1000)
        const from = to - (days * 24 * 60 * 60)
        const data = await stockApi.getCandles(symbol, resolution, from, to)
        setCandles(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCandles()
  }, [symbol, resolution, days])

  return { candles, loading, error }
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
