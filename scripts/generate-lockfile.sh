#!/bin/bash
# Generate package-lock.json
# Run this if you have network connectivity issues and want to generate the lock file later

set -e

echo "🔒 Generating package-lock.json..."
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Check if package-lock.json already exists
if [ -f "package-lock.json" ]; then
    echo "⚠️  package-lock.json already exists"
    read -p "   Regenerate? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Skipping..."
        exit 0
    fi
    rm package-lock.json
fi

# Install dependencies to generate lock file
echo "📥 Installing dependencies to generate lock file..."
npm install

if [ -f "package-lock.json" ]; then
    echo ""
    echo "✅ package-lock.json generated successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Commit package-lock.json to version control"
    echo "   2. Run ./scripts/build-for-production.sh"
else
    echo ""
    echo "❌ Failed to generate package-lock.json"
    echo "   Check your network connection and npm registry access"
    exit 1
fi

