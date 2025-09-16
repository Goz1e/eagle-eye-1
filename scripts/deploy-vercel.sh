#!/bin/bash

# Eagle Eye Vercel Deployment Script
# This script helps prepare and deploy Eagle Eye to Vercel

set -e

echo "🚀 Eagle Eye Vercel Deployment Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the eagle-eye directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Prisma configuration check removed - no database required

# Check for required environment variables
echo "🔍 Checking environment variables..."
if [ -z "$DATABASE_URL" ] && [ -f ".env.local" ]; then
    echo "⚠️  DATABASE_URL not set in environment, checking .env.local..."
    export DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2- | tr -d '"')
fi

if [ -z "$DIRECT_URL" ] && [ -f ".env.local" ]; then
    echo "⚠️  DIRECT_URL not set in environment, checking .env.local..."
    export DIRECT_URL=$(grep "^DIRECT_URL=" .env.local | cut -d'=' -f2- | tr -d '"')
fi

# Validate environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required."
    echo "   Please set it in your environment or .env.local file."
    echo "   Format: DATABASE_URL=\"postgresql://username:password@hostname:5432/dbname\""
    exit 1
fi

if [ -z "$DIRECT_URL" ]; then
    echo "❌ Error: DIRECT_URL environment variable is required."
    echo "   Please set it in your environment or .env.local file."
    echo "   Format: DIRECT_URL=\"postgresql://username:password@hostname:5432/dbname\""
    exit 1
fi

echo "✅ Environment variables found:"
echo "   DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "   DIRECT_URL: ${DIRECT_URL:0:50}..."

# No Prisma client generation needed

# Check if build works locally
echo "🏗️  Testing build locally..."
npm run build

echo "✅ Local build successful!"

# Check if project is linked to Vercel
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking project to Vercel..."
    vercel link
else
    echo "✅ Project already linked to Vercel"
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo "📱 Your app should now be live on Vercel!"
echo "🔍 Check the deployment logs above for any issues."
echo ""
echo "📋 Next steps:"
echo "   1. Go to your Vercel dashboard"
echo "   2. Navigate to Settings → Environment Variables"
echo "   3. Ensure DATABASE_URL and DIRECT_URL are set correctly"
echo "   4. Redeploy if needed: vercel --prod"
