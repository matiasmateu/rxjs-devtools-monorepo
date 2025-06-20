import { useEffect, useRef, useMemo, useCallback } from 'react';
import type { Observable } from 'rxjs';
import { RxJSDevTools, type RxJSDevToolsOptions } from './RxJSDevTools';

/**
 * Global RxJS DevTools instance (created once per app)
 */
let globalDevToolsInstance: RxJSDevTools | null = null;

/**
 * Get or create the global RxJS DevTools instance
 */
function getGlobalDevTools(options?: RxJSDevToolsOptions): RxJSDevTools {
  if (!globalDevToolsInstance) {
    globalDevToolsInstance = new RxJSDevTools(options);
  }
  return globalDevToolsInstance;
}

/**
 * Hook to initialize RxJS DevTools for the entire app
 * Call this once in your root component
 * 
 * @param options - DevTools configuration options
 * @returns DevTools instance
 */
export function useRxJSDevTools(options?: RxJSDevToolsOptions): RxJSDevTools {
  const devTools = useMemo(() => getGlobalDevTools(options), []);
  
  useEffect(() => {
    console.log('🔄 RxJS DevTools: Hook initialized');
    return () => {
      console.log('🔄 RxJS DevTools: Hook cleanup');
    };
  }, []);

  return devTools;
}

/**
 * Hook to track an Observable in RxJS DevTools
 * 
 * @param observable - The Observable to track
 * @param name - Optional name for the Observable
 * @returns Tracked Observable
 */
export function useTrackedObservable<T>(
  observable: Observable<T> | (() => Observable<T>),
  name?: string
): Observable<T> {
  const devTools = getGlobalDevTools();
  const observableRef = useRef<Observable<T>>();
  
  return useMemo(() => {
    const obs = typeof observable === 'function' ? observable() : observable;
    
    // Only track if it's a different observable instance
    if (observableRef.current !== obs) {
      observableRef.current = obs;
      return devTools.trackObservable(obs, name);
    }
    
    return obs;
  }, [observable, name, devTools]);
}

/**
 * Hook to track multiple Observables at once
 * 
 * @param observables - Object containing observables to track
 * @returns Object with tracked observables
 */
export function useTrackedObservables<T extends Record<string, Observable<any>>>(
  observables: T
): T {
  const devTools = getGlobalDevTools();
  
  return useMemo(() => {
    const tracked = {} as T;
    
    for (const [name, observable] of Object.entries(observables)) {
      tracked[name as keyof T] = devTools.trackObservable(observable, name);
    }
    
    return tracked;
  }, [observables, devTools]);
}

/**
 * Hook to create a tracked Observable factory
 * Useful for creating observables within components
 * 
 * @param factory - Function that creates an Observable
 * @param deps - Dependencies array (like useEffect)
 * @param name - Optional name for the Observable
 * @returns Tracked Observable
 */
export function useObservableFactory<T>(
  factory: () => Observable<T>,
  deps: React.DependencyList,
  name?: string
): Observable<T> {
  const devTools = getGlobalDevTools();
  
  return useMemo(() => {
    const observable = factory();
    return devTools.trackObservable(observable, name);
  }, deps);
}

/**
 * Hook to manually emit values to DevTools
 * Useful for custom tracking scenarios
 * 
 * @returns Function to emit values
 */
export function useDevToolsEmitter(): (streamId: string, type: 'next' | 'error' | 'complete', value?: any) => void {
  const devTools = getGlobalDevTools();
  
  return useCallback((streamId: string, type: 'next' | 'error' | 'complete', value?: any) => {
    devTools.emit(streamId, type, value);
  }, [devTools]);
}

/**
 * Hook to check if DevTools is connected
 * 
 * @returns Boolean indicating connection status
 */
export function useDevToolsConnectionStatus(): boolean {
  const devTools = getGlobalDevTools();
  // Note: This won't be reactive - for a reactive version, we'd need to implement
  // a subscription mechanism in RxJSDevTools
  return devTools.isConnected();
}

