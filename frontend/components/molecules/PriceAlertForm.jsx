import { useState } from 'react'
import Button from '../atoms/Button'
import { AlertCondition, createAlert } from '../../utils/priceAlerts'
import { formatCurrency } from '../../utils/calculations'

const PriceAlertForm = ({ symbol, currentPrice, onAlertCreated }) => {
  const [condition, setCondition] = useState(AlertCondition.ABOVE)
  const [targetPrice, setTargetPrice] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const price = parseFloat(targetPrice)

    if (!price || price <= 0) {
      setError('Please enter a valid price')
      return
    }

    if (condition === AlertCondition.ABOVE && price <= currentPrice) {
      setError(`Target price must be above current price (${formatCurrency(currentPrice)})`)
      return
    }

    if (condition === AlertCondition.BELOW && price >= currentPrice) {
      setError(`Target price must be below current price (${formatCurrency(currentPrice)})`)
      return
    }

    const alert = createAlert(symbol, condition, price)
    setTargetPrice('')
    
    if (onAlertCreated) {
      onAlertCreated(alert)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Alert Condition
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCondition(AlertCondition.ABOVE)}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              condition === AlertCondition.ABOVE
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            Above
          </button>
          <button
            type="button"
            onClick={() => setCondition(AlertCondition.BELOW)}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              condition === AlertCondition.BELOW
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            Below
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-300 mb-2">
          Target Price
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            $
          </span>
          <input
            id="targetPrice"
            type="number"
            step="0.01"
            min="0.01"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Current price: {formatCurrency(currentPrice)}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full">
        Create Alert
      </Button>
    </form>
  )
}

export default PriceAlertForm
