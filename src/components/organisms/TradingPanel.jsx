import { useState } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'
import Button from '../atoms/Button'
import TradeModal from '../molecules/TradeModal'
import { formatCurrency, formatNumber } from '../../utils/calculations'

const TradingPanel = ({ symbol, currentPrice }) => {
  const { cash, getHolding, buyStock, sellStock } = usePortfolio()
  const [tradeType, setTradeType] = useState(null)
  const [notification, setNotification] = useState(null)

  const holding = getHolding(symbol)
  const availableShares = holding?.quantity || 0

  const handleTrade = (quantity) => {
    const result = tradeType === 'BUY'
      ? buyStock(symbol, quantity, currentPrice)
      : sellStock(symbol, quantity, currentPrice)

    if (result.success) {
      setNotification({
        type: 'success',
        message: `Successfully ${tradeType === 'BUY' ? 'bought' : 'sold'} ${quantity} shares of ${symbol}`
      })
    } else {
      setNotification({
        type: 'error',
        message: result.error
      })
    }

    setTradeType(null)
    setTimeout(() => setNotification(null), 5000)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Trade {symbol}</h2>

      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-900 border border-green-700 text-green-100' 
            : 'bg-red-900 border border-red-700 text-red-100'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Available Cash</div>
          <div className="text-white text-lg font-semibold">
            {formatCurrency(cash)}
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Your Holdings</div>
          <div className="text-white text-lg font-semibold">
            {holding ? (
              <>
                {formatNumber(holding.quantity)} shares
                <div className="text-sm text-gray-400 mt-1">
                  Avg Price: {formatCurrency(holding.avgPrice)}
                </div>
              </>
            ) : (
              'None'
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="success"
          onClick={() => setTradeType('BUY')}
          className="w-full"
          disabled={cash < currentPrice}
        >
          Buy {symbol}
        </Button>
        <Button
          variant="danger"
          onClick={() => setTradeType('SELL')}
          className="w-full"
          disabled={!holding || holding.quantity === 0}
        >
          Sell {symbol}
        </Button>
      </div>

      <TradeModal
        isOpen={tradeType !== null}
        onClose={() => setTradeType(null)}
        type={tradeType}
        symbol={symbol}
        currentPrice={currentPrice}
        onConfirm={handleTrade}
        availableShares={availableShares}
        availableCash={cash}
      />
    </div>
  )
}

export default TradingPanel
