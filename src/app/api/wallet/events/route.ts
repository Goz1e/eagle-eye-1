import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAptosClient } from '@/lib/aptos-client';

const requestSchema = z.object({
  addresses: z.array(z.string()),
  tokenTypes: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses, tokenTypes, startDate, endDate } = requestSchema.parse(body);

    // Initialize Aptos client
    const aptosClient = createAptosClient({
      baseUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
      timeout: 30000,
      maxRetries: 3,
      cacheTTL: 300, // 5 minutes
      rateLimitPerSecond: 10,
    });

    // Process each address with real blockchain data
    const realEvents = await Promise.all(
      addresses.map(async (address) => {
        try {
          // Get real deposit and withdrawal events
          const depositEvents = await aptosClient.getDepositEvents(
            address,
            tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
            100
          );

          const withdrawEvents = await aptosClient.getWithdrawEvents(
            address,
            tokenTypes?.[0] || '0x1::aptos_coin::AptosCoin',
            100
          );

          // Calculate totals from real data
          const totalDeposits = depositEvents.reduce(
            (sum, event) => sum + parseFloat(event.data.amount),
            0
          ).toString();

          const totalWithdrawals = withdrawEvents.reduce(
            (sum, event) => sum + parseFloat(event.data.amount),
            0
          ).toString();

          const netFlow = (totalDeposits - totalWithdrawals).toString();

          // Get account info for additional context
          const accountInfo = await aptosClient.getAccountInfo(address);

          return {
            address,
            events: [
              ...depositEvents.map(event => ({
                type: 'deposit' as const,
                amount: event.data.amount,
                tokenType: event.data.tokenType,
                timestamp: event.timestamp,
                version: event.sequenceNumber,
              })),
              ...withdrawEvents.map(event => ({
                type: 'withdrawal' as const,
                amount: event.data.amount,
                tokenType: event.data.tokenType,
                timestamp: event.timestamp,
                version: event.sequenceNumber,
              })),
            ],
            totalDeposits,
            totalWithdrawals,
            netFlow,
            accountInfo: {
              sequenceNumber: accountInfo.sequenceNumber,
              coinResources: accountInfo.coinResources,
              tokenResources: accountInfo.tokenResources,
            },
          };
        } catch (error) {
          console.error(`Error processing address ${address}:`, error);
          
          // Return error info for this address
          return {
            address,
            events: [],
            totalDeposits: '0',
            totalWithdrawals: '0',
            netFlow: '0',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    // Clean up client
    await aptosClient.disconnect();

    return NextResponse.json({
      success: true,
      data: realEvents,
      metadata: {
        addresses: addresses.length,
        tokenTypes: tokenTypes || ['0x1::aptos_coin::AptosCoin'],
        dateRange: { startDate, endDate },
        processedAt: new Date().toISOString(),
        source: 'Aptos Mainnet',
        dataType: 'real_blockchain_data',
      },
    });
  } catch (error) {
    console.error('Wallet events API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to fetch real blockchain data'
      },
      { status: 500 }
    );
  }
}
