'use client'

import { useState, useCallback } from 'react'

// Types for wallet data
export interface WalletEvent {
  type: string
  amount: string
  tokenType: string
  timestamp: string
  version: string
}

export interface AccountInfo {
  sequenceNumber: string
  coinResources: Array<Record<string, unknown>>
  tokenResources: Array<Record<string, unknown>>
}

export interface WalletData {
  address: string
  events: WalletEvent[]
  totalDeposits: string
  totalWithdrawals: string
  netFlow: string
  accountInfo: AccountInfo
}

export interface WalletSearchResult {
  address: string
  events: WalletEvent[]
  totalDeposits: string
  totalWithdrawals: string
  netFlow: string
  accountInfo: AccountInfo
}

export interface WalletSearchParams {
  addresses: string[]
  tokenTypes?: string[]
  dateRange?: {
    days: number
  }
}

export interface WalletSearchResponse {
  success: boolean
  data: WalletSearchResult[]
  metadata: {
    addresses: number
    tokenTypes: string[]
    processedAt: string
    source: string
    dataType: string
  }
}

export interface WalletAnalysisResult {
  address: string
  summary: {
    totalDeposits: string
    totalWithdrawals: string
    netFlow: string
    totalTransactions: number
    processingTimeMs: number
  }
  events: {
    deposits: number
    withdrawals: number
    total: number
  }
  activity: {
    hasActivity: boolean
    lastActivity: string | null
  }
  accountInfo?: AccountInfo
  recentTransactions?: WalletEvent[]
  metadata: {
    analyzedAt: string
    tokenType: string
    dataSource: string
    cacheStatus: string
  }
}

export interface WalletAnalysisParams {
  addresses: string[]
  tokenTypes?: string[]
  includeAccountInfo?: boolean
  includeTransactionHistory?: boolean
}

export interface WalletAnalysisResponse {
  success: boolean
  data: WalletAnalysisResult[]
  metadata: {
    totalAddresses: number
    successfulAnalyses: number
    failedAnalyses: number
    totalProcessingTimeMs: number
    averageProcessingTimeMs: number
    tokenTypes: string[]
    processedAt: string
    source: string
    dataType: string
  }
}

export interface BatchAnalysisResult {
  address: string
  batchIndex: number
  summary: {
    totalDeposits: string
    totalWithdrawals: string
    netFlow: string
    totalTransactions: number
    processingTimeMs: number
  }
  events: {
    deposits: number
    withdrawals: number
    total: number
  }
  accountInfo: AccountInfo
  metadata: {
    analyzedAt: string
    tokenType: string
    dataSource: string
    batchNumber: number
    priority: string
  }
}

export interface BatchAnalysisParams {
  addresses: string[]
  tokenTypes?: string[]
  batchSize?: number
  priority?: 'low' | 'normal' | 'high'
  includeProgress?: boolean
}

export interface BatchAnalysisResponse {
  success: boolean
  data: {
    results: BatchAnalysisResult[]
    errors: Array<Record<string, unknown>>
    summary: {
      totalAddresses: number
      successfulAnalyses: number
      failedAnalyses: number
      successRate: number
      totalProcessingTimeMs: number
      averageProcessingTimeMs: number
      batchSize: number
      totalBatches: number
    }
    performance: {
      addressesPerSecond: number
      averageBatchTime: number
      priority: string
      cacheEfficiency: string
    }
  }
  metadata: {
    processedAt: string
    source: string
    dataType: string
    priority: string
    includeProgress: boolean
  }
}

export const useWalletSearch = () => {
  const [results, setResults] = useState<WalletSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchWallets = useCallback(async (params: WalletSearchParams): Promise<WalletSearchResult[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wallet/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: WalletSearchResponse = await response.json()
      
      if (data.success) {
        setResults(data.data)
        return data.data
      } else {
        throw new Error('Search failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    searchWallets,
    results,
    isLoading,
    error,
    clearResults,
    clearError,
  }
}

export const useWalletAnalysis = () => {
  const [results, setResults] = useState<WalletAnalysisResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeWallets = useCallback(async (params: WalletAnalysisParams): Promise<WalletAnalysisResult[]> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/wallet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: WalletAnalysisResponse = await response.json()
      
      if (data.success) {
        setResults(data.data)
        return data.data
      } else {
        throw new Error('Analysis failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    analyzeWallets,
    results,
    isAnalyzing,
    error,
    clearResults,
    clearError,
  }
}

export const useBatchAnalysis = () => {
  const [results, setResults] = useState<BatchAnalysisResult[]>([])
  const [batchInfo, setBatchInfo] = useState<{
    totalBatches: number
    currentBatch: number
    progress: number
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const analyzeBatch = useCallback(async (params: BatchAnalysisParams): Promise<BatchAnalysisResult[]> => {
    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: BatchAnalysisResponse = await response.json()
      
      if (data.success) {
        setResults(data.data.results)
        setBatchInfo({
          totalBatches: data.data.summary.totalBatches,
          currentBatch: data.data.summary.totalBatches,
          progress: 100,
        })
        setProgress(100)
        return data.data.results
      } else {
        throw new Error('Batch analysis failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setBatchInfo(null)
    setProgress(0)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    analyzeBatch,
    results,
    batchInfo,
    isProcessing,
    progress,
    error,
    clearResults,
    clearError,
  }
}
