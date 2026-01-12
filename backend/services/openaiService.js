import OpenAI from 'openai';
import logger from '../utils/logger.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI client
const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

/**
 * Build a structured prompt for portfolio analysis
 */
const buildAnalysisPrompt = (portfolioData) => {
  const { holdings, quotes, marketSentiment } = portfolioData;

  let prompt = `You are a professional financial advisor analyzing a stock portfolio. Provide actionable insights and recommendations.

PORTFOLIO OVERVIEW:
`;

  // Calculate portfolio totals
  let totalValue = 0;
  let totalPnL = 0;
  holdings.forEach((holding) => {
    const quote = quotes[holding.symbol];
    if (quote) {
      const currentPrice = quote.price || quote.currentPrice;
      const marketValue = holding.quantity * currentPrice;
      const pnl = (currentPrice - holding.avgPrice) * holding.quantity;
      totalValue += marketValue;
      totalPnL += pnl;
    }
  });

  prompt += `Total Portfolio Value: $${totalValue.toFixed(2)}
Total P&L: $${totalPnL.toFixed(2)} (${((totalPnL / (totalValue - totalPnL)) * 100).toFixed(2)}%)
Number of Holdings: ${holdings.length}

HOLDINGS DETAILS:
`;

  holdings.forEach((holding) => {
    const quote = quotes[holding.symbol];
    const sentiment = marketSentiment[holding.symbol] || {};
    
    if (quote) {
      const currentPrice = quote.price || quote.currentPrice;
      const changePercent = quote.changePercent || 0;
      const pnl = (currentPrice - holding.avgPrice) * holding.quantity;
      const pnlPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
      
      prompt += `
${holding.symbol}:
  - Quantity: ${holding.quantity} shares
  - Average Price: $${holding.avgPrice.toFixed(2)}
  - Current Price: $${currentPrice.toFixed(2)}
  - Price Change Today: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
  - P&L: $${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)
  - Market Value: $${(holding.quantity * currentPrice).toFixed(2)}
`;

      if (sentiment.newsCount > 0) {
        prompt += `  - Recent News: ${sentiment.newsCount} articles\n`;
      }
      if (sentiment.recommendation) {
        prompt += `  - Analyst Recommendation: ${sentiment.recommendation}\n`;
      }
    }
  });

  prompt += `

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence executive summary of portfolio performance",
  "holdings_analysis": [
    {
      "symbol": "SYMBOL",
      "sentiment": "positive|neutral|negative",
      "recommendation": "BUY|HOLD|SELL",
      "reasoning": "Detailed explanation (2-3 sentences)"
    }
  ],
  "risk_assessment": {
    "level": "low|moderate|high",
    "details": "Explanation of portfolio risk factors"
  },
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ]
}

Focus on:
1. Risk assessment based on portfolio concentration and individual stock performance
2. Rebalancing suggestions (which positions to trim or add to)
3. Entry/exit timing recommendations based on current market sentiment
4. Overall portfolio health and diversification

Be specific, actionable, and professional.`;

  return prompt;
};

/**
 * Parse AI response into structured format
 */
const parseAIResponse = (response) => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, return structured error response
    return {
      summary: response.substring(0, 200),
      holdings_analysis: [],
      risk_assessment: {
        level: 'moderate',
        details: 'Unable to parse detailed analysis'
      },
      recommendations: ['Review portfolio manually']
    };
  } catch (error) {
    logger.error('Error parsing AI response:', error);
    return {
      summary: 'Analysis completed but formatting error occurred',
      holdings_analysis: [],
      risk_assessment: {
        level: 'moderate',
        details: 'Analysis parsing failed'
      },
      recommendations: ['Please review portfolio manually']
    };
  }
};

/**
 * Analyze portfolio using OpenAI
 */
export const analyzePortfolio = async (holdings, quotes, marketSentiment) => {
  if (!openai) {
    logger.warn('OpenAI API key not configured, returning mock analysis');
    return getMockAnalysis(holdings, quotes);
  }

  try {
    const prompt = buildAnalysisPrompt({ holdings, quotes, marketSentiment });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional financial advisor providing portfolio analysis. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const analysis = parseAIResponse(responseText);

    return analysis;
  } catch (error) {
    logger.error('OpenAI API Error:', error);
    
    // Return mock analysis on error
    return getMockAnalysis(holdings, quotes);
  }
};

/**
 * Generate mock analysis for development/testing
 */
const getMockAnalysis = (holdings, quotes) => {
  const holdingsAnalysis = holdings.map((holding) => {
    const quote = quotes[holding.symbol];
    const currentPrice = quote?.price || quote?.currentPrice || holding.avgPrice;
    const pnlPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
    
    let recommendation = 'HOLD';
    let sentiment = 'neutral';
    
    if (pnlPercent > 10) {
      recommendation = 'SELL';
      sentiment = 'positive';
    } else if (pnlPercent < -5) {
      recommendation = 'BUY';
      sentiment = 'negative';
    }

    return {
      symbol: holding.symbol,
      sentiment,
      recommendation,
      reasoning: `Current position shows ${pnlPercent >= 0 ? 'gain' : 'loss'} of ${Math.abs(pnlPercent).toFixed(2)}%. ${recommendation === 'SELL' ? 'Consider taking profits.' : recommendation === 'BUY' ? 'Consider averaging down if fundamentals remain strong.' : 'Monitor position closely.'}`
    };
  });

  const totalPnL = holdings.reduce((sum, holding) => {
    const quote = quotes[holding.symbol];
    const currentPrice = quote?.price || quote?.currentPrice || holding.avgPrice;
    return sum + (currentPrice - holding.avgPrice) * holding.quantity;
  }, 0);

  return {
    summary: `Your portfolio contains ${holdings.length} holdings. ${totalPnL >= 0 ? 'Overall performance is positive.' : 'Some positions are underperforming.'} Review individual holdings for specific recommendations.`,
    holdings_analysis: holdingsAnalysis,
    risk_assessment: {
      level: holdings.length < 5 ? 'high' : holdings.length < 10 ? 'moderate' : 'low',
      details: holdings.length < 5 ? 'Portfolio is concentrated in few positions. Consider diversification.' : 'Portfolio shows reasonable diversification.'
    },
    recommendations: [
      totalPnL > 0 ? 'Consider taking profits on top performers' : 'Review underperforming positions',
      holdings.length < 5 ? 'Add more positions for better diversification' : 'Monitor portfolio allocation',
      'Stay updated with market news and company fundamentals'
    ]
  };
};
