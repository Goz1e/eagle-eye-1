# Vercel Database Setup Guide for Eagle Eye

This guide explains how to set up your database connection strings in Vercel for deployment.

## 🗄️ **Database Connection Strings**

### **Required Environment Variables**

You need to set these in your Vercel dashboard:

```env
DATABASE_URL="postgresql://username:password@hostname:5432/dbname"
DIRECT_URL="postgresql://username:password@hostname:5432/dbname"
```

### **Where to Get These Values**

#### **Option 1: Vercel Postgres (Recommended)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose your plan and region
6. Once created, go to **Settings** → **Environment Variables**
7. Copy the connection strings provided

#### **Option 2: External PostgreSQL Service**

If using an external service (Supabase, PlanetScale, etc.):

1. Get your connection string from the service dashboard
2. Use the same string for both `DATABASE_URL` and `DIRECT_URL`
3. Ensure the database is accessible from Vercel's servers

## 🔧 **Setting Environment Variables in Vercel**

### **Step 1: Access Environment Variables**

1. Go to your Vercel project dashboard
2. Click **Settings** tab
3. Click **Environment Variables** in the left sidebar

### **Step 2: Add Database Variables**

Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://username:password@hostname:5432/dbname` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://username:password@hostname:5432/dbname` | Production, Preview, Development |

### **Step 3: Deploy**

After adding the environment variables:

1. Commit and push your code
2. Vercel will automatically redeploy
3. The build process will use these variables

## 🚀 **Deployment Process**

### **1. Local Testing**

Before deploying, test locally:

```bash
# Set your production database URL locally
export DATABASE_URL="your_production_db_url"
export DIRECT_URL="your_production_db_url"

# Test the build
npm run build

# Test database connection
npm run dev
# Then visit: http://localhost:3000/api/test-db
```

### **2. Deploy to Vercel**

```bash
# Use the deployment script
./scripts/deploy-vercel.sh

# Or deploy manually
vercel --prod
```

### **3. Verify Deployment**

After deployment:

1. Check Vercel build logs for any errors
2. Test your API endpoints
3. Verify database connectivity

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Build Failures**

**Error**: `Environment variable not found: DATABASE_URL`

**Solution**: Ensure both `DATABASE_URL` and `DIRECT_URL` are set in Vercel

#### **2. Database Connection Errors**

**Error**: `Connection refused` or `Authentication failed`

**Solution**: 
- Verify connection strings are correct
- Check database firewall settings
- Ensure database is accessible from Vercel

#### **3. Prisma Client Generation Fails**

**Error**: `Prisma Client is not generated`

**Solution**: 
- Check build logs for Prisma errors
- Verify environment variables are loaded
- Ensure `postinstall` script runs: `prisma generate`

### **Debug Commands**

```bash
# Check environment variables
vercel env ls

# View build logs
vercel logs

# Test database connection locally
npx prisma db pull
```

## 📊 **Database Schema Verification**

After deployment, verify your database schema:

```bash
# Connect to your production database
psql "your_production_connection_string"

# List tables
\dt

# Check table structure
\d "User"
\d "Report"
\d "SavedSearch"
```

## 🔐 **Security Best Practices**

### **1. Connection String Security**

- Never commit `.env` files to git
- Use Vercel's environment variable management
- Rotate database credentials regularly

### **2. Database Access**

- Use least-privilege database users
- Enable SSL connections
- Implement proper authentication

### **3. Environment Separation**

- Use different databases for development/staging/production
- Never share production credentials
- Test with production-like data in staging

## 📚 **Additional Resources**

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🆘 **Getting Help**

If you encounter issues:

1. Check Vercel build logs
2. Verify environment variables are set correctly
3. Test database connectivity locally
4. Review Prisma schema syntax
5. Check database service status

For additional support, refer to the main Eagle Eye documentation or create an issue in the repository.
