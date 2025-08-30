// ============================================================================
// SIMPLE BATCH PROCESSOR
// ============================================================================

export interface BatchProcessorConfig {
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface BatchJob<T> {
  id: string;
  data: T;
  priority?: number;
}

export interface BatchResult<T, R> {
  success: boolean;
  data?: R;
  error?: string;
  item: T;
  attempts: number;
  executionTime: number;
}

export interface ProgressCallback {
  (processed: number, total: number, currentItem?: string): void;
}

export class SimpleBatchProcessor<T extends { address: string; [key: string]: unknown }> {
  private batchSize: number
  private priority: 'low' | 'normal' | 'high'
  private includeProgress: boolean

  constructor(options: {
    batchSize?: number
    priority?: 'low' | 'normal' | 'high'
    includeProgress?: boolean
  } = {}) {
    this.batchSize = options.batchSize || 10
    this.priority = options.priority || 'normal'
    this.includeProgress = options.includeProgress !== false
  }

  async processBatch(
    addresses: string[],
    tokenTypes?: string[]
  ): Promise<Array<T & { processingTimeMs: number }>> {
    const results: Array<T & { processingTimeMs: number }> = []
    const totalBatches = Math.ceil(addresses.length / this.batchSize)

    for (let i = 0; i < addresses.length; i += this.batchSize) {
      const batch = addresses.slice(i, i + this.batchSize)
      const batchStartTime = Date.now()

      console.log(`Processing batch ${Math.floor(i / this.batchSize) + 1}/${totalBatches}: ${batch.length} addresses`)

      // Process batch concurrently
      const batchPromises = batch.map(async (address, batchIndex) => {
        try {
          const addressStartTime = Date.now()

          // Simulate wallet analysis (replace with actual implementation)
          const walletData = await this.analyzeWallet(address, tokenTypes)
          const processingTime = Date.now() - addressStartTime

          return {
            ...walletData,
            processingTimeMs: processingTime,
          } as T & { processingTimeMs: number }
        } catch (error) {
          console.error(`Error processing address ${address}:`, error)
          
          // Return error result
          return {
            address,
            batchIndex: i + batchIndex,
            error: error instanceof Error ? error.message : 'Unknown error',
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
              tokenType: tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
              dataSource: 'Aptos Mainnet',
              batchNumber: Math.floor(i / this.batchSize) + 1,
              priority: this.priority,
              cacheStatus: 'error',
            },
            processingTimeMs: 0,
          } as unknown as T & { processingTimeMs: number }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      const batchProcessingTime = Date.now() - batchStartTime
      
      results.push(...batchResults)

      // Add batch metadata
      if (this.includeProgress) {
        const progress = {
          batchNumber: Math.floor(i / this.batchSize) + 1,
          totalBatches,
          addressesProcessed: Math.min(i + this.batchSize, addresses.length),
          totalAddresses: addresses.length,
          progressPercentage: Math.min(((i + this.batchSize) / addresses.length) * 100, 100),
          batchProcessingTimeMs: batchProcessingTime,
          estimatedTimeRemaining: batchProcessingTime * (Math.ceil(addresses.length / this.batchSize) - Math.floor(i / this.batchSize) - 1),
        }
        
        console.log('Batch Progress:', progress)
      }

      // Rate limiting between batches (except for high priority)
      if (this.priority !== 'high' && i + this.batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  private async analyzeWallet(address: string, tokenTypes?: string[]): Promise<T> {
    // Simulate wallet analysis
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
    
    return {
      address,
      batchIndex: 0,
      summary: {
        totalDeposits: '1000000000', // 10 APT
        totalWithdrawals: '500000000', // 5 APT
        netFlow: '500000000', // 5 APT
        totalTransactions: 25,
        processingTimeMs: 150,
      },
      events: {
        deposits: 15,
        withdrawals: 10,
        total: 25,
      },
      accountInfo: {
        sequenceNumber: '100',
        coinResources: [],
        tokenResources: [],
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        tokenType: tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
        dataSource: 'Aptos Mainnet',
        batchNumber: 1,
        priority: this.priority,
      },
    } as unknown as T
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const simpleBatchProcessor = new SimpleBatchProcessor({
  batchSize: 5,
  priority: 'normal',
  includeProgress: true,
});
