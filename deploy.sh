#!/bin/bash
set -e

# Configuration
# NAS is now handled via reliable symlinks in /var/www/html/ziyo-web/public/uploads/nas
# No need to mask anything as #recycle is excluded from symlinks.

# Ensure we are in the project root
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root."
    exit 1
fi

# Stop app
echo "Stopping application..."
pm2 stop ziyo-web || true

# Build
echo "Building application..."
# Create temporary .eslintignore to skip linting during build
echo "*" > .eslintignore
export NODE_OPTIONS="--max-old-space-size=6144"

npm run build 
BUILD_STATUS=$?

# Remove temporary .eslintignore
rm .eslintignore

if [ $BUILD_STATUS -ne 0 ]; then
    echo "Build failed!"
    exit $BUILD_STATUS
fi

echo "Preparing standalone deployment..."
# Create directory structure
mkdir -p .next/standalone/.next/static

# Copy static assets
cp -r .next/static/. .next/standalone/.next/static/

# Copy public folder (Symlinks in public/uploads/nas will be copied as symlinks)
cp -a public .next/standalone/

echo "Updating running application..."
pm2 stop ziyo-web || true

# Copy standalone files to current directory
cp -a .next/standalone/. .

echo "Restarting service..."
pm2 restart ziyo-web || pm2 start server.js --name ziyo-web

echo "Deployment completed successfully!"
