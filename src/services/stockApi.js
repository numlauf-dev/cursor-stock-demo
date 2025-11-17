// Stock API service using Finnhub (free tier: 60 req/min)
// Sign up at https://finnhub.io for a free API key

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo'
const BASE_URL = 'https://finnhub.io/api/v1';

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

export const stockApi = {
  // Get stock quote (current price)
  async getQuote(symbol) {
    const cacheKey = `quote_${symbol}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch quote')
      const data = await response.json()
      
      // Transform to standardized format
      const quote = {
        symbol,
        currentPrice: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: Date.now()
      }
      
      setCache(cacheKey, quote)
      return quote
    } catch (error) {
      console.error('Error fetching quote:', error)
      // Return mock data for demo
      return {
        symbol,
        currentPrice: 150 + Math.random() * 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        high: 200,
        low: 100,
        open: 150,
        previousClose: 155,
        timestamp: Date.now()
      }
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

  // Get historical candles
  async getCandles(symbol, resolution = 'D', from, to) {
    try {
      // If no dates provided, get last 30 days
      if (!to) to = Math.floor(Date.now() / 1000)
      if (!from) from = to - (30 * 24 * 60 * 60)

      const response = await fetch(
        `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch candles')
      const data = await response.json()
      
      if (data.s === 'no_data') {
        return this.generateMockCandles(symbol, 30)
      }

      return {
        timestamps: data.t,
        open: data.o,
        high: data.h,
        low: data.l,
        close: data.c,
        volume: data.v
      }
    } catch (error) {
      console.error('Error fetching candles:', error)
      return this.generateMockCandles(symbol, 30)
    }
  },

  // Generate mock candlestick data for demo
  generateMockCandles(symbol, days = 30) {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const basePrice = 150
    
    const timestamps = []
    const open = []
    const high = []
    const low = []
    const close = []
    const volume = []

    let currentPrice = basePrice

    for (let i = days - 1; i >= 0; i--) {
      const timestamp = Math.floor((now - (i * dayMs)) / 1000)
      const volatility = 5
      
      const openPrice = currentPrice
      const closePrice = openPrice + (Math.random() - 0.5) * volatility
      const highPrice = Math.max(openPrice, closePrice) + Math.random() * 2
      const lowPrice = Math.min(openPrice, closePrice) - Math.random() * 2
      
      timestamps.push(timestamp)
      open.push(openPrice)
      high.push(highPrice)
      low.push(lowPrice)
      close.push(closePrice)
      volume.push(Math.floor(Math.random() * 10000000))
      
      currentPrice = closePrice
    }

    return { timestamps, open, high, low, close, volume }
  }
}
