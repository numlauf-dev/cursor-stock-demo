import { Routes, Route } from 'react-router-dom'
import Layout from './components/organisms/Layout'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import Transactions from './pages/Transactions'
import { PortfolioProvider } from './context/PortfolioContext'
import { WatchlistProvider } from './context/WatchlistContext'

function App() {
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
