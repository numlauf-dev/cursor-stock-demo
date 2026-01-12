import { useNavigate } from 'react-router-dom'
import PriceDisplay from '../atoms/PriceDisplay'

const StockCard = ({ symbol, quote, onRemove }) => {
  const navigate = useNavigate()

  if (!quote) {
    return (
      <div className="bg-card-02 border border-card-04 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-card-03 rounded w-20 mb-2"></div>
        <div className="h-8 bg-card-03 rounded w-32"></div>
      </div>
    )
  }

  return (
    <div className="bg-card-02 border border-card-04 rounded-lg p-4 hover:border-card-04/80 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => navigate(`/stock/${symbol}`)}
          className="font-bold text-lg text-accent hover:opacity-80"
        >
          {symbol}
        </button>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(symbol)
            }}
            className="text-fg/40 hover:text-loss opacity-0 group-hover:opacity-100 transition-opacity"
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
