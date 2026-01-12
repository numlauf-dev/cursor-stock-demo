import { Sparklines, SparklinesLine } from 'react-sparklines'

const MiniSparkline = ({ 
  data = [],           // Array of numbers (closing prices)
  height = 40,
  className = '',
  loading = false 
}) => {
  if (loading) {
    return (
      <div 
        className={`animate-pulse bg-text-secondary/20 rounded ${className}`}
        style={{ height }}
      />
    )
  }

  if (!data || data.length < 2) {
    return null
  }

  // Determine trend color: compare first and last values
  const isPositive = data[data.length - 1] >= data[0]
  const color = isPositive ? '#10b981' : '#ef4444'

  return (
    <div className={className} style={{ height }}>
      <Sparklines data={data} height={height} margin={2}>
        <SparklinesLine color={color} style={{ strokeWidth: 1.5, fill: 'none' }} />
      </Sparklines>
    </div>
  )
}

export default MiniSparkline

