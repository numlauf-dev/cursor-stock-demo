import { useState } from 'react'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import { formatCurrency, formatNumber } from '../../utils/calculations'
import { emptyDraft, resolveDraft } from '../../utils/orderDraft'

const UNIT_TABS = [
  { unit: 'shares', label: 'Shares' },
  { unit: 'dollars', label: 'Dollars' },
]

const PLACEHOLDERS = {
  shares: 'Enter shares (for example 1.5)',
  dollars: 'Enter dollars (for example 250.00)',
}

const formatShares = (shares) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(shares)

const TradeModal = ({
  onClose,
  type,
  symbol,
  currentPrice,
  onConfirm,
  availableShares = 0,
  availableCash = 0
}) => {
  const [draft, setDraft] = useState(emptyDraft())

  const isBuy = type === 'BUY'
  const resolution = resolveDraft(draft, {
    side: type,
    price: currentPrice,
    cash: availableCash,
    heldShares: availableShares,
  })
  const total =
    resolution.status === 'ready' ? resolution.notional : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isBuy ? 'Buy' : 'Sell'} {symbol}
          </h2>
          <button
            onClick={onClose}
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

          <div
            role="group"
            aria-label="Order size unit"
            className="flex rounded-lg overflow-hidden border border-gray-600"
          >
            {UNIT_TABS.map(({ unit, label }) => {
              const pressed = draft.unit === unit
              return (
                <button
                  key={unit}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setDraft({ unit, amount: '' })}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    pressed
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <Input
            type="number"
            label="Quantity"
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
            placeholder={PLACEHOLDERS[draft.unit]}
            step="any"
            error={resolution.status === 'invalid' ? resolution.reason : ''}
          />

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total</div>
            <div className="text-white text-xl font-bold">
              {formatCurrency(total)}
            </div>
            {draft.unit === 'dollars' && resolution.status === 'ready' && (
              <div className="text-gray-400 text-sm mt-1">
                ≈ {formatShares(resolution.shares)} shares
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={isBuy ? 'success' : 'danger'}
            onClick={() => {
              if (resolution.status !== 'ready') return
              const shares = resolution.shares
              setDraft((current) => emptyDraft(current.unit))
              onConfirm(shares)
            }}
            disabled={resolution.status !== 'ready'}
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
