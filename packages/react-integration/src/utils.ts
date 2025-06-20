// Utility functions for RxJS DevTools integration

import type { Observable } from 'rxjs';
import { RxJSDevTools, type RxJSDevToolsOptions } from './RxJSDevTools';

/**
 * Global DevTools instance for standalone usage
 */
let globalInstance: RxJSDevTools | null = null;

/**
 * Initialize RxJS DevTools globally
 * Call this once in your app's entry point
 * 
 * @param options - Configuration options
 * @returns DevTools instance
 */
export function initializeRxJSDevTools(options?: RxJSDevToolsOptions): RxJSDevTools {
  if (globalInstance) {
    console.warn('🔄 RxJS DevTools: Already initialized, returning existing instance');
    return globalInstance;
  }
  
  globalInstance = new RxJSDevTools(options);
  console.log('🔄 RxJS DevTools: Initialized globally');
  return globalInstance;
}

/**
 * Get the global DevTools instance
 * Throws an error if not initialized
 * 
 * @returns DevTools instance
 */
export function getRxJSDevTools(): RxJSDevTools {
  if (!globalInstance) {
    throw new Error(
      'RxJS DevTools not initialized. Call initializeRxJSDevTools() first, or use auto-initialization by importing from rxjs-devtools/auto'
    );
  }
  return globalInstance;
}

/**
 * Track an Observable with the global DevTools instance
 * 
 * @param observable - Observable to track
 * @param name - Optional name for the observable
 * @returns Tracked observable
 */
export function trackObservable<T>(observable: Observable<T>, name?: string): Observable<T> {
  const devTools = getRxJSDevTools();
  return devTools.trackObservable(observable, name);
}

/**
 * Check if DevTools is available and connected
 * 
 * @returns Connection status
 */
export function isDevToolsConnected(): boolean {
  try {
    const devTools = getRxJSDevTools();
    return devTools.isConnected();
  } catch {
    return false;
  }
}

/**
 * Create a decorator for automatically tracking class method observables
 * 
 * @param name - Optional name for the observable
 * @returns Method decorator
 */
export function TrackedObservable(name?: string) {
  return function <T extends Observable<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<() => T>
  ): TypedPropertyDescriptor<() => T> {
    const originalMethod = descriptor.value;
    
    if (!originalMethod) {
      return descriptor;
    }
    
    descriptor.value = function (this: any): T {
      const observable = originalMethod.call(this);
      const streamName = name || `${target.constructor.name}.${propertyKey}`;
      
      try {
        const devTools = getRxJSDevTools();
        return devTools.trackObservable(observable, streamName);
      } catch {
        // DevTools not available, return original observable
        return observable;
      }
    };
    
    return descriptor;
  };
}

/**
 * Create a higher-order function that automatically tracks returned observables
 * 
 * @param fn - Function that returns an observable
 * @param name - Optional name for the observable
 * @returns Wrapped function
 */
export function withTracking<T extends (...args: any[]) => Observable<any>>(
  fn: T,
  name?: string
): T {
  return ((...args: any[]) => {
    const observable = fn(...args);
    const streamName = name || fn.name || 'Anonymous Observable';
    
    try {
      const devTools = getRxJSDevTools();
      return devTools.trackObservable(observable, streamName);
    } catch {
      // DevTools not available, return original observable
      return observable;
    }
  }) as T;
}

/**
 * Conditionally track an observable only in development
 * 
 * @param observable - Observable to track
 * @param name - Optional name for the observable
 * @returns Tracked observable (in dev) or original observable (in prod)
 */
export function trackInDevelopment<T>(observable: Observable<T>, name?: string): Observable<T> {
  if (process.env.NODE_ENV !== 'development') {
    return observable;
  }
  
  try {
    const devTools = getRxJSDevTools();
    return devTools.trackObservable(observable, name);
  } catch {
    return observable;
  }
}

/**
 * Create a tracking-enabled observable factory
 * 
 * @param factory - Function that creates observables
 * @param namePrefix - Prefix for generated names
 * @returns Wrapped factory function
 */
export function createTrackedFactory<T extends (...args: any[]) => Observable<any>>(
  factory: T,
  namePrefix?: string
): T {
  let counter = 0;
  
  return ((...args: any[]) => {
    const observable = factory(...args);
    const streamName = namePrefix 
      ? `${namePrefix} #${++counter}`
      : `${factory.name || 'Factory'} #${++counter}`;
    
    try {
      const devTools = getRxJSDevTools();
      return devTools.trackObservable(observable, streamName);
    } catch {
      return observable;
    }
  }) as T;
}

