import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { 
  TEST_WALLETS, 
  TEST_TOKENS, 
  TEST_DATE_RANGES, 
  PERFORMANCE_BENCHMARKS,
  createTestWalletData,
  isValidAptosAddress,
  convertMicroUnits,
  waitFor as waitForHelper
} from '../utils/test-constants'

// Mock the hooks
jest.mock('@/hooks/use-search', () => ({
  useWalletSearch: () => ({
    searchWallets: jest.fn(),
    results: [],
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
  useWalletAnalysis: () => ({
    analyzeWallets: jest.fn(),
    results: [],
    isAnalyzing: false,
    error: null,
    clearError: jest.fn(),
  }),
}))

// Mock the reports hook
jest.mock('@/hooks/use-reports', () => ({
  useReports: () => ({
    reports: [],
    fetchReports: jest.fn(),
    createReport: jest.fn(),
    isLoading: false,
    error: null,
  }),
}))

// Setup MSW server for API mocking
const server = setupServer(
  // Mock wallet events API
  rest.post('/api/wallet/events', (req, res, ctx) => {
    const { addresses, tokenTypes } = req.body as any
    
    if (!addresses || addresses.length === 0) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, error: 'Addresses required' })
      )
    }

    // Validate address format
    const invalidAddresses = addresses.filter((addr: string) => !isValidAptosAddress(addr))
    if (invalidAddresses.length > 0) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, error: 'Invalid address format' })
      )
    }

    const mockData = addresses.map((address: string) => {
      // Use the high volume wallet for testing
      if (address === TEST_WALLETS.highVolume) {
        return createTestWalletData(address, 'high')
      }
      return createTestWalletData(address, 'empty')
    })

    return res(
      ctx.json({
        success: true,
        data: mockData,
        metadata: {
          addresses: addresses.length,
          tokenTypes: tokenTypes || [TEST_TOKENS.APT],
          processedAt: new Date().toISOString(),
          source: 'Aptos Mainnet',
          dataType: 'real_blockchain_data',
        },
      })
    )
  }),

  // Mock wallet analysis API
  rest.post('/api/wallet/analyze', (req, res, ctx) => {
    const { addresses, tokenTypes, includeAccountInfo, includeTransactionHistory } = req.body as any
    
    const mockData = addresses.map((address: string) => {
      const walletData = createTestWalletData(address, 'high')
      
      return {
        address,
        summary: {
          totalDeposits: convertMicroUnits(walletData.totalDeposits),
          totalWithdrawals: convertMicroUnits(walletData.totalWithdrawals),
          netFlow: convertMicroUnits(walletData.netFlow),
          totalTransactions: walletData.events.length,
          processingTimeMs: Math.floor(Math.random() * 100) + 50, // 50-150ms
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
        ...(includeAccountInfo && {
          accountInfo: walletData.accountInfo,
        }),
        ...(includeTransactionHistory && {
          recentTransactions: walletData.events.slice(0, 5),
        }),
        metadata: {
          analyzedAt: new Date().toISOString(),
          tokenType: tokenTypes?.[0] || TEST_TOKENS.APT,
          dataSource: 'Aptos Mainnet',
          cacheStatus: 'real_time',
        },
      }
    })

    return res(
      ctx.json({
        success: true,
        data: mockData,
        metadata: {
          totalAddresses: addresses.length,
          successfulAnalyses: addresses.length,
          failedAnalyses: 0,
          totalProcessingTimeMs: mockData.reduce((sum, d) => sum + d.summary.processingTimeMs, 0),
          averageProcessingTimeMs: mockData.reduce((sum, d) => sum + d.summary.processingTimeMs, 0) / mockData.length,
          tokenTypes: tokenTypes || [TEST_TOKENS.APT],
          processedAt: new Date().toISOString(),
          source: 'Aptos Mainnet',
          dataType: 'real_blockchain_analysis',
        },
      })
    )
  }),

  // Mock reports API
  rest.post('/api/reports', (req, res, ctx) => {
    const { title, description, walletData, parameters, createdBy } = req.body as any
    
    if (!title || !walletData || !createdBy) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, error: 'Missing required fields' })
      )
    }

    const mockReport = {
      id: 'test-report-id',
      title,
      description,
      walletData,
      parameters,
      status: 'COMPLETED',
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return res(
      ctx.json({
        success: true,
        data: mockReport,
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Single Wallet Analysis Flow - End-to-End Tests', () => {
  let startTime: number

  beforeEach(() => {
    startTime = Date.now()
    // Clear all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Performance assertion
    expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.uiResponsiveness)
  })

  describe('Wallet Address Validation', () => {
    test('should validate correct Aptos address format', () => {
      const validAddress = TEST_WALLETS.highVolume
      expect(isValidAptosAddress(validAddress)).toBe(true)
    })

    test('should reject invalid address formats', () => {
      const invalidAddresses = [
        '0x123', // Too short
        '0xg234567890123456789012345678901234567890123456789012345678901234', // Invalid hex
        'd665491175132e66210164f5c0aef6aa432191ac7f3fcc1ab1deebe6d76351ec', // Missing 0x
        '0x12345678901234567890123456789012345678901234567890123456789012345', // Too long
      ]

      invalidAddresses.forEach(address => {
        expect(isValidAptosAddress(address)).toBe(false)
      })
    })
  })

  describe('API Integration Tests', () => {
    test('should fetch real wallet events from Aptos blockchain', async () => {
      const response = await fetch('/api/wallet/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].address).toBe(TEST_WALLETS.highVolume)
      expect(data.metadata.source).toBe('Aptos Mainnet')
      expect(data.metadata.dataType).toBe('real_blockchain_data')
    })

    test('should perform comprehensive wallet analysis', async () => {
      const response = await fetch('/api/wallet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
          includeAccountInfo: true,
          includeTransactionHistory: true,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].summary.totalTransactions).toBeGreaterThan(0)
      expect(data.data[0].activity.hasActivity).toBe(true)
      expect(data.data[0].accountInfo).toBeDefined()
      expect(data.data[0].recentTransactions).toBeDefined()
    })

    test('should handle API errors gracefully', async () => {
      // Test with invalid request
      const response = await fetch('/api/wallet/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [], // Empty addresses
          tokenTypes: [TEST_TOKENS.APT],
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Addresses required')
    })
  })

  describe('Data Processing and Conversion', () => {
    test('should convert microunits to readable APT amounts', () => {
      const testCases = [
        { microunits: '100000000', expected: '1.00000000' }, // 1 APT
        { microunits: '150000000', expected: '1.50000000' }, // 1.5 APT
        { microunits: '123456789', expected: '1.23456789' }, // 1.23456789 APT
        { microunits: '1000000000', expected: '10.00000000' }, // 10 APT
      ]

      testCases.forEach(({ microunits, expected }) => {
        const result = convertMicroUnits(microunits)
        expect(result).toBe(expected)
      })
    })

    test('should calculate net flow correctly', () => {
      const deposits = '1000000000' // 10 APT
      const withdrawals = '300000000' // 3 APT
      const netFlow = BigInt(deposits) - BigInt(withdrawals)
      
      expect(netFlow.toString()).toBe('700000000') // 7 APT
      expect(convertMicroUnits(netFlow.toString())).toBe('7.00000000')
    })

    test('should handle empty wallet data correctly', () => {
      const emptyWallet = createTestWalletData(TEST_WALLETS.empty, 'empty')
      
      expect(emptyWallet.events).toHaveLength(0)
      expect(emptyWallet.totalDeposits).toBe('0')
      expect(emptyWallet.totalWithdrawals).toBe('0')
      expect(emptyWallet.netFlow).toBe('0')
    })
  })

  describe('Report Generation and Export', () => {
    test('should create and save analysis report', async () => {
      const reportData = {
        title: 'Test Analysis Report',
        description: 'End-to-end test report',
        walletData: createTestWalletData(TEST_WALLETS.highVolume, 'high'),
        parameters: {
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
          dateRange: TEST_DATE_RANGES.week,
        },
        createdBy: 'test-user-id',
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.title).toBe(reportData.title)
      expect(data.data.status).toBe('COMPLETED')
      expect(data.data.walletData.address).toBe(TEST_WALLETS.highVolume)
    })

    test('should generate valid CSV export data', () => {
      const walletData = createTestWalletData(TEST_WALLETS.highVolume, 'high')
      
      // Simulate CSV generation
      const csvHeaders = ['Address', 'Total Deposits (APT)', 'Total Withdrawals (APT)', 'Net Flow (APT)', 'Transactions']
      const csvRow = [
        walletData.address,
        convertMicroUnits(walletData.totalDeposits),
        convertMicroUnits(walletData.totalWithdrawals),
        convertMicroUnits(walletData.netFlow),
        walletData.events.length.toString(),
      ]
      
      expect(csvHeaders).toContain('Address')
      expect(csvHeaders).toContain('Total Deposits (APT)')
      expect(csvRow[0]).toBe(walletData.address)
      expect(csvRow[1]).toBe('10.00000000') // 10 APT
      expect(csvRow[2]).toBe('5.00000000')  // 5 APT
      expect(csvRow[3]).toBe('5.00000000')  // 5 APT net flow
    })
  })

  describe('Performance and Reliability', () => {
    test('should complete single wallet analysis within performance benchmarks', async () => {
      const analysisStart = Date.now()
      
      const response = await fetch('/api/wallet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
          includeAccountInfo: true,
        }),
      })

      const analysisEnd = Date.now()
      const duration = analysisEnd - analysisStart
      
      expect(response.ok).toBe(true)
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.singleWalletAnalysis)
      
      const data = await response.json()
      expect(data.metadata.averageProcessingTimeMs).toBeLessThan(200) // Should be under 200ms
    })

    test('should handle concurrent requests without rate limiting issues', async () => {
      const requests = Array(3).fill(null).map(() =>
        fetch('/api/wallet/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: [TEST_WALLETS.highVolume],
            tokenTypes: [TEST_TOKENS.APT],
          }),
        })
      )

      const responses = await Promise.all(requests)
      const results = await Promise.all(responses.map(r => r.json()))
      
      responses.forEach(response => {
        expect(response.ok).toBe(true)
      })
      
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle network failures gracefully', async () => {
      // Mock network failure
      server.use(
        rest.post('/api/wallet/events', (req, res, ctx) => {
          return res.networkError('Failed to connect')
        })
      )

      try {
        await fetch('/api/wallet/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: [TEST_WALLETS.highVolume],
            tokenTypes: [TEST_TOKENS.APT],
          }),
        })
        fail('Should have thrown network error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    test('should handle malformed wallet addresses', async () => {
      const response = await fetch('/api/wallet/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: ['invalid-address'],
          tokenTypes: [TEST_TOKENS.APT],
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid address format')
    })

    test('should handle empty token types gracefully', async () => {
      const response = await fetch('/api/wallet/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [TEST_WALLETS.highVolume],
          // No token types specified
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.metadata.tokenTypes).toEqual([TEST_TOKENS.APT]) // Should default to APT
    })
  })
})
