import { useState, useCallback } from 'react';
import { api } from '../utils/api.js';

/**
 * Custom hook for portfolio analysis
 */
export const usePortfolioAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timestamp, setTimestamp] = useState(null);

  const analyzePortfolio = useCallback(async (holdings) => {
    if (!holdings || holdings.length === 0) {
      setError('No holdings provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.analyzePortfolio(holdings);

      if (data.success) {
        setAnalysis(data.analysis);
        setTimestamp(data.timestamp);
        setError(null);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze portfolio');
      setAnalysis(null);
      setTimestamp(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setTimestamp(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    timestamp,
    analyzePortfolio,
    clearAnalysis,
  };
};
