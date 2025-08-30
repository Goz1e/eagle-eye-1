import { NextRequest, NextResponse } from 'next/server'
import { SimpleBatchProcessor } from '@/lib/simple-batch'

interface BatchRequest {
  addresses: string[]
  tokenTypes?: string[]
  batchSize?: number
  priority?: 'low' | 'normal' | 'high'
  includeProgress?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchRequest = await request.json()
    const { addresses, tokenTypes, batchSize = 10, priority = 'normal', includeProgress = true } = body

    if (!addresses || addresses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Addresses required' },
        { status: 400 }
      )
    }

    if (addresses.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 addresses allowed' },
        { status: 400 }
      )
    }

    // Initialize batch processor
    const processor = new SimpleBatchProcessor({
      batchSize,
      priority,
      includeProgress,
    })

    // Process the batch
    const results = await processor.processBatch(addresses, tokenTypes)

    // Calculate summary metrics
    const totalProcessingTime = results.reduce((sum, r) => sum + (r.processingTimeMs || 0), 0)
    const successfulAnalyses = results.length
    const failedAnalyses = 0
    const totalBatches = Math.ceil(addresses.length / batchSize)

    return NextResponse.json({
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
  } catch (error) {
    console.error('Batch processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process batch' },
      { status: 500 }
    )
  }
}
