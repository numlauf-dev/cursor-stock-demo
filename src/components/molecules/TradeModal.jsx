import { useState } from 'react'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import { formatCurrency } from '../../utils/calculations'

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
  const quantityNum = parseInt(quantity) || 0
  const total = quantityNum * currentPrice

  const handleQuantityChange = (e) => {
    const value = e.target.value
    setQuantity(value)
    setError('')

    const num = parseInt(value)
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
              <div className="text-white text-xl font-bold">{availableShares}</div>
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

          <Input
            type="number"
            label="Quantity"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Enter number of shares"
            min="1"
            step="1"
            error={error}
          />

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
