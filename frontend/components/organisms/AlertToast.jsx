import { useEffect } from 'react'
import { formatCurrency } from '../../utils/calculations'
import Button from '../atoms/Button'

const AlertToast = ({ alert, currentPrice, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) {
        onDismiss()
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!alert) {
    return null
  }

  const conditionText = alert.condition === 'ABOVE' ? 'above' : 'below'
  const isAbove = alert.condition === 'ABOVE'
  const bgColor = isAbove ? 'bg-green-900/90' : 'bg-red-900/90'
  const borderColor = isAbove ? 'border-green-500' : 'border-red-500'
  const textColor = isAbove ? 'text-green-300' : 'text-red-300'

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 shadow-lg backdrop-blur-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-semibold text-white">Alert Triggered</h3>
          </div>
          <p className="text-sm text-white mb-1">
            <span className="font-semibold text-blue-300">{alert.symbol}</span> is now{' '}
            <span className={textColor}>{conditionText}</span> your target price
          </p>
          <div className="text-xs text-gray-300">
            Target: {formatCurrency(alert.targetPrice)} | Current: {formatCurrency(currentPrice)}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}

export default AlertToast
