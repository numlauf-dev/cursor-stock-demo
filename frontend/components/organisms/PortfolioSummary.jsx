import { usePortfolio } from '../../context/PortfolioContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import { 
  formatCurrency, 
  formatPercentage, 
  calculatePortfolioValue, 
  calculateTotalPnL 
} from '../../utils/calculations'
import Card from '../atoms/Card'
import Badge from '../atoms/Badge'
import Skeleton from '../atoms/Skeleton'

const PortfolioSummary = () => {
  const { cash, holdings } = usePortfolio()
  const symbols = holdings.map(h => h.symbol)
  const { quotes, loading } = useMultipleQuotes(symbols)

  const currentPrices = {}
  Object.keys(quotes).forEach(symbol => {
    currentPrices[symbol] = quotes[symbol]?.currentPrice || 0
  })

  const portfolioValue = calculatePortfolioValue(holdings, currentPrices)
  const totalPnL = calculateTotalPnL(holdings, currentPrices)
  const totalValue = cash + portfolioValue
  const costBasis = portfolioValue - totalPnL
  const pnlPercent = costBasis > 0 ? (totalPnL / costBasis) * 100 : 0

  const isPositive = totalPnL >= 0
  const isLoading = loading && holdings.length > 0

  if (isLoading) {
    return (
      <div>
        <Card className="mb-6">
          <Skeleton className="w-40 h-10 mb-2" />
          <Skeleton className="w-24 h-6" />
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="w-24 mb-3" />
              <Skeleton className="w-32 h-8" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-text-muted text-sm mb-1">Portfolio Value</div>
            <div className="text-text text-4xl font-bold tabular-nums mb-2">
              {formatCurrency(totalValue)}
            </div>
            <Badge 
              variant={isPositive ? 'gain' : 'loss'} 
              showArrow={true}
              size="md"
            >
              {formatCurrency(totalPnL)} ({formatPercentage(pnlPercent)})
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-text-muted text-sm mb-2">Holdings Value</div>
          <div className="text-text text-2xl font-bold tabular-nums">
            {formatCurrency(portfolioValue)}
          </div>
        </Card>

        <Card>
          <div className="text-text-muted text-sm mb-2">Cash Balance</div>
          <div className="text-text text-2xl font-bold tabular-nums">
            {formatCurrency(cash)}
          </div>
        </Card>

        <Card>
          <div className="text-text-muted text-sm mb-2">Total Return</div>
          <div className={`text-2xl font-bold tabular-nums ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {formatCurrency(totalPnL)}
          </div>
          <div className={`text-sm tabular-nums ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {formatPercentage(pnlPercent)}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default PortfolioSummary
