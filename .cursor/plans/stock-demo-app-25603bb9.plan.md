<!-- 25603bb9-57b1-4eee-84ab-d815b75f6f46 870b6b5a-8fc7-4cb1-8c78-42cf65eadef0 -->
# Stock Demo Application

A simple, clean demo application built with Next.js to showcase Cursor's capabilities. Users can input a stock ticker symbol and view financial information with a price chart.

## Architecture

**Frontend & Backend**: Next.js 14+ (App Router)

- Single codebase with API routes for backend logic
- Server-side and client-side components
- Modern React patterns (hooks, async components)

**Data Source**: `yahoo-finance2` npm package

- Node.js-native alternative to Python's yfinance
- No Python runtime required
- Provides stock quotes, historical data, and company info

**Charting**: `recharts` or `chart.js`

- Simple, responsive price chart
- Easy to customize for demo purposes

## File Structure

```
/app
  /api
    /stock/[ticker]/route.js     # API endpoint to fetch stock data
  /page.js                        # Main page with search form
  /components
    StockInfo.js                  # Component to display stock metrics
    StockChart.js                 # Component for price chart
    SearchForm.js                 # Ticker input form
/layout.js                        # Root layout
/package.json                     # Dependencies
```

## Implementation Details

1. **API Route** (`/app/api/stock/[ticker]/route.js`)

   - Fetches current quote and historical data (last 30 days)
   - Returns JSON with price, volume, market cap, and price history
   - Error handling for invalid tickers

2. **Main Page** (`/app/page.js`)

   - Search form component
   - Displays stock info and chart when data is loaded
   - Loading and error states

3. **Components**

   - `SearchForm`: Input field with submit button
   - `StockInfo`: Card displaying key metrics (price, change %, volume, market cap)
   - `StockChart`: Line chart showing price over time

4. **Styling**: Tailwind CSS (included with Next.js)

   - Clean, modern UI
   - Responsive design
   - Easy to customize

## Additional Considerations

- **Error Handling**: Graceful handling of invalid tickers or API failures
- **Loading States**: Visual feedback during data fetching
- **Caching**: Consider API route caching to avoid rate limits
- **TypeScript**: Optional but recommended for better demo of Cursor's capabilities
- **Environment Variables**: Store any API keys if needed (though yahoo-finance2 doesn't require keys)

## Dependencies

- `next`: ^14.0.0
- `react`: ^18.0.0
- `yahoo-finance2`: Latest
- `recharts`: Latest (for charting)
- `tailwindcss`: Included with Next.js

## Demo-Friendly Features

- Simple, intuitive interface
- Clear visual feedback
- Shows both frontend and backend code generation
- Easy to explain to non-technical audiences
- Can demonstrate live editing and AI assistance

### To-dos

- [ ] Initialize Next.js project with App Router and Tailwind CSS
- [ ] Install yahoo-finance2 and recharts dependencies
- [ ] Create API route /api/stock/[ticker] to fetch stock data from yahoo-finance2
- [ ] Build SearchForm, StockInfo, and StockChart components
- [ ] Create main page that integrates all components with state management
- [ ] Add error handling and loading states throughout the app
- [ ] Style the UI with Tailwind CSS for a clean, modern look