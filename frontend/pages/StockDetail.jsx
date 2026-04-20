import { useParams } from 'react-router-dom'
import { useStockQuote, useStockProfile, useStockNews } from '../hooks/useStockData'
import { useWatchlist } from '../context/WatchlistContext'
import PriceDisplay from '../components/atoms/PriceDisplay'
import Button from '../components/atoms/Button'
import TradingPanel from '../components/organisms/TradingPanel'
import { formatCurrency } from '../utils/calculations'

const StockDetail = () => {
  const { symbol } = useParams()
  const { quote, loading: quoteLoading } = useStockQuote(symbol?.toUpperCase())
  const { profile, loading: profileLoading } = useStockProfile(symbol?.toUpperCase())
  const { news, loading: newsLoading, error: newsError } = useStockNews(symbol?.toUpperCase(), 5)
  const { isInWatchlist, toggleWatchlist, isReady: watchlistReady, loading: watchlistLoading } = useWatchlist()

  const upperSymbol = symbol?.toUpperCase()
  const inWatchlist = isInWatchlist(upperSymbol)

  const formatPublishedTime = (publishedAt) => {
    const timestamp = new Date(publishedAt)
    if (Number.isNaN(timestamp.getTime())) {
      return 'Unknown time'
    }

    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

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
          <div className="text-white font-semibold">{formatCurrency(quote.open)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">High</div>
          <div className="text-white font-semibold">{formatCurrency(quote.high)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Low</div>
          <div className="text-white font-semibold">{formatCurrency(quote.low)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Prev Close</div>
          <div className="text-white font-semibold">{formatCurrency(quote.previousClose)}</div>
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
                <span className="text-white font-semibold text-lg">{formatCurrency(quote.currentPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Previous Close</span>
                <span className="text-white">{formatCurrency(quote.previousClose)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Day's Range</span>
                <span className="text-white">{formatCurrency(quote.low)} - {formatCurrency(quote.high)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Change</span>
                <span className={`font-semibold ${quote.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {quote.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(quote.change))} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                Historical price charts require a premium API subscription. Current price data is available above.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-white mb-4">News</h2>

            {newsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="animate-pulse border border-gray-700 rounded-lg p-4">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : newsError ? (
              <div className="text-sm text-red-400">Unable to load news right now.</div>
            ) : news.length === 0 ? (
              <div className="text-sm text-gray-400">No recent news available.</div>
            ) : (
              <div className="space-y-3">
                {news.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block border border-gray-700 hover:border-gray-500 rounded-lg p-4 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-white mb-2">{article.headline}</h3>
                    <div className="text-xs text-gray-400">
                      {article.source} · {formatPublishedTime(article.publishedAt)}
                    </div>
                  </a>
                ))}
              </div>
            )}
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
