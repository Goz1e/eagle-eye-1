import { walletAnalyzer, TimeRange } from './aggregator';

// ============================================================================
// EXAMPLE USAGE OF WALLET ANALYZER
// ============================================================================

export async function exampleWalletAnalysis() {
  // Create sample data for demonstration
  const sampleWallets = [
    {
      walletAddress: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      gasMetrics: { gasEfficiency: 0.8, costSavingsVsEthereum: 25.50, totalGasUsed: 15000, averageGasPerTx: 1500, totalGasCost: 0.0015 },
      tradingStats: { totalTrades: 25, averageTradeSize: 100, largestTrade: 500, smallestTrade: 10, tradeFrequency: 2.5, volumeDistribution: { "2024-01-01": 100, "2024-01-02": 150 } }
    },
    {
      walletAddress: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      gasMetrics: { gasEfficiency: 0.6, costSavingsVsEthereum: 35.75, totalGasUsed: 12000, averageGasPerTx: 1200, totalGasCost: 0.0012 },
      tradingStats: { totalTrades: 18, averageTradeSize: 75, largestTrade: 300, smallestTrade: 5, tradeFrequency: 1.8, volumeDistribution: { "2024-01-01": 75, "2024-01-02": 120 } }
    }
  ];  console.log('=== Wallet Analysis Examples ===\n');

  // Example 1: Analyze single wallet activity
  console.log('1. Analyzing single wallet activity...');
  
  const singleWalletResult = await walletAnalyzer.analyzeWalletActivity(
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '0x1::aptos_coin::AptosCoin',
    {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    }
  );

  console.log('Single wallet analysis result:');
  console.log(`- Wallet: ${singleWalletResult.walletAddress}`);
  console.log(`- Token: ${singleWalletResult.tokenType}`);
  console.log(`- Net Flow: ${singleWalletResult.netFlow} APT`);
  console.log(`- Total Volume: ${singleWalletResult.totalVolume} APT`);
  console.log(`- Total Volume USD: $${singleWalletResult.totalVolumeUSD.toFixed(2)}`);
  console.log(`- Transaction Count: ${singleWalletResult.transactionCount}`);
  console.log(`- Rebate Amount: ${singleWalletResult.rebateAmount} APT`);
  console.log(`- Gas Efficiency: ${singleWalletResult.gasMetrics.gasEfficiency.toFixed(2)}`);
  console.log(`- Cost Savings vs Ethereum: $${singleWalletResult.gasMetrics.costSavingsVsEthereum.toFixed(2)}`);
  console.log(`- Trading Frequency: ${singleWalletResult.tradingStats.tradeFrequency.toFixed(2)} trades/day`);
  console.log('');

  // Example 2: Analyze multiple wallets
  console.log('2. Analyzing multiple wallets...');
  
  const multipleWalletsResult = await walletAnalyzer.analyzeMultipleWallets(
    [
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    ],
    [
      '0x1::aptos_coin::AptosCoin',
      '0x1::coin::Coin<0x1::usd_coin::USDCoin>',
      '0x1::coin::Coin<0x1::tether::Tether>',
    ],
    {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    }
  );

  console.log('Multiple wallets analysis summary:');
  console.log(`- Total Wallets: ${multipleWalletsResult.summary.totalWallets}`);
  console.log(`- Total Volume: ${multipleWalletsResult.summary.totalVolume} tokens`);
  console.log(`- Total Volume USD: $${multipleWalletsResult.summary.totalVolumeUSD.toFixed(2)}`);
  console.log(`- Total Transactions: ${multipleWalletsResult.summary.totalTransactions}`);
  console.log(`- Total Gas Used: ${multipleWalletsResult.summary.totalGasUsed}`);
  console.log(`- Total Rebates: ${multipleWalletsResult.summary.totalRebates} tokens`);
  console.log(`- Average Net Flow: ${multipleWalletsResult.summary.averageNetFlow.toFixed(2)} tokens`);
  console.log(`- Processing Time: ${multipleWalletsResult.metadata.processingTime}ms`);
  console.log(`- Cache Hit Rate: ${multipleWalletsResult.metadata.cacheHitRate.toFixed(2)}%`);
  console.log('');

  // Example 3: Cache management
  console.log('3. Cache management examples...');
  
  // Invalidate cache for a specific wallet
  await walletAnalyzer.invalidateWalletCache(
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  );
  console.log('Cache invalidated for wallet');

  // Warm cache for frequently accessed wallets
  await walletAnalyzer.warmWalletCache(
    [
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    ],
    [
      '0x1::aptos_coin::AptosCoin',
      '0x1::coin::Coin<0x1::usd_coin::USDCoin>',
    ]
  );
  console.log('Cache warming initiated');

  // Example 4: Performance monitoring
  console.log('4. Performance monitoring...');
  
  const performanceMetrics = await walletAnalyzer.getPerformanceMetrics();
  console.log('Performance metrics:');
  console.log(`- Cache Hit Rate: ${performanceMetrics.cacheStats.hitRate.toFixed(2)}%`);
  console.log(`- Cache Keys: ${performanceMetrics.cacheStats.keys}`);
  console.log(`- Batch Processor Jobs: ${performanceMetrics.batchProcessorMetrics.total}`);
  console.log(`- Active Jobs: ${performanceMetrics.batchProcessorMetrics.successful}`);
  console.log(`- Wallet Analysis Cache Entries: ${performanceMetrics.walletAnalysisCount}`);
  console.log('');

  // Example 5: Detailed metrics breakdown
  console.log('5. Detailed metrics breakdown for first wallet...');
  
  const firstWallet = sampleWallets[0];
  if (firstWallet) {
    console.log('Gas Metrics:');
    console.log(`  - Total Gas Used: ${firstWallet.gasMetrics.totalGasUsed}`);
    console.log(`  - Average Gas Per Tx: ${firstWallet.gasMetrics.averageGasPerTx.toFixed(2)}`);
    console.log(`  - Total Gas Cost: ${firstWallet.gasMetrics.totalGasCost.toFixed(6)} APT`);
    console.log(`  - Gas Efficiency: ${firstWallet.gasMetrics.gasEfficiency.toFixed(2)}`);
    console.log(`  - Cost Savings vs Ethereum: $${firstWallet.gasMetrics.costSavingsVsEthereum.toFixed(2)}`);
    
    console.log('Trading Stats:');
    console.log(`  - Total Trades: ${firstWallet.tradingStats.totalTrades}`);
    console.log(`  - Average Trade Size: ${firstWallet.tradingStats.averageTradeSize.toFixed(2)}`);
    console.log(`  - Largest Trade: ${firstWallet.tradingStats.largestTrade.toFixed(2)}`);
    console.log(`  - Smallest Trade: ${firstWallet.tradingStats.smallestTrade.toFixed(2)}`);
    console.log(`  - Trade Frequency: ${firstWallet.tradingStats.tradeFrequency.toFixed(2)} trades/day`);
    
    console.log('Volume Distribution (first 5 days):');
    const volumeEntries = Object.entries(firstWallet.tradingStats.volumeDistribution)
      .slice(0, 5)
      .sort(([a], [b]) => a.localeCompare(b));
    
    volumeEntries.forEach(([date, volume]) => {
      console.log(`  - ${date}: ${volume.toFixed(2)} tokens`);
    });
  }

  console.log('\n=== Examples completed ===');
}

// ============================================================================
// EXAMPLE SCENARIOS
// ============================================================================

export async function exampleScenarios() {
  console.log('=== Example Scenarios ===\n');

  // Scenario 1: High-volume trader analysis
  console.log('Scenario 1: High-volume trader analysis');
  
  const highVolumeTrader = await walletAnalyzer.analyzeWalletActivity(
    '0x1111111111111111111111111111111111111111111111111111111111111111',
    '0x1::aptos_coin::AptosCoin',
    {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    }
  );

  if (highVolumeTrader.totalVolume > 1000) {
    console.log('High-volume trader detected!');
    console.log(`- Volume: ${highVolumeTrader.totalVolume} APT`);
    console.log(`- Rebate: ${highVolumeTrader.rebateAmount} APT`);
    console.log(`- Trading frequency: ${highVolumeTrader.tradingStats.tradeFrequency.toFixed(2)} trades/day`);
  }

  // Create sample data for demonstration
  const sampleWallets = [
    {
      walletAddress: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      gasMetrics: { gasEfficiency: 0.8, costSavingsVsEthereum: 25.50 }
    },
    {
      walletAddress: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      gasMetrics: { gasEfficiency: 0.6, costSavingsVsEthereum: 35.75 }
    }
  ];  
  const gasEfficientWallets = sampleWallets.filter(
    wallet => wallet.gasMetrics.gasEfficiency < 1.0
  );

  console.log(`Found ${gasEfficientWallets.length} gas-efficient wallets`);
  gasEfficientWallets.forEach((wallet, index) => {
    console.log(`  ${index + 1}. ${wallet.walletAddress.slice(0, 8)}...`);
    console.log(`     Gas efficiency: ${wallet.gasMetrics.gasEfficiency.toFixed(2)}`);
    console.log(`     Cost savings: $${wallet.gasMetrics.costSavingsVsEthereum.toFixed(2)}`);
  });

  // Scenario 3: Portfolio diversification analysis
  console.log('\nScenario 3: Portfolio diversification analysis');
  
  const walletTokenCounts = new Map<string, number>();
  sampleWallets.forEach(wallet => {
    const count = walletTokenCounts.get(wallet.walletAddress) || 0;
    walletTokenCounts.set(wallet.walletAddress, count + 1);
  });

  const diversifiedWallets = Array.from(walletTokenCounts.entries())
    .filter(([addr, count]) => count > 1)
    .sort(([_, countA], [__, countB]) => countB - countA);

  console.log(`Found ${diversifiedWallets.length} diversified wallets:`);
  diversifiedWallets.slice(0, 5).forEach(([addr, count]) => {
    console.log(`  - ${addr.slice(0, 8)}...: ${count} token types`);
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createTimeRange(days: number): TimeRange {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  // Run examples if this file is executed directly
  exampleWalletAnalysis()
    .then(() => {
      console.log('All examples completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Examples failed:', error);
      process.exit(1);
    });
}
