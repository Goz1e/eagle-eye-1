#!/usr/bin/env tsx

/**
 * Database Setup Script for Eagle Eye
 * Initializes the database from scratch with migrations and seed data
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Eagle Eye database setup...\n');

  try {
    // Step 1: Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('pnpm prisma:generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully\n');

    // Step 2: Push schema to database
    console.log('🗄️  Pushing schema to database...');
    execSync('pnpm prisma:push', { stdio: 'inherit' });
    console.log('✅ Schema pushed successfully\n');

    // Step 3: Seed initial data
    console.log('🌱 Seeding initial data...');
    await seedInitialData();
    console.log('✅ Initial data seeded successfully\n');

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedInitialData() {
  // Seed common token types
  const tokens = [
    {
      tokenType: '0x1::aptos_coin::AptosCoin',
      tokenSymbol: 'APT',
      priceUSD: 8.50,
      source: 'defillama',
    },
    {
      tokenType: '0x1::usdt::USDT',
      tokenSymbol: 'USDT',
      priceUSD: 1.00,
      source: 'defillama',
    },
    {
      tokenType: '0x1::usdc::USDC',
      tokenSymbol: 'USDC',
      priceUSD: 1.00,
      source: 'defillama',
    },
  ];

  for (const token of tokens) {
    await prisma.tokenPrice.upsert({
      where: {
        tokenType_timestamp: {
          tokenType: token.tokenType,
          timestamp: new Date(),
        },
      },
      update: {
        priceUSD: token.priceUSD,
        source: token.source,
      },
      create: {
        tokenType: token.tokenType,
        tokenSymbol: token.tokenSymbol,
        priceUSD: token.priceUSD,
        source: token.source,
        timestamp: new Date(),
      },
    });
  }

  // Seed test wallet addresses
  const testWallets = [
    {
      address: '0x1234567890123456789012345678901234567890123456789012345678901234',
      label: 'Test Wallet 1',
      description: 'Development test wallet',
      walletType: 'REGULAR' as const,
    },
    {
      address: '0x2345678901234567890123456789012345678901234567890123456789012345',
      label: 'Test Wallet 2',
      description: 'Development test wallet',
      walletType: 'REGULAR' as const,
    },
  ];

  for (const wallet of testWallets) {
    await prisma.wallet.upsert({
      where: { address: wallet.address },
      update: wallet,
      create: wallet,
    });
  }

  // Seed database configuration
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
  ];

  for (const config of configs) {
    await prisma.databaseConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }
}

main().catch(console.error);
