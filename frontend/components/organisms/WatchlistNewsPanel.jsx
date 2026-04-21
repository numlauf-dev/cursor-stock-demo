import { useEffect, useMemo, useState } from 'react'
import { api } from '../../utils/api'
import Button from '../atoms/Button'

const DEFAULT_LIMIT = 20

const SENTIMENT_OPTIONS = [
  { label: 'All sentiments', value: '' },
  { label: 'Positive', value: 'positive' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Negative', value: 'negative' },
]

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'publishedAt:desc' },
  { label: 'Oldest first', value: 'publishedAt:asc' },
]

const getSentimentChipClasses = (sentiment) => {
  if (sentiment === 'positive') {
    return 'bg-green-500/20 text-green-300 border border-green-500/30'
  }
  if (sentiment === 'negative') {
    return 'bg-red-500/20 text-red-300 border border-red-500/30'
  }
  return 'bg-gray-600/30 text-gray-300 border border-gray-500/40'
}

const getSentimentLabel = (sentiment) => {
  if (sentiment === 'positive') return 'Positive'
  if (sentiment === 'negative') return 'Negative'
  return 'Neutral'
}

const formatPublishedTime = (publishedAt) => {
  const timestamp = new Date(publishedAt)
  if (Number.isNaN(timestamp.getTime())) {
    return 'Unknown time'
  }
  return timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const WatchlistNewsPanel = ({ watchlistId, symbols, isWatchlistReady }) => {
  const [articles, setArticles] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [loadMoreError, setLoadMoreError] = useState(null)
  const [symbolFilter, setSymbolFilter] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('publishedAt:desc')

  const symbolOptions = useMemo(
    () => [{ label: 'All symbols', value: '' }, ...symbols.map((symbol) => ({ label: symbol, value: symbol }))],
    [symbols]
  )

  useEffect(() => {
    if (!isWatchlistReady || !watchlistId) {
      return
    }

    const fetchInitialFeed = async () => {
      setLoading(true)
      setError(null)
      setLoadMoreError(null)
      try {
        const payload = await api.getWatchlistNews(watchlistId, {
          limit: DEFAULT_LIMIT,
          symbol: symbolFilter || undefined,
          sentiment: sentimentFilter || undefined,
          sort: sortOrder,
        })
        setArticles(payload.news || [])
        setNextCursor(payload.nextCursor ?? null)
        setHasMore(Boolean(payload.hasMore))
      } catch (err) {
        setArticles([])
        setNextCursor(null)
        setHasMore(false)
        setError(err.message || 'Failed to load watchlist news')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialFeed()
  }, [watchlistId, symbolFilter, sentimentFilter, sortOrder, isWatchlistReady])

  const handleLoadMore = async () => {
    if (!watchlistId || !hasMore || nextCursor === null || loadingMore) {
      return
    }

    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const payload = await api.getWatchlistNews(watchlistId, {
        limit: DEFAULT_LIMIT,
        cursor: nextCursor,
        symbol: symbolFilter || undefined,
        sentiment: sentimentFilter || undefined,
        sort: sortOrder,
      })
      setArticles((existingArticles) => [...existingArticles, ...(payload.news || [])])
      setNextCursor(payload.nextCursor ?? null)
      setHasMore(Boolean(payload.hasMore))
    } catch (err) {
      setLoadMoreError(err.message || 'Failed to load more watchlist news')
    } finally {
      setLoadingMore(false)
    }
  }

  if (!symbols.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">Watchlist News</h2>
        <div className="text-sm text-gray-400">Add symbols to your watchlist to see aggregated news.</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-white mb-4">Watchlist News</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <label className="text-sm text-gray-300">
          <span className="block mb-1">Symbol</span>
          <select
            value={symbolFilter}
            onChange={(event) => setSymbolFilter(event.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          >
            {symbolOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-gray-300">
          <span className="block mb-1">Sentiment</span>
          <select
            value={sentimentFilter}
            onChange={(event) => setSentimentFilter(event.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          >
            {SENTIMENT_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-gray-300">
          <span className="block mb-1">Sort</span>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="animate-pulse border border-gray-700 rounded-lg p-4">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : articles.length === 0 ? (
        <div className="text-sm text-gray-400">No watchlist news matches your selected filters.</div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, index) => (
            <a
              key={`${article.symbol}-${article.id}-${index}`}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="block border border-gray-700 hover:border-gray-500 rounded-lg p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-white">{article.headline}</h3>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getSentimentChipClasses(article.sentiment)}`}>
                  {getSentimentLabel(article.sentiment)}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {article.symbol} · {article.source} · {formatPublishedTime(article.publishedAt)}
              </div>
            </a>
          ))}

          {loadMoreError && (
            <div className="text-sm text-red-400">
              Could not load more watchlist news. Please try again.
            </div>
          )}

          {hasMore && (
            <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading more...' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default WatchlistNewsPanel
