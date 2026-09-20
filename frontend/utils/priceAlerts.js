// Price alert management for client-side alerts

const ALERTS_KEY = 'stockAlerts';
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

export const AlertCondition = {
  ABOVE: 'ABOVE',
  BELOW: 'BELOW',
};

/**
 * Get all active alerts from localStorage
 */
export const getAlerts = () => {
  try {
    const stored = localStorage.getItem(ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load alerts:', error);
    return [];
  }
};

/**
 * Save alerts to localStorage
 */
const saveAlerts = (alerts) => {
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    return true;
  } catch (error) {
    console.error('Failed to save alerts:', error);
    return false;
  }
};

/**
 * Create a new price alert
 */
export const createAlert = (symbol, condition, targetPrice) => {
  const alerts = getAlerts();
  
  const newAlert = {
    id: `${symbol}-${condition}-${targetPrice}-${Date.now()}`,
    symbol: symbol.toUpperCase(),
    condition,
    targetPrice: Number(targetPrice),
    createdAt: new Date().toISOString(),
    triggered: false,
  };

  alerts.push(newAlert);
  saveAlerts(alerts);
  
  return newAlert;
};

/**
 * Delete an alert by ID
 */
export const deleteAlert = (alertId) => {
  const alerts = getAlerts().filter(alert => alert.id !== alertId);
  saveAlerts(alerts);
};

/**
 * Check if an alert should trigger based on current price
 */
const shouldTrigger = (alert, currentPrice) => {
  if (alert.triggered) {
    return false;
  }

  if (alert.condition === AlertCondition.ABOVE) {
    return currentPrice >= alert.targetPrice;
  }

  if (alert.condition === AlertCondition.BELOW) {
    return currentPrice <= alert.targetPrice;
  }

  return false;
};

/**
 * Mark an alert as triggered
 */
const markAlertTriggered = (alertId) => {
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === alertId);
  
  if (alert) {
    alert.triggered = true;
    alert.triggeredAt = new Date().toISOString();
    saveAlerts(alerts);
  }
};

/**
 * Show browser notification for triggered alert
 */
const showNotification = (alert, currentPrice) => {
  const conditionText = alert.condition === AlertCondition.ABOVE ? 'above' : 'below';
  const title = `${alert.symbol} Alert Triggered`;
  const body = `${alert.symbol} is now ${conditionText} $${alert.targetPrice.toFixed(2)} (current: $${currentPrice.toFixed(2)})`;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: alert.id,
    });
  }
};

/**
 * Check all alerts against current prices
 */
export const checkAlerts = async (quotes, onAlertTriggered) => {
  const alerts = getAlerts().filter(alert => !alert.triggered);
  
  if (alerts.length === 0) {
    return [];
  }

  const triggeredAlerts = [];

  for (const alert of alerts) {
    const quote = quotes[alert.symbol];
    
    if (quote && quote.currentPrice) {
      const currentPrice = Number(quote.currentPrice);
      
      if (shouldTrigger(alert, currentPrice)) {
        markAlertTriggered(alert.id);
        showNotification(alert, currentPrice);
        triggeredAlerts.push({ ...alert, currentPrice });
        
        if (onAlertTriggered) {
          onAlertTriggered(alert, currentPrice);
        }
      }
    }
  }

  return triggeredAlerts;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Clear all triggered alerts
 */
export const clearTriggeredAlerts = () => {
  const alerts = getAlerts().filter(alert => !alert.triggered);
  saveAlerts(alerts);
};

/**
 * Get active alerts for a specific symbol
 */
export const getAlertsForSymbol = (symbol) => {
  return getAlerts().filter(
    alert => alert.symbol === symbol.toUpperCase() && !alert.triggered
  );
};
