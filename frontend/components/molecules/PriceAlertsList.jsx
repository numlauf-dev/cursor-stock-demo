import { AlertCondition, deleteAlert } from '../../utils/priceAlerts'
import { formatCurrency } from '../../utils/calculations'
import Button from '../atoms/Button'

const PriceAlertsList = ({ alerts, onAlertDeleted }) => {
  const handleDelete = (alertId) => {
    deleteAlert(alertId)
    if (onAlertDeleted) {
      onAlertDeleted(alertId)
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <p className="text-sm">No active alerts</p>
        <p className="text-xs mt-1">Create an alert to get notified when price targets are reached</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isAbove = alert.condition === AlertCondition.ABOVE
        const conditionText = isAbove ? 'above' : 'below'
        const conditionColor = isAbove ? 'text-green-400' : 'text-red-400'
        const conditionIcon = isAbove ? '▲' : '▼'

        return (
          <div
            key={alert.id}
            className="flex items-center justify-between p-4 bg-gray-700 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-blue-400">{alert.symbol}</span>
                <span className={`text-sm ${conditionColor}`}>
                  {conditionIcon} {conditionText} {formatCurrency(alert.targetPrice)}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Created {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(alert.id)}
            >
              Delete
            </Button>
          </div>
        )
      })}
    </div>
  )
}

export default PriceAlertsList
