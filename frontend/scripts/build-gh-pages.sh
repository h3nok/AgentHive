#!/bin/bash

# Exit on error
set -e

echo "Building for GitHub Pages..."

# Create .env file for production
echo "VITE_BASE_URL=/agenthive/" > .env

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the app
echo "Building the app..."
npm run build

echo "Build completed successfully!"
echo "The built files are in the 'dist' directory."
