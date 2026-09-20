import { useState, useEffect, useCallback } from 'react'
import { getAlerts, checkAlerts, requestNotificationPermission } from '../utils/priceAlerts'

const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

export const usePriceAlerts = (quotes) => {
  const [alerts, setAlerts] = useState([])
  const [permissionStatus, setPermissionStatus] = useState('default')
  const [triggeredAlerts, setTriggeredAlerts] = useState([])

  // Load alerts from localStorage
  const refreshAlerts = useCallback(() => {
    const loadedAlerts = getAlerts()
    setAlerts(loadedAlerts)
    return loadedAlerts
  }, [])

  // Initial load
  useEffect(() => {
    refreshAlerts()
    
    // Check notification permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission)
    } else {
      setPermissionStatus('unsupported')
    }
  }, [refreshAlerts])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    const permission = await requestNotificationPermission()
    setPermissionStatus(permission)
    return permission
  }, [])

  // Check alerts periodically
  useEffect(() => {
    if (!quotes || Object.keys(quotes).length === 0) {
      return
    }

    const checkAndNotify = async () => {
      const triggered = await checkAlerts(quotes, (alert, currentPrice) => {
        setTriggeredAlerts(prev => [...prev, { ...alert, currentPrice, triggeredAt: new Date() }])
      })

      if (triggered.length > 0) {
        refreshAlerts()
      }
    }

    // Check immediately
    checkAndNotify()

    // Then check every 30 seconds
    const intervalId = setInterval(checkAndNotify, CHECK_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [quotes, refreshAlerts])

  // Dismiss a triggered alert notification
  const dismissTriggeredAlert = useCallback((alertId) => {
    setTriggeredAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  return {
    alerts,
    triggeredAlerts,
    permissionStatus,
    refreshAlerts,
    requestPermission,
    dismissTriggeredAlert,
  }
}
