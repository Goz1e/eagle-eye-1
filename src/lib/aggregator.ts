import { createAptosClient } from './aptos-client';

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface CoinEvent {
  type: 'deposit' | 'withdraw';
  amount: string;
  tokenType: string;
  timestamp: Date;
  transactionHash: string;
  sender: string;
  recipient: string;
  metadata?: Record<string, unknown>;
}

export interface AptosTransaction {
  version: string;
  hash: string;
  timestamp: Date;
  sender: string;
  receiver?: string;
  amount?: string;
  tokenType?: string;
  status: 'success' | 'failure';
  gasUsed: string;
  gasPrice: string;
  function: string;
  events: unknown[];
}

export interface WalletActivity {
  walletAddress: string;
  tokenType: string;
  dateRange: TimeRange;
  deposits: CoinEvent[];
  withdrawals: CoinEvent[];
  transactions: AptosTransaction[];
  netFlow: number;
  totalVolume: number;
  totalVolumeUSD: number;
  transactionCount: number;
  gasMetrics: GasMetrics;
  tradingStats: TradingStats;
  rebateAmount: number;
  lastUpdated: Date;
}

export interface GasMetrics {
  totalGasUsed: number;
  averageGasPerTx: number;
  totalGasCost: number;
  gasEfficiency: number;
  costSavingsVsEthereum: number;
}

export interface TradingStats {
  totalTrades: number;
  averageTradeSize: number;
  largestTrade: number;
  smallestTrade: number;
  tradeFrequency: number;
  volumeDistribution: Record<string, number>;
}

export interface AggregationResult {
  wallets: WalletActivity[];
  summary: {
    totalWallets: number;
    totalVolume: number;
    totalVolumeUSD: number;
    totalTransactions: number;
    totalGasUsed: number;
    totalRebates: number;
    averageNetFlow: number;
  };
  metadata: {
    processingTime: number;
    cacheHitRate: number;
    lastUpdated: Date;
  };
}

export class WalletAnalyzer {
  private aptosClient = createAptosClient();

  constructor() {
    console.log('WalletAnalyzer initialized with simple batch processor');
  }

  // ============================================================================
  // MAIN ANALYSIS METHODS
  // ============================================================================

  async analyzeMultipleWallets(
    addresses: string[],
    tokenTypes: string[],
    dateRange: TimeRange
  ): Promise<WalletActivity[]> {
    try {
      const results = await Promise.all(
        addresses.map(async address => {
          try {
            // Get account info
            const accountInfo = await this.aptosClient.getAccountInfo(address);
            if (!accountInfo) {
              throw new Error(`Account not found: ${address}`);
            }

            // Get coin balance
            const coinBalance = await this.aptosClient.getAptosCoinBalance(address);

            // Get recent transactions
            const transactions = await this.aptosClient.getAccountTransactions(address, 100);

            // Calculate basic metrics
            const totalTransactions = transactions.length;

            // Create basic wallet activity
            const walletActivity: WalletActivity = {
              walletAddress: address,
              tokenType: tokenTypes[0] || '0x1::aptos_coin::AptosCoin',
              dateRange,
              deposits: [],
              withdrawals: [],
              transactions: [],
              netFlow: 0,
              totalVolume: parseFloat(coinBalance),
              totalVolumeUSD: parseFloat(coinBalance) * 10, // Mock USD conversion
              transactionCount: totalTransactions,
              gasMetrics: {
                totalGasUsed: 0,
                averageGasPerTx: 0,
                totalGasCost: 0,
                gasEfficiency: 0,
                costSavingsVsEthereum: 0,
              },
              tradingStats: {
                totalTrades: 0,
                averageTradeSize: 0,
                largestTrade: 0,
                smallestTrade: 0,
                tradeFrequency: 0,
                volumeDistribution: {},
              },
              rebateAmount: 0,
              lastUpdated: new Date(),
            };

            return walletActivity;
          } catch (error) {
            console.error(`Failed to analyze wallet ${address}:`, error);
            // Return a basic error result
            return {
              walletAddress: address,
              tokenType: tokenTypes[0] || '0x1::aptos_coin::AptosCoin',
              dateRange,
              deposits: [],
              withdrawals: [],
              transactions: [],
              netFlow: 0,
              totalVolume: 0,
              totalVolumeUSD: 0,
              transactionCount: 0,
              gasMetrics: {
                totalGasUsed: 0,
                averageGasPerTx: 0,
                totalGasCost: 0,
                gasEfficiency: 0,
                costSavingsVsEthereum: 0,
              },
              tradingStats: {
                totalTrades: 0,
                averageTradeSize: 0,
                largestTrade: 0,
                smallestTrade: 0,
                tradeFrequency: 0,
                volumeDistribution: {},
              },
              rebateAmount: 0,
              lastUpdated: new Date(),
            };
          }
        })
      );

      return results;
    } catch (error) {
      console.error('Failed to analyze multiple wallets:', error);
      throw error;
    }
  }
}

export const walletAnalyzer = new WalletAnalyzer();
