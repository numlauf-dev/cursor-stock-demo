import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Hook to manage polling intervals based on market status and tab visibility.
 * 
 * @param {Function} callback - Function to call on each poll
 * @param {boolean} isMarketOpen - Whether the market is currently open
 * @param {number} marketOpenInterval - Poll interval when market is open (ms)
 * @param {number} marketClosedInterval - Poll interval when market is closed (ms), 0 to disable
 * @param {boolean} enabled - Whether polling is enabled
 */
export const useMarketAwarePolling = (
  callback,
  isMarketOpen = false,
  marketOpenInterval = 15000,
  marketClosedInterval = 300000,
  enabled = true
) => {
  const savedCallback = useRef(callback)
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsTabVisible(visible)
      
      if (visible && enabled) {
        savedCallback.current()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled])

  useEffect(() => {
    if (!enabled || !isTabVisible) {
      return
    }

    const interval = isMarketOpen ? marketOpenInterval : marketClosedInterval

    if (interval === 0) {
      return
    }

    const timer = setInterval(() => {
      savedCallback.current()
    }, interval)

    return () => clearInterval(timer)
  }, [enabled, isTabVisible, isMarketOpen, marketOpenInterval, marketClosedInterval])

  return { isTabVisible }
}

/**
 * Hook to fetch and track market status with periodic refresh
 */
export const useMarketStatus = (refreshInterval = 60000) => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchStatus, refreshInterval])

  return { status, loading, isMarketOpen: status?.isOpen ?? false, refresh: fetchStatus }
}
