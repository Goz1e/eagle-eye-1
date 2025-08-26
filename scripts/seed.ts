import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Eagle Eye database...');

  // Clear existing data (for development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.apiCall.deleteMany();
    await prisma.report.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.tokenPrice.deleteMany();
    await prisma.databaseConfig.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create test users
  console.log('👥 Creating test users...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@eagle-eye.com' },
    update: {},
    create: {
      email: 'admin@eagle-eye.com',
      name: 'Admin User',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'test@eagle-eye.com' },
    update: {},
    create: {
      email: 'test@eagle-eye.com',
      name: 'Test User',
      role: 'USER',
      isVerified: true,
      isActive: true,
    },
  });

  // Create test wallets
  console.log('💼 Creating test wallets...');
  const wallet1 = await prisma.wallet.upsert({
    where: { address: '0x1234567890123456789012345678901234567890123456789012345678901234' },
    update: {},
    create: {
      address: '0x1234567890123456789012345678901234567890123456789012345678901234',
      label: 'Test Wallet 1',
      description: 'Development test wallet for APT transactions',
      walletType: 'REGULAR',
      isActive: true,
      userId: testUser.id,
    },
  });

  const wallet2 = await prisma.wallet.upsert({
    where: { address: '0x2345678901234567890123456789012345678901234567890123456789012345' },
    update: {},
    create: {
      address: '0x2345678901234567890123456789012345678901234567890123456789012345',
      label: 'Test Wallet 2',
      description: 'Development test wallet for DeFi interactions',
      walletType: 'REGULAR',
      isActive: true,
      userId: testUser.id,
    },
  });

  // Create test transactions
  console.log('💸 Creating test transactions...');
  const transactions = [
    {
      version: '123456789',
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      sender: wallet1.address,
      receiver: wallet2.address,
      amount: '1000000',
      tokenType: '0x1::aptos_coin::AptosCoin',
      tokenSymbol: 'APT',
      status: 'SUCCESS' as const,
      type: 'TRANSFER' as const,
      timestamp: new Date('2024-01-01T10:00:00Z'),
      walletId: wallet1.id,
    },
    {
      version: '123456790',
      hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      sender: wallet2.address,
      receiver: wallet1.address,
      amount: '500000',
      tokenType: '0x1::aptos_coin::AptosCoin',
      tokenSymbol: 'APT',
      status: 'SUCCESS' as const,
      type: 'TRANSFER' as const,
      timestamp: new Date('2024-01-01T11:00:00Z'),
      walletId: wallet2.id,
    },
  ];

  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: { version: tx.version },
      update: tx,
      create: tx,
    });
  }

  // Create test reports
  console.log('📊 Creating test reports...');
  const report = await prisma.report.upsert({
    where: { reportId: 'test_report_001' },
    update: {},
    create: {
      reportId: 'test_report_001',
      title: 'Test Wallet Analysis Report',
      description: 'Sample report for development testing',
      walletAddress: wallet1.address,
      timeRangeStart: new Date('2024-01-01T00:00:00Z'),
      timeRangeEnd: new Date('2024-01-31T23:59:59Z'),
      granularity: 'DAY',
      includeTransactions: true,
      includeBalances: true,
      includeDefiInteractions: false,
      includeNFTs: false,
      status: 'COMPLETED',
      format: 'JSON',
      priority: 'NORMAL',
      userId: testUser.id,
      walletId: wallet1.id,
      generationTime: 15,
      dataQualityScore: 95,
      requestedAt: new Date('2024-01-15T10:00:00Z'),
      startedAt: new Date('2024-01-15T10:00:01Z'),
      completedAt: new Date('2024-01-15T10:00:16Z'),
    },
  });

  // Create token prices
  console.log('�� Creating token prices...');
  const tokenPrices = [
    {
      tokenType: '0x1::aptos_coin::AptosCoin',
      tokenSymbol: 'APT',
      priceUSD: 8.50,
      priceChange24h: 2.5,
      volume24h: 15000000,
      marketCap: 8500000000,
      source: 'defillama',
      confidence: 100,
    },
    {
      tokenType: '0x1::usdt::USDT',
      tokenSymbol: 'USDT',
      priceUSD: 1.00,
      priceChange24h: 0.0,
      volume24h: 50000000,
      marketCap: 100000000000,
      source: 'defillama',
      confidence: 100,
    },
    {
      tokenType: '0x1::usdc::USDC',
      tokenSymbol: 'USDC',
      priceUSD: 1.00,
      priceChange24h: 0.0,
      volume24h: 30000000,
      marketCap: 80000000000,
      source: 'defillama',
      confidence: 100,
    },
  ];

  for (const price of tokenPrices) {
    await prisma.tokenPrice.upsert({
      where: {
        tokenType_timestamp: {
          tokenType: price.tokenType,
          timestamp: new Date(),
        },
      },
      update: price,
      create: {
        ...price,
        timestamp: new Date(),
      },
    });
  }

  // Create database configuration
  console.log('⚙️  Creating database configuration...');
  const configs = [
    {
      key: 'app_version',
      value: '1.0.0',
      description: 'Current application version',
      category: 'system',
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Maintenance mode flag',
      category: 'system',
    },
    {
      key: 'max_report_generation_time',
      value: '300',
      description: 'Maximum report generation time in seconds',
      category: 'performance',
    },
    {
      key: 'default_time_range_days',
      value: '30',
      description: 'Default time range for reports in days',
      category: 'user_experience',
    },
  ];

  for (const config of configs) {
    await prisma.databaseConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }

  // Create sample API calls
  console.log('📡 Creating sample API calls...');
  const apiCalls = [
    {
      endpoint: '/api/wallets',
      method: 'GET',
      statusCode: 200,
      responseTime: 150,
      userId: testUser.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    },
    {
      endpoint: '/api/reports',
      method: 'POST',
      statusCode: 201,
      responseTime: 2500,
      userId: testUser.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    },
  ];

  for (const call of apiCalls) {
    await prisma.apiCall.create({
      data: call,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Created ${await prisma.user.count()} users`);
  console.log(`💼 Created ${await prisma.wallet.count()} wallets`);
  console.log(`💸 Created ${await prisma.transaction.count()} transactions`);
  console.log(`📊 Created ${await prisma.report.count()} reports`);
  console.log(`💰 Created ${await prisma.user.count()} token prices`);
  console.log(`⚙️  Created ${await prisma.databaseConfig.count()} configs`);
  console.log(`📡 Created ${await prisma.apiCall.count()} API calls`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
