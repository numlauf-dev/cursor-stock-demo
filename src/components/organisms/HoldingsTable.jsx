import { useNavigate } from 'react-router-dom'
import { usePortfolio } from '../../context/PortfolioContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber,
  calculateHoldingPnL,
  calculatePnLPercentage 
} from '../../utils/calculations'

const HoldingsTable = () => {
  const navigate = useNavigate()
  const { holdings } = usePortfolio()
  const symbols = holdings.map(h => h.symbol)
  const { quotes, loading } = useMultipleQuotes(symbols)

  if (holdings.length === 0) {
    return (
      <div className="bg-card-02 border border-card-04 rounded-lg p-8">
        <div className="text-center text-fg/60">
          <p className="text-xl mb-2">No holdings yet</p>
          <p className="text-sm">Search for stocks to start trading</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card-02 border border-card-04 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-card-03">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-fg/60 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-fg/60 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-fg/60 uppercase tracking-wider">
                Avg Price
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-fg/60 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-fg/60 uppercase tracking-wider">
                Market Value
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-fg/60 uppercase tracking-wider">
                P&L
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-fg/60 uppercase tracking-wider">
                P&L %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-04">
            {holdings.map((holding) => {
              const quote = quotes[holding.symbol]
              const currentPrice = quote?.currentPrice || holding.avgPrice
              const marketValue = holding.quantity * currentPrice
              const pnl = calculateHoldingPnL(holding, currentPrice)
              const pnlPercent = calculatePnLPercentage(holding, currentPrice)
              const isPositive = pnl >= 0

              return (
                <tr 
                  key={holding.symbol}
                  onClick={() => navigate(`/stock/${holding.symbol}`)}
                  className="hover:bg-card-03 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-accent">
                      {holding.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-fg">
                    {formatNumber(holding.quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-fg">
                    {formatCurrency(holding.avgPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-fg">
                    {loading ? (
                      <div className="h-4 w-16 bg-card-03 rounded animate-pulse ml-auto"></div>
                    ) : (
                      formatCurrency(currentPrice)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-fg">
                    {formatCurrency(marketValue)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    {formatCurrency(pnl)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    {formatPercentage(pnlPercent)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default HoldingsTable
