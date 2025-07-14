#!/bin/bash

# Exit on error and print commands as they are executed
set -ex

echo "🚀 Starting GitHub Pages deployment..."

# Navigate to frontend directory
echo "📁 Moving to frontend directory..."
cd frontend

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf node_modules/.vite
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --prefer-offline

# Build for GitHub Pages
echo "🔨 Building for GitHub Pages..."
NODE_OPTIONS=--max-old-space-size=4096 npm run build:gh-pages

# Install gh-pages if not already installed
if ! command -v gh-pages &> /dev/null; then
    echo "📦 Installing gh-pages..."
    npm install --save-dev gh-pages
fi

# Create CNAME file if it doesn't exist
if [ ! -f "dist/CNAME" ] && [ -f "public/CNAME" ]; then
    echo "🌐 Copying CNAME file..."
    cp public/CNAME dist/
fi

# Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npx gh-pages -d dist -t true

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site should be live at: https://$(git config --get user.name).github.io/agenthive"
echo ""
echo "💡 If you encounter any issues:"
echo "1. Make sure you have set up GitHub Pages in your repository settings"
echo "2. Check the GitHub Actions tab for any build errors"
echo "3. Ensure your repository is public if using a free GitHub account"
