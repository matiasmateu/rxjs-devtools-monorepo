// RxJS DevTools - Global Hook (Redux DevTools Style)
// This creates a global hook that applications can connect to voluntarily

interface RxJSDevToolsHook {
  connect(options?: { name?: string }): RxJSDevToolsConnection;
  isConnected(): boolean;
  version: string;
}

interface RxJSDevToolsConnection {
  subscribe(observer: RxJSObservable): void;
  unsubscribe(observer: RxJSObservable): void;
  emit(streamId: string, type: 'next' | 'error' | 'complete', value?: any): void;
  error(streamId: string, error: any): void;
  complete(streamId: string): void;
  serializeValue(value: any): any;
}

interface RxJSObservable {
  __rxjsDevToolsId?: string;
  __rxjsDevToolsName?: string;
}

interface GlobalWindow extends Window {
  __RXJS_DEVTOOLS_EXTENSION__?: RxJSDevToolsHook;
  __RXJS_DEVTOOLS_EXTENSION_COMPOSE__?: any;
}

(function(): void {
  'use strict';
  
  console.log('🔄 RxJS DevTools: Installing global hook...');
  
  // Don't install if already present
  if ((window as GlobalWindow).__RXJS_DEVTOOLS_EXTENSION__) {
    console.log('🔄 RxJS DevTools: Global hook already installed');
    return;
  }
  
  let streamCounter = 0;
  const connections = new Set<RxJSDevToolsConnection>();
  const activeStreams = new Map<string, any>();
  
  function createStreamId(): string {
    return `rxjs-hook-stream-${++streamCounter}`;
  }
  
  function sendMessage(type: string, data: any): void {
    window.postMessage({
      type,
      source: 'rxjs-devtools-global-hook',
      data,
      timestamp: Date.now()
    }, '*');
  }
  
  const devToolsHook: RxJSDevToolsHook = {
    version: '1.0.0',
    
    connect(options = {}): RxJSDevToolsConnection {
      console.log('🔄 RxJS DevTools: Application connected to hook:', options.name || 'Unknown App');
      
      const connection: RxJSDevToolsConnection = {
        subscribe(observable: RxJSObservable): void {
          if (!observable.__rxjsDevToolsId) {
            observable.__rxjsDevToolsId = createStreamId();
            observable.__rxjsDevToolsName = options.name || 'Observable';
          }
          
          const streamId = observable.__rxjsDevToolsId;
          activeStreams.set(streamId, observable);
          
          console.log('🔄 RxJS DevTools: New stream registered:', streamId);
          
          sendMessage('new-stream', {
            id: streamId,
            name: observable.__rxjsDevToolsName,
            type: 'Observable',
            appName: options.name || 'App',
            timestamp: Date.now()
          });
        },
        
        unsubscribe(observable: RxJSObservable): void {
          if (observable.__rxjsDevToolsId) {
            const streamId = observable.__rxjsDevToolsId;
            activeStreams.delete(streamId);
            
            sendMessage('stream-complete', {
              id: streamId,
              timestamp: Date.now()
            });
          }
        },
        
        emit(streamId: string, type: 'next' | 'error' | 'complete', value?: any): void {
          sendMessage('stream-emission', {
            streamId,
            type,
            value: this.serializeValue(value),
            timestamp: Date.now()
          });
        },
        
        error(streamId: string, error: any): void {
          sendMessage('stream-error', {
            id: streamId,
            error: this.serializeValue(error),
            timestamp: Date.now()
          });
        },
        
        complete(streamId: string): void {
          sendMessage('stream-complete', {
            id: streamId,
            timestamp: Date.now()
          });
        },
        
        serializeValue(value: any): any {
          if (value === null || value === undefined) return value;
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return value;
          }
          if (value instanceof Error) {
            return { __error: true, message: value.message, stack: value.stack };
          }
          if (value instanceof Date) {
            return { __date: true, value: value.toISOString() };
          }
          
          try {
            return JSON.parse(JSON.stringify(value));
          } catch (e) {
            return { __serialized: String(value) };
          }
        }
      };
      
      connections.add(connection);
      
      // Send connection notification
      sendMessage('app-connected', {
        name: options.name || 'Unknown App',
        timestamp: Date.now()
      });
      
      return connection;
    },
    
    isConnected(): boolean {
      return connections.size > 0;
    }
  };
  
  // Install the global hook
  (window as GlobalWindow).__RXJS_DEVTOOLS_EXTENSION__ = devToolsHook;
  
  // Also provide compose function for enhanced integration
  (window as GlobalWindow).__RXJS_DEVTOOLS_EXTENSION_COMPOSE__ = function(compose: Function) {
    return function(...args: any[]) {
      console.log('🔄 RxJS DevTools: Enhanced compose integration');
      return compose(...args);
    };
  };
  
  console.log('🔄 RxJS DevTools: Global hook installed successfully');
  
  // Send ready notification
  sendMessage('devtools-ready', {
    version: devToolsHook.version,
    timestamp: Date.now()
  });
  
})();

