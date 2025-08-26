/**
 * Eagle Eye application types
 * Core interfaces for the blockchain analytics platform
 */

/**
 * Time range interface
 * Defines the time period for data analysis
 */
export interface TimeRange {
  /** Start timestamp (ISO 8601 string) */
  start: string;
  /** End timestamp (ISO 8601 string) */
  end: string;
  /** Time zone for the range (IANA timezone identifier) */
  timezone?: string;
  /** Granularity for data aggregation */
  granularity?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Supported tokens interface
 * Defines which tokens are supported by the platform
 */
export interface SupportedTokens {
  /** Token type identifier */
  tokenType: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Whether token is actively supported */
  isActive: boolean;
  /** Token priority for display (higher = more important) */
  priority: number;
  /** Token category */
  category: 'native' | 'stablecoin' | 'defi' | 'nft' | 'other';
  /** Token logo URL */
  logoUrl?: string;
  /** Token website URL */
  websiteUrl?: string;
  /** Token description */
  description?: string;
  /** Date when token was added to platform */
  addedAt: string;
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Report request interface
 * Defines the parameters for generating wallet reports
 */
export interface ReportRequest {
  /** Unique request identifier */
  requestId: string;
  /** Wallet address to analyze */
  walletAddress: string;
  /** Time range for the report */
  timeRange: TimeRange;
  /** Types of tokens to include in the report */
  tokenTypes?: string[];
  /** Whether to include transaction details */
  includeTransactions: boolean;
  /** Whether to include token balances */
  includeBalances: boolean;
  /** Whether to include DeFi protocol interactions */
  includeDefiInteractions: boolean;
  /** Whether to include NFT holdings */
  includeNFTs: boolean;
  /** Report format */
  format: 'json' | 'csv' | 'pdf';
  /** Priority level for processing */
  priority: 'low' | 'normal' | 'high' | 'urgent';
  /** User who requested the report */
  requestedBy: string;
  /** Request timestamp */
  requestedAt: string;
  /** Request status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  /** Error message if failed */
  errorMessage?: string;
  /** Estimated completion time */
  estimatedCompletion?: string;
}

/**
 * Wallet report interface
 * Comprehensive analysis results for a wallet
 */
export interface WalletReport {
  /** Report identifier */
  reportId: string;
  /** Original request details */
  request: ReportRequest;
  /** Wallet address analyzed */
  walletAddress: string;
  /** Report generation timestamp */
  generatedAt: string;
  /** Time range covered by the report */
  timeRange: TimeRange;
  /** Executive summary of findings */
  summary: WalletSummary;
  /** Detailed transaction analysis */
  transactionAnalysis: TransactionAnalysis;
  /** Token balance analysis */
  balanceAnalysis: BalanceAnalysis;
  /** DeFi protocol interactions */
  defiInteractions: DefiInteraction[];
  /** NFT holdings and transactions */
  nftAnalysis: NFTAnalysis;
  /** Risk assessment */
  riskAssessment: RiskAssessment;
  /** Recommendations */
  recommendations: Recommendation[];
  /** Report metadata */
  metadata: ReportMetadata;
}

/**
 * Wallet summary interface
 * High-level overview of wallet activity and status
 */
export interface WalletSummary {
  /** Total transaction count in the period */
  totalTransactions: number;
  /** Total volume of transactions (in USD) */
  totalVolumeUSD: string;
  /** Net change in wallet value (in USD) */
  netValueChangeUSD: string;
  /** Current wallet value (in USD) */
  currentValueUSD: string;
  /** Wallet activity level */
  activityLevel: 'low' | 'medium' | 'high' | 'very_high';
  /** Primary use case of the wallet */
  primaryUseCase: 'trading' | 'hodling' | 'defi' | 'nft' | 'gaming' | 'other';
  /** Whether wallet is considered active */
  isActive: boolean;
  /** Wallet age in days */
  walletAgeDays: number;
  /** Number of unique counterparties */
  uniqueCounterparties: number;
}

/**
 * Transaction analysis interface
 * Detailed breakdown of transaction patterns
 */
export interface TransactionAnalysis {
  /** Transaction count by type */
  byType: Record<string, number>;
  /** Transaction count by status */
  byStatus: Record<string, number>;
  /** Transaction count by time of day */
  byTimeOfDay: Record<string, number>;
  /** Transaction count by day of week */
  byDayOfWeek: Record<string, number>;
  /** Gas usage statistics */
  gasUsage: {
    total: string;
    average: string;
    min: string;
    max: string;
  };
  /** Fee statistics */
  fees: {
    total: string;
    average: string;
    min: string;
    max: string;
  };
  /** Top counterparties by transaction count */
  topCounterparties: Array<{
    address: string;
    transactionCount: number;
    totalVolume: string;
    lastInteraction: string;
  }>;
  /** Transaction frequency over time */
  frequencyOverTime: Array<{
    timestamp: string;
    count: number;
    volume: string;
  }>;
}

/**
 * Balance analysis interface
 * Analysis of token holdings and changes
 */
export interface BalanceAnalysis {
  /** Current token balances */
  currentBalances: Array<{
    tokenType: string;
    symbol: string;
    amount: string;
    valueUSD: string;
    percentageOfPortfolio: number;
  }>;
  /** Balance changes over time */
  balanceChanges: Array<{
    timestamp: string;
    tokenType: string;
    symbol: string;
    previousBalance: string;
    currentBalance: string;
    change: string;
    changePercentage: number;
    valueChangeUSD: string;
  }>;
  /** Portfolio diversification metrics */
  diversification: {
    /** Herfindahl-Hirschman Index for concentration */
    hhi: number;
    /** Number of different token types */
    tokenCount: number;
    /** Largest position percentage */
    largestPositionPercentage: number;
    /** Top 5 positions percentage */
    top5PositionsPercentage: number;
  };
  /** Token performance ranking */
  performanceRanking: Array<{
    tokenType: string;
    symbol: string;
    performance: number;
    rank: number;
  }>;
}

/**
 * DeFi interaction interface
 * Details about DeFi protocol interactions
 */
export interface DefiInteraction {
  /** Protocol name */
  protocol: string;
  /** Protocol category */
  category: 'lending' | 'borrowing' | 'swapping' | 'yield_farming' | 'staking' | 'other';
  /** Protocol address */
  protocolAddress: string;
  /** Interaction type */
  interactionType: 'deposit' | 'withdraw' | 'swap' | 'stake' | 'unstake' | 'claim' | 'other';
  /** Token involved */
  tokenType: string;
  /** Token symbol */
  symbol: string;
  /** Amount involved */
  amount: string;
  /** Value in USD at time of interaction */
  valueUSD: string;
  /** Transaction hash */
  transactionHash: string;
  /** Interaction timestamp */
  timestamp: string;
  /** Gas used */
  gasUsed: string;
  /** Fees paid */
  fees: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * NFT analysis interface
 * Analysis of NFT holdings and transactions
 */
export interface NFTAnalysis {
  /** Current NFT holdings */
  holdings: Array<{
    collection: string;
    tokenId: string;
    name?: string;
    description?: string;
    imageUrl?: string;
    attributes?: Record<string, unknown>;
    valueUSD?: string;
    acquiredAt?: string;
    acquisitionPrice?: string;
  }>;
  /** NFT transactions */
  transactions: Array<{
    type: 'mint' | 'transfer' | 'sale' | 'purchase';
    collection: string;
    tokenId: string;
    amount?: string;
    valueUSD?: string;
    counterparty?: string;
    transactionHash: string;
    timestamp: string;
  }>;
  /** Collection statistics */
  collections: Array<{
    name: string;
    count: number;
    totalValueUSD: string;
    averageValueUSD: string;
  }>;
}

/**
 * Risk assessment interface
 * Evaluation of wallet risk factors
 */
export interface RiskAssessment {
  /** Overall risk score (0-100, higher = more risky) */
  riskScore: number;
  /** Risk level category */
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  /** Risk factors identified */
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
    recommendation: string;
  }>;
  /** Suspicious activity indicators */
  suspiciousActivity: Array<{
    type: string;
    description: string;
    confidence: number;
    timestamp: string;
    }>;
  /** Compliance status */
  compliance: {
    /** Whether wallet meets regulatory requirements */
    isCompliant: boolean;
    /** Compliance issues found */
    issues: string[];
    /** Required actions */
    requiredActions: string[];
  };
}

/**
 * Recommendation interface
 * Suggestions for wallet optimization
 */
export interface Recommendation {
  /** Recommendation category */
  category: 'security' | 'optimization' | 'investment' | 'compliance' | 'other';
  /** Priority level */
  priority: 'low' | 'medium' | 'high';
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** Expected impact */
  impact: string;
  /** Implementation difficulty */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Estimated time to implement */
  estimatedTime: string;
  /** Related resources */
  resources?: string[];
}

/**
 * Report metadata interface
 * Additional information about the report
 */
export interface ReportMetadata {
  /** Report version */
  version: string;
  /** Data sources used */
  dataSources: string[];
  /** Last data update timestamp */
  lastDataUpdate: string;
  /** Report generation duration (in seconds) */
  generationDuration: number;
  /** Data quality score (0-100) */
  dataQualityScore: number;
  /** Whether report contains complete data */
  isComplete: boolean;
  /** Missing data points */
  missingData?: string[];
  /** Report checksum for integrity verification */
  checksum: string;
}

/**
 * Aggregated metrics interface
 * Platform-wide statistics and insights
 */
export interface AggregatedMetrics {
  /** Total wallets analyzed */
  totalWallets: number;
  /** Total transactions processed */
  totalTransactions: number;
  /** Total volume processed (in USD) */
  totalVolumeUSD: string;
  /** Platform usage statistics */
  usage: {
    /** Active users in last 24 hours */
    activeUsers24h: number;
    /** Active users in last 7 days */
    activeUsers7d: number;
    /** Active users in last 30 days */
    activeUsers30d: number;
    /** Reports generated today */
    reportsGeneratedToday: number;
    /** Reports generated this week */
    reportsGeneratedThisWeek: number;
    /** Reports generated this month */
    reportsGeneratedThisMonth: number;
  };
  /** Performance metrics */
  performance: {
    /** Average report generation time (in seconds) */
    averageReportGenerationTime: number;
    /** Success rate of report generation */
    reportSuccessRate: number;
    /** Average API response time (in milliseconds) */
    averageApiResponseTime: number;
  };
  /** Token statistics */
  tokens: {
    /** Total supported tokens */
    totalSupported: number;
    /** Most analyzed tokens */
    mostAnalyzed: string[];
    /** Token analysis volume */
    analysisVolume: Record<string, number>;
  };
  /** Risk assessment statistics */
  risk: {
    /** Average risk score across all wallets */
    averageRiskScore: number;
    /** Risk distribution */
    riskDistribution: Record<string, number>;
    /** High-risk wallets count */
    highRiskWalletsCount: number;
  };
}
