import { useParams } from 'react-router-dom'
import { useStockQuote, useStockProfile } from '../hooks/useStockData'
import { useWatchlist } from '../context/WatchlistContext'
import PriceDisplay from '../components/atoms/PriceDisplay'
import Button from '../components/atoms/Button'
import TradingPanel from '../components/organisms/TradingPanel'

const StockDetail = () => {
  const { symbol } = useParams()
  const { quote, loading: quoteLoading } = useStockQuote(symbol?.toUpperCase())
  const { profile, loading: profileLoading } = useStockProfile(symbol?.toUpperCase())
  const { isInWatchlist, toggleWatchlist, isReady: watchlistReady, loading: watchlistLoading } = useWatchlist()

  const upperSymbol = symbol?.toUpperCase()
  const inWatchlist = isInWatchlist(upperSymbol)

  if (quoteLoading || profileLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-12 bg-gray-700 rounded w-64 mb-8"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">
          Failed to load stock data
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{upperSymbol}</h1>
            {profile && <p className="text-xl text-gray-400">{profile.name}</p>}
          </div>
          <Button
            variant={inWatchlist ? 'secondary' : 'outline'}
            onClick={() => {
              if (watchlistReady && !watchlistLoading) {
                toggleWatchlist(upperSymbol)
              }
            }}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {watchlistLoading ? 'Loading...' : inWatchlist ? '★ In Watchlist' : '☆ Add to Watchlist'}
          </Button>
        </div>
        <PriceDisplay
          price={quote.currentPrice}
          change={quote.change}
          changePercent={quote.changePercent}
          size="lg"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Open</div>
          <div className="text-white font-semibold">${quote.open.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">High</div>
          <div className="text-white font-semibold">${quote.high.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Low</div>
          <div className="text-white font-semibold">${quote.low.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Prev Close</div>
          <div className="text-white font-semibold">${quote.previousClose.toFixed(2)}</div>
        </div>
      </div>

      {/* Price Summary and Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Price Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Price</span>
                <span className="text-white font-semibold text-lg">${quote.currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Previous Close</span>
                <span className="text-white">${quote.previousClose.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Day's Range</span>
                <span className="text-white">${quote.low.toFixed(2)} - ${quote.high.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Change</span>
                <span className={`font-semibold ${quote.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                Historical price charts require a premium API subscription. Current price data is available above.
              </p>
            </div>
          </div>
        </div>
        <div>
          <TradingPanel symbol={upperSymbol} currentPrice={quote.currentPrice} />
        </div>
      </div>
    </div>
  )
}

export default StockDetail
