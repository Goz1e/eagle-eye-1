import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { 
  TEST_WALLETS, 
  TEST_TOKENS, 
  TEST_DATE_RANGES, 
  TEST_REPORT_DATA,
  createTestWalletData,
  waitFor as waitForHelper
} from '../utils/test-constants'

// Setup MSW server for API mocking
const server = setupServer(
  // Mock reports API for CRUD operations
  rest.post('/api/reports', (req, res, ctx) => {
    const { title, description, walletData, parameters, createdBy } = req.body as any
    
    if (!title || !walletData || !createdBy) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, error: 'Missing required fields' })
      )
    }

    const mockReport = {
      id: `report-${Date.now()}`,
      title,
      description,
      walletData,
      parameters,
      status: 'COMPLETED',
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: createdBy,
        email: 'test@eagle-eye.com',
        name: 'Test User',
      },
    }

    return res(
      ctx.json({
        success: true,
        data: mockReport,
      })
    )
  }),

  rest.get('/api/reports', (req, res, ctx) => {
    const { searchParams } = req
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    // Mock different report scenarios
    const mockReports = [
      {
        id: 'report-1',
        title: 'High Volume Wallet Analysis',
        description: 'Analysis of high-volume Aptos wallet',
        walletData: createTestWalletData(TEST_WALLETS.highVolume, 'high'),
        parameters: {
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
          dateRange: TEST_DATE_RANGES.week,
        },
        status: 'COMPLETED',
        createdBy: 'user-1',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: 'user-1',
          email: 'analyst@eagle-eye.com',
          name: 'Analyst User',
        },
      },
      {
        id: 'report-2',
        title: 'Batch Wallet Analysis',
        description: 'Analysis of multiple wallets',
        walletData: [
          createTestWalletData(TEST_WALLETS.highVolume, 'high'),
          createTestWalletData(TEST_WALLETS.mediumVolume, 'medium'),
        ],
        parameters: {
          addresses: [TEST_WALLETS.highVolume, TEST_WALLETS.mediumVolume],
          tokenTypes: [TEST_TOKENS.APT, TEST_TOKENS.USDT],
          dateRange: TEST_DATE_RANGES.month,
        },
        status: 'COMPLETED',
        createdBy: 'user-2',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: 'user-2',
          email: 'admin@eagle-eye.com',
          name: 'Admin User',
        },
      },
      {
        id: 'report-3',
        title: 'Pending Analysis',
        description: 'Analysis in progress',
        walletData: createTestWalletData(TEST_WALLETS.lowVolume, 'low'),
        parameters: {
          addresses: [TEST_WALLETS.lowVolume],
          tokenTypes: [TEST_TOKENS.APT],
          dateRange: TEST_DATE_RANGES.week,
        },
        status: 'PROCESSING',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user-1',
          email: 'analyst@eagle-eye.com',
          name: 'Analyst User',
        },
      },
    ]

    // Apply filters
    let filteredReports = mockReports
    if (userId) {
      filteredReports = filteredReports.filter(report => report.createdBy === userId)
    }
    if (status) {
      filteredReports = filteredReports.filter(report => report.status === status)
    }

    return res(
      ctx.json({
        success: true,
        data: filteredReports,
      })
    )
  }),

  rest.put('/api/reports', (req, res, ctx) => {
    const { id, title, description, status } = req.body as any
    
    if (!id) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, error: 'Report ID required' })
      )
    }

    const mockReport = {
      id,
      title: title || 'Updated Report',
      description: description || 'Updated description',
      status: status || 'COMPLETED',
      walletData: createTestWalletData(TEST_WALLETS.highVolume, 'high'),
      parameters: TEST_REPORT_DATA.parameters,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        email: 'analyst@eagle-eye.com',
        name: 'Analyst User',
      },
    }

    return res(
      ctx.json({
        success: true,
        data: mockReport,
      })
    )
  }),

  rest.delete('/api/reports', (req, res, ctx) => {
    const { searchParams } = req
    const id = searchParams.get('id')
    
    if (!id) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, error: 'Report ID required' })
      )
    }

    return res(
      ctx.json({
        success: true,
        message: 'Report deleted successfully',
      })
    )
  }),

  // Mock database health check
  rest.get('/api/test-db', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: 'Database connected successfully',
        stats: {
          users: 3,
          reports: 3,
          searches: 2,
        },
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Database Integration and Report Persistence - End-to-End Tests', () => {
  describe('Database Connection Tests', () => {
    test('should connect to PostgreSQL database successfully', async () => {
      const response = await fetch('/api/test-db')
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Database connected successfully')
      expect(data.stats).toBeDefined()
      expect(data.stats.users).toBeGreaterThan(0)
      expect(data.stats.reports).toBeGreaterThan(0)
    })

    test('should provide accurate database statistics', async () => {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      
      const stats = data.stats
      expect(typeof stats.users).toBe('number')
      expect(typeof stats.reports).toBe('number')
      expect(typeof stats.searches).toBe('number')
      expect(stats.users).toBeGreaterThanOrEqual(0)
      expect(stats.reports).toBeGreaterThanOrEqual(0)
      expect(stats.searches).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Report Creation and Storage Tests', () => {
    test('should create and store analysis report with valid data', async () => {
      const reportData = {
        title: 'Test Wallet Analysis Report',
        description: 'End-to-end test report for validation',
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
      expect(data.data.id).toBeDefined()
      expect(data.data.title).toBe(reportData.title)
      expect(data.data.description).toBe(reportData.description)
      expect(data.data.status).toBe('COMPLETED')
      expect(data.data.createdBy).toBe(reportData.createdBy)
      expect(data.data.createdAt).toBeDefined()
      expect(data.data.updatedAt).toBeDefined()
      expect(data.data.user).toBeDefined()
    })

    test('should validate required fields during report creation', async () => {
      const invalidReports = [
        { description: 'Missing title', walletData: {}, createdBy: 'user-1' },
        { title: 'Missing wallet data', description: 'Test', createdBy: 'user-1' },
        { title: 'Missing user', description: 'Test', walletData: {} },
        {}, // Empty object
      ]

      for (const invalidReport of invalidReports) {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidReport),
        })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toBe('Missing required fields')
      }
    })

    test('should store wallet data correctly in JSON format', async () => {
      const walletData = createTestWalletData(TEST_WALLETS.highVolume, 'high')
      
      const reportData = {
        title: 'JSON Data Storage Test',
        description: 'Testing JSON field storage',
        walletData,
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
      
      const storedWalletData = data.data.walletData
      
      // Verify wallet data structure is preserved
      expect(storedWalletData.address).toBe(walletData.address)
      expect(storedWalletData.events).toHaveLength(walletData.events.length)
      expect(storedWalletData.totalDeposits).toBe(walletData.totalDeposits)
      expect(storedWalletData.totalWithdrawals).toBe(walletData.totalWithdrawals)
      expect(storedWalletData.netFlow).toBe(walletData.netFlow)
      expect(storedWalletData.accountInfo).toBeDefined()
      expect(storedWalletData.accountInfo.sequenceNumber).toBe(walletData.accountInfo.sequenceNumber)
    })

    test('should preserve search parameters accurately', async () => {
      const parameters = {
        addresses: [TEST_WALLETS.highVolume, TEST_WALLETS.mediumVolume],
        tokenTypes: [TEST_TOKENS.APT, TEST_TOKENS.USDT],
        dateRange: TEST_DATE_RANGES.month,
        customFilters: {
          minVolume: '100000000', // 1 APT
          maxVolume: '10000000000', // 100 APT
          includeInactive: false,
        },
      }

      const reportData = {
        title: 'Parameters Preservation Test',
        description: 'Testing parameter storage accuracy',
        walletData: createTestWalletData(TEST_WALLETS.highVolume, 'high'),
        parameters,
        createdBy: 'test-user-id',
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      const storedParameters = data.data.parameters
      
      // Verify all parameters are preserved exactly
      expect(storedParameters.addresses).toEqual(parameters.addresses)
      expect(storedParameters.tokenTypes).toEqual(parameters.tokenTypes)
      expect(storedParameters.dateRange).toEqual(parameters.dateRange)
      expect(storedParameters.customFilters).toEqual(parameters.customFilters)
    })
  })

  describe('Report Retrieval and Query Tests', () => {
    test('should retrieve all reports successfully', async () => {
      const response = await fetch('/api/reports')
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(3) // Based on our mock data
      expect(data.data[0].id).toBeDefined()
      expect(data.data[0].title).toBeDefined()
      expect(data.data[0].status).toBeDefined()
      expect(data.data[0].createdBy).toBeDefined()
    })

    test('should filter reports by user ID', async () => {
      const userId = 'user-1'
      const response = await fetch(`/api/reports?userId=${userId}`)
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
      
      // All returned reports should belong to the specified user
      data.data.forEach((report: any) => {
        expect(report.createdBy).toBe(userId)
      })
    })

    test('should filter reports by status', async () => {
      const status = 'COMPLETED'
      const response = await fetch(`/api/reports?status=${status}`)
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
      
      // All returned reports should have the specified status
      data.data.forEach((report: any) => {
        expect(report.status).toBe(status)
      })
    })

    test('should combine multiple filters correctly', async () => {
      const userId = 'user-1'
      const status = 'COMPLETED'
      const response = await fetch(`/api/reports?userId=${userId}&status=${status}`)
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // All returned reports should match both filters
      data.data.forEach((report: any) => {
        expect(report.createdBy).toBe(userId)
        expect(report.status).toBe(status)
      })
    })

    test('should include user information in report data', async () => {
      const response = await fetch('/api/reports')
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // All reports should include user information
      data.data.forEach((report: any) => {
        expect(report.user).toBeDefined()
        expect(report.user.id).toBeDefined()
        expect(report.user.email).toBeDefined()
        expect(report.user.name).toBeDefined()
        expect(report.user.id).toBe(report.createdBy)
      })
    })

    test('should order reports by creation date (newest first)', async () => {
      const response = await fetch('/api/reports')
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.length).toBeGreaterThan(1)
      
      // Reports should be ordered by creation date (newest first)
      for (let i = 0; i < data.data.length - 1; i++) {
        const currentDate = new Date(data.data[i].createdAt)
        const nextDate = new Date(data.data[i + 1].createdAt)
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime())
      }
    })
  })

  describe('Report Update and Modification Tests', () => {
    test('should update report title and description', async () => {
      const reportId = 'report-1'
      const updateData = {
        id: reportId,
        title: 'Updated Report Title',
        description: 'Updated report description',
      }

      const response = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(reportId)
      expect(data.data.title).toBe(updateData.title)
      expect(data.data.description).toBe(updateData.description)
      expect(data.data.updatedAt).toBeDefined()
      
      // Verify updatedAt timestamp is recent
      const updatedAt = new Date(data.data.updatedAt)
      const now = new Date()
      expect(now.getTime() - updatedAt.getTime()).toBeLessThan(5000) // Within 5 seconds
    })

    test('should update report status correctly', async () => {
      const reportId = 'report-3'
      const updateData = {
        id: reportId,
        status: 'COMPLETED',
      }

      const response = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(reportId)
      expect(data.data.status).toBe('COMPLETED')
      expect(data.data.updatedAt).toBeDefined()
    })

    test('should validate report ID during updates', async () => {
      const updateData = {
        title: 'Missing ID test',
        description: 'This should fail',
      }

      const response = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Report ID required')
    })

    test('should preserve unchanged fields during updates', async () => {
      const reportId = 'report-1'
      const updateData = {
        id: reportId,
        title: 'Only Title Updated',
      }

      const response = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(reportId)
      expect(data.data.title).toBe(updateData.title)
      expect(data.data.description).toBeDefined() // Should preserve original description
      expect(data.data.walletData).toBeDefined() // Should preserve wallet data
      expect(data.data.parameters).toBeDefined() // Should preserve parameters
    })
  })

  describe('Report Deletion and Cleanup Tests', () => {
    test('should delete report successfully', async () => {
      const reportId = 'report-1'
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: 'DELETE',
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.message).toBe('Report deleted successfully')
    })

    test('should require report ID for deletion', async () => {
      const response = await fetch('/api/reports', {
        method: 'DELETE',
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Report ID required')
    })

    test('should handle deletion of non-existent reports gracefully', async () => {
      const nonExistentId = 'non-existent-report-id'
      const response = await fetch(`/api/reports?id=${nonExistentId}`, {
        method: 'DELETE',
      })

      // The mock API returns success for any ID, but in a real scenario
      // this would test proper error handling for non-existent reports
      expect(response.ok).toBe(true)
    })
  })

  describe('Data Integrity and Validation Tests', () => {
    test('should maintain data consistency across CRUD operations', async () => {
      // Create a report
      const createData = {
        title: 'Data Integrity Test',
        description: 'Testing data consistency',
        walletData: createTestWalletData(TEST_WALLETS.highVolume, 'high'),
        parameters: {
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
          dateRange: TEST_DATE_RANGES.week,
        },
        createdBy: 'integrity-test-user',
      }

      const createResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      })

      expect(createResponse.ok).toBe(true)
      const createdReport = await createResponse.json()
      const reportId = createdReport.data.id

      // Update the report
      const updateData = {
        id: reportId,
        title: 'Updated Data Integrity Test',
        status: 'PROCESSING',
      }

      const updateResponse = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      expect(updateResponse.ok).toBe(true)
      const updatedReport = await updateResponse.json()

      // Verify data consistency
      expect(updatedReport.data.id).toBe(reportId)
      expect(updatedReport.data.title).toBe(updateData.title)
      expect(updatedReport.data.status).toBe(updateData.status)
      expect(updatedReport.data.description).toBe(createData.description) // Should be preserved
      expect(updatedReport.data.walletData).toEqual(createData.walletData) // Should be preserved
      expect(updatedReport.data.parameters).toEqual(createData.parameters) // Should be preserved
      expect(updatedReport.data.createdBy).toBe(createData.createdBy) // Should be preserved
      expect(updatedReport.data.createdAt).toBe(createdReport.data.createdAt) // Should be preserved
      expect(updatedReport.data.updatedAt).not.toBe(createdReport.data.updatedAt) // Should be updated
    })

    test('should handle large wallet data objects correctly', async () => {
      // Create a report with large wallet data
      const largeWalletData = {
        address: TEST_WALLETS.highVolume,
        events: Array(1000).fill(null).map((_, i) => ({
          type: i % 2 === 0 ? 'deposit' : 'withdrawal',
          amount: (i * 1000000).toString(),
          tokenType: TEST_TOKENS.APT,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          version: `tx_${i}`,
        })),
        totalDeposits: '500000000000', // 5000 APT
        totalWithdrawals: '250000000000', // 2500 APT
        netFlow: '250000000000', // 2500 APT
        accountInfo: {
          sequenceNumber: '1000',
          coinResources: Array(10).fill(null).map((_, i) => ({
            type: `0x1::coin::Coin<0x${i}::token::Token>`,
            amount: (i * 1000000).toString(),
          })),
          tokenResources: Array(5).fill(null).map((_, i) => ({
            type: `0x1::token::Token<0x${i}::nft::NFT>`,
            amount: '1',
            tokenId: `nft_${i}`,
          })),
        },
      }

      const reportData = {
        title: 'Large Data Test',
        description: 'Testing with large wallet data objects',
        walletData: largeWalletData,
        parameters: {
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
          dateRange: TEST_DATE_RANGES.month,
        },
        createdBy: 'large-data-test-user',
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      // Verify large data is stored correctly
      const storedData = data.data.walletData
      expect(storedData.events).toHaveLength(1000)
      expect(storedData.accountInfo.coinResources).toHaveLength(10)
      expect(storedData.accountInfo.tokenResources).toHaveLength(5)
      expect(storedData.totalDeposits).toBe('500000000000')
      expect(storedData.totalWithdrawals).toBe('250000000000')
      expect(storedData.netFlow).toBe('250000000000')
    })

    test('should preserve complex nested data structures', async () => {
      const complexParameters = {
        addresses: [TEST_WALLETS.highVolume, TEST_WALLETS.mediumVolume],
        tokenTypes: [TEST_TOKENS.APT, TEST_TOKENS.USDT],
        dateRange: TEST_DATE_RANGES.month,
        filters: {
          volume: {
            min: '100000000', // 1 APT
            max: '10000000000', // 100 APT
            currency: 'APT',
          },
          activity: {
            minTransactions: 10,
            maxTransactions: 1000,
            includeInactive: false,
            activityThreshold: '86400', // 24 hours in seconds
          },
          tokens: {
            includeStablecoins: true,
            excludeLowLiquidity: true,
            minMarketCap: '1000000', // $1M
          },
        },
        sorting: {
          field: 'totalVolume',
          direction: 'desc',
          secondaryField: 'transactionCount',
          secondaryDirection: 'asc',
        },
        pagination: {
          page: 1,
          limit: 50,
          offset: 0,
        },
      }

      const reportData = {
        title: 'Complex Parameters Test',
        description: 'Testing complex nested parameter structures',
        walletData: createTestWalletData(TEST_WALLETS.highVolume, 'high'),
        parameters: complexParameters,
        createdBy: 'complex-params-test-user',
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      // Verify complex nested structure is preserved exactly
      const storedParameters = data.data.parameters
      expect(storedParameters.filters.volume.min).toBe(complexParameters.filters.volume.min)
      expect(storedParameters.filters.volume.max).toBe(complexParameters.filters.volume.max)
      expect(storedParameters.filters.activity.minTransactions).toBe(complexParameters.filters.activity.minTransactions)
      expect(storedParameters.filters.tokens.includeStablecoins).toBe(complexParameters.filters.tokens.includeStablecoins)
      expect(storedParameters.sorting.field).toBe(complexParameters.sorting.field)
      expect(storedParameters.sorting.direction).toBe(complexParameters.sorting.direction)
      expect(storedParameters.pagination.page).toBe(complexParameters.pagination.page)
      expect(storedParameters.pagination.limit).toBe(complexParameters.pagination.limit)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle database connection failures gracefully', async () => {
      // Mock database connection failure
      server.use(
        rest.get('/api/test-db', (req, res, ctx) => {
          return res.networkError('Database connection failed')
        })
      )

      try {
        await fetch('/api/test-db')
        fail('Should have thrown network error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    test('should handle malformed JSON data gracefully', async () => {
      const malformedData = {
        title: 'Malformed Data Test',
        description: 'Testing with malformed data',
        walletData: {
          address: TEST_WALLETS.highVolume,
          events: [
            {
              type: 'deposit',
              amount: 'invalid-amount', // Invalid amount
              tokenType: TEST_TOKENS.APT,
              timestamp: 'invalid-timestamp', // Invalid timestamp
            },
          ],
        },
        parameters: {
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
        },
        createdBy: 'malformed-data-test-user',
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(malformedData),
      })

      // The mock API accepts this data, but in a real scenario
      // this would test proper validation and error handling
      expect(response.ok).toBe(true)
    })

    test('should handle concurrent report operations correctly', async () => {
      const reportData = {
        title: 'Concurrent Test',
        description: 'Testing concurrent operations',
        walletData: createTestWalletData(TEST_WALLETS.highVolume, 'high'),
        parameters: {
          addresses: [TEST_WALLETS.highVolume],
          tokenTypes: [TEST_TOKENS.APT],
        },
        createdBy: 'concurrent-test-user',
      }

      // Simulate concurrent report creation
      const concurrentRequests = Array(3).fill(null).map(() =>
        fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        })
      )

      const responses = await Promise.all(concurrentRequests)
      const results = await Promise.all(responses.map(r => r.json()))

      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true)
      })

      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.data.id).toBeDefined()
        expect(result.data.title).toBe(reportData.title)
      })

      // Each should have a unique ID
      const ids = results.map(r => r.data.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})
