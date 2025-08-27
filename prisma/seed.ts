import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@eagle-eye.com' },
    update: {},
    create: {
      email: 'admin@eagle-eye.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'test@eagle-eye.com' },
    update: {},
    create: {
      email: 'test@eagle-eye.com',
      name: 'Test User',
      role: 'VIEWER',
    },
  });

  console.log('✅ Created users:', { adminUser: adminUser.email, testUser: testUser.email });

  // Create sample reports
  const sampleReport = await prisma.report.create({
    data: {
      title: 'Sample Wallet Analysis',
      description: 'Example report for demonstration purposes',
      walletData: {
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        totalTransactions: 150,
        totalVolume: '125000000000',
        lastActivity: new Date().toISOString(),
      },
      parameters: {
        tokenTypes: ['0x1::aptos_coin::AptosCoin'],
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
      status: 'COMPLETED',
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Created sample report:', sampleReport.title);

  // Create sample saved search
  const savedSearch = await prisma.savedSearch.create({
    data: {
      name: 'High Volume Wallets',
      parameters: {
        minVolume: '100000000000',
        tokenTypes: ['0x1::aptos_coin::AptosCoin'],
        timeRange: '30d',
      },
      userId: adminUser.id,
    },
  });

  console.log('✅ Created saved search:', savedSearch.name);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
