#!/bin/bash

# RxJS DevTools Extension Build Script

echo "🔄 Building RxJS DevTools Extension..."

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean

# Compile TypeScript
echo "📦 Compiling TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful!"
    
    # Validate extension
    echo "🔍 Validating extension..."
    node scripts/validate-extension.js
    
    echo ""
    echo "🎉 Build completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Open Chrome and go to chrome://extensions/"
    echo "2. Enable 'Developer mode' (toggle in top right)"
    echo "3. Click 'Load unpacked' and select this folder:"
    echo "   $(pwd)"
    echo "4. Test with examples/test-page.html or examples/react-test-page.html"
    echo ""
    echo "🔄 For development, use: npm run watch"
    
else
    echo "❌ TypeScript compilation failed!"
    exit 1
fi

