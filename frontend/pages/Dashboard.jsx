import { usePortfolio } from '../context/PortfolioContext'
import { useWatchlist } from '../context/WatchlistContext'
import { useMultipleQuotes } from '../hooks/useStockData'
import { useState, useEffect } from 'react'
import PortfolioSummary from '../components/organisms/PortfolioSummary'
import HoldingsTable from '../components/organisms/HoldingsTable'
import WatchlistHighlights from '../components/organisms/WatchlistHighlights'
import WatchlistNewsPanel from '../components/organisms/WatchlistNewsPanel'
import PortfolioCommentary from '../components/organisms/PortfolioCommentary'
import Button from '../components/atoms/Button'
import MarketStatusBadge from '../components/atoms/MarketStatusBadge'

const Dashboard = () => {
  const { resetPortfolio, holdings } = usePortfolio()
  const { watchlist, activeWatchlistId, isReady } = useWatchlist()
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [updateText, setUpdateText] = useState('Just now')
  
  // Share a single quotes source across all dashboard components
  const symbols = holdings.map(h => h.symbol)
  const { quotes, loading: quotesLoading } = useMultipleQuotes(symbols)

  useEffect(() => {
    if (!quotesLoading && Object.keys(quotes).length > 0) {
      setLastUpdate(Date.now())
    }
  }, [quotes, quotesLoading])

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000)
      if (secondsAgo < 5) {
        setUpdateText('Just now')
      } else if (secondsAgo < 60) {
        setUpdateText(`${secondsAgo}s ago`)
      } else {
        const minutesAgo = Math.floor(secondsAgo / 60)
        setUpdateText(`${minutesAgo}m ago`)
      }
    }, 1000)

    return () => clearInterval(updateInterval)
  }, [lastUpdate])

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset your portfolio? This will delete all holdings and transactions and reset your cash to $100,000.')) {
      await resetPortfolio()
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-text">Portfolio</h1>
            <MarketStatusBadge />
          </div>
          <p className="text-text-muted text-xs">Last updated: {updateText}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="space-y-8">
        <PortfolioSummary quotes={quotes} quotesLoading={quotesLoading} />
        
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wide text-text-muted font-medium">Watchlist</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          <WatchlistHighlights />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase tracking-wide text-text-muted font-medium">Your Holdings</span>
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <HoldingsTable quotes={quotes} quotesLoading={quotesLoading} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase tracking-wide text-text-muted font-medium">News</span>
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <WatchlistNewsPanel
              watchlistId={activeWatchlistId}
              symbols={watchlist}
              isWatchlistReady={isReady}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wide text-text-muted font-medium">AI Analysis</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          <PortfolioCommentary />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
