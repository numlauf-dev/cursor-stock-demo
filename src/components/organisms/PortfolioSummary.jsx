import { usePortfolio } from '../../context/PortfolioContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import { 
  formatCurrency, 
  formatPercentage, 
  calculatePortfolioValue, 
  calculateTotalPnL 
} from '../../utils/calculations'

const PortfolioSummary = () => {
  const { cash, holdings } = usePortfolio()
  const symbols = holdings.map(h => h.symbol)
  const { quotes } = useMultipleQuotes(symbols)

  const currentPrices = {}
  Object.keys(quotes).forEach(symbol => {
    currentPrices[symbol] = quotes[symbol]?.currentPrice || 0
  })

  const portfolioValue = calculatePortfolioValue(holdings, currentPrices)
  const totalPnL = calculateTotalPnL(holdings, currentPrices)
  const totalValue = cash + portfolioValue
  const pnlPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0

  const isPositive = totalPnL >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card-02 border border-card-04 rounded-lg p-6">
        <div className="text-fg/60 text-sm mb-2">Total Value</div>
        <div className="text-fg text-3xl font-bold">
          {formatCurrency(totalValue)}
        </div>
      </div>

      <div className="bg-card-02 border border-card-04 rounded-lg p-6">
        <div className="text-fg/60 text-sm mb-2">Portfolio Value</div>
        <div className="text-fg text-3xl font-bold">
          {formatCurrency(portfolioValue)}
        </div>
      </div>

      <div className="bg-card-02 border border-card-04 rounded-lg p-6">
        <div className="text-fg/60 text-sm mb-2">Cash Balance</div>
        <div className="text-fg text-3xl font-bold">
          {formatCurrency(cash)}
        </div>
      </div>

      <div className="bg-card-02 border border-card-04 rounded-lg p-6">
        <div className="text-fg/60 text-sm mb-2">Total P&L</div>
        <div className={`text-3xl font-bold ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {formatCurrency(totalPnL)}
        </div>
        <div className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {formatPercentage(pnlPercent)}
        </div>
      </div>
    </div>
  )
}

export default PortfolioSummary
