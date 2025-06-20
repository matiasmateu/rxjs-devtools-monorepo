// RxJS DevTools Integration for React Applications
// This module provides integration with the RxJS DevTools Chrome extension

import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

declare global {
  interface Window {
    __RXJS_DEVTOOLS_EXTENSION__?: RxJSDevToolsExtension;
  }
}

interface RxJSDevToolsExtension {
  connect(options?: { name?: string }): RxJSDevToolsConnection;
  isConnected(): boolean;
  version: string;
}

interface RxJSDevToolsConnection {
  subscribe(observer: Observable<any>): string; // Returns stream ID
  unsubscribe(observer: Observable<any>): void;
  emit(streamId: string, type: 'next' | 'error' | 'complete', value?: any): void;
  error(streamId: string, error: any): void;
  complete(streamId: string): void;
}

export interface RxJSDevToolsOptions {
  name?: string;
  enabled?: boolean;
  logObservables?: boolean;
  maxRetries?: number;
  retryInterval?: number;
}

/**
 * RxJS DevTools integration class for React applications
 * Provides seamless integration with the RxJS DevTools Chrome extension
 */
export class RxJSDevTools {
  private connection: RxJSDevToolsConnection | null = null;
  private streamCounter = 0;
  private trackedStreams = new WeakMap<Observable<any>, string>();
  private options: Required<RxJSDevToolsOptions>;
  private pendingObservables: Array<{ observable: Observable<any>; name: string }> = [];
  private isInitialized = false;

  constructor(options: RxJSDevToolsOptions = {}) {
    this.options = {
      name: 'React App',
      enabled: process.env.NODE_ENV === 'development',
      logObservables: true,
      maxRetries: 50,
      retryInterval: 500,
      ...options,
    };

    this.initialize();
  }

  /**
   * Initialize connection to RxJS DevTools extension
   */
  private initialize(): void {
    if (!this.options.enabled || this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    if (typeof window === 'undefined') {
      console.warn('🔄 RxJS DevTools: Window object not available (SSR environment)');
      return;
    }

    console.log('🔄 RxJS DevTools: Initializing integration...');

    // Check if DevTools extension is available
    if (window.__RXJS_DEVTOOLS_EXTENSION__) {
      this.connectToExtension();
    } else {
      console.log('🔄 RxJS DevTools: Extension not detected, setting up listeners...');
      this.setupGlobalHookListener();
    }
  }

  /**
   * Connect to the DevTools extension
   */
  private connectToExtension(): void {
    try {
      this.connection = window.__RXJS_DEVTOOLS_EXTENSION__!.connect({
        name: this.options.name,
      });
      console.log('🔄 RxJS DevTools: Successfully connected to extension');
      
      // Process any pending observables
      this.processPendingObservables();
    } catch (error) {
      console.warn('🔄 RxJS DevTools: Failed to connect to extension:', error);
    }
  }

  /**
   * Set up listener for when the global hook becomes available
   */
  private setupGlobalHookListener(): void {
    // Listen for the devtools-ready message
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window || !event.data) return;
      
      if (event.data.type === 'devtools-ready' && event.data.source === 'rxjs-devtools-global-hook') {
        console.log('🔄 RxJS DevTools: Global hook is now ready, attempting connection...');
        
        // Remove the listener since we only need to connect once
        window.removeEventListener('message', handleMessage);
        
        // Try to connect now that the hook is ready
        setTimeout(() => {
          if (window.__RXJS_DEVTOOLS_EXTENSION__) {
            this.connectToExtension();
          }
        }, 100);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Also set up a periodic check as backup
    let retryCount = 0;
    const retryInterval = setInterval(() => {
      retryCount++;
      
      if (this.connection || retryCount >= this.options.maxRetries) {
        clearInterval(retryInterval);
        window.removeEventListener('message', handleMessage);
        return;
      }
      
      if (window.__RXJS_DEVTOOLS_EXTENSION__) {
        console.log('🔄 RxJS DevTools: Global hook detected via periodic check, connecting...');
        clearInterval(retryInterval);
        window.removeEventListener('message', handleMessage);
        this.connectToExtension();
      }
    }, this.options.retryInterval);
  }

  /**
   * Check if DevTools is connected and available
   */
  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Track an RxJS Observable for debugging
   * @param observable - The Observable to track
   * @param name - Optional name for the Observable
   * @param metadata - Optional metadata for the stream
   * @returns The same Observable with tracking added
   */
  public trackObservable<T>(observable: Observable<T>, name?: string, metadata?: Record<string, any>): Observable<T> {
    if (!this.options.enabled || !this.options.logObservables) {
      return observable;
    }

    const streamName = name || `Observable #${++this.streamCounter}`;
    
    if (!this.connection) {
      // Queue for later processing when connection becomes available
      this.pendingObservables.push({ observable: observable as Observable<any>, name: streamName });
      return observable;
    }

    return this.doTrackObservable(observable, streamName, metadata);
  }

  /**
   * Actually track an observable (when connection is available)
   */
  private doTrackObservable<T>(observable: Observable<T>, streamName: string, metadata?: Record<string, any>): Observable<T> {
    if (!this.connection) {
      return observable;
    }

    // Register the Observable with DevTools and get the actual stream ID
    let actualStreamId: string;
    try {
      actualStreamId = this.connection.subscribe(observable as Observable<any>);
      
      if (!actualStreamId) {
        // Fallback to generating our own ID if none returned
        actualStreamId = this.generateStreamId();
      }
    } catch (error) {
      console.error(`🔄 RxJS DevTools: Failed to register Observable "${streamName}":`, error);
      return observable;
    }

    this.trackedStreams.set(observable as Observable<any>, actualStreamId);

    // Emit new-stream message with metadata
    const streamMeta = {
      id: actualStreamId,
      name: streamName,
      type: metadata?.type || 'Observable',
      timestamp: Date.now(),
      ...metadata,
    };
    try {
      window.postMessage({
        type: 'new-stream',
        source: 'rxjs-devtools-global-hook',
        data: streamMeta,
        timestamp: Date.now(),
      }, '*');
    } catch (err) {
      console.warn('🔄 RxJS DevTools: Failed to post new-stream metadata', err);
    }

    // Return the Observable with tracking operators
    return observable.pipe(
      tap({
        next: (value) => {
          try {
            this.connection?.emit(actualStreamId, 'next', value);
          } catch (error) {
            console.error('🔄 RxJS DevTools: Error emitting next:', error);
          }
        },
        error: (error) => {
          try {
            this.connection?.emit(actualStreamId, 'error', error);
            this.connection?.error(actualStreamId, error);
          } catch (emitError) {
            console.error('🔄 RxJS DevTools: Error emitting error:', emitError);
          }
        },
        complete: () => {
          try {
            this.connection?.emit(actualStreamId, 'complete');
            this.connection?.complete(actualStreamId);
          } catch (error) {
            console.error('🔄 RxJS DevTools: Error emitting complete:', error);
          }
        },
      }),
    );
  }

  /**
   * Process pending observables that were queued before connection was ready
   */
  private processPendingObservables(): void {
    if (this.pendingObservables.length === 0) {
      return;
    }
    
    console.log(`🔄 RxJS DevTools: Processing ${this.pendingObservables.length} pending observables`);
    
    // Process all pending observables
    for (const { observable, name } of this.pendingObservables) {
      try {
        this.doTrackObservable(observable, name);
      } catch (error) {
        console.error(`🔄 RxJS DevTools: Error processing pending observable "${name}":`, error);
      }
    }
    
    // Clear the pending list
    this.pendingObservables = [];
  }

  /**
   * Generate a unique stream ID
   */
  private generateStreamId(): string {
    return `react-stream-${++this.streamCounter}`;
  }

  /**
   * Enable or disable DevTools integration
   * @param enabled - Whether to enable DevTools
   */
  public setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
    if (enabled && !this.connection && !this.isInitialized) {
      this.initialize();
    }
  }

  /**
   * Get current DevTools options
   */
  public getOptions(): Required<RxJSDevToolsOptions> {
    return { ...this.options };
  }

  /**
   * Manually emit a value to DevTools
   * @param streamId - The stream ID
   * @param type - Type of emission
   * @param value - The value to emit
   */
  public emit(streamId: string, type: 'next' | 'error' | 'complete', value?: any): void {
    if (!this.connection) return;
    this.connection.emit(streamId, type, value);
  }
}

