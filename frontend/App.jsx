import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/organisms/Layout'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import Transactions from './pages/Transactions'
import { PortfolioProvider } from './context/PortfolioContext'
import { WatchlistProvider } from './context/WatchlistContext'
import { api } from './utils/api'

function App() {
  // Initialize authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we already have a token
      const existingToken = localStorage.getItem('auth_token')
      
      // If no token, get default user (single-user mode)
      if (!existingToken) {
        try {
          await api.getDefaultUser()
          console.log('[App] Authentication initialized')
        } catch (error) {
          console.error('[App] Failed to initialize authentication:', error)
        }
      }
    }

    initializeAuth()
  }, [])

  return (
    <PortfolioProvider>
      <WatchlistProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/transactions" element={<Transactions />} />
          </Routes>
        </Layout>
      </WatchlistProvider>
    </PortfolioProvider>
  )
}

export default App
