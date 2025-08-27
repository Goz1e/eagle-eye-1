import { useState, useCallback } from 'react';

export interface WalletEvent {
  type: 'deposit' | 'withdrawal';
  amount: string;
  tokenType: string;
  timestamp: string;
  version: string;
}

export interface WalletActivity {
  address: string;
  events: WalletEvent[];
  totalDeposits: string;
  totalWithdrawals: string;
  netFlow: string;
  accountInfo?: {
    sequenceNumber: string;
    coinResources: any[];
    tokenResources: any[];
  };
  error?: string;
}

export interface SearchParameters {
  addresses: string[];
  tokenTypes?: string[];
  startDate?: string;
  endDate?: string;
}

export function useWalletSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WalletActivity[]>([]);

  const searchWallets = useCallback(async (params: SearchParameters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wallet/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchWallets,
    results,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

export function useBatchAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [batchInfo, setBatchInfo] = useState<any>(null);

  const analyzeBatch = useCallback(async (addresses: string[], tokenTypes?: string[], options?: {
    batchSize?: number;
    priority?: 'low' | 'normal' | 'high';
    includeProgress?: boolean;
  }) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResults([]);
    setBatchInfo(null);

    try {
      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses,
          tokenTypes,
          batchSize: options?.batchSize || 10,
          priority: options?.priority || 'normal',
          includeProgress: options?.includeProgress !== false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start batch analysis');
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.data.results);
        setBatchInfo(data.data.summary);
        setProgress(100);
      } else {
        throw new Error(data.error || 'Batch analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch analysis failed');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    analyzeBatch,
    results,
    batchInfo,
    isProcessing,
    progress,
    error,
    clearResults: () => setResults([]),
    clearError: () => setError(null),
  };
}

export function useWalletAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeWallets = useCallback(async (params: SearchParameters & {
    includeAccountInfo?: boolean;
    includeTransactionHistory?: boolean;
  }) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/wallet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze wallets');
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeWallets,
    results,
    isAnalyzing,
    error,
    clearError: () => setError(null),
  };
}
