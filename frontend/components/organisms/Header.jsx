import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePortfolio } from '../../context/PortfolioContext'
import SearchBar from '../molecules/SearchBar'
import { formatCurrency } from '../../utils/calculations'

const Header = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Get cash from portfolio - will be 0 if not ready yet
  const portfolio = usePortfolio()
  const cash = portfolio?.cash ?? 0

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
  ]

  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 md:px-6 py-4">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-white">📈 StockSim</div>
          </Link>
          
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <SearchBar />
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
            <div className="text-xs text-gray-400">Cash Balance</div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(cash)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-xl font-bold text-white">📈 StockSim</div>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
              <div className="text-xs text-gray-400">Cash</div>
              <div className="text-sm font-bold text-white">
                {formatCurrency(cash)}
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <SearchBar />

        {mobileMenuOpen && (
          <nav className="mt-4 flex flex-col gap-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
