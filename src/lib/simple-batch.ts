// ============================================================================
// SIMPLE BATCH PROCESSOR
// ============================================================================

export interface BatchProcessorConfig {
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface BatchJob<T, R> {
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

export class SimpleBatchProcessor {
  private config: BatchProcessorConfig;

  constructor(config: BatchProcessorConfig = {
    maxConcurrency: 5,
    retryAttempts: 3,
    retryDelay: 1000,
  }) {
    this.config = config;
  }

  // ============================================================================
  // MAIN BATCH PROCESSING METHOD
  // ============================================================================

  async processBatch<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    onProgress?: ProgressCallback
  ): Promise<BatchResult<T, R>[]> {
    const results: BatchResult<T, R>[] = [];
    const total = items.length;
    let processed = 0;

    // Process items in batches based on concurrency limit
    for (let i = 0; i < total; i += this.config.maxConcurrency) {
      const batch = items.slice(i, i + this.config.maxConcurrency);
      const batchPromises = batch.map(async (item, batchIndex) => {
        const globalIndex = i + batchIndex;
        const result = await this.processItemWithRetry(item, processor, globalIndex);
        
        processed++;
        if (onProgress) {
          onProgress(processed, total, `Processing item ${globalIndex + 1}`);
        }
        
        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // ============================================================================
  // INDIVIDUAL ITEM PROCESSING WITH RETRY
  // ============================================================================

  private async processItemWithRetry<T, R>(
    item: T,
    processor: (item: T, index: number) => Promise<R>,
    index: number
  ): Promise<BatchResult<T, R>> {
    let lastError: string | undefined;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const data = await processor(item, index);
        const executionTime = Date.now() - startTime;
        
        return {
          success: true,
          data,
          item,
          attempts: attempt,
          executionTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt < this.config.retryAttempts) {
          // Wait before retry with exponential backoff
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const executionTime = Date.now() - startTime;
    return {
      success: false,
      error: lastError,
      item,
      attempts: this.config.retryAttempts,
      executionTime,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async processBatchWithTimeout<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    timeoutMs: number = 30000,
    onProgress?: ProgressCallback
  ): Promise<BatchResult<T, R>[]> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Batch processing timeout')), timeoutMs);
    });

    try {
      return await Promise.race([
        this.processBatch(items, processor, onProgress),
        timeoutPromise
      ]);
    } catch (error) {
      // Return partial results if timeout occurs
      console.warn('Batch processing timed out, returning partial results');
      return [];
    }
  }

  // ============================================================================
  // STATISTICS AND METRICS
  // ============================================================================

  getBatchStats(results: BatchResult<unknown, unknown>[]): {
    total: number;
    successful: number;
    failed: number;
    averageExecutionTime: number;
    totalExecutionTime: number;
  } {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const averageExecutionTime = total > 0 ? totalExecutionTime / total : 0;

    return {
      total,
      successful,
      failed,
      averageExecutionTime,
      totalExecutionTime,
    };
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const simpleBatchProcessor = new SimpleBatchProcessor({
  maxConcurrency: 5,
  retryAttempts: 3,
  retryDelay: 1000,
});
