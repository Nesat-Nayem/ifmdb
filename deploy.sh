#!/bin/bash

# MovieMart Backend Auto-Deploy Script
# This script is called by GitHub Actions after push to main

set -e  # Exit on any error

echo "🚀 Starting deployment..."
echo "📅 $(date)"

cd /var/www/backend

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git fetch --all
git reset --hard origin/main

# Install dependencies if package.json changed
echo "📦 Installing dependencies..."
npm install --production

# Build TypeScript (if needed)
echo "🔨 Building..."
npm run build 2>/dev/null || echo "No build script, skipping..."

# Reload PM2
echo "🔄 Reloading PM2..."
pm2 reload bigsell-api

echo "✅ Deployment completed successfully!"
echo "📅 $(date)"
