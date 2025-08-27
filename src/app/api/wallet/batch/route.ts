import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAptosClient } from '@/lib/aptos-client';

const requestSchema = z.object({
  addresses: z.array(z.string()),
  tokenTypes: z.array(z.string()).optional(),
  batchSize: z.number().min(1).max(50).optional(),
  includeProgress: z.boolean().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      addresses, 
      tokenTypes, 
      batchSize = 10,
      includeProgress = true,
      priority = 'normal'
    } = requestSchema.parse(body);

    // Initialize Aptos client
    const aptosClient = createAptosClient({
      baseUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
      timeout: 30000,
      maxRetries: 3,
      cacheTTL: 300,
      rateLimitPerSecond: priority === 'high' ? 15 : 10,
    });

    const startTime = Date.now();
    const totalAddresses = addresses.length;
    const results: any[] = [];
    const errors: any[] = [];

    // Process addresses in batches
    for (let i = 0; i < totalAddresses; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const batchStartTime = Date.now();
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalAddresses / batchSize)}: ${batch.length} addresses`);

      // Process batch concurrently
      const batchPromises = batch.map(async (address, batchIndex) => {
        try {
          const addressStartTime = Date.now();
          
          // Get comprehensive wallet data
          const [depositEvents, withdrawEvents, accountInfo] = await Promise.all([
            aptosClient.getDepositEvents(
              address,
              tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
              100
            ),
            aptosClient.getWithdrawEvents(
              address,
              tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
              100
            ),
            aptosClient.getAccountInfo(address),
          ]);

          // Calculate metrics
          const totalDeposits = depositEvents.reduce(
            (sum, event) => sum + parseFloat(event.data.amount),
            0
          );

          const totalWithdrawals = withdrawEvents.reduce(
            (sum, event) => sum + parseFloat(event.data.amount),
            0
          );

          const netFlow = totalDeposits - totalWithdrawals;
          const totalTransactions = depositEvents.length + withdrawEvents.length;
          const processingTime = Date.now() - addressStartTime;

          return {
            address,
            batchIndex: i + batchIndex,
            summary: {
              totalDeposits: totalDeposits.toFixed(8),
              totalWithdrawals: totalWithdrawals.toFixed(8),
              netFlow: netFlow.toFixed(8),
              totalTransactions,
              processingTimeMs: processingTime,
            },
            events: {
              deposits: depositEvents.length,
              withdrawals: withdrawEvents.length,
              total: totalTransactions,
            },
            accountInfo: {
              sequenceNumber: accountInfo.sequenceNumber,
              coinResources: accountInfo.coinResources,
              tokenResources: accountInfo.tokenResources,
            },
            metadata: {
              analyzedAt: new Date().toISOString(),
              tokenType: tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
              dataSource: 'Aptos Mainnet',
              batchNumber: Math.floor(i / batchSize) + 1,
              priority,
            },
          };
        } catch (error) {
          console.error(`Error processing address ${address}:`, error);
          
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
              batchNumber: Math.floor(i / batchSize) + 1,
              priority,
              cacheStatus: 'error',
            },
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      const batchProcessingTime = Date.now() - batchStartTime;
      
      // Separate successful results from errors
      batchResults.forEach(result => {
        if (result.error) {
          errors.push(result);
        } else {
          results.push(result);
        }
      });

      // Add batch metadata
      if (includeProgress) {
        const progress = {
          batchNumber: Math.floor(i / batchSize) + 1,
          totalBatches: Math.ceil(totalAddresses / batchSize),
          addressesProcessed: Math.min(i + batchSize, totalAddresses),
          totalAddresses,
          progressPercentage: Math.min(((i + batchSize) / totalAddresses) * 100, 100),
          batchProcessingTimeMs: batchProcessingTime,
          estimatedTimeRemaining: batchProcessingTime * (Math.ceil(totalAddresses / batchSize) - Math.floor(i / batchSize) - 1),
        };
        
        console.log('Batch Progress:', progress);
      }

      // Rate limiting between batches (except for high priority)
      if (priority !== 'high' && i + batchSize < totalAddresses) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Clean up client
    await aptosClient.disconnect();

    const totalProcessingTime = Date.now() - startTime;
    const successfulAnalyses = results.length;
    const failedAnalyses = errors.length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          totalAddresses,
          successfulAnalyses,
          failedAnalyses,
          successRate: (successfulAnalyses / totalAddresses) * 100,
          totalProcessingTimeMs: totalProcessingTime,
          averageProcessingTimeMs: successfulAnalyses > 0 ? totalProcessingTime / successfulAnalyses : 0,
          batchSize,
          totalBatches: Math.ceil(totalAddresses / batchSize),
        },
        performance: {
          addressesPerSecond: totalAddresses / (totalProcessingTime / 1000),
          averageBatchTime: totalProcessingTime / Math.ceil(totalAddresses / batchSize),
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
    });
  } catch (error) {
    console.error('Batch wallet analysis API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to process batch wallet analysis with real blockchain data'
      },
      { status: 500 }
    );
  }
}
