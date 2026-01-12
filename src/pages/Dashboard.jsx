import { usePortfolio } from '../context/PortfolioContext'
import PortfolioSummary from '../components/organisms/PortfolioSummary'
import HoldingsTable from '../components/organisms/HoldingsTable'
import Button from '../components/atoms/Button'

const Dashboard = () => {
  const { resetPortfolio } = usePortfolio()

  const handleReset = () => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:9',message:'handleReset called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const confirmed = window.confirm('Are you sure you want to reset your portfolio? This will delete all holdings and transactions and reset your cash to $100,000.')
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:12',message:'confirm dialog result',data:{confirmed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (confirmed) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/3119f75d-315d-4eec-9fd7-249551556ccd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:14',message:'calling resetPortfolio',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      resetPortfolio()
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-fg">Portfolio Dashboard</h1>
        <Button variant="danger" size="sm" onClick={handleReset}>
          Reset Portfolio
        </Button>
      </div>

      <div className="space-y-8">
        <PortfolioSummary />
        
        <div>
          <h2 className="text-2xl font-semibold text-fg mb-4">Your Holdings</h2>
          <HoldingsTable />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
