# 🔄 RxJS DevTools

A Chrome extension for debugging and monitoring RxJS observables in real-time, built with TypeScript for enhanced type safety and developer experience.

## ✨ Features

- 🔍 **Real-time Stream Monitoring** - Track observable creations, subscriptions, and emissions
- 📊 **DevTools Integration** - Dedicated panel in Chrome DevTools for stream inspection  
- 🎯 **Smart Detection** - Automatically detects RxJS usage in Angular, React, and vanilla JS apps
- 📈 **Emission Timeline** - View stream emissions with timestamps and values
- ⚡ **Performance Optimized** - Minimal impact on application performance
- 🔧 **TypeScript Support** - Full type safety and enhanced development experience

## 🚀 Quick Start

### Installation

1. **Build the Extension:**
   ```bash
   npm install
   ./scripts/build.sh
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"  
   - Click "Load unpacked" → select this folder

3. **Test with Examples:**
   ```bash
   open examples/test-page.html        # Basic RxJS patterns
   open examples/react-test-page.html  # React + RxJS integration
   ```

## 📁 Project Structure

```
rxjs-devtools/
├── 📦 Extension Core
│   ├── manifest.json              # Extension configuration
│   ├── public/                    # UI files
│   │   ├── devtools.html         # DevTools entry point
│   │   ├── panel.html            # Main DevTools panel
│   │   ├── popup.html            # Extension popup
│   │   └── *.css                 # Stylesheets
│   └── icons/                    # Extension icons
│
├── 💻 Source Code (TypeScript)
│   ├── src/                      # TypeScript source files
│   │   ├── background.ts         # Background service worker
│   │   ├── devtools.ts          # DevTools creation
│   │   ├── panel.ts             # Main panel logic
│   │   ├── popup.ts             # Popup functionality
│   │   ├── rxjs-detector.ts     # Content script
│   │   └── injected-script.ts   # Page context script
│   └── types/                   # Type definitions
│
├── 🏗️ Build System
│   ├── dist/                    # Compiled JavaScript (auto-generated)
│   ├── scripts/                 # Build and utility scripts
│   │   ├── build.sh            # Main build script
│   │   └── validate-extension.js # Validation script
│   └── tsconfig.json           # TypeScript configuration
│
├── 🧪 Testing & Examples
│   ├── examples/               # Test pages
│   │   ├── test-page.html     # Basic RxJS testing
│   │   └── react-test-page.html # React integration
│   └── tests/                 # Future test files
│
└── 📚 Documentation
    └── docs/                  # Detailed documentation
        ├── README.md         # Main documentation
        ├── TYPESCRIPT.md     # TypeScript guide  
        └── PROJECT_SUMMARY.md # Project overview
```

## 🛠️ Development

### Build Commands

```bash
# One-time build
npm run build

# Watch mode (rebuilds on changes)
npm run watch

# Full build with validation
./scripts/build.sh

# Validate extension structure
npm run validate
```

### Making Changes

1. Edit TypeScript files in `src/`
2. Run `npm run build` or `npm run watch`
3. Reload extension in `chrome://extensions/`
4. Test changes with example pages

## 🎯 Framework Support

### ✅ React Applications
- **State Management** - Redux-Observable, RxJS stores
- **Hooks Integration** - Custom hooks with observables
- **Event Streams** - DOM events and user interactions
- **HTTP Requests** - API calls with RxJS operators

### ✅ Angular Applications  
- **HttpClient Observables** - HTTP request monitoring
- **Reactive Forms** - Form control streams
- **Router Events** - Navigation streams
- **Service Integration** - Service-based observables

### ✅ Vanilla JavaScript
- **Direct Observable Usage** - Any RxJS implementation
- **Custom Operators** - User-defined operators
- **Third-party Libraries** - Libraries using RxJS

## 🧪 Testing

### Test with Included Examples

```bash
# Basic RxJS patterns
open examples/test-page.html

# React + RxJS integration  
open examples/react-test-page.html
```

### Test with Your Applications

1. Load the extension in Chrome
2. Navigate to your app using RxJS
3. Open DevTools → "RxJS" tab
4. Create observables to see them tracked

## 📖 Documentation

- **[docs/README.md](docs/README.md)** - Complete usage guide
- **[docs/TYPESCRIPT.md](docs/TYPESCRIPT.md)** - TypeScript migration details
- **[examples/README.md](examples/README.md)** - Testing examples guide
- **[scripts/README.md](scripts/README.md)** - Build scripts documentation

## 🔧 Configuration

### TypeScript

The project uses strict TypeScript configuration:
- ES2020 target for modern browsers
- Strict null checks and type checking
- Source maps for debugging
- Chrome extension API types

### Build Process

1. **Clean** - Remove old artifacts
2. **Compile** - TypeScript → JavaScript  
3. **Validate** - Check structure and dependencies
4. **Package** - Ready for Chrome loading

## 🐛 Troubleshooting

### Extension Won't Load
- Check `npm run validate` output
- Verify all files in `dist/` exist
- Check browser console for errors

### RxJS Not Detected
- Refresh page after loading extension
- Check if RxJS is bundled vs global
- Open browser console for detection logs

### Streams Not Appearing
- Verify observables are being subscribed to
- Check DevTools console for patch errors
- Try the test pages to verify functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with TypeScript types
4. Test with included examples
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [RxJS Documentation](https://rxjs.dev/)
- [Chrome Extensions Guide](https://developer.chrome.com/docs/extensions/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

