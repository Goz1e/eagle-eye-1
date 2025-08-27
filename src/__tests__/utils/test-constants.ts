// Test wallet addresses with known transaction history on Aptos mainnet
export const TEST_WALLETS = {
  highVolume: '0xd665491175132e66210164f5c0aef6aa432191ac7f3fcc1ab1deebe6d76351ec',
  mediumVolume: '0x1d8727df513fa2a8785d0834e40b34223daff1affc079574082baadb74b66ee4',
  lowVolume: '0x2c7c363ded4b3b4e1f954494d2bc3955e4965c9363f770d7547a6f78b5c7c0c1',
  empty: '0x3d8727df513fa2a8785d0834e40b34223daff1affc079574082baadb74b66ee4',
  // Add more test wallets as needed
}

// Test token types for analysis
export const TEST_TOKENS = {
  APT: '0x1::aptos_coin::AptosCoin',
  USDT: '0x1::coin::Coin<0x1::usdt::USDT>',
  USDC: '0x1::coin::Coin<0x1::usdc::USDC>',
  // Add more token types as needed
}

// Test date ranges for analysis
export const TEST_DATE_RANGES = {
  week: { days: 7 },
  month: { days: 30 },
  quarter: { days: 90 },
  year: { days: 365 },
}

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  singleWalletAnalysis: 5000, // 5 seconds
  batchProcessing: 30000, // 30 seconds for 5 wallets
  uiResponsiveness: 500, // 500ms for interactions
  cacheHitRate: 0.6, // 60% cache hit rate
  maxMemoryUsage: 500 * 1024 * 1024, // 500MB
}

// API response validation constants
export const API_VALIDATION = {
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  rateLimitDelay: 1000, // 1 second between requests
}

// Test data for reports
export const TEST_REPORT_DATA = {
  title: 'Test Wallet Analysis Report',
  description: 'End-to-end test report for validation',
  parameters: {
    addresses: [TEST_WALLETS.highVolume],
    tokenTypes: [TEST_TOKENS.APT],
    dateRange: TEST_DATE_RANGES.week,
  },
}

// Mock user data for testing
export const TEST_USERS = {
  admin: {
    id: 'test-admin-id',
    email: 'admin@eagle-eye.com',
    role: 'ADMIN',
  },
  analyst: {
    id: 'test-analyst-id',
    email: 'analyst@eagle-eye.com',
    role: 'ANALYST',
  },
  viewer: {
    id: 'test-viewer-id',
    email: 'viewer@eagle-eye.com',
    role: 'VIEWER',
  },
}

// Helper function to create test wallet data
export const createTestWalletData = (address: string, activity: 'high' | 'medium' | 'low' | 'empty') => {
  const baseData = {
    address,
    events: [],
    totalDeposits: '0',
    totalWithdrawals: '0',
    netFlow: '0',
    accountInfo: {
      sequenceNumber: '0',
      coinResources: [],
      tokenResources: [],
    },
  }

  switch (activity) {
    case 'high':
      return {
        ...baseData,
        events: [
          { type: 'deposit', amount: '1000000000', tokenType: TEST_TOKENS.APT, timestamp: new Date().toISOString(), version: '123456789' },
          { type: 'withdrawal', amount: '500000000', tokenType: TEST_TOKENS.APT, timestamp: new Date().toISOString(), version: '123456788' },
        ],
        totalDeposits: '1000000000',
        totalWithdrawals: '500000000',
        netFlow: '500000000',
      }
    case 'medium':
      return {
        ...baseData,
        events: [
          { type: 'deposit', amount: '500000000', tokenType: TEST_TOKENS.APT, timestamp: new Date().toISOString(), version: '123456787' },
        ],
        totalDeposits: '500000000',
        totalWithdrawals: '0',
        netFlow: '500000000',
      }
    case 'low':
      return {
        ...baseData,
        events: [
          { type: 'deposit', amount: '100000000', tokenType: TEST_TOKENS.APT, timestamp: new Date().toISOString(), version: '123456786' },
        ],
        totalDeposits: '100000000',
        totalWithdrawals: '0',
        netFlow: '100000000',
      }
    case 'empty':
    default:
      return baseData
  }
}

// Helper function to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to mock API responses
export const mockApiResponse = (data: any, success = true, status = 200) => {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve({ success, data }),
  })
}

// Helper function to validate wallet address format
export const isValidAptosAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(address)
}

// Helper function to convert microunits to APT
export const convertMicroUnits = (amount: string, decimals = 8): string => {
  const num = BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const whole = num / divisor
  const fraction = num % divisor
  
  if (fraction === BigInt(0)) {
    return whole.toString()
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0')
  return `${whole}.${fractionStr}`
}
