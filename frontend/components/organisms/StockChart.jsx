import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStockCandles } from '../../hooks/useStockData'
import Button from '../atoms/Button'

const timeRanges = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 730 },
]

const StockChart = ({ symbol, initialRange = 30, height = 400 }) => {
  const [selectedRange, setSelectedRange] = useState(initialRange)
  const { candles, loading, error, refresh } = useStockCandles(symbol, 'D', selectedRange)

  // Reset selected range when initialRange prop changes
  useEffect(() => {
    setSelectedRange(initialRange)
  }, [initialRange])

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-32 mb-4"></div>
          <div style={{ height: `${height}px` }} className="bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !candles || !candles.timestamps || candles.timestamps.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Price Chart</h2>
        <div style={{ height: `${height}px` }} className="flex flex-col items-center justify-center text-gray-400">
          <p className="mb-4">{error || 'No chart data available'}</p>
          <Button onClick={refresh} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Transform candles data for Recharts
  const chartData = candles.timestamps.map((timestamp, index) => ({
    date: new Date(timestamp * 1000).toLocaleDateString(),
    price: candles.close[index],
    high: candles.high[index],
    low: candles.low[index],
  }))

  // Determine if the stock is up or down
  const firstPrice = chartData[0]?.price || 0
  const lastPrice = chartData[chartData.length - 1]?.price || 0
  const isPositive = lastPrice >= firstPrice
  const lineColor = isPositive ? '#10b981' : '#ef4444'

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Price Chart</h2>
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range.label}
              variant={selectedRange === range.days ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(range.days)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StockChart
