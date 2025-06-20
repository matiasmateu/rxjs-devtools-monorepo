# 🔄 RxJS DevTools

A Chrome extension for debugging and monitoring RxJS observables in real-time, similar to Redux DevTools but specifically designed for reactive streams.

## Features

- 🔍 **Real-time Stream Monitoring**: Track observable creations, subscriptions, and emissions
- 📊 **DevTools Integration**: Dedicated panel in Chrome DevTools for stream inspection
- 🎯 **Smart Detection**: Automatically detects RxJS usage on any webpage
- 📈 **Emission Timeline**: View stream emissions with timestamps and values
- 🔧 **Developer-Friendly**: Designed for debugging reactive applications
- ⚡ **Performance Optimized**: Minimal impact on application performance

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. The RxJS DevTools icon should appear in your extension toolbar

## Usage

### Getting Started

1. **Open a webpage that uses RxJS** (Angular apps, React apps with RxJS, etc.)
2. **Open Chrome DevTools** (F12 or right-click → Inspect)
3. **Look for the "RxJS" tab** in the DevTools panel
4. **Create observables in your application** to see them appear in real-time

### DevTools Panel Features

- **Stream List**: View all active observable streams in the sidebar
- **Emission Timeline**: Click any stream to see its emission history
- **Real-time Updates**: Watch streams emit values in real-time
- **Filtering**: Search and filter streams by name
- **Pause/Resume**: Control recording of stream events
- **Clear History**: Reset all tracked streams

### Extension Popup

Click the RxJS DevTools icon in the toolbar to:
- Check if RxJS is detected on the current page
- View quick stats (stream count, total emissions)
- Get instructions for opening DevTools
- Refresh the page to re-initialize monitoring

## Files Structure

```
rxjs-devtools/
├── manifest.json          # Extension configuration
├── devtools.html          # DevTools page entry point
├── devtools.js            # DevTools panel creation
├── panel.html             # Main DevTools panel UI
├── panel.css              # DevTools panel styles
├── panel.js               # DevTools panel logic
├── popup.html             # Extension popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup functionality
├── rxjs-detector.js       # Content script for RxJS detection
├── injected-script.js     # Script injected into page context
├── background.js          # Background service worker
├── icons/                 # Extension icons
└── README.md              # This file
```

## How It Works

### Architecture

1. **Content Script** (`rxjs-detector.js`): Detects RxJS libraries and injects monitoring
2. **Injected Script** (`injected-script.js`): Patches RxJS Observable methods in page context
3. **Background Script** (`background.js`): Manages data flow and tab state
4. **DevTools Panel** (`panel.js`): Displays stream information and emissions
5. **Popup** (`popup.js`): Provides quick status and controls

### RxJS Monitoring

The extension works by:
- Detecting when RxJS is loaded on a page
- Patching Observable.prototype.subscribe to track subscriptions
- Intercepting observer callbacks to capture emissions
- Safely serializing emitted values for display
- Preserving stream identity through operator chains

## Supported RxJS Patterns

- ✅ Observable creation (new Observable, of, from, etc.)
- ✅ Operator chains (map, filter, mergeMap, etc.)
- ✅ Subject and BehaviorSubject
- ✅ Error handling (catchError)
- ✅ Completion events
- ✅ Angular HttpClient observables
- ✅ React hooks with RxJS integration
- ✅ Custom observables

## Framework Support

### React Applications

The extension fully supports React applications using RxJS:

- **State Management**: Monitor RxJS-based state stores (Redux-Observable, etc.)
- **API Calls**: Track HTTP requests using RxJS operators
- **Event Streams**: Monitor user interactions and DOM events
- **React Hooks**: Observables created within useEffect and custom hooks
- **Component Communication**: Subject-based inter-component messaging

**Common React + RxJS Patterns Supported:**
```javascript
// Custom hooks with RxJS
const useObservableState = (observable$) => {
  const [state, setState] = useState();
  useEffect(() => {
    const subscription = observable$.subscribe(setState);
    return () => subscription.unsubscribe();
  }, [observable$]);
};

// Event streams
const clicks$ = fromEvent(buttonRef.current, 'click');

// API integration
const data$ = ajax('/api/data').pipe(map(response => response.data));
```

### Angular Applications

Native support for Angular's RxJS integration:
- HttpClient observables
- Router events
- Form controls and reactive forms
- Component lifecycle hooks
- Service-based observables

## Development

### TypeScript Setup

This extension is built with TypeScript for better type safety and development experience:

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes during development
npm run watch

# Clean build artifacts
npm run clean

# Quick build with validation
./build.sh
```

### Project Structure

```
rxjs-devtools/
├── src/                   # TypeScript source files
│   ├── background.ts      # Background service worker
│   ├── devtools.ts        # DevTools panel creation
│   ├── panel.ts           # Main DevTools panel logic
│   ├── popup.ts           # Extension popup
│   ├── rxjs-detector.ts   # Content script for RxJS detection
│   └── injected-script.ts # Page context script for patching
├── dist/                  # Compiled JavaScript (auto-generated)
├── types/                 # TypeScript type definitions
├── icons/                 # Extension icons
├── *.html                 # HTML files
├── *.css                  # Stylesheets
├── manifest.json          # Extension manifest
└── package.json           # Dependencies and scripts
```

### Making Changes

1. Modify TypeScript files in the `src/` directory
2. Run `npm run build` to compile
3. Go to `chrome://extensions/`
4. Click the refresh icon on the RxJS DevTools extension
5. Reload the page you're testing
6. Open DevTools to see changes

**For active development:** Use `npm run watch` to automatically recompile on file changes.

### Testing

Test the extension on pages that use RxJS:
- **Angular applications** - Full framework support with automatic detection
- **React apps with RxJS** - State management, async operations, and hooks integration
- **Standalone RxJS projects** - Direct Observable usage
- **Observable examples** from RxJS documentation

#### Test Pages Included

1. **`test-page.html`** - Basic RxJS patterns and operators
2. **`react-test-page.html`** - React + RxJS integration examples

To test locally:
```bash
# Open test pages in Chrome
open test-page.html
open react-test-page.html
```

### Debugging

Enable verbose logging:
1. Open the extension's background page console
2. Look for messages prefixed with "🔄 RxJS DevTools"
3. Check the browser console for injected script logs

## Permissions

- `activeTab`: Access to the current active tab for RxJS detection
- `scripting`: Inject monitoring scripts into web pages

## Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **RxJS**: Versions 6.x and 7.x
- **Frameworks**: Angular, React, Vue.js, vanilla JavaScript

## Known Limitations

- Cannot monitor observables created before the extension loads
- Some bundlers may interfere with Observable patching
- Very high-frequency streams may impact performance
- Complex object serialization may be truncated

## Contributing

Contributions are welcome! Please feel free to:
- Report bugs or suggest features
- Submit pull requests
- Improve documentation
- Add support for additional RxJS patterns

## Resources

- [RxJS Documentation](https://rxjs.dev/)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [DevTools Extension Guide](https://developer.chrome.com/docs/extensions/mv3/devtools/)
- [RxJS Operators](https://rxjs.dev/guide/operators)

