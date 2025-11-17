# 📈 Stock Trading Simulator

A full-featured React-based stock trading simulator that allows users to practice trading stocks with virtual money. Features real-time price updates, interactive charts, portfolio management, and a personal watchlist.

## 🚀 Features

- **Virtual Trading**: Start with $100,000 virtual cash and practice trading stocks
- **Real-time Updates**: Stock prices update every 5 seconds for active stocks
- **Interactive Charts**: View price charts with multiple timeframes (1D, 1W, 1M, 3M, 1Y)
- **Portfolio Dashboard**: Track your holdings, P&L, and overall performance
- **Watchlist**: Add stocks to your watchlist for quick access and monitoring
- **Transaction History**: View all your past trades
- **Stock Search**: Search for stocks with autocomplete functionality
- **Persistent Data**: All portfolio data and transactions are saved to local storage

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Finnhub API** - Stock market data
- **Context API** - State management

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cursor-stock-demo
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up API key:
   - Sign up for a free API key at [Finnhub](https://finnhub.io)
   - Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   - Add your API key to `.env`:
   ```
   VITE_FINNHUB_API_KEY=your_api_key_here
   ```
   - Note: The app will work with mock data if no API key is provided

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## 🎮 Usage

### Getting Started
1. The app starts with a portfolio of $100,000 cash
2. Use the search bar to find stocks (e.g., "AAPL", "GOOGL", "TSLA")
3. Click on a stock to view details and charts

### Trading
1. On a stock detail page, use the "Buy" or "Sell" buttons in the trading panel
2. Enter the quantity you want to trade
3. Confirm the transaction
4. Your portfolio will update automatically

### Managing Your Portfolio
- **Dashboard**: View your total portfolio value, holdings, and P&L
- **Watchlist**: Add stocks to the sidebar for quick monitoring
- **Transactions**: Review your complete trading history
- **Reset**: Use the "Reset Portfolio" button on the dashboard to start over

## 📁 Project Structure

```
src/
├── components/
│   ├── atoms/          # Basic UI components (Button, Input, etc.)
│   ├── molecules/      # Composite components (SearchBar, StockCard, etc.)
│   └── organisms/      # Complex components (Layout, Chart, etc.)
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
├── utils/              # Utility functions
├── App.jsx             # Main app component
├── main.jsx            # App entry point
└── index.css           # Global styles
```

## 🔑 API Information

The app uses the Finnhub API for stock data:
- **Free Tier**: 60 API requests per minute
- **Sign up**: https://finnhub.io
- **Features Used**:
  - Real-time stock quotes
  - Company profiles
  - Historical price data
  - Stock symbol search

If no API key is provided or rate limits are exceeded, the app will fall back to mock data for demonstration purposes.

## 🎨 Key Features Explained

### Real-time Price Updates
- Stock prices refresh every 5 seconds when viewing the dashboard or stock details
- Watchlist updates automatically with real-time data
- Visual indicators (colors, arrows) show price movements

### Portfolio Management
- Calculates average cost basis for multiple purchases of the same stock
- Tracks profit/loss for each holding and overall portfolio
- Validates trades (sufficient cash/shares) before execution

### Data Persistence
- All data is stored in browser's localStorage
- Portfolio survives page refreshes
- Reset option available to start fresh

## 🚧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Customization

To customize the initial cash amount, edit `src/context/PortfolioContext.jsx`:
```javascript
const INITIAL_CASH = 100000 // Change this value
```

To adjust refresh intervals, modify the hooks in `src/hooks/useStockData.js`.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📝 License

Copyright Anysphere Inc.

## 🙏 Acknowledgments

- Stock data provided by [Finnhub](https://finnhub.io)
- Charts powered by [Recharts](https://recharts.org)
- Built with [Vite](https://vitejs.dev) and [React](https://react.dev)
