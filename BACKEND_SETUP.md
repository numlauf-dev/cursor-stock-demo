# Back-End Setup Guide

This guide will help you set up and run the back-end API server for the Stock Demo application.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Redis (optional, for caching - will work without it in development)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/stock_demo?schema=public

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h

# Stock API Configuration
STOCK_API_KEY=your-api-key-here
STOCK_API_PROVIDER=finnhub

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### 3. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```bash
createdb stock_demo
```

Or using psql:

```sql
CREATE DATABASE stock_demo;
```

### 4. Set Up Prisma

Generate Prisma Client:

```bash
npm run db:generate
```

Run database migrations:

```bash
npm run db:migrate
```

This will create all the necessary tables (User, Watchlist, WatchlistItem).

### 5. (Optional) Set Up Redis

If you want to use Redis for caching:

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

The application will work without Redis, but caching will be disabled.

### 6. Get Stock API Key

#### Option 1: Finnhub (Recommended - Free Tier)
1. Sign up at [https://finnhub.io](https://finnhub.io)
2. Get your free API key (60 requests/minute)
3. Set `STOCK_API_KEY` in `.env`
4. Set `STOCK_API_PROVIDER=finnhub`

#### Option 2: Alpha Vantage (Free Tier)
1. Sign up at [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. Get your free API key (5 API calls/minute, 500 calls/day)
3. Set `STOCK_API_KEY` in `.env`
4. Set `STOCK_API_PROVIDER=alphavantage`

**Note:** If no API key is provided, the application will use mock data for development.

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run server:dev
```

### Production Mode

```bash
npm run server
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user (requires auth)

### Stocks
- `GET /api/v1/stocks/search?query=AAPL` - Search for stocks
- `GET /api/v1/stocks/:symbol` - Get stock information
- `GET /api/v1/stocks/:symbol/quote` - Get current stock quote
- `GET /api/v1/stocks/:symbol/history?period=1m` - Get historical data
- `GET /api/v1/stocks/trending` - Get trending stocks

### Watchlists (requires authentication)
- `GET /api/v1/watchlists` - Get all user watchlists
- `POST /api/v1/watchlists` - Create new watchlist
- `GET /api/v1/watchlists/:id` - Get specific watchlist
- `PUT /api/v1/watchlists/:id` - Update watchlist name
- `DELETE /api/v1/watchlists/:id` - Delete watchlist
- `POST /api/v1/watchlists/:id/stocks` - Add stock to watchlist
- `DELETE /api/v1/watchlists/:id/stocks/:symbol` - Remove stock from watchlist

## Testing the API

### Using curl

**Register a user:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","firstName":"Test","lastName":"User"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'
```

**Get stock quote (no auth required):**
```bash
curl http://localhost:3000/api/v1/stocks/AAPL/quote
```

**Create watchlist (requires auth token):**
```bash
curl -X POST http://localhost:3000/api/v1/watchlists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"My Watchlist"}'
```

## Database Management

### Prisma Studio (Database GUI)

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` to browse and edit your database.

### Create a Migration

```bash
npm run db:migrate
```

### Reset Database (⚠️ Warning: Deletes all data)

```bash
npx prisma migrate reset
```

## Project Structure

```
├── server.js                 # Express server entry point
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # Prisma client
│   │   └── redis.js         # Redis client
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── stockController.js
│   │   └── watchlistController.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js          # JWT authentication
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── validation.js    # Validation error handler
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── stockRoutes.js
│   │   └── watchlistRoutes.js
│   ├── services/            # Business logic
│   │   ├── authService.js
│   │   ├── stockService.js
│   │   ├── stockApi.js      # External API client
│   │   └── watchlistService.js
│   ├── utils/               # Utility functions
│   │   ├── errors.js        # Error classes and handler
│   │   └── logger.js        # Winston logger
│   └── validators/          # Input validation schemas
│       ├── authValidators.js
│       ├── stockValidators.js
│       └── watchlistValidators.js
├── prisma/
│   └── schema.prisma        # Database schema
└── tests/                   # Test files
```

## Troubleshooting

### Database Connection Error

Make sure PostgreSQL is running and the `DATABASE_URL` in `.env` is correct:

```bash
# Check if PostgreSQL is running
pg_isready

# Test connection
psql -d stock_demo
```

### Redis Connection Error

If Redis is not available, the application will continue without caching. To disable Redis warnings, you can comment out the Redis connection in `server.js` or ensure Redis is running:

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

### Port Already in Use

Change the `PORT` in `.env` or kill the process using the port:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Prisma Client Not Generated

Run:

```bash
npm run db:generate
```

## Security Notes

- **Never commit `.env` file** - It contains sensitive information
- **Change `JWT_SECRET`** - Use a strong, random secret in production
- **Use HTTPS in production** - Never send JWT tokens over unencrypted connections
- **Rate limiting is enabled** - Protects against brute force and API abuse
- **Input validation** - All user inputs are validated and sanitized

## Next Steps

- Review the [back-end-plan.md](./back-end-plan.md) for detailed architecture decisions
- Set up front-end to connect to the API
- Configure production environment variables
- Set up CI/CD pipeline
- Add monitoring and logging

## Support

For issues or questions, refer to:
- [Back-End Plan](./back-end-plan.md)
- [Master Plan](./plan.plan.md)
