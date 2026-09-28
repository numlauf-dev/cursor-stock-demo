import { usePortfolio } from '../context/PortfolioContext'
import { useWatchlist } from '../context/WatchlistContext'
import PortfolioSummary from '../components/organisms/PortfolioSummary'
import HoldingsTable from '../components/organisms/HoldingsTable'
import WatchlistHighlights from '../components/organisms/WatchlistHighlights'
import WatchlistNewsPanel from '../components/organisms/WatchlistNewsPanel'
import PortfolioCommentary from '../components/organisms/PortfolioCommentary'
import Button from '../components/atoms/Button'

const Dashboard = () => {
  const { resetPortfolio } = usePortfolio()
  const { watchlist, activeWatchlistId, isReady } = useWatchlist()

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset your portfolio? This will delete all holdings and transactions and reset your cash to $100,000.')) {
      await resetPortfolio()
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text mb-1">Portfolio Dashboard</h1>
          <p className="text-text-muted text-sm">Track your investments and performance</p>
        </div>
        <Button variant="danger" size="sm" onClick={handleReset}>
          Reset Portfolio
        </Button>
      </div>

      <div className="space-y-6">
        <PortfolioSummary />
        
        <WatchlistHighlights />
        <WatchlistNewsPanel
          watchlistId={activeWatchlistId}
          symbols={watchlist}
          isWatchlistReady={isReady}
        />
        
        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Your Holdings</h2>
          <HoldingsTable />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">AI Portfolio Analysis</h2>
          <PortfolioCommentary />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
