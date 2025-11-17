# Quick Setup Guide

## ✅ What's Been Built

A complete React-based stock trading simulator with:
- ✅ Virtual trading with $100,000 starting cash
- ✅ Real-time stock price updates (every 5 seconds)
- ✅ Interactive price charts with multiple timeframes
- ✅ Full portfolio management (buy/sell stocks)
- ✅ Watchlist functionality
- ✅ Transaction history
- ✅ Persistent local storage
- ✅ Responsive design for mobile and desktop

## 🚀 Running the Application

The dev server is already running! Open your browser to:
```
http://localhost:5173/
```

If you need to restart the server:
```bash
npm run dev
```

## 🎯 First Steps

1. **Search for a stock**: Use the search bar in the header (try "AAPL", "TSLA", "GOOGL")
2. **View stock details**: Click on a stock to see charts and price info
3. **Make a trade**: Click "Buy" or "Sell" buttons, enter quantity, and confirm
4. **Add to watchlist**: Click the "Add to Watchlist" button on stock detail pages
5. **View portfolio**: Go to Dashboard to see all holdings and P&L
6. **Check transactions**: Click "Transactions" to see your trading history

## 🔧 Configuration

### Using Real Stock Data (Optional)

By default, the app uses demo/mock data. To use real stock data:

1. Sign up for a free API key at https://finnhub.io
2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Add your API key:
   ```
   VITE_FINNHUB_API_KEY=your_actual_api_key_here
   ```
4. Restart the dev server

### Customizing Initial Cash

Edit `src/context/PortfolioContext.jsx`:
```javascript
const INITIAL_CASH = 100000 // Change to desired amount
```

### Adjusting Refresh Rates

Edit `src/hooks/useStockData.js`:
```javascript
export const useStockQuote = (symbol, refreshInterval = 5000) // milliseconds
```

## 📁 Project Structure

```
src/
├── components/
│   ├── atoms/          # Button, Input, PriceDisplay, LoadingSpinner
│   ├── molecules/      # SearchBar, StockCard, TradeModal
│   └── organisms/      # Layout, Header, Sidebar, Chart, TradingPanel
├── context/            # PortfolioContext, WatchlistContext
├── hooks/              # useStockData (quotes, search, candles)
├── pages/              # Dashboard, StockDetail, Transactions
├── services/           # stockApi (Finnhub integration)
└── utils/              # storage, calculations
```

## 🎨 Key Features

### Dashboard
- Portfolio summary cards (Total Value, Portfolio Value, Cash, P&L)
- Holdings table with real-time prices and profit/loss
- Click any holding to view details

### Stock Detail Page
- Real-time price with change indicators
- Interactive chart with 1D/1W/1M/3M/1Y views
- Key metrics (Open, High, Low, Previous Close)
- Buy/Sell trading panel
- Add/remove from watchlist

### Watchlist (Sidebar)
- Real-time price updates
- Quick navigation to stock details
- Click X to remove stocks

### Trading
- Input validation (sufficient cash/shares)
- Average cost basis calculation for multiple purchases
- Instant trade execution
- Success/error notifications

## 🧪 Testing the App

Try these flows:

1. **Basic Trading Flow**:
   - Search for "AAPL"
   - Click on Apple Inc
   - Buy 10 shares
   - Go to Dashboard to see your holding
   - Return to AAPL and sell 5 shares
   - Check Transactions page

2. **Watchlist Flow**:
   - Search and add GOOGL, MSFT, TSLA to watchlist
   - Watch prices update in sidebar
   - Click cards to navigate to details

3. **Portfolio Management**:
   - Buy shares of multiple stocks
   - Watch portfolio value change
   - Check P&L on Dashboard
   - Reset portfolio when done testing

## 🐛 Troubleshooting

### Server won't start
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port 5173 already in use
```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9
npm run dev
```

### API rate limits
- Free Finnhub tier: 60 requests/minute
- App automatically falls back to mock data
- Reduce refresh rates in useStockData.js if needed

## 📱 Mobile Support

The app is fully responsive:
- Mobile menu in header (hamburger icon)
- Floating watchlist button (bottom right)
- Touch-friendly buttons and inputs
- Optimized table layouts

## 🎯 Next Steps

Consider adding:
- User authentication and cloud sync
- More advanced charts (candlesticks, indicators)
- News feed for stocks
- Portfolio performance graphs over time
- Social features (share trades)
- Export transaction history

## 📝 Notes

- All data is stored locally (localStorage)
- No backend required for basic functionality
- Works offline after initial load (with cached data)
- Safe to experiment - use "Reset Portfolio" to start over
