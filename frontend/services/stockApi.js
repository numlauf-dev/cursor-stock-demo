const API_KEY = import.meta.env?.VITE_FINNHUB_API_KEY || 'demo'
const BASE_URL = 'https://finnhub.io/api/v1'
const BACKEND_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api/v1'

// Cache to reduce API calls
const cache = new Map()
const CACHE_DURATION = 5000 // 5 seconds

const getCached = (key) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() })
}

const roundToCents = (value) => Math.round(value * 100) / 100

const getSymbolHash = (symbol) =>
  Array.from((symbol || '').toUpperCase()).reduce(
    (hash, character) => ((hash * 31) + character.charCodeAt(0)) % 1000003,
    17
  )

const getDeterministicNumber = (symbol, min, max, seedOffset = 0) => {
  const hash = (getSymbolHash(symbol) + seedOffset) % 1000
  const ratio = hash / 999
  return roundToCents(min + ((max - min) * ratio))
}

const mapBackendQuoteToFrontendQuote = (symbol, quote) => ({
  symbol: quote?.symbol || symbol,
  currentPrice: quote?.price ?? 0,
  price: quote?.price ?? 0,
  change: quote?.change ?? 0,
  changePercent: quote?.changePercent ?? 0,
  high: quote?.high ?? quote?.price ?? 0,
  low: quote?.low ?? quote?.price ?? 0,
  open: quote?.open ?? quote?.previousClose ?? quote?.price ?? 0,
  previousClose: quote?.previousClose ?? quote?.price ?? 0,
  volume: quote?.volume ?? 0,
  latestTradingDay: quote?.latestTradingDay ?? null,
  timestamp: Date.now()
})

const createDeterministicFallbackQuote = (symbol) => {
  const currentPrice = getDeterministicNumber(symbol, 140, 240)
  const changePercent = getDeterministicNumber(symbol, -2, 2, 97)
  const change = roundToCents((currentPrice * changePercent) / 100)
  const previousClose = roundToCents(currentPrice - change)
  const open = roundToCents(previousClose + getDeterministicNumber(symbol, -1.5, 1.5, 193))
  const highBase = Math.max(currentPrice, open, previousClose)
  const lowBase = Math.min(currentPrice, open, previousClose)

  return {
    symbol,
    currentPrice,
    price: currentPrice,
    change,
    changePercent,
    high: roundToCents(highBase + getDeterministicNumber(symbol, 0.25, 2.5, 389)),
    low: roundToCents(Math.max(0.01, lowBase - getDeterministicNumber(symbol, 0.25, 2.5, 587))),
    open,
    previousClose,
    volume: Math.round(getDeterministicNumber(symbol, 500000, 5000000, 761)),
    latestTradingDay: null,
    timestamp: Date.now()
  }
}

export const stockApi = {
  // Get stock quote (current price)
  async getQuote(symbol) {
    const cacheKey = `quote_${symbol}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/stocks/${encodeURIComponent(symbol)}/quote`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch quote')
      }

      const result = await response.json()
      const backendQuote = result?.data?.quote
      if (!backendQuote) {
        throw new Error('Quote payload missing from backend response')
      }

      const quote = mapBackendQuoteToFrontendQuote(symbol, backendQuote)
      setCache(cacheKey, quote)
      return quote
    } catch (error) {
      console.error('Error fetching quote:', error)
      const fallbackQuote = createDeterministicFallbackQuote(symbol)
      setCache(cacheKey, fallbackQuote)
      return fallbackQuote
    }
  },

  // Get company profile
  async getCompanyProfile(symbol) {
    const cacheKey = `profile_${symbol}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      
      setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return {
        name: symbol,
        ticker: symbol,
        marketCapitalization: 0,
        shareOutstanding: 0,
        exchange: 'NASDAQ'
      }
    }
  },

  // Get stock news from backend API
  async getNews(symbol, limit = 5, cursor = null) {
    const cursorKey = cursor === null ? 'first' : String(cursor)
    const cacheKey = `news_${symbol}_${limit}_${cursorKey}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const query = new URLSearchParams({ limit: String(limit) })
      if (cursor !== null && cursor !== undefined) {
        query.set('cursor', String(cursor))
      }

      const response = await fetch(
        `${BACKEND_BASE_URL}/stocks/${encodeURIComponent(symbol)}/news?${query.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch stock news')
      }

      const result = await response.json()
      const payload = {
        news: result?.data?.news || [],
        nextCursor: result?.data?.nextCursor ?? null,
        hasMore: Boolean(result?.data?.hasMore),
      }
      setCache(cacheKey, payload)
      return payload
    } catch (error) {
      console.error('Error fetching stock news:', error)
      throw error
    }
  },

  // Get historical price data from backend so the server can
  // decide between Finnhub candles and demo fallback history.
  async getHistory(symbol, period = '1m') {
    const cacheKey = `history_${symbol}_${period}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/stocks/${encodeURIComponent(symbol)}/history?period=${encodeURIComponent(period)}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch stock history')
      }

      const result = await response.json()
      const history = result?.data?.history || []
      setCache(cacheKey, history)
      return history
    } catch (error) {
      console.error('Error fetching stock history:', error)
      throw error
    }
  },

  // Search for stocks
  async searchStocks(query) {
    if (!query || query.length < 1) return []
    
    try {
      const response = await fetch(
        `${BASE_URL}/search?q=${query}&token=${API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to search stocks')
      const data = await response.json()
      
      // Filter for US stocks only
      return data.result
        .filter(stock => stock.type === 'Common Stock')
        .slice(0, 10)
        .map(stock => ({
          symbol: stock.symbol,
          description: stock.description
        }))
    } catch (error) {
      console.error('Error searching stocks:', error)
      // Return common stocks for demo
      const commonStocks = [
        { symbol: 'AAPL', description: 'Apple Inc' },
        { symbol: 'GOOGL', description: 'Alphabet Inc Class A' },
        { symbol: 'MSFT', description: 'Microsoft Corporation' },
        { symbol: 'AMZN', description: 'Amazon.com Inc' },
        { symbol: 'TSLA', description: 'Tesla Inc' },
        { symbol: 'META', description: 'Meta Platforms Inc' },
        { symbol: 'NVDA', description: 'NVIDIA Corporation' },
        { symbol: 'JPM', description: 'JPMorgan Chase & Co' },
        { symbol: 'V', description: 'Visa Inc' },
        { symbol: 'WMT', description: 'Walmart Inc' }
      ]
      return commonStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.description.toLowerCase().includes(query.toLowerCase())
      )
    }
  },

}

export const __testables = {
  createDeterministicFallbackQuote,
  mapBackendQuoteToFrontendQuote,
  clearCache: () => cache.clear()
}
