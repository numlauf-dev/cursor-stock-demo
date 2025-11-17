import { useNavigate } from 'react-router-dom'
import PriceDisplay from '../atoms/PriceDisplay'

const StockCard = ({ symbol, quote, onRemove }) => {
  const navigate = useNavigate()

  if (!quote) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-32"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => navigate(`/stock/${symbol}`)}
          className="font-bold text-lg text-blue-400 hover:text-blue-300"
        >
          {symbol}
        </button>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(symbol)
            }}
            className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
      <PriceDisplay
        price={quote.currentPrice}
        change={quote.change}
        changePercent={quote.changePercent}
        size="sm"
      />
    </div>
  )
}

export default StockCard
