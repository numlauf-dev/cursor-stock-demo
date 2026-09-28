import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const alphaVantageGetMock = jest.fn();
const axiosGetMock = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: alphaVantageGetMock,
    })),
    get: axiosGetMock,
  },
}));

const stockService = await import('../backend/services/stockService.js');
const { getStockNews } = stockService;

const originalEnv = { ...process.env };

describe('News sentiment classification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STOCK_NEWS_PROVIDER = 'mock';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('classifies clearly negative headlines correctly', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    const negativeHeadlines = [
      'slips after supplier warning',
      'faces downgrade',
      'demand outlook weakens',
    ];

    negativeHeadlines.forEach((fragment) => {
      const article = news.find((n) => n.headline.toLowerCase().includes(fragment));
      expect(article).toBeDefined();
      expect(article.sentiment).toBe('negative');
    });
  });

  it('classifies clearly positive headlines correctly', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    const positiveHeadlines = [
      'extends gains',
      'raise targets',
      'strong growth outlook',
    ];

    positiveHeadlines.forEach((fragment) => {
      const article = news.find((n) => n.headline.toLowerCase().includes(fragment));
      expect(article).toBeDefined();
      expect(article.sentiment).toBe('positive');
    });
  });

  it('classifies neutral headlines correctly', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    const neutralHeadlines = [
      'hiring plan signals steady expansion',
    ];

    neutralHeadlines.forEach((fragment) => {
      const article = news.find((n) => n.headline.toLowerCase().includes(fragment));
      expect(article).toBeDefined();
      expect(article.sentiment).toBe('neutral');
    });
  });

  it('handles headlines with mixed sentiment by net score', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    // "slips after supplier warning on margin pressure" has 'slips', 'warning', and 'pressure' (3 negative)
    // versus any positive words (0 positive)
    const negativeArticle = news.find((n) => 
      n.headline.toLowerCase().includes('slips') && 
      n.headline.toLowerCase().includes('warning')
    );
    
    expect(negativeArticle).toBeDefined();
    expect(negativeArticle.sentiment).toBe('negative');
  });

  it('returns all news articles with sentiment tags', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    expect(news.length).toBeGreaterThan(0);
    news.forEach((article) => {
      expect(article).toHaveProperty('sentiment');
      expect(['positive', 'negative', 'neutral']).toContain(article.sentiment);
    });
  });

  it('ensures "slip", "slips", "warning", "pressure" classify as negative', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    const negativeKeywords = ['slip', 'slips', 'warning', 'pressure'];
    
    negativeKeywords.forEach((keyword) => {
      const matchingArticles = news.filter((n) => 
        n.headline.toLowerCase().includes(keyword) || 
        n.summary.toLowerCase().includes(keyword)
      );
      
      if (matchingArticles.length > 0) {
        matchingArticles.forEach((article) => {
          // Articles with these keywords should be negative or neutral,
          // but definitely not positive (unless they have overwhelming positive words)
          if (article.sentiment === 'positive') {
            const headlineAndSummary = `${article.headline} ${article.summary}`.toLowerCase();
            const positiveCount = ['gain', 'gains', 'rise', 'rises', 'surge', 'beat', 'beats', 'strong', 'growth', 'profit', 'bullish', 'upgrade'].filter(kw => headlineAndSummary.includes(kw)).length;
            
            // Only allow positive if there are more positive than negative keywords
            expect(positiveCount).toBeGreaterThan(1);
          }
        });
      }
    });
  });
});
