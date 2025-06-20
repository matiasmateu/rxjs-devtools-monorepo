// RxJS DevTools - Injected Script
// This script runs in the page context to patch RxJS observables

// Type definitions
interface NewStreamMessage {
  type: 'new-stream';
  data: {
    id: string;
    name: string;
    type: string;
    timestamp: number;
  };
}

interface StreamEmissionMessage {
  type: 'stream-emission';
  data: {
    streamId: string;
    type: 'next' | 'error' | 'complete';
    value: any;
    timestamp: number;
  };
}

interface StreamCompleteMessage {
  type: 'stream-complete';
  data: {
    id: string;
    timestamp: number;
  };
}

interface StreamErrorMessage {
  type: 'stream-error';
  data: {
    id: string;
    error: any;
    timestamp: number;
  };
}

interface RxJSObservable {
  subscribe(observer?: any): any;
  pipe(...operators: any[]): RxJSObservable;
  __rxjsDevToolsId?: string;
  __rxjsDevToolsOriginalSubscribe?: Function;
}

interface TrackedStreamInfo {
  id: string;
  name: string;
  subscriptions: number;
  emissions: number;
}

((): void => {
  'use strict';

  console.log('🔄 RxJS DevTools: Injected script starting execution...');
  
  try {
    console.log('🔄 RxJS DevTools: Environment check - window object:', typeof window);
    console.log('🔄 RxJS DevTools: Environment check - document object:', typeof document);
    console.log('🔄 RxJS DevTools: Environment check - postMessage:', typeof window.postMessage);
  } catch (error) {
    console.error('🔄 RxJS DevTools: Environment check failed:', error);
  }

  // Tracking variables
  let streamIdCounter = 0;
  const trackedStreams = new Map<string, TrackedStreamInfo>();

  // Create unique stream ID
  function createStreamId(): string {
    return `rxjs-stream-${++streamIdCounter}`;
  }

  // Message throttling to prevent flooding
  const messageQueues = new Map<string, any[]>();
  const THROTTLE_INTERVAL = 100; // ms
  const MAX_EMISSIONS_PER_INTERVAL = 10;

  // Send message to content script with throttling
  function sendMessage(type: string, data: any): void {
    const message = {
      type,
      source: 'rxjs-devtools-injected',
      data,
      timestamp: Date.now()
    };
    
    // Always send stream registration messages immediately
    if (type === 'new-stream' || type === 'stream-error' || type === 'stream-complete') {
      window.postMessage(message, '*');
      return;
    }
    
    // Throttle emission messages to prevent flooding
    if (type === 'stream-emission') {
      const streamId = data.streamId;
      if (!messageQueues.has(streamId)) {
        messageQueues.set(streamId, []);
        
        // Set up throttled sending for this stream
        setInterval(() => {
          const queue = messageQueues.get(streamId);
          if (queue && queue.length > 0) {
            // Send only the most recent emissions
            const toSend = queue.splice(0, MAX_EMISSIONS_PER_INTERVAL);
            toSend.forEach(msg => window.postMessage(msg, '*'));
          }
        }, THROTTLE_INTERVAL);
      }
      
      const queue = messageQueues.get(streamId)!;
      queue.push(message);
      
      // Limit queue size to prevent memory issues
      if (queue.length > 50) {
        queue.splice(0, queue.length - 25); // Keep only the most recent 25
      }
      return;
    }
    
    window.postMessage(message, '*');
  }

  // Get stack trace for debugging
  function getStackTrace(): string {
    try {
      throw new Error();
    } catch (e) {
      return (e as Error).stack || '';
    }
  }

  // Extract meaningful names from stack trace
  function extractStreamName(stackTrace: string): string | null {
    if (!stackTrace) return null;

    const lines = stackTrace.split('\n');
    for (let i = 2; i < Math.min(lines.length, 8); i++) {
      const line = lines[i];
      if (line && !line.includes('rxjs') && !line.includes('devtools')) {
        const match = line.match(/at\s+(\w+)/);
        if (match && match[1] !== 'new' && match[1] !== 'Object') {
          return match[1];
        }
      }
    }
    return null;
  }

  // Patch Observable constructor
  function patchObservable(): boolean {
    console.log('🔄 RxJS DevTools: Attempting to patch Observable...');
    console.log('🔄 RxJS DevTools: window.rxjs =', window.rxjs);
    console.log('🔄 RxJS DevTools: window.Observable =', window.Observable);

    // Try different ways RxJS might be available
    const rxjsSources: (() => any)[] = [
      (): any => window.rxjs && window.rxjs.Observable,
      (): any => window.Rx && window.Rx.Observable,
      (): any => window.Observable && window.Observable.prototype && window.Observable.prototype.subscribe ? window.Observable : null,
      (): any => {
        try {
          return typeof (window as any).require !== 'undefined' && (window as any).require('rxjs');
        } catch (e) {
          return null;
        }
      }
    ];

    let rxjs: any = null;
    let Observable: any = null;

    for (const source of rxjsSources) {
      try {
        const result = source();
        if (result) {
          if (result.Observable) {
            rxjs = result;
            Observable = result.Observable;
            console.log('🔄 RxJS DevTools: Found Observable via rxjs object');
            break;
          } else if (typeof result === 'function' && result.prototype && result.prototype.subscribe) {
            Observable = result;
            console.log('🔄 RxJS DevTools: Found Observable directly');
            break;
          }
        }
      } catch (e) {
        console.log('🔄 RxJS DevTools: Error checking source:', e);
        continue;
      }
    }

    if (!Observable) {
      console.log('🔄 RxJS DevTools: Observable not found, will retry...');
      return false;
    }

    console.log('🔄 RxJS DevTools: Patching Observable...', Observable);

    // Store original methods
    const originalSubscribe = Observable.prototype.subscribe;

    // Store original subscribe before patching
    if (Observable.prototype.__rxjsDevToolsOriginalSubscribe) {
      console.log('🔄 RxJS DevTools: Observable already patched, skipping...');
      return true;
    }

    Observable.prototype.__rxjsDevToolsOriginalSubscribe = Observable.prototype.subscribe;

    // Patch Observable.prototype.subscribe
    Observable.prototype.subscribe = function (this: RxJSObservable, ...args: any[]): any {

      const streamId = this.__rxjsDevToolsId || createStreamId();
      this.__rxjsDevToolsId = streamId;

      // If this is a new stream, register it
      if (!trackedStreams.has(streamId)) {
        const stackTrace = getStackTrace();
        const streamName = extractStreamName(stackTrace) || `Observable #${streamIdCounter}`;

        // Only log new streams, not every subscription

        trackedStreams.set(streamId, {
          id: streamId,
          name: streamName,
          subscriptions: 0,
          emissions: 0
        });

        const newStreamData: NewStreamMessage['data'] = {
          id: streamId,
          name: streamName,
          type: 'Observable',
          timestamp: Date.now()
        };

        console.log('🔄 RxJS DevTools: Sending new-stream message:', newStreamData);
        sendMessage('new-stream', newStreamData);
      }

      // Increment subscription count
      const streamInfo = trackedStreams.get(streamId)!;
      streamInfo.subscriptions++;

      // Wrap observer to track emissions
      const wrappedArgs = args.map((arg: any): any => {
        if (typeof arg === 'function') {
          // Handle function observers
          return function (this: any, value: any): any {
            streamInfo.emissions++;
            const emissionData: StreamEmissionMessage['data'] = {
              streamId,
              type: 'next',
              value: safeStringify(value),
              timestamp: Date.now()
            };
            sendMessage('stream-emission', emissionData);
            return arg.call(this, value);
          };
        } else if (arg && typeof arg === 'object') {
          // Handle observer objects
          const wrappedObserver: any = { ...arg };

          if (arg.next) {
            const originalNext = arg.next;
            wrappedObserver.next = function (this: any, value: any): any {
              streamInfo.emissions++;
              const emissionData: StreamEmissionMessage['data'] = {
                streamId,
                type: 'next',
                value: safeStringify(value),
                timestamp: Date.now()
              };
              sendMessage('stream-emission', emissionData);
              return originalNext.call(this, value);
            };
          }

          if (arg.error) {
            const originalError = arg.error;
            wrappedObserver.error = function (this: any, error: any): any {
              const emissionData: StreamEmissionMessage['data'] = {
                streamId,
                type: 'error',
                value: safeStringify(error),
                timestamp: Date.now()
              };
              sendMessage('stream-emission', emissionData);

              const errorData: StreamErrorMessage['data'] = {
                id: streamId,
                error: safeStringify(error),
                timestamp: Date.now()
              };
              sendMessage('stream-error', errorData);
              return originalError.call(this, error);
            };
          }

          if (arg.complete) {
            const originalComplete = arg.complete;
            wrappedObserver.complete = function (this: any): any {
              const emissionData: StreamEmissionMessage['data'] = {
                streamId,
                type: 'complete',
                value: undefined,
                timestamp: Date.now()
              };
              sendMessage('stream-emission', emissionData);

              const completeData: StreamCompleteMessage['data'] = {
                id: streamId,
                timestamp: Date.now()
              };
              sendMessage('stream-complete', completeData);
              return originalComplete.call(this);
            };
          }

          return wrappedObserver;
        }
        return arg;
      });

      return originalSubscribe.apply(this, wrappedArgs);
    };

    // Patch operator methods to preserve stream IDs
    const operatorMethods = [
      'map', 'filter', 'mergeMap', 'switchMap', 'concatMap', 'exhaustMap',
      'take', 'skip', 'distinctUntilChanged', 'debounceTime', 'throttleTime',
      'startWith', 'combineLatest', 'merge', 'concat', 'zip', 'share',
      'shareReplay', 'tap', 'catchError', 'retry', 'delay', 'timeout'
    ];

    operatorMethods.forEach((methodName: string): void => {
      if (Observable.prototype[methodName]) {
        const originalMethod = Observable.prototype[methodName];
        Observable.prototype[methodName] = function (this: RxJSObservable, ...args: any[]): RxJSObservable {
          const result = originalMethod.apply(this, args) as RxJSObservable;
          // Preserve stream ID through operators
          if (this.__rxjsDevToolsId) {
            result.__rxjsDevToolsId = this.__rxjsDevToolsId;
          }
          return result;
        };
      }
    });

    console.log('🔄 RxJS DevTools: Observable patched successfully');
    return true;
  }

  // Safe JSON stringify with circular reference handling
  function safeStringify(obj: any, maxDepth: number = 3, currentDepth: number = 0): string {
    if (currentDepth >= maxDepth) {
      return '[Max Depth Reached]';
    }

    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';

    const type = typeof obj;
    if (type === 'string') return obj;
    if (type === 'number' || type === 'boolean') return obj.toString();
    if (type === 'function') return '[Function]';

    if (type === 'object') {
      if (obj instanceof Error) {
        return `Error: ${obj.message}`;
      }

      if (obj instanceof Date) {
        return obj.toISOString();
      }

      if (Array.isArray(obj)) {
        if (obj.length > 10) {
          return `Array(${obj.length}) [${obj.slice(0, 3).map((item: any): string =>
            safeStringify(item, maxDepth, currentDepth + 1)
          ).join(', ')}, ...]`;
        }
        return `[${obj.map((item: any): string =>
          safeStringify(item, maxDepth, currentDepth + 1)
        ).join(', ')}]`;
      }

      try {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';

        if (keys.length > 5) {
          const firstKeys = keys.slice(0, 3);
          const preview = firstKeys.map((key: string): string =>
            `${key}: ${safeStringify(obj[key], maxDepth, currentDepth + 1)}`
          ).join(', ');
          return `{${preview}, ... +${keys.length - 3} more}`;
        }

        const preview = keys.map((key: string): string =>
          `${key}: ${safeStringify(obj[key], maxDepth, currentDepth + 1)}`
        ).join(', ');
        return `{${preview}}`;
      } catch (e) {
        return '[Object - Cannot Serialize]';
      }
    }

    return String(obj);
  }

  // Advanced RxJS detection for bundled applications (specifically for SiriusXM)
  function findBundledRxJS(): any {
    console.log('🔄 RxJS DevTools: Searching for bundled RxJS...');
    
    // Search through all global objects for Observable-like constructors
    const globalObservables: any[] = [];
    
    // SiriusXM-specific detection strategies
    
    // Strategy 1: Look for webpack bundles containing RxJS
    if ((window as any).__webpack_require__) {
      console.log('🔄 Webpack detected, searching modules for RxJS...');
      try {
        const webpackRequire = (window as any).__webpack_require__;
        if (webpackRequire.cache) {
          Object.keys(webpackRequire.cache).forEach(moduleId => {
            const module = webpackRequire.cache[moduleId];
            if (module && module.exports) {
              // Look for direct RxJS exports
              if (module.exports.Observable && typeof module.exports.Observable === 'function') {
                console.log(`🔄 Found Observable in webpack module ${moduleId}`);
                globalObservables.push({ path: `webpack.${moduleId}`, Observable: module.exports.Observable });
              }
              
              // Look for RxJS operators (SiriusXM pattern)
              if (module.exports.map && module.exports.filter && module.exports.switchMap) {
                console.log(`🔄 Found RxJS operators in webpack module ${moduleId}`);
                // Try to get Observable from operators module
                if (module.exports.__esModule && module.exports.EMPTY) {
                  // This looks like RxJS operators module, find the Observable
                  try {
                    const rxjsCore = webpackRequire('rxjs');
                    if (rxjsCore && rxjsCore.Observable) {
                      console.log(`🔄 Found RxJS core via operators module`);
                      globalObservables.push({ path: `webpack.rxjs`, Observable: rxjsCore.Observable });
                    }
                  } catch (e) {
                    // Continue searching
                  }
                }
              }
              
              // Look for redux-observable (SiriusXM uses this)
              if (module.exports.combineEpics || module.exports.createEpicMiddleware) {
                console.log(`🔄 Found redux-observable in webpack module ${moduleId}`);
                // redux-observable internally uses RxJS, try to access it
                try {
                  // Try different ways to get RxJS from redux-observable context
                  const contexts = [
                    () => webpackRequire('rxjs'),
                    () => webpackRequire('rxjs/Observable'),
                    () => webpackRequire('rxjs/internal/Observable')
                  ];
                  
                  for (const getContext of contexts) {
                    try {
                      const rxjsModule = getContext();
                      if (rxjsModule && rxjsModule.Observable) {
                        console.log(`🔄 Found RxJS via redux-observable context`);
                        globalObservables.push({ path: `redux-observable.rxjs`, Observable: rxjsModule.Observable });
                        break;
                      }
                    } catch (e) {
                      // Continue trying
                    }
                  }
                } catch (e) {
                  console.log('🔄 Could not access RxJS from redux-observable context');
                }
              }
              
              // Look for RxJS bundled as part of other modules
              if (module.exports.rxjs && module.exports.rxjs.Observable) {
                console.log(`🔄 Found RxJS in webpack module ${moduleId}`);
                globalObservables.push({ path: `webpack.${moduleId}.rxjs`, Observable: module.exports.rxjs.Observable });
              }
            }
          });
        }
      } catch (e) {
        console.log('🔄 Error searching webpack modules:', e);
      }
    }
    
    // Strategy 2: Check for module loaders and try to require RxJS directly
    if (typeof (window as any).require === 'function') {
      console.log('🔄 Module loader detected, trying to require RxJS...');
      try {
        const rxjsModule = (window as any).require('rxjs');
        if (rxjsModule && rxjsModule.Observable) {
          console.log('🔄 Found RxJS via require("rxjs")');
          globalObservables.push({ path: 'require.rxjs', Observable: rxjsModule.Observable });
        }
      } catch (e) {
        // Try alternative require patterns
        try {
          const rxjsModule = (window as any).require('rxjs/Observable');
          if (rxjsModule && rxjsModule.Observable) {
            console.log('🔄 Found RxJS via require("rxjs/Observable")');
            globalObservables.push({ path: 'require.rxjs.Observable', Observable: rxjsModule.Observable });
          }
        } catch (e2) {
          console.log('🔄 Could not require RxJS directly');
        }
      }
    }
    
    // Strategy 3: Deep search through window object
    function deepSearch(obj: any, path: string = 'window', depth: number = 0): void {
      if (depth > 4 || !obj || typeof obj !== 'object') return;
      
      try {
        Object.keys(obj).forEach(key => {
          if (key.toLowerCase().includes('observ') || key.toLowerCase().includes('rxjs') || key.toLowerCase().includes('redux')) {
            const value = obj[key];
            if (value && typeof value === 'function' && value.prototype && value.prototype.subscribe) {
              console.log(`🔄 Found Observable-like at ${path}.${key}:`, value);
              globalObservables.push({ path: `${path}.${key}`, Observable: value });
            } else if (value && typeof value === 'object' && value.Observable) {
              console.log(`🔄 Found RxJS-like at ${path}.${key}:`, value);
              globalObservables.push({ path: `${path}.${key}`, Observable: value.Observable });
            }
          }
        });
      } catch (e) {
        // Ignore access errors
      }
    }
    
    // Search main window
    deepSearch(window, 'window', 0);
    
    // Strategy 4: Look for specific SiriusXM patterns
    // Check if there are any Redux stores with epic middleware
    try {
      // Look for Redux DevTools extension data
      if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
        console.log('🔄 Redux DevTools detected, checking for epic middleware...');
        // The Redux store might have epic middleware with RxJS
      }
      
      // Look for common variable names SiriusXM might use
      const siriusPatterns = ['__SXM__', 'sxm', 'SiriusXM', 'SXMP'];
      siriusPatterns.forEach(pattern => {
        if ((window as any)[pattern]) {
          console.log(`🔄 Found SiriusXM pattern: ${pattern}`);
          deepSearch((window as any)[pattern], `window.${pattern}`, 0);
        }
      });
    } catch (e) {
      console.log('🔄 Error in SiriusXM-specific detection:', e);
    }
    
    // Return the first valid Observable found
    if (globalObservables.length > 0) {
      console.log(`🔄 Found ${globalObservables.length} Observable(s):`, globalObservables);
      return globalObservables[0].Observable;
    }
    
    console.log('🔄 No bundled RxJS Observable found');
    return null;
  }
  
  // Wait for RxJS to be fully loaded before patching
  function waitForRxJSAndPatch(): void {
    console.log('🔄 RxJS DevTools: Waiting for RxJS to be fully loaded...');

    let attempts = 0;
    const maxAttempts = 100; // 10 seconds

    const checkInterval = setInterval((): void => {
      attempts++;

      // Try to patch Observable if we can find it
      if (patchObservable()) {
        console.log('🔄 RxJS DevTools: Successfully patched Observable!');
        clearInterval(checkInterval);
        return;
      }
      
      // After 20 attempts, try advanced bundled search
      if (attempts === 20) {
        console.log('🔄 Standard detection failed, trying bundled RxJS detection...');
        const bundledObservable = findBundledRxJS();
        if (bundledObservable) {
          // Make it globally available for our patching
          if (!window.rxjs) {
            window.rxjs = { Observable: bundledObservable };
          }
          if (!window.Observable) {
            window.Observable = bundledObservable;
          }
          console.log('🔄 Made bundled Observable globally available');
        }
      }

      // If we're in a framework environment, try alternative approaches
      if ((window.ng || window.React || window.ReactDOM) && attempts > 10) {
        console.log('🔄 RxJS DevTools: Framework detected, trying alternative RxJS detection...');

        // Framework apps often have RxJS bundled but not on the global scope
        try {
          const possibleLocations: any[] = [
            window.rxjs,
            window.ng?.rxjs, // Angular
            window.React?.rxjs, // React with RxJS
            window.__webpack_require__ ? ((): any => {
              // Try to find RxJS in webpack bundle
              try {
                const webpackRequire = window.__webpack_require__;
                // Look through webpack modules for RxJS
                if (webpackRequire.cache) {
                  for (const moduleId in webpackRequire.cache) {
                    const module = webpackRequire.cache[moduleId];
                    if (module && module.exports) {
                      if (module.exports.Observable ||
                        (module.exports.rxjs && module.exports.rxjs.Observable)) {
                        return module.exports.rxjs || module.exports;
                      }
                    }
                  }
                }
              } catch (e) {
                return null;
              }
            })() : null,
            typeof (window as any).require !== 'undefined' ? ((): any => {
              try {
                return (window as any).require('rxjs');
              } catch (e) {
                // Try different module names
                try {
                  return (window as any).require('rx');
                } catch (e2) {
                  return null;
                }
              }
            })() : null,
            // Check if RxJS is available via ES6 modules
            typeof window.System !== 'undefined' ? ((): any => {
              try {
                return window.System.get('rxjs');
              } catch (e) {
                return null;
              }
            })() : null
          ];

          for (const location of possibleLocations) {
            if (location && (location.Observable || (typeof location === 'function' && location.prototype && location.prototype.subscribe))) {
              // Make RxJS globally available for patching
              if (location.Observable) {
                window.rxjs = location;
              } else {
                window.rxjs = { Observable: location };
              }

              if (patchObservable()) {
                console.log('🔄 RxJS DevTools: Successfully patched Observable via framework detection!');
                clearInterval(checkInterval);
                return;
              }
            }
          }
        } catch (error) {
          console.log('🔄 RxJS DevTools: Error during framework RxJS detection:', error);
        }
      }

      // Reduce logging frequency for attempts
      if (attempts % 10 === 0) {
        console.log(`🔄 RxJS DevTools: RxJS not ready yet (attempt ${attempts}/${maxAttempts})`);
      }

      if (attempts >= maxAttempts) {
        console.log('🔄 RxJS DevTools: Failed to patch Observable after maximum attempts');
        console.log('🔄 RxJS DevTools: window.rxjs =', window.rxjs);
        console.log('🔄 RxJS DevTools: window.rxjs?.Observable =', window.rxjs?.Observable);
        console.log('🔄 RxJS DevTools: window.ng =', window.ng);
        console.log('🔄 RxJS DevTools: Available global objects:', Object.keys(window).filter((key: string): boolean => key.toLowerCase().includes('rx') || key.toLowerCase().includes('observ')));
        clearInterval(checkInterval);
      }
    }, 100);
  }

  // Start the patching process
  waitForRxJSAndPatch();

  console.log('🔄 RxJS DevTools: Injected script loaded');
})();

