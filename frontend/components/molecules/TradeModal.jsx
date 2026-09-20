import { useState } from 'react'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import { formatCurrency, formatNumber } from '../../utils/calculations'

const parseQuantity = (value) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const TradeModal = ({ 
  isOpen, 
  onClose, 
  type, 
  symbol, 
  currentPrice, 
  onConfirm,
  availableShares = 0,
  availableCash = 0
}) => {
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const isBuy = type === 'BUY'
  const quantityNum = parseQuantity(quantity)
  const total = quantityNum * currentPrice

  const handleQuantityChange = (e) => {
    const value = e.target.value
    setQuantity(value)
    setError('')

    if (value.trim() === '') {
      return
    }

    const num = parseQuantity(value)
    if (num <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    if (isBuy) {
      if (num * currentPrice > availableCash) {
        setError('Insufficient funds')
      }
    } else {
      if (num > availableShares) {
        setError('Insufficient shares')
      }
    }
  }

  const handleQuickAmount = (percentage) => {
    let amount
    if (isBuy) {
      const maxShares = availableCash / currentPrice
      amount = (maxShares * percentage).toFixed(6)
    } else {
      amount = (availableShares * percentage).toFixed(6)
    }
    
    const cleanAmount = parseFloat(amount).toString()
    setQuantity(cleanAmount)
    
    const num = parseQuantity(cleanAmount)
    if (isBuy && num * currentPrice > availableCash) {
      setError('Insufficient funds')
    } else if (!isBuy && num > availableShares) {
      setError('Insufficient shares')
    } else {
      setError('')
    }
  }

  const handleConfirm = () => {
    if (error || !quantity || quantityNum <= 0) return

    onConfirm(quantityNum)
    setQuantity('')
    setError('')
  }

  const handleClose = () => {
    setQuantity('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isBuy ? 'Buy' : 'Sell'} {symbol}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Current Price</div>
            <div className="text-white text-xl font-bold">
              {formatCurrency(currentPrice)}
            </div>
          </div>

          {!isBuy && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Available Shares</div>
              <div className="text-white text-xl font-bold">{formatNumber(availableShares)}</div>
            </div>
          )}

          {isBuy && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Available Cash</div>
              <div className="text-white text-xl font-bold">
                {formatCurrency(availableCash)}
              </div>
            </div>
          )}

          <div>
            <Input
              type="number"
              label="Quantity"
              value={quantity}
              onChange={handleQuantityChange}
              placeholder="Enter shares"
              min="0.01"
              step="0.01"
              error={error}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(0.25)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(0.5)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(1.0)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total</div>
            <div className="text-white text-xl font-bold">
              {formatCurrency(total)}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={isBuy ? 'success' : 'danger'}
            onClick={handleConfirm}
            disabled={!!error || !quantity || quantityNum <= 0}
            className="flex-1"
          >
            Confirm {isBuy ? 'Buy' : 'Sell'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TradeModal
