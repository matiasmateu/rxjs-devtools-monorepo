# RxJS DevTools

A comprehensive debugging solution for RxJS streams, consisting of a Chrome extension and React integration library.

![RxJS DevTools Demo](./assets/demo.gif)

## 🚀 Features

- **Chrome Extension**: Full-featured DevTools panel for RxJS debugging
- **React Integration**: Seamless integration with React applications
- **Stream Visualization**: Real-time stream monitoring and emission tracking
- **Performance Friendly**: Automatically disabled in production
- **TypeScript Support**: Full type definitions included
- **Easy Setup**: Multiple integration options for different use cases

## 📦 Packages

This monorepo contains two main packages:

### 1. Chrome Extension (`packages/extension`)

A Chrome DevTools extension that provides a dedicated panel for debugging RxJS streams.

**Features:**
- Real-time stream monitoring
- Emission history with timestamps
- Stream filtering and search
- Performance optimized with throttling
- Global hook integration for any JavaScript app

### 2. React Integration (`packages/react-integration`)

An NPM package providing React hooks and utilities for easy RxJS DevTools integration.

**Features:**
- React hooks for tracking observables
- Utility functions and decorators
- TypeScript support
- Auto-initialization options
- Development-only execution

## 🏃‍♂️ Quick Start

### Install the Chrome Extension

1. Download the extension from the [Chrome Web Store](link-to-store) or build it locally
2. Enable the extension in Chrome
3. Open Chrome DevTools and look for the "RxJS" tab

### Add to Your React App

```bash
npm install rxjs-devtools
```

```typescript
// Option 1: Auto-initialization (recommended)
import 'rxjs-devtools/auto';

// Option 2: Manual setup
import { useRxJSDevTools } from 'rxjs-devtools';

function App() {
  useRxJSDevTools({ name: 'My App' });
  return <div>My App</div>;
}
```

### Track Your Observables

```typescript
import { useTrackedObservable } from 'rxjs-devtools';

function MyComponent() {
  const data$ = useTrackedObservable(
    () => interval(1000).pipe(map(n => `Data ${n}`)),
    'My Data Stream'
  );
  
  // Your component logic...
}
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser for testing

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/rxjs-devtools.git
cd rxjs-devtools

# Install dependencies
npm install

# Build all packages
npm run build
```

### Building Individual Packages

```bash
# Build Chrome extension
npm run build:extension

# Build React integration
npm run build:react
```

### Development Workflow

```bash
# Start development mode for all packages
npm run dev

# Or start individual packages
npm run dev --workspace=packages/extension
npm run dev --workspace=packages/react-integration
```

### Testing the Extension

1. Build the extension: `npm run build:extension`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `packages/extension/dist`
5. Open a page with RxJS streams and check the DevTools

## 📖 Documentation

### Chrome Extension

The Chrome extension provides a DevTools panel that automatically detects RxJS usage and displays stream information.

**Key Features:**
- Automatic RxJS detection
- Real-time stream monitoring
- Emission filtering and search
- Stream pause/resume functionality
- Memory-efficient with automatic cleanup

### React Integration

The React package provides multiple ways to integrate with the DevTools:

**Hooks:**
- `useRxJSDevTools()` - Initialize DevTools
- `useTrackedObservable()` - Track individual observables
- `useObservableFactory()` - Create tracked observables dynamically

**Utilities:**
- `trackObservable()` - Track any observable
- `TrackedObservable` decorator - Automatic method tracking
- `withTracking()` - Higher-order function wrapper

## 🔌 Integration Examples

### Basic React Integration

```typescript
import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { useTrackedObservable } from 'rxjs-devtools';

function TimerApp() {
  const timer$ = useTrackedObservable(
    () => interval(1000).pipe(map(n => `Count: ${n}`)),
    'Timer Stream'
  );

  const [count, setCount] = useState('');

  useEffect(() => {
    const sub = timer$.subscribe(setCount);
    return () => sub.unsubscribe();
  }, [timer$]);

  return <div>{count}</div>;
}
```

### Service Class Integration

```typescript
import { TrackedObservable } from 'rxjs-devtools';

class DataService {
  @TrackedObservable('User API Calls')
  getUsers() {
    return this.http.get('/api/users');
  }

  @TrackedObservable('WebSocket Messages')
  getRealtimeUpdates() {
    return this.websocket.messages$;
  }
}
```

### Redux Observable Integration

```typescript
import { trackObservable } from 'rxjs-devtools';

const fetchUserEpic = (action$, state$) =>
  action$.pipe(
    ofType('FETCH_USER'),
    switchMap(() =>
      trackObservable(
        ajax.getJSON('/api/user').pipe(
          map(user => ({ type: 'FETCH_USER_SUCCESS', payload: user }))
        ),
        'Fetch User Epic'
      )
    )
  );
```

## 🎯 Use Cases

### Development Debugging

- **Stream Flow Visualization**: See exactly when and what your observables emit
- **Performance Analysis**: Identify streams that emit too frequently
- **Error Tracking**: Monitor error emissions and their sources
- **Memory Leak Detection**: Track uncompleted streams

### Learning RxJS

- **Educational Tool**: Perfect for learning how RxJS operators work
- **Real-time Feedback**: See the immediate effect of operator chains
- **Debugging Practice**: Learn to identify common RxJS patterns and anti-patterns

### Team Collaboration

- **Code Reviews**: Share stream behavior during code reviews
- **Bug Reports**: Include DevTools screenshots in bug reports
- **Documentation**: Create visual documentation of complex stream flows

## 🛠️ Architecture

### Chrome Extension Architecture

```
├── Background Script (background.ts)
│   ├── Message routing
│   ├── Tab management
│   └── DevTools communication
├── Content Script (rxjs-detector.ts)
│   ├── RxJS detection
│   ├── Script injection
│   └── Message forwarding
├── DevTools Panel (panel.ts)
│   ├── UI management
│   ├── Stream visualization
│   └── User interactions
└── Injected Script (injected-script.ts)
    ├── Observable patching
    ├── Global hook installation
    └── Stream monitoring
```

### React Integration Architecture

```
├── Core Class (RxJSDevTools.ts)
│   ├── Extension connection
│   ├── Observable tracking
│   └── Message handling
├── React Hooks (hooks.ts)
│   ├── useRxJSDevTools
│   ├── useTrackedObservable
│   └── useObservableFactory
├── Utilities (utils.ts)
│   ├── Global initialization
│   ├── Tracking helpers
│   └── Decorators
└── Auto-init (auto.ts)
    └── Automatic setup
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- TypeScript for all new code
- ESLint and Prettier for formatting
- Conventional commit messages
- Comprehensive JSDoc documentation

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by Redux DevTools
- Built with love for the RxJS community
- Thanks to all contributors and users

## 📞 Support

- 🐛 [Report bugs](https://github.com/your-username/rxjs-devtools/issues)
- 💡 [Request features](https://github.com/your-username/rxjs-devtools/issues)
- 💬 [Join discussions](https://github.com/your-username/rxjs-devtools/discussions)
- 📧 Email: your-email@example.com

---

Made with ❤️ for the RxJS community

