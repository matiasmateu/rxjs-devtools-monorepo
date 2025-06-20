# RxJS DevTools - React Integration

A powerful React integration for the RxJS DevTools Chrome extension. Debug and visualize your RxJS streams directly in Chrome DevTools.

## Features

- 🔄 **Seamless Integration**: Easy setup with React applications
- 🎣 **React Hooks**: Purpose-built hooks for tracking observables
- 🔧 **Utility Functions**: Helper functions for common patterns
- 🎯 **TypeScript Support**: Full TypeScript support with type definitions
- 🚀 **Auto-initialization**: Optional auto-setup for quick start
- 🎨 **Decorator Support**: Class method decorators for clean code
- 🔍 **Development-only**: Automatically disabled in production

## Installation

```bash
npm install rxjs-devtools
# or
yarn add rxjs-devtools
```

You'll also need the [RxJS DevTools Chrome Extension](link-to-extension).

## Quick Start

### Option 1: Auto-initialization (Recommended)

```typescript
// In your main app file (index.tsx or App.tsx)
import 'rxjs-devtools/auto';

// That's it! DevTools is now ready to use throughout your app
```

### Option 2: Manual initialization

```typescript
// In your root component
import { useRxJSDevTools } from 'rxjs-devtools';

function App() {
  useRxJSDevTools({
    name: 'My React App',
    enabled: process.env.NODE_ENV === 'development',
  });

  return <div>{/* Your app */}</div>;
}
```

## Usage Examples

### Tracking Observables with Hooks

```typescript
import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { useTrackedObservable } from 'rxjs-devtools';

function TimerComponent() {
  // This observable will appear in DevTools as "Timer Stream"
  const timer$ = useTrackedObservable(
    () => interval(1000).pipe(map(n => `Timer: ${n}`)),
    'Timer Stream'
  );

  const [value, setValue] = useState('');

  useEffect(() => {
    const subscription = timer$.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [timer$]);

  return <div>{value}</div>;
}
```

### Dynamic Observables

```typescript
import { useObservableFactory } from 'rxjs-devtools';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchResults$ = useObservableFactory(
    () => {
      // Create observable based on current search term
      return searchService.search(searchTerm);
    },
    [searchTerm], // Dependencies
    'Search Results'
  );

  // Use the observable...
}
```

### Utility Functions

```typescript
import { trackObservable } from 'rxjs-devtools';

// Track any observable
const clicks$ = trackObservable(
  fromEvent(document, 'click'),
  'Document Clicks'
);
```

### Class Decorators

```typescript
import { TrackedObservable } from 'rxjs-devtools';

class DataService {
  @TrackedObservable('User Data')
  getUserData() {
    return this.http.get('/api/users');
  }

  @TrackedObservable('Real-time Updates')
  getRealTimeUpdates() {
    return this.websocket.messages$;
  }
}
```

### Higher-Order Functions

```typescript
import { withTracking } from 'rxjs-devtools';

const createTimerStream = withTracking(
  (interval: number) => timer(0, interval),
  'Timer Factory'
);

// Each call creates a tracked observable
const timer1$ = createTimerStream(1000);
const timer2$ = createTimerStream(2000);
```

## API Reference

### Hooks

#### `useRxJSDevTools(options?)`

Initialize DevTools in your root component.

```typescript
const devTools = useRxJSDevTools({
  name: 'My App',           // App name in DevTools
  enabled: true,            // Enable/disable DevTools
  logObservables: true,     // Track observables
  maxRetries: 50,          // Connection retry attempts
  retryInterval: 500,      // Retry interval (ms)
});
```

#### `useTrackedObservable(observable, name?)`

Track a single observable.

```typescript
const tracked$ = useTrackedObservable(myObservable$, 'Stream Name');
```

#### `useTrackedObservables(observables)`

Track multiple observables at once.

```typescript
const tracked = useTrackedObservables({
  users: users$,
  notifications: notifications$,
  updates: updates$,
});
```

#### `useObservableFactory(factory, deps, name?)`

Create and track observables dynamically.

```typescript
const dynamic$ = useObservableFactory(
  () => createObservable(param),
  [param],
  'Dynamic Stream'
);
```

### Utility Functions

#### `initializeRxJSDevTools(options?)`

Initialize DevTools globally.

#### `trackObservable(observable, name?)`

Track any observable.

#### `TrackedObservable(name?)`

Decorator for class methods that return observables.

#### `withTracking(fn, name?)`

Wrap functions that return observables.

#### `trackInDevelopment(observable, name?)`

Only track in development mode.

## Configuration Options

```typescript
interface RxJSDevToolsOptions {
  name?: string;           // App name (default: 'React App')
  enabled?: boolean;       // Enable DevTools (default: NODE_ENV === 'development')
  logObservables?: boolean; // Track observables (default: true)
  maxRetries?: number;     // Connection retries (default: 50)
  retryInterval?: number;  // Retry interval in ms (default: 500)
}
```

## Best Practices

### 1. Use Meaningful Names

```typescript
// Good
const userClicks$ = useTrackedObservable(clicks$, 'User Click Events');

// Bad
const stream$ = useTrackedObservable(clicks$, 'Stream 1');
```

### 2. Initialize Once

Only call `useRxJSDevTools()` or `initializeRxJSDevTools()` once in your app, preferably in the root component.

### 3. Development Only

DevTools automatically disables in production, but you can explicitly control this:

```typescript
const devTools = useRxJSDevTools({
  enabled: process.env.NODE_ENV === 'development',
});
```

### 4. Clean Up Subscriptions

Always unsubscribe from observables to prevent memory leaks:

```typescript
useEffect(() => {
  const subscription = stream$.subscribe(handler);
  return () => subscription.unsubscribe();
}, [stream$]);
```

## Troubleshooting

### DevTools Not Connecting

1. Make sure the Chrome extension is installed and enabled
2. Check that you're in development mode
3. Verify the extension has permission to access your domain
4. Look for connection logs in the browser console

### Observables Not Appearing

1. Ensure observables are subscribed to (cold observables won't emit)
2. Check that tracking is enabled in your configuration
3. Verify the observable is created after DevTools initialization

### Performance Issues

1. Use meaningful names to avoid confusion
2. Limit the number of tracked observables in production
3. Consider using `trackInDevelopment()` for conditional tracking

## Examples

See the [examples file](src/examples.tsx) for comprehensive usage patterns.

## License

MIT

## Contributing

See the main repository for contribution guidelines.

