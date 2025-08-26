# Vercel Deployment Guide for Eagle Eye

This guide covers deploying Eagle Eye with Prisma on Vercel, including database setup and configuration.

## 🚀 Prerequisites

- Vercel account
- PostgreSQL database (Vercel Postgres, Supabase, PlanetScale, etc.)
- GitHub repository with Eagle Eye code

## 📦 Package.json Scripts

The following scripts have been configured for Vercel deployment:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate",
    "dev": "next dev --turbopack",
    "start": "next start"
  }
}
```

### Script Explanations

- **`build`**: Generates Prisma client before building the Next.js app
- **`postinstall`**: Ensures Prisma client is generated after npm install
- **`dev`**: Development server with Turbopack
- **`start`**: Production server startup

## 🔧 Vercel Configuration

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "PRISMA_GENERATE_DATAPROXY": "true"
  }
}
```

### Configuration Details

- **`buildCommand`**: Uses our custom build script
- **`installCommand`**: Standard npm install
- **`framework`**: Specifies Next.js framework
- **`functions`**: Sets Node.js 18.x runtime for API routes
- **`env`**: Enables Prisma Data Proxy generation

## 🗄️ Database Setup

### 1. Vercel Postgres (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Create Postgres database
vercel storage create postgres

# Add environment variables
vercel env add DATABASE_URL
```

### 2. Alternative Databases

#### Supabase
```bash
# Create project at supabase.com
# Get connection string from Settings > Database
# Add to Vercel environment variables
```

#### PlanetScale
```bash
# Create database at planetscale.com
# Get connection string from Connect
# Add to Vercel environment variables
```

### 3. Environment Variables

Add these to your Vercel project:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
NODE_ENV="production"
```

## 🔄 Prisma Schema Configuration

### Updated Generator

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}
```

### Benefits

- **Custom Output**: Prevents conflicts with Vercel's build process
- **Cleaner Builds**: Separates generated code from source
- **Better Caching**: Improves build performance

## 🚀 Deployment Steps

### 1. Prepare Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

```bash
# Deploy from CLI
vercel --prod

# Or deploy from Vercel dashboard
# Connect GitHub repository and deploy
```

### 3. Verify Deployment

```bash
# Check build logs
vercel logs

# Check function status
vercel functions list
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Prisma Client Generation Fails

**Error**: `Prisma Client is not generated`

**Solution**:
```bash
# Ensure postinstall script runs
npm run postinstall

# Check Prisma version compatibility
npm list prisma @prisma/client
```

#### 2. Database Connection Issues

**Error**: `Connection refused` or `Authentication failed`

**Solution**:
- Verify `DATABASE_URL` in Vercel environment variables
- Check database firewall settings
- Ensure database is accessible from Vercel's IP ranges

#### 3. Build Failures

**Error**: `Build command failed`

**Solution**:
```bash
# Test build locally
npm run build

# Check Prisma schema syntax
npx prisma validate

# Verify all dependencies are installed
npm install
```

### Debug Commands

```bash
# Validate Prisma schema
npx prisma validate

# Generate Prisma client
npx prisma generate

# Test database connection
npx prisma db pull

# Check Prisma version
npx prisma --version
```

## 📊 Performance Optimization

### 1. Connection Pooling

For production databases, consider connection pooling:

```env
DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=5&pool_timeout=2"
```

### 2. Prisma Client Caching

```typescript
// lib/prisma.ts
import { PrismaClient } from './generated/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. Edge Runtime (Optional)

For API routes that don't need full Node.js:

```typescript
export const runtime = 'edge'

export async function GET() {
  // Edge-compatible code
}
```

## 🔐 Security Considerations

### 1. Environment Variables

- Never commit `.env` files
- Use Vercel's environment variable management
- Rotate database credentials regularly

### 2. Database Access

- Use least-privilege database users
- Enable SSL connections
- Implement proper authentication

### 3. API Security

- Rate limiting (already implemented)
- Input validation (Zod schemas)
- CORS configuration

## 📈 Monitoring

### 1. Vercel Analytics

- Function execution times
- Error rates
- Build performance

### 2. Database Monitoring

- Connection pool usage
- Query performance
- Error logs

### 3. Application Metrics

- API response times
- Cache hit rates
- User engagement

## 🚀 Post-Deployment

### 1. Database Migrations

```bash
# Run migrations on production
npx prisma migrate deploy

# Seed production data (if needed)
npm run prisma:seed
```

### 2. Health Checks

```typescript
// app/api/health/route.ts
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: 'healthy', database: 'connected' })
  } catch (error) {
    return Response.json({ status: 'unhealthy', database: 'disconnected' }, { status: 500 })
  }
}
```

### 3. Performance Testing

```bash
# Test API endpoints
curl https://your-app.vercel.app/api/health

# Load test critical endpoints
npm install -g artillery
artillery quick --count 100 --num 10 https://your-app.vercel.app/api/wallet/events
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL on Vercel](https://vercel.com/docs/storage/vercel-postgres)

## 🆘 Support

If you encounter issues:

1. Check Vercel build logs
2. Verify environment variables
3. Test database connectivity
4. Review Prisma schema syntax
5. Check dependency versions

For additional help, refer to the main Eagle Eye documentation or create an issue in the repository.
