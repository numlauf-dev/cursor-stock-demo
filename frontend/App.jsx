import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/organisms/Layout'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import Transactions from './pages/Transactions'
import AlertToast from './components/organisms/AlertToast'
import { PortfolioProvider } from './context/PortfolioContext'
import { WatchlistProvider } from './context/WatchlistContext'
import { usePriceAlerts } from './hooks/usePriceAlerts'
import { api } from './utils/api'

function AppContent() {
  const [currentQuotes, setCurrentQuotes] = useState({})
  const { triggeredAlerts, dismissTriggeredAlert } = usePriceAlerts(currentQuotes)

  // Initialize authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we already have a token
      const existingToken = localStorage.getItem('auth_token')
      
      // If no token, get default user (single-user mode)
      if (!existingToken) {
        try {
          await api.getDefaultUser()
        } catch (error) {
          console.error('[App] Failed to initialize authentication:', error)
        }
      }
    }

    initializeAuth()
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock/:symbol" element={<StockDetail />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
      
      {triggeredAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
          {triggeredAlerts.map((alert) => (
            <AlertToast
              key={alert.id}
              alert={alert}
              currentPrice={alert.currentPrice}
              onDismiss={() => dismissTriggeredAlert(alert.id)}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}

function App() {
  return (
    <PortfolioProvider>
      <WatchlistProvider>
        <AppContent />
      </WatchlistProvider>
    </PortfolioProvider>
  )
}

export default App
