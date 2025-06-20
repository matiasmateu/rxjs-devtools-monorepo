// Auto-initialization for RxJS DevTools
// Import this file to automatically initialize DevTools with default settings

import { initializeRxJSDevTools } from './utils';

// Auto-initialize with sensible defaults
const devTools = initializeRxJSDevTools({
  name: 'React App',
  enabled: process.env.NODE_ENV === 'development',
  logObservables: true,
});

console.log('🔄 RxJS DevTools: Auto-initialized for React');

// Re-export everything for convenience
export * from './RxJSDevTools';
export * from './hooks';
export * from './utils';
export { devTools as rxjsDevTools };

