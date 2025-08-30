#!/usr/bin/env tsx

import { createAptosClient } from '../src/lib/aptos-client';

async function testAptosClient() {
  console.log('🧪 Testing Aptos Client...\n');

  // Create client with default configuration
  const client = createAptosClient();
  
  try {
    console.log('✅ Client created successfully');
    
    // Test ledger info (health check alternative)
    const ledgerInfo = await client.getLedgerInfo();
    console.log('🏥 Ledger Info:', ledgerInfo);
    
    // Test with a valid Aptos address (this will fail but should show proper error handling)
    const testAddress = '0x1d8727df513fa2a45c1d1cac54c6f1e5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b';
    console.log(`\n🔍 Testing with address: ${testAddress}`);
    
    try {
      const accountInfo = await client.getAccountInfo(testAddress);
      console.log('✅ Account info retrieved:', accountInfo);
    } catch (error: any) {
      console.log('⚠️  Expected error (invalid address):', {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        endpoint: error.endpoint,
      });
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // No disconnect method needed for our client
    console.log('🔌 Test completed');
  }
}

// Run the test
testAptosClient().catch(console.error);
