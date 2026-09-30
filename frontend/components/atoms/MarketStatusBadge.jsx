import { useEffect, useState } from 'react'
import { api } from '../../utils/api'

const MarketStatusBadge = () => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/stocks/market/status`)
        const data = await response.json()
        if (data.success) {
          setStatus(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch market status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000)

    return () => clearInterval(interval)
  }, [])

  if (loading || !status) return null

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-gain animate-pulse' : 'bg-text-muted'}`}></div>
      <span className="text-xs text-text-muted">
        {status.isOpen ? 'Live' : 'Market closed'}
      </span>
    </div>
  )
}

export default MarketStatusBadge
