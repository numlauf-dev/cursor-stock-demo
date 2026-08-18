import { useState } from 'react'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import { formatCurrency, formatNumber } from '../../utils/calculations'
import {
  DENOM,
  emptyDraft,
  formatShares,
  resolveOrder,
  withAmount,
  withDenomination,
} from '../../utils/orderDraft'

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
  const [draft, setDraft] = useState(() => emptyDraft())

  const terms = {
    side: type,
    price: currentPrice,
    cash: availableCash,
    shares: availableShares
  }
  const order = resolveOrder(draft, terms)
  const inDollars = draft.denomination === DENOM.DOLLARS

  if (!isOpen) return null

  const isBuy = type === 'BUY'

  const handleConfirm = () => {
    if (!order.canConfirm) return
    onConfirm(order.shares)
    setDraft(emptyDraft(draft.denomination))
  }

  const handleClose = () => {
    setDraft(emptyDraft(draft.denomination))
    onClose()
  }

  const toggleClass = (pressed) =>
    `flex-1 py-2 rounded-lg font-semibold ${
      pressed
        ? 'bg-blue-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:text-white'
    }`

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

          <div className="flex gap-2" role="group">
            <button
              type="button"
              onClick={() => setDraft(withDenomination(draft, DENOM.SHARES, terms))}
              aria-pressed={!inDollars}
              className={toggleClass(!inDollars)}
            >
              Shares
            </button>
            <button
              type="button"
              onClick={() => setDraft(withDenomination(draft, DENOM.DOLLARS, terms))}
              aria-pressed={inDollars}
              className={toggleClass(inDollars)}
            >
              Dollars
            </button>
          </div>

          <Input
            type="text"
            inputMode="decimal"
            label={inDollars ? 'Amount' : 'Quantity'}
            value={draft.amount}
            onChange={(e) => setDraft(withAmount(draft, e.target.value))}
            placeholder={inDollars
              ? 'Enter dollars (for example 250.00)'
              : 'Enter shares (for example 1.5)'}
            error={order.error}
          />

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total</div>
            <div className="text-white text-xl font-bold">
              {formatCurrency(order.notional)}
            </div>
            {inDollars && (
              <div className="text-gray-400 text-sm mt-1">
                ≈ {formatShares(order.shares)} shares
              </div>
            )}
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
            disabled={!order.canConfirm}
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
