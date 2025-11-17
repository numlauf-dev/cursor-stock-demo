import { useWatchlist } from '../../context/WatchlistContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import StockCard from '../molecules/StockCard'

const Sidebar = () => {
  const { watchlist, removeFromWatchlist } = useWatchlist()
  const { quotes } = useMultipleQuotes(watchlist)

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Watchlist</h2>
      
      {watchlist.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p className="text-sm">No stocks in watchlist</p>
          <p className="text-xs mt-2">Add stocks to track prices</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map(symbol => (
            <StockCard
              key={symbol}
              symbol={symbol}
              quote={quotes[symbol]}
              onRemove={removeFromWatchlist}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Sidebar
