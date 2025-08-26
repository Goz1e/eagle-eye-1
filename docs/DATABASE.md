# Eagle Eye Database Setup Guide

This document provides comprehensive instructions for setting up the Eagle Eye database from scratch.

## 🗄️ Database Requirements

- **Database**: PostgreSQL 12+ (recommended: PostgreSQL 14+)
- **Extensions**: No special extensions required
- **Connection**: Standard PostgreSQL connection string

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file with your database configuration:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/eagle_eye"

# Other required environment variables
APTOS_INDEXER_URL=https://indexer.mainnet.aptoslabs.com/v1/graphql
APTOS_FULLNODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
DEFILLAMA_API_KEY=your_defillama_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 2. Database Creation

Create the database in PostgreSQL:

```sql
CREATE DATABASE eagle_eye;
CREATE USER eagle_eye_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE eagle_eye TO eagle_eye_user;
```

### 3. Automated Setup

Run the automated database setup script:

```bash
pnpm db:setup
```

This script will:
- Generate the Prisma client
- Push the schema to the database
- Seed initial data (tokens, test wallets, etc.)

## 🔧 Manual Setup

### 1. Generate Prisma Client

```bash
pnpm prisma:generate
```

### 2. Push Schema to Database

```bash
pnpm prisma:push
```

### 3. Seed Initial Data

```bash
pnpm prisma:seed
```

## 📊 Database Schema Overview

### Core Models

- **User**: Authentication and user management
- **Wallet**: Tracked blockchain addresses
- **Transaction**: Individual blockchain transactions
- **Report**: Saved wallet analysis reports
- **TokenPrice**: Cached price data
- **ApiCall**: Rate limiting and monitoring
- **DatabaseConfig**: System configuration

### Key Features

- **Soft Deletes**: All models support soft deletion for audit compliance
- **Comprehensive Indexing**: Optimized for wallet addresses, timestamps, and token types
- **Foreign Key Relationships**: Proper cascading deletes where appropriate
- **Audit Timestamps**: Created/updated timestamps on all models

## 🗂️ Database Structure

```
eagle_eye/
├── users                    # User accounts and authentication
├── wallets                  # Tracked wallet addresses
├── transactions            # Blockchain transaction data
├── reports                 # Generated analysis reports
├── token_prices            # Cached token price data
├── api_calls               # API call monitoring
└── database_configs        # System configuration
```

## 🔍 Indexes and Performance

### Primary Indexes

- **Wallet addresses**: Fast wallet lookups
- **Transaction versions**: Quick transaction retrieval
- **Timestamps**: Efficient time-based queries
- **User relationships**: Optimized user data access

### Query Optimization

- Composite indexes for common query patterns
- Partial indexes for active records
- B-tree indexes for range queries

## 🌱 Seed Data

The database comes pre-populated with:

### Test Users
- **Admin User**: `admin@eagle-eye.com` (ADMIN role)
- **Test User**: `test@eagle-eye.com` (USER role)

### Test Wallets
- Sample Aptos wallet addresses for development
- Pre-configured with test transactions

### Common Tokens
- **APT**: Aptos Coin
- **USDT**: Tether USD
- **USDC**: USD Coin

### Sample Reports
- Test wallet analysis reports
- Various report formats and configurations

## 🛠️ Development Commands

### Database Management

```bash
# Generate Prisma client
pnpm prisma:generate

# Push schema changes
pnpm prisma:push

# Open Prisma Studio
pnpm prisma:studio

# Run migrations
pnpm prisma:migrate

# Seed database
pnpm prisma:seed

# Reset database (development only)
pnpm db:reset
```

### Database Setup

```bash
# Complete database setup
pnpm db:setup

# Check database connection
pnpm db:health
```

## 🔒 Security Considerations

### Connection Security

- Use SSL connections in production
- Implement connection pooling
- Set appropriate connection limits

### Data Protection

- All sensitive data is hashed
- Soft deletes maintain audit trails
- User permissions are role-based

## 📈 Monitoring and Maintenance

### Connection Pooling

- **Min Connections**: 2
- **Max Connections**: 10
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 30 seconds

### Automated Cleanup

- Old API calls: 30 days
- Old token prices: 7 days
- Soft-deleted records: Configurable retention

### Health Checks

```typescript
import { checkDatabaseConnection, getConnectionStatus } from '@/lib/db';

// Check connection health
const isHealthy = await checkDatabaseConnection();

// Get connection pool status
const status = await getConnectionStatus();
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify PostgreSQL is running
   - Check connection string format
   - Ensure database exists

2. **Permission Denied**
   - Verify user permissions
   - Check database ownership
   - Ensure proper grants

3. **Schema Push Fails**
   - Check for conflicting tables
   - Verify database version compatibility
   - Review error logs

### Debug Mode

Enable detailed logging in development:

```bash
# Set environment variable
export DEBUG=prisma:*

# Run with verbose output
pnpm prisma:push --verbose
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Database Design Best Practices](https://www.prisma.io/dataguide)

## 🤝 Support

For database-related issues:

1. Check the logs for detailed error messages
2. Verify environment configuration
3. Test database connectivity manually
4. Review Prisma schema syntax

---

**Note**: This database setup is designed for production use with proper security measures. Always review and customize the configuration for your specific deployment environment.
