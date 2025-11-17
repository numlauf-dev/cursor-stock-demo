import { usePortfolio } from '../context/PortfolioContext'
import PortfolioSummary from '../components/organisms/PortfolioSummary'
import HoldingsTable from '../components/organisms/HoldingsTable'
import Button from '../components/atoms/Button'

const Dashboard = () => {
  const { resetPortfolio } = usePortfolio()

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset your portfolio? This will delete all holdings and transactions and reset your cash to $100,000.')) {
      resetPortfolio()
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Portfolio Dashboard</h1>
        <Button variant="danger" size="sm" onClick={handleReset}>
          Reset Portfolio
        </Button>
      </div>

      <div className="space-y-8">
        <PortfolioSummary />
        
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Your Holdings</h2>
          <HoldingsTable />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
