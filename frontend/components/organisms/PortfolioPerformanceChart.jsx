import { useCallback, useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Button from '../atoms/Button'
import { api } from '../../utils/api'
import { formatCurrency } from '../../utils/calculations'

const timeRanges = [
  { label: '1W', period: '1w' },
  { label: '1M', period: '1m' },
  { label: '3M', period: '3m' },
  { label: '1Y', period: '1y' },
  { label: 'ALL', period: 'all' },
]

const formatAxisLabel = (dateValue, period) => {
  if (Number.isNaN(dateValue.getTime())) {
    return ''
  }

  if (period === '1y' || period === 'all') {
    return dateValue.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    })
  }

  return dateValue.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatTooltipLabel = (dateValue) => {
  if (Number.isNaN(dateValue.getTime())) {
    return 'Unknown date'
  }

  return dateValue.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PortfolioPerformanceChart = () => {
  const [selectedRange, setSelectedRange] = useState('1m')
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getPortfolioPerformance(selectedRange)
      setSeries(Array.isArray(data?.series) ? data.series : [])
    } catch (err) {
      setError(err.message)
      setSeries([])
    } finally {
      setLoading(false)
    }
  }, [selectedRange])

  useEffect(() => {
    fetchPerformance()
  }, [fetchPerformance, refreshKey])

  const chartData = useMemo(() => (
    series
      .map((point) => {
        const timestamp = new Date(point.date)
        if (Number.isNaN(timestamp.getTime())) {
          return null
        }

        return {
          timestamp: timestamp.getTime(),
          label: formatAxisLabel(timestamp, selectedRange),
          tooltipLabel: formatTooltipLabel(timestamp),
          totalValue: point.totalValue,
          cash: point.cash,
          holdingsValue: point.holdingsValue,
          pnl: point.pnl,
        }
      })
      .filter(Boolean)
  ), [selectedRange, series])

  const latestPoint = chartData[chartData.length - 1]
  const firstPoint = chartData[0]
  const lineColor = (latestPoint?.totalValue || 0) >= (firstPoint?.totalValue || 0) ? '#10b981' : '#ef4444'

  const refresh = () => {
    setRefreshKey((previousKey) => previousKey + 1)
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-80 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Portfolio Value Over Time</h2>
          <p className="text-sm text-gray-400">
            Reconstructed from your trade history using historical closes when available.
          </p>
        </div>
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range.period}
              variant={selectedRange === range.period ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(range.period)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="h-80 flex flex-col items-center justify-center text-center">
          <p className="text-red-400 mb-4">Unable to load portfolio performance data.</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center text-center">
          <p className="text-white text-lg font-medium mb-2">Make a trade to start tracking performance</p>
          <p className="text-sm text-gray-400">Your chart will appear here once you buy or sell a stock.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-6 mb-6">
            <div>
              <div className="text-gray-400 text-sm mb-1">Latest Total Value</div>
              <div className="text-white text-3xl font-bold">
                {formatCurrency(latestPoint.totalValue)}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">P&amp;L</div>
              <div className={`text-2xl font-bold ${latestPoint.pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
                {formatCurrency(latestPoint.pnl)}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
                minTickGap={24}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
                width={92}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltipLabel || ''}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value, name) => {
                  const labels = {
                    totalValue: 'Total value',
                    cash: 'Cash',
                    holdingsValue: 'Holdings',
                    pnl: 'P&L',
                  }

                  return [formatCurrency(Number(value)), labels[name] || name]
                }}
              />
              <Line
                type="monotone"
                dataKey="totalValue"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

export default PortfolioPerformanceChart
