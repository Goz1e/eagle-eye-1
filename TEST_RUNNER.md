# 🧪 Eagle Eye End-to-End Test Suite

This document provides comprehensive guidance for running the end-to-end test suite that validates Eagle Eye's complete functionality with real Aptos blockchain data.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm installed
- PostgreSQL database running
- Aptos mainnet access
- All dependencies installed

### Install Dependencies
```bash
pnpm install
```

### Run All Tests
```bash
pnpm test
```

### Run End-to-End Tests Only
```bash
pnpm test:e2e
```

## 📋 Test Suite Overview

### 1. **Single Wallet Analysis Flow** (`wallet-analysis.test.ts`)
**Purpose**: Validates complete single wallet analysis workflow
**Coverage**:
- ✅ Wallet address validation
- ✅ API integration with real Aptos data
- ✅ Data processing and microunit conversion
- ✅ Report generation and export
- ✅ Performance benchmarks
- ✅ Error handling

**Key Tests**:
- Real blockchain data fetching
- Microunit to APT conversion accuracy
- CSV export functionality
- Performance under 5 seconds
- Concurrent request handling

### 2. **Batch Processing Integration** (`batch-processing.test.ts`)
**Purpose**: Validates multi-wallet batch analysis capabilities
**Coverage**:
- ✅ Batch processing with configurable sizes
- ✅ Priority-based processing
- ✅ Real-time progress tracking
- ✅ Performance scaling
- ✅ Data accuracy across batch sizes

**Key Tests**:
- Batch sizes: 1, 2, 5, 10 wallets
- Priority levels: low, normal, high
- Performance under 30 seconds for 5 wallets
- Data consistency between individual and batch analysis
- Error handling for failed wallet analysis

### 3. **Database Integration** (`report-persistence.test.ts`)
**Purpose**: Validates PostgreSQL integration and data persistence
**Coverage**:
- ✅ Database connection health
- ✅ Report CRUD operations
- ✅ JSON field storage accuracy
- ✅ Complex data structure preservation
- ✅ Concurrent operation handling

**Key Tests**:
- Report creation, reading, updating, deletion
- Large wallet data objects (1000+ events)
- Complex nested parameter structures
- Data integrity across operations
- Concurrent report operations

## 🎯 Test Data and Scenarios

### Test Wallet Addresses
```typescript
TEST_WALLETS = {
  highVolume: '0xd665491175132e66210164f5c0aef6aa432191ac7f3fcc1ab1deebe6d76351ec',
  mediumVolume: '0x1d8727df513fa2a8785d0834e40b34223daff1affc079574082baadb74b66ee4',
  lowVolume: '0x2c7c363ded4b3b4e1f954494d2bc3955e4965c9363f770d7547a6f78b5c7c0c1',
  empty: '0x3d8727df513fa2a8785d0834e40b34223daff1affc079574082baadb74b66ee4'
}
```

### Test Token Types
```typescript
TEST_TOKENS = {
  APT: '0x1::aptos_coin::AptosCoin',
  USDT: '0x1::coin::Coin<0x1::usdt::USDT>',
  USDC: '0x1::coin::Coin<0x1::usdc::USDC>'
}
```

### Performance Benchmarks
```typescript
PERFORMANCE_BENCHMARKS = {
  singleWalletAnalysis: 5000,    // 5 seconds
  batchProcessing: 30000,        // 30 seconds for 5 wallets
  uiResponsiveness: 500,         // 500ms for interactions
  cacheHitRate: 0.6,             // 60% cache hit rate
  maxMemoryUsage: 500 * 1024 * 1024  // 500MB
}
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom for DOM testing
- **Timeout**: 30 seconds for blockchain API calls
- **Workers**: 1 (sequential execution to avoid rate limiting)
- **Coverage**: Comprehensive coverage collection
- **Path Mapping**: `@/` maps to `src/`

### Test Setup (`jest.setup.js`)
- **MSW Integration**: Mock Service Worker for API mocking
- **Environment Variables**: Test environment configuration
- **Global Mocks**: Next.js router, fetch, observers
- **Console Suppression**: Clean test output

## 📊 Running Tests

### Basic Test Execution
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Specific Test Suites
```bash
# End-to-end tests only
pnpm test:e2e

# Unit tests only
pnpm test:unit

# Continuous integration mode
pnpm test:ci
```

### Individual Test Files
```bash
# Run specific test file
pnpm test wallet-analysis.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="should validate correct Aptos address format"
```

## 🧹 Test Environment Management

### Database Setup
```bash
# Ensure database is running
pnpm db:push

# Seed with test data
pnpm db:seed

# Check database health
curl http://localhost:3000/api/test-db
```

### Environment Variables
```bash
# Required for tests
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
NEXT_PUBLIC_DATABASE_URL=postgresql://test:test@localhost:5432/eagle_eye_test
```

## 📈 Test Results and Coverage

### Coverage Reports
After running tests with coverage:
```bash
pnpm test:coverage
```

Coverage reports are generated in:
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **Console**: Summary in terminal output

### Performance Metrics
Tests automatically validate:
- API response times
- Batch processing performance
- Memory usage patterns
- Cache efficiency
- UI responsiveness

## 🐛 Debugging Tests

### Verbose Output
```bash
# Run with verbose logging
pnpm test --verbose

# Run specific test with logging
pnpm test --testNamePattern="API Integration" --verbose
```

### Debug Mode
```bash
# Run tests in debug mode
NODE_OPTIONS="--inspect-brk" pnpm test
```

### Test Isolation
```bash
# Run single test in isolation
pnpm test --testNamePattern="should validate correct Aptos address format" --runInBand
```

## 🔄 Continuous Integration

### CI Pipeline Integration
```bash
# Run tests in CI mode
pnpm test:ci
```

This command:
- Runs tests without watch mode
- Generates coverage reports
- Exits with appropriate code for CI systems
- Optimized for automated environments

### GitHub Actions Example
```yaml
- name: Run End-to-End Tests
  run: |
    pnpm test:ci
    pnpm test:e2e
```

## 📝 Test Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts`
3. Import test utilities and constants
4. Use descriptive test names
5. Include performance assertions

### Updating Test Data
1. Modify `test-constants.ts`
2. Update mock data in test files
3. Ensure test wallets are still active
4. Validate performance benchmarks

### Test Data Validation
```bash
# Verify test wallet addresses are valid
curl "https://fullnode.mainnet.aptoslabs.com/v1/accounts/0xd665491175132e66210164f5c0aef6aa432191ac7f3fcc1ab1deebe6d76351ec/resources"
```

## 🎯 Success Criteria

### All Tests Must Pass
- ✅ **API Accuracy**: Real blockchain data validation
- ✅ **Performance**: Meet specified benchmarks
- ✅ **Data Integrity**: Accurate storage and retrieval
- ✅ **Error Handling**: Graceful failure management
- ✅ **Concurrency**: Handle multiple simultaneous requests

### Performance Requirements
- Single wallet analysis: < 5 seconds
- Batch processing (5 wallets): < 30 seconds
- UI responsiveness: < 500ms
- Memory usage: < 500MB
- Cache hit rate: > 60%

### Data Accuracy Requirements
- Microunit conversions: 100% accurate
- Transaction counts: Match blockchain records
- Gas calculations: Accurate network fee representation
- Price data: Current market rates
- Report persistence: Complete data preservation

## 🚨 Common Issues and Solutions

### Rate Limiting
**Issue**: Tests fail due to Aptos API rate limits
**Solution**: Tests use MSW mocking to avoid real API calls

### Database Connection
**Issue**: Tests fail to connect to PostgreSQL
**Solution**: Ensure database is running and accessible

### Memory Issues
**Issue**: Tests consume excessive memory
**Solution**: Tests run sequentially with cleanup between runs

### Timeout Issues
**Issue**: Tests timeout during blockchain operations
**Solution**: Tests use mocked responses for consistent timing

## 📚 Additional Resources

### Documentation
- [Jest Testing Framework](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Next.js Testing](https://nextjs.org/docs/testing)

### Support
- Check test output for specific error messages
- Review coverage reports for untested code
- Validate test data against current blockchain state
- Ensure all dependencies are properly installed

---

**🎯 Goal**: Comprehensive validation that Eagle Eye works reliably with real Aptos data and provides accurate insights for Canza Finance operations.
