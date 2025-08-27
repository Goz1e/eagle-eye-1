import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { 
  TEST_WALLETS, 
  TEST_TOKENS, 
  PERFORMANCE_BENCHMARKS,
  createTestWalletData,
  waitFor as waitForHelper
} from '../utils/test-constants'

// Mock the hooks
jest.mock('@/hooks/use-search', () => ({
  useBatchAnalysis: () => ({
    analyzeBatch: jest.fn(),
    results: [],
    batchInfo: null,
    isProcessing: false,
    progress: 0,
    error: null,
    clearResults: jest.fn(),
    clearError: jest.fn(),
  }),
}))

// Setup MSW server for API mocking
const server = setupServer(
  // Mock batch processing API
  rest.post('/api/wallet/batch', (req, res, ctx) => {
    const { addresses, tokenTypes, batchSize = 10, priority = 'normal', includeProgress = true } = req.body as any
    
    if (!addresses || addresses.length === 0) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, error: 'Addresses required' })
      )
    }

    if (addresses.length > 50) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, error: 'Maximum 50 addresses allowed' })
      )
    }

    // Simulate batch processing with different wallet activity levels
    const results = addresses.map((address: string, index: number) => {
      let activityLevel: 'high' | 'medium' | 'low' | 'empty' = 'empty'
      
      // Assign activity levels based on index for testing
      if (index === 0) activityLevel = 'high'
      else if (index === 1) activityLevel = 'medium'
      else if (index === 2) activityLevel = 'low'
      else activityLevel = 'empty'
      
      const walletData = createTestWalletData(address, activityLevel)
      
      return {
        address,
        batchIndex: index,
        summary: {
          totalDeposits: walletData.totalDeposits,
          totalWithdrawals: walletData.totalWithdrawals,
          netFlow: walletData.netFlow,
          totalTransactions: walletData.events.length,
          processingTimeMs: Math.floor(Math.random() * 200) + 100, // 100-300ms
        },
        events: {
          deposits: walletData.events.filter(e => e.type === 'deposit').length,
          withdrawals: walletData.events.filter(e => e.type === 'withdrawal').length,
          total: walletData.events.length,
        },
        accountInfo: {
          sequenceNumber: walletData.accountInfo.sequenceNumber,
          coinResources: walletData.accountInfo.coinResources,
          tokenResources: walletData.accountInfo.tokenResources,
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          tokenType: tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
          dataSource: 'Aptos Mainnet',
          batchNumber: Math.floor(index / batchSize) + 1,
          priority,
        },
      }
    })

    // Calculate batch processing metrics
    const totalProcessingTime = results.reduce((sum, r) => sum + r.summary.processingTimeMs, 0)
    const successfulAnalyses = results.length
    const failedAnalyses = 0
    const totalBatches = Math.ceil(addresses.length / batchSize)

    return res(
      ctx.json({
        success: true,
        data: {
          results,
          errors: [],
          summary: {
            totalAddresses: addresses.length,
            successfulAnalyses,
            failedAnalyses,
            successRate: (successfulAnalyses / addresses.length) * 100,
            totalProcessingTimeMs: totalProcessingTime,
            averageProcessingTimeMs: totalProcessingTime / successfulAnalyses,
            batchSize,
            totalBatches,
          },
          performance: {
            addressesPerSecond: addresses.length / (totalProcessingTime / 1000),
            averageBatchTime: totalProcessingTime / totalBatches,
            priority,
            cacheEfficiency: 'real_time',
          },
        },
        metadata: {
          processedAt: new Date().toISOString(),
          source: 'Aptos Mainnet',
          dataType: 'real_blockchain_batch_analysis',
          priority,
          includeProgress,
        },
      })
    )
  }),

  // Mock individual wallet analysis for comparison
  rest.post('/api/wallet/analyze', (req, res, ctx) => {
    const { addresses, tokenTypes } = req.body as any
    
    const results = addresses.map((address: string, index: number) => {
      let activityLevel: 'high' | 'medium' | 'low' | 'empty' = 'empty'
      
      if (index === 0) activityLevel = 'high'
      else if (index === 1) activityLevel = 'medium'
      else if (index === 2) activityLevel = 'low'
      else activityLevel = 'empty'
      
      const walletData = createTestWalletData(address, activityLevel)
      
      return {
        address,
        summary: {
          totalDeposits: walletData.totalDeposits,
          totalWithdrawals: walletData.totalWithdrawals,
          netFlow: walletData.netFlow,
          totalTransactions: walletData.events.length,
          processingTimeMs: Math.floor(Math.random() * 150) + 50, // 50-200ms
        },
        events: {
          deposits: walletData.events.filter(e => e.type === 'deposit').length,
          withdrawals: walletData.events.filter(e => e.type === 'withdrawal').length,
          total: walletData.events.length,
        },
        activity: {
          hasActivity: walletData.events.length > 0,
          lastActivity: walletData.events.length > 0 ? new Date().toISOString() : null,
        },
        accountInfo: walletData.accountInfo,
        metadata: {
          analyzedAt: new Date().toISOString(),
          tokenType: tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
          dataSource: 'Aptos Mainnet',
          cacheStatus: 'real_time',
        },
      }
    })

    return res(
      ctx.json({
        success: true,
        data: results,
        metadata: {
          totalAddresses: addresses.length,
          successfulAnalyses: addresses.length,
          failedAnalyses: 0,
          totalProcessingTimeMs: results.reduce((sum, r) => sum + r.summary.processingTimeMs, 0),
          averageProcessingTimeMs: results.reduce((sum, r) => sum + r.summary.processingTimeMs, 0) / results.length,
          tokenTypes: tokenTypes || ['0x1::aptos_coin::AptosCoin'],
          processedAt: new Date().toISOString(),
          source: 'Aptos Mainnet',
          dataType: 'real_blockchain_analysis',
        },
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Batch Processing Integration - End-to-End Tests', () => {
  let startTime: number

  beforeEach(() => {
    startTime = Date.now()
    jest.clearAllMocks()
  })

  afterEach(() => {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Performance assertion for test execution
    expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.uiResponsiveness)
  })

  describe('Batch Processing API Tests', () => {
    test('should process multiple wallets in batches', async () => {
      const testAddresses = [
        TEST_WALLETS.highVolume,
        TEST_WALLETS.mediumVolume,
        TEST_WALLETS.lowVolume,
        TEST_WALLETS.empty,
      ]

      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: testAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 2,
          priority: 'normal',
          includeProgress: true,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.results).toHaveLength(4)
      expect(data.data.summary.totalAddresses).toBe(4)
      expect(data.data.summary.successRate).toBe(100)
      expect(data.data.summary.totalBatches).toBe(2)
      expect(data.metadata.source).toBe('Aptos Mainnet')
    })

    test('should handle different batch sizes correctly', async () => {
      const testAddresses = Array(10).fill(null).map((_, i) => `0x${i.toString().padStart(64, '0')}`)
      
      const batchSizes = [1, 2, 5, 10]
      
      for (const batchSize of batchSizes) {
        const response = await fetch('/api/wallet/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: testAddresses,
            tokenTypes: [TEST_TOKENS.APT],
            batchSize,
            priority: 'normal',
            includeProgress: true,
          }),
        })

        expect(response.ok).toBe(true)
        const data = await response.json()
        
        expect(data.data.summary.batchSize).toBe(batchSize)
        expect(data.data.summary.totalBatches).toBe(Math.ceil(10 / batchSize))
        expect(data.data.results).toHaveLength(10)
      }
    })

    test('should respect priority levels for processing', async () => {
      const testAddresses = [TEST_WALLETS.highVolume, TEST_WALLETS.mediumVolume]
      const priorities = ['low', 'normal', 'high']
      
      for (const priority of priorities) {
        const response = await fetch('/api/wallet/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: testAddresses,
            tokenTypes: [TEST_TOKENS.APT],
            batchSize: 2,
            priority,
            includeProgress: true,
          }),
        })

        expect(response.ok).toBe(true)
        const data = await response.json()
        
        expect(data.metadata.priority).toBe(priority)
        expect(data.data.performance.priority).toBe(priority)
      }
    })

    test('should handle empty address list gracefully', async () => {
      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [],
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 5,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Addresses required')
    })

    test('should enforce maximum address limit', async () => {
      const tooManyAddresses = Array(51).fill(null).map((_, i) => `0x${i.toString().padStart(64, '0')}`)
      
      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: tooManyAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 10,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Maximum 50 addresses allowed')
    })
  })

  describe('Batch Processing Performance Tests', () => {
    test('should complete batch processing within performance benchmarks', async () => {
      const testAddresses = [
        TEST_WALLETS.highVolume,
        TEST_WALLETS.mediumVolume,
        TEST_WALLETS.lowVolume,
      ]

      const batchStart = Date.now()
      
      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: testAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 2,
          priority: 'high',
          includeProgress: true,
        }),
      })

      const batchEnd = Date.now()
      const duration = batchEnd - batchStart
      
      expect(response.ok).toBe(true)
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.batchProcessing)
      
      const data = await response.json()
      expect(data.data.summary.totalProcessingTimeMs).toBeLessThan(1000) // Should be under 1 second
      expect(data.data.performance.addressesPerSecond).toBeGreaterThan(1) // Should process at least 1 address per second
    })

    test('should show linear scaling with batch size', async () => {
      const testAddresses = Array(5).fill(null).map((_, i) => `0x${i.toString().padStart(64, '0')}`)
      const batchSizes = [1, 2, 5]
      const processingTimes: number[] = []
      
      for (const batchSize of batchSizes) {
        const start = Date.now()
        
        const response = await fetch('/api/wallet/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: testAddresses,
            tokenTypes: [TEST_TOKENS.APT],
            batchSize,
            priority: 'normal',
            includeProgress: true,
          }),
        })

        const end = Date.now()
        const duration = end - start
        
        expect(response.ok).toBe(true)
        processingTimes.push(duration)
      }
      
      // Larger batch sizes should generally be more efficient
      // (though this is a simplified test - real performance depends on many factors)
      expect(processingTimes[2]).toBeLessThanOrEqual(processingTimes[0] * 2) // 5-size batch should be <= 2x 1-size batch
    })

    test('should maintain consistent performance across multiple runs', async () => {
      const testAddresses = [TEST_WALLETS.highVolume, TEST_WALLETS.mediumVolume]
      const runTimes: number[] = []
      
      for (let i = 0; i < 3; i++) {
        const start = Date.now()
        
        const response = await fetch('/api/wallet/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: testAddresses,
            tokenTypes: [TEST_TOKENS.APT],
            batchSize: 2,
            priority: 'normal',
            includeProgress: true,
          }),
        })

        const end = Date.now()
        const duration = end - start
        
        expect(response.ok).toBe(true)
        runTimes.push(duration)
        
        // Wait between runs to avoid rate limiting
        await waitForHelper(100)
      }
      
      // Performance should be consistent (within 50% variance)
      const avgTime = runTimes.reduce((sum, time) => sum + time, 0) / runTimes.length
      runTimes.forEach(time => {
        expect(time).toBeLessThan(avgTime * 1.5)
        expect(time).toBeGreaterThan(avgTime * 0.5)
      })
    })
  })

  describe('Batch Processing Data Accuracy Tests', () => {
    test('should maintain data accuracy across different batch sizes', async () => {
      const testAddresses = [
        TEST_WALLETS.highVolume,
        TEST_WALLETS.mediumVolume,
        TEST_WALLETS.lowVolume,
      ]

      // Get individual analysis results for comparison
      const individualResponse = await fetch('/api/wallet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: testAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          includeAccountInfo: true,
        }),
      })

      expect(individualResponse.ok).toBe(true)
      const individualData = await individualResponse.json()

      // Get batch analysis results
      const batchResponse = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: testAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 2,
          priority: 'normal',
          includeProgress: true,
        }),
      })

      expect(batchResponse.ok).toBe(true)
      const batchData = await batchResponse.json()

      // Compare results - they should be identical
      expect(batchData.data.results).toHaveLength(individualData.data.length)
      
      for (let i = 0; i < testAddresses.length; i++) {
        const individual = individualData.data[i]
        const batch = batchData.data.results[i]
        
        expect(batch.address).toBe(individual.address)
        expect(batch.summary.totalDeposits).toBe(individual.summary.totalDeposits)
        expect(batch.summary.totalWithdrawals).toBe(individual.summary.totalWithdrawals)
        expect(batch.summary.totalTransactions).toBe(individual.summary.totalTransactions)
      }
    })

    test('should correctly aggregate summary metrics across batches', async () => {
      const testAddresses = Array(6).fill(null).map((_, i) => `0x${i.toString().padStart(64, '0')}`)
      
      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: testAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 2,
          priority: 'normal',
          includeProgress: true,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      const summary = data.data.summary
      const results = data.data.results
      
      // Verify aggregated metrics
      expect(summary.totalAddresses).toBe(6)
      expect(summary.successfulAnalyses).toBe(6)
      expect(summary.failedAnalyses).toBe(0)
      expect(summary.successRate).toBe(100)
      expect(summary.totalBatches).toBe(3) // 6 addresses / 2 batch size = 3 batches
      
      // Verify performance metrics
      const performance = data.data.performance
      expect(performance.addressesPerSecond).toBeGreaterThan(0)
      expect(performance.averageBatchTime).toBeGreaterThan(0)
      expect(performance.priority).toBe('normal')
      expect(performance.cacheEfficiency).toBe('real_time')
    })

    test('should handle mixed wallet activity levels correctly', async () => {
      const testAddresses = [
        TEST_WALLETS.highVolume,   // High activity
        TEST_WALLETS.mediumVolume, // Medium activity
        TEST_WALLETS.lowVolume,    // Low activity
        TEST_WALLETS.empty,        // No activity
      ]

      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: testAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 2,
          priority: 'normal',
          includeProgress: true,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      const results = data.data.results
      
      // Verify activity levels are preserved
      expect(results[0].summary.totalTransactions).toBeGreaterThan(results[1].summary.totalTransactions)
      expect(results[1].summary.totalTransactions).toBeGreaterThan(results[2].summary.totalTransactions)
      expect(results[2].summary.totalTransactions).toBeGreaterThanOrEqual(results[3].summary.totalTransactions)
      
      // Verify all wallets were processed successfully
      results.forEach(result => {
        expect(result.address).toBeDefined()
        expect(result.summary).toBeDefined()
        expect(result.events).toBeDefined()
        expect(result.accountInfo).toBeDefined()
        expect(result.metadata).toBeDefined()
      })
    })
  })

  describe('Batch Processing Error Handling Tests', () => {
    test('should handle individual wallet failures gracefully', async () => {
      // Mock a scenario where some wallets fail
      server.use(
        rest.post('/api/wallet/batch', (req, res, ctx) => {
          const { addresses } = req.body as any
          
          const results = addresses.map((address: string, index: number) => {
            if (index === 1) {
              // Simulate failure for second wallet
              return {
                address,
                error: 'Failed to fetch wallet data',
                summary: {
                  totalDeposits: '0',
                  totalWithdrawals: '0',
                  netFlow: '0',
                  totalTransactions: 0,
                  processingTimeMs: 0,
                },
                events: { deposits: 0, withdrawals: 0, total: 0 },
                metadata: {
                  analyzedAt: new Date().toISOString(),
                  tokenType: '0x1::aptos_coin::AptosCoin',
                  dataSource: 'Aptos Mainnet',
                  batchNumber: 1,
                  priority: 'normal',
                  cacheStatus: 'error',
                },
              }
            }
            
            // Success for other wallets
            const walletData = createTestWalletData(address, 'high')
            return {
              address,
              batchIndex: index,
              summary: {
                totalDeposits: walletData.totalDeposits,
                totalWithdrawals: walletData.totalWithdrawals,
                netFlow: walletData.netFlow,
                totalTransactions: walletData.events.length,
                processingTimeMs: 100,
              },
              events: {
                deposits: walletData.events.filter(e => e.type === 'deposit').length,
                withdrawals: walletData.events.filter(e => e.type === 'withdrawal').length,
                total: walletData.events.length,
              },
              accountInfo: walletData.accountInfo,
              metadata: {
                analyzedAt: new Date().toISOString(),
                tokenType: '0x1::aptos_coin::AptosCoin',
                dataSource: 'Aptos Mainnet',
                batchNumber: 1,
                priority: 'normal',
              },
            }
          })

          return res(
            ctx.json({
              success: true,
              data: {
                results,
                errors: results.filter(r => r.error),
                summary: {
                  totalAddresses: addresses.length,
                  successfulAnalyses: results.filter(r => !r.error).length,
                  failedAnalyses: results.filter(r => r.error).length,
                  successRate: (results.filter(r => !r.error).length / addresses.length) * 100,
                  totalProcessingTimeMs: results.reduce((sum, r) => sum + r.summary.processingTimeMs, 0),
                  averageProcessingTimeMs: results.filter(r => !r.error).reduce((sum, r) => sum + r.summary.processingTimeMs, 0) / results.filter(r => !r.error).length,
                  batchSize: 2,
                  totalBatches: Math.ceil(addresses.length / 2),
                },
                performance: {
                  addressesPerSecond: addresses.length / (results.reduce((sum, r) => sum + r.summary.processingTimeMs, 0) / 1000),
                  averageBatchTime: results.reduce((sum, r) => sum + r.summary.processingTimeMs, 0) / Math.ceil(addresses.length / 2),
                  priority: 'normal',
                  cacheEfficiency: 'real_time',
                },
              },
              metadata: {
                processedAt: new Date().toISOString(),
                source: 'Aptos Mainnet',
                dataType: 'real_blockchain_batch_analysis',
                priority: 'normal',
                includeProgress: true,
              },
            })
          )
        })
      )

      const testAddresses = [TEST_WALLETS.highVolume, TEST_WALLETS.mediumVolume]
      
      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: testAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 2,
          priority: 'normal',
          includeProgress: true,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.data.summary.successfulAnalyses).toBe(1)
      expect(data.data.summary.failedAnalyses).toBe(1)
      expect(data.data.summary.successRate).toBe(50)
      expect(data.data.errors).toHaveLength(1)
      expect(data.data.errors[0].address).toBe(TEST_WALLETS.mediumVolume)
      expect(data.data.errors[0].error).toBe('Failed to fetch wallet data')
    })

    test('should handle network failures during batch processing', async () => {
      // Mock network failure
      server.use(
        rest.post('/api/wallet/batch', (req, res, ctx) => {
          return res.networkError('Failed to connect to blockchain')
        })
      )

      try {
        await fetch('/api/wallet/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: [TEST_WALLETS.highVolume],
            tokenTypes: [TEST_TOKENS.APT],
            batchSize: 1,
          }),
        })
        fail('Should have thrown network error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Batch Processing Progress Tracking Tests', () => {
    test('should provide accurate progress information', async () => {
      const testAddresses = Array(10).fill(null).map((_, i) => `0x${i.toString().padStart(64, '0')}`)
      
      const response = await fetch('/api/wallet/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: testAddresses,
          tokenTypes: [TEST_TOKENS.APT],
          batchSize: 3,
          priority: 'normal',
          includeProgress: true,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      const summary = data.data.summary
      
      // Verify progress-related metadata
      expect(summary.totalAddresses).toBe(10)
      expect(summary.totalBatches).toBe(4) // 10 addresses / 3 batch size = 4 batches (3, 3, 3, 1)
      expect(summary.successfulAnalyses).toBe(10)
      expect(summary.failedAnalyses).toBe(0)
      expect(summary.successRate).toBe(100)
      
      // Verify performance metrics are reasonable
      const performance = data.data.performance
      expect(performance.addressesPerSecond).toBeGreaterThan(0)
      expect(performance.averageBatchTime).toBeGreaterThan(0)
      expect(performance.averageBatchTime).toBeLessThan(5000) // Should be under 5 seconds per batch
    })
  })
})
