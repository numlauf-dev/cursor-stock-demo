import { useWatchlist } from '../../context/WatchlistContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatPercentage } from '../../utils/calculations'
import LoadingSpinner from '../atoms/LoadingSpinner'

const WatchlistHighlights = () => {
  const { watchlist } = useWatchlist()
  const { quotes, loading, error } = useMultipleQuotes(watchlist)
  const navigate = useNavigate()

  if (watchlist.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Watchlist Highlights</h2>
        <div className="text-center text-gray-400 py-8">
          <p className="text-sm">No stocks in watchlist</p>
          <p className="text-xs mt-2">Add stocks to track their prices and changes</p>
        </div>
      </div>
    )
  }

  if (loading && Object.keys(quotes).length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">Watchlist Highlights</h2>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">Watchlist Highlights</h2>
        <div className="text-center text-red-400 py-4">
          <p className="text-sm">Error loading stock data: {error}</p>
        </div>
      </div>
    )
  }

  const handleStockClick = (symbol) => {
    navigate(`/stock/${symbol}`)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-white mb-4">Watchlist Highlights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {watchlist.map(symbol => {
          const quote = quotes[symbol]
          
          if (!quote) {
            return (
              <div
                key={symbol}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 animate-pulse"
              >
                <div className="h-6 bg-gray-600 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-600 rounded w-32"></div>
              </div>
            )
          }

          const isPositive = quote.change >= 0
          const changeColorClass = isPositive 
            ? 'text-green-500 bg-green-500/10' 
            : quote.change === 0 
            ? 'text-gray-400 bg-gray-500/10'
            : 'text-red-500 bg-red-500/10'

          return (
            <div
              key={symbol}
              onClick={() => handleStockClick(symbol)}
              className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 hover:bg-gray-700 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-blue-400 group-hover:text-blue-300">
                  {symbol}
                </h3>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(quote.currentPrice)}
                </div>
                
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold ${changeColorClass}`}>
                  <span>{isPositive ? '▲' : quote.change === 0 ? '—' : '▼'}</span>
                  <span>{formatCurrency(Math.abs(quote.change))}</span>
                  <span>({formatPercentage(quote.changePercent)})</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WatchlistHighlights

