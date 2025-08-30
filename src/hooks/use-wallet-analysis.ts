'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { WalletAnalyzer } from '@/lib/aggregator';
import { ReportGenerator } from '@/lib/report-generator';
import { cache } from '@/lib/cache';

export type AnalysisState = 'idle' | 'processing' | 'completed' | 'error';

export interface AnalysisProgress {
  currentWallet: number;
  totalWallets: number;
  currentWalletAddress: string;
  status: 'analyzing' | 'completed' | 'failed';
  processingTime: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface WalletAnalysisResult {
  address: string;
  summary: {
    totalDeposits: string;
    totalWithdrawals: string;
    netFlow: string;
    totalTransactions: number;
    processingTimeMs: number;
  };
  events: {
    deposits: number;
    withdrawals: number;
    total: number;
  };
  activity: {
    hasActivity: boolean;
    lastActivity: string | null;
  };
  accountInfo?: any;
  recentTransactions?: any[];
  metadata: {
    analyzedAt: string;
    tokenType: string;
    dataSource: string;
    cacheStatus: string;
  };
}

export interface AnalysisParams {
  addresses: string[];
  tokenTypes: string[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeGasMetrics: boolean;
  includeTradingStats: boolean;
  includeUSDConversions: boolean;
}

export interface WalletAnalysisReport {
  summary: {
    totalWallets: number;
    totalVolume: number;
    totalVolumeUSD: number;
    totalTransactions: number;
    analysisDate: Date;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
  };
  wallets: WalletAnalysisResult[];
  charts: {
    volumeComparison: any;
    transactionPatterns: any;
    gasAnalysis: any;
  };
  insights: string[];
  recommendations: string[];
}

export function useWalletAnalysis() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [results, setResults] = useState<WalletAnalysisResult[]>([]);
  const [progress, setProgress] = useState<AnalysisProgress>({
    currentWallet: 0,
    totalWallets: 0,
    currentWalletAddress: '',
    status: 'analyzing',
    processingTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
  });

  const walletAnalyzer = new WalletAnalyzer();

  const analyzeWallets = useMutation({
    mutationFn: async (params: AnalysisParams) => {
      setAnalysisState('processing');
      setProgress(prev => ({
        ...prev,
        totalWallets: params.addresses.length,
        currentWallet: 0,
        processingTime: 0,
      }));

      const startTime = Date.now();
      let cacheHits = 0;
      let cacheMisses = 0;

      try {
        // Analyze wallets with progress tracking
        const results = await Promise.all(
          params.addresses.map(async (address, index) => {
            // Update progress
            setProgress(prev => ({
              ...prev,
              currentWallet: index + 1,
              currentWalletAddress: address,
              status: 'analyzing',
            }));

            try {
              // Check cache first
              const cacheKey = `wallet_${address}_${params.tokenTypes.join('_')}_${params.dateRange.startDate.getTime()}_${params.dateRange.endDate.getTime()}`;
              const cachedResult = await cache.get(cacheKey);
              
              if (cachedResult) {
                cacheHits++;
                setProgress(prev => ({ ...prev, cacheHits }));
                return cachedResult;
              }

              cacheMisses++;
              setProgress(prev => ({ ...prev, cacheMisses }));

              // Perform analysis
              const result = await walletAnalyzer.analyzeMultipleWallets(
                [address],
                params.tokenTypes,
                {
                  startDate: params.dateRange.startDate,
                  endDate: params.dateRange.endDate,
                }
              );

              // Cache the result
              await cache.set(cacheKey, result, 300); // 5 minutes TTL

              return result;
            } catch (error) {
              console.error(`Failed to analyze wallet ${address}:`, error);
              return {
                address,
                error: error instanceof Error ? error.message : 'Unknown error',
                summary: {
                  totalDeposits: '0',
                  totalWithdrawals: '0',
                  netFlow: '0',
                  totalTransactions: 0,
                  processingTimeMs: 0,
                },
                events: { deposits: 0, withdrawals: 0, total: 0 },
                activity: { hasActivity: false, lastActivity: null },
                metadata: {
                  analyzedAt: new Date().toISOString(),
                  tokenType: params.tokenTypes[0] || '0x1::aptos_coin::AptosCoin',
                  dataSource: 'Aptos Mainnet',
                  cacheStatus: 'error',
                },
              };
            }
          })
        );

        // Transform results for report format
        const reportData = ReportGenerator.generateWalletReport(results, params);
        
        setResults(reportData.wallets);
        setAnalysisState('completed');
        
        // Final progress update
        setProgress(prev => ({
          ...prev,
          currentWallet: params.addresses.length,
          status: 'completed',
          processingTime: Date.now() - startTime,
        }));

        return reportData;
      } catch (error) {
        console.error('Wallet analysis failed:', error);
        setAnalysisState('error');
        throw error;
      }
    },
    onError: (error) => {
      setAnalysisState('error');
      console.error('Analysis mutation error:', error);
    },
  });

  const resetAnalysis = useCallback(() => {
    setAnalysisState('idle');
    setResults([]);
    setProgress({
      currentWallet: 0,
      totalWallets: 0,
      currentWalletAddress: '',
      status: 'analyzing',
      processingTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    });
  }, []);

  const exportResults = useCallback((format: 'csv' | 'json' | 'pdf') => {
    if (!results.length) return;

    switch (format) {
      case 'csv':
        // Implement CSV export
        const csvContent = results.map(result => 
          `${result.address},${result.summary.totalDeposits},${result.summary.totalWithdrawals},${result.summary.netFlow}`
        ).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet-analysis-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        break;
      
      case 'json':
        const jsonContent = JSON.stringify(results, null, 2);
        const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
        const jsonUrl = window.URL.createObjectURL(jsonBlob);
        const jsonA = document.createElement('a');
        jsonA.href = jsonUrl;
        jsonA.download = `wallet-analysis-${new Date().toISOString().split('T')[0]}.json`;
        jsonA.click();
        break;
      
      case 'pdf':
        // Implement PDF export (would need a PDF library)
        console.log('PDF export not yet implemented');
        break;
    }
  }, [results]);

  return {
    analyzeWallets,
    analysisState,
    results,
    progress,
    resetAnalysis,
    exportResults,
    isProcessing: analysisState === 'processing',
    isCompleted: analysisState === 'completed',
    hasError: analysisState === 'error',
  };
}
