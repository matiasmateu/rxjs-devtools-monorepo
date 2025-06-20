// RxJS Detector - Content Script
// This script runs early to detect RxJS and inject monitoring capabilities

// Type definitions
interface RxJSDetectionMessage {
  type: 'rxjs-detected';
  url: string;
  timestamp: number;
}

interface CheckRxJSMessage {
  action: 'checkRxJS';
}

interface DevToolsMessage {
  type: string;
  source?: string;
  data?: any;
  timestamp?: number;
}

interface RxJSDetector {
  rxjsDetected: boolean;
  injectedScript: HTMLScriptElement | null;
}

((): void => {
  'use strict';

  const detector: RxJSDetector = {
    rxjsDetected: false,
    injectedScript: null
  };

  // Function to check if RxJS is available
  function checkForRxJS(): Promise<boolean> {
    return new Promise((resolve): void => {
      // Check multiple ways RxJS might be available
      const checks: (() => boolean)[] = [
        (): boolean => !!(window.rxjs && window.rxjs.Observable),
        (): boolean => !!(window.Rx && window.Rx.Observable),
        (): boolean => !!(window.Observable && window.Observable.prototype && window.Observable.prototype.subscribe),
        (): boolean => {
          try {
            return typeof (window as any).require !== 'undefined' && !!(window as any).require('rxjs');
          } catch (e) {
            return false;
          }
        },
        (): boolean => {
          // Check for Angular which often includes RxJS
          return !!(window.ng || window.angular || window.Zone || window.getAllAngularTestabilities);
        },
        (): boolean => {
          // Check for React which may use RxJS
          return !!(window.React || window.ReactDOM ||
            document.querySelector('[data-reactroot]') ||
            document.querySelector('#root') ||
            document.querySelector('.react-component') ||
            document.querySelector('[class*="react"]'));
        },
        (): boolean => {
          // Check for modern bundled apps with RxJS
          return !!(document.querySelector('script[src*="rxjs"]') ||
            document.querySelector('script[src*="main"]') || // Common bundle names
            document.querySelector('script[src*="vendor"]') ||
            document.querySelector('script[src*="bundle"]') ||
            document.querySelector('script[src*="app"]'));
        },
        (): boolean => {
          // Check for Angular-specific DOM markers
          return !!(document.querySelector('[ng-version]') ||
            document.querySelector('app-root') ||
            document.querySelector('[_nghost]') ||
            document.querySelector('[_ngcontent]'));
        },
        (): boolean => {
          // Check for React-specific DOM markers
          return !!(document.querySelector('[data-reactroot]') ||
            document.querySelector('[data-react-helmet]') ||
            document.querySelector('#root') ||
            document.querySelector('#react-root') ||
            document.querySelector('.App'));
        }
      ];

      const found = checks.some((check): boolean => {
        try {
          const result = check();
          if (result) {
            console.log('🔄 RxJS DevTools: Found RxJS via check:', check.toString());
            return true;
          }
          return false;
        } catch (e) {
          return false;
        }
      });

      console.log('🔄 RxJS DevTools: checkForRxJS result:', found);
      resolve(found);
    });
  }

  // Function to inject the monitoring script
  function injectMonitoringScript(): void {
    if (detector.injectedScript) {
      console.log('🔄 RxJS DevTools: Monitoring script already injected, skipping...');
      return;
    }

    console.log('🔄 RxJS DevTools: Starting injection process...');
    
    // Wait a bit for the page to be more stable before injecting
    setTimeout((): void => {
      try {
        console.log('🔄 RxJS DevTools: Creating script element...');
        detector.injectedScript = document.createElement('script');
        
        const scriptUrl = chrome.runtime.getURL('dist/injected-script.js');
        console.log('🔄 RxJS DevTools: Script URL:', scriptUrl);
        
        detector.injectedScript.src = scriptUrl;
        detector.injectedScript.onload = (): void => {
          console.log('🔄 RxJS DevTools: ✅ Monitoring script loaded successfully!');
          // Don't remove immediately, let it execute first
          setTimeout(() => {
            if (detector.injectedScript) {
              detector.injectedScript.remove();
              console.log('🔄 RxJS DevTools: Script element removed from DOM');
            }
          }, 1000);
        };
        detector.injectedScript.onerror = (error): void => {
          console.error('🔄 RxJS DevTools: ❌ Failed to load injected script:', error);
          console.error('🔄 RxJS DevTools: Script src was:', detector.injectedScript?.src);
        };
        
        const targetElement = document.head || document.documentElement;
        console.log('🔄 RxJS DevTools: Appending to:', targetElement.tagName);
        targetElement.appendChild(detector.injectedScript);
        console.log('🔄 RxJS DevTools: Script element appended to DOM');
        
      } catch (error) {
        console.error('🔄 RxJS DevTools: ❌ Exception during injection:', error);
      }
    }, 500); // Wait 500ms for page to stabilize
  }

  // Function to notify the DevTools about RxJS detection
  function notifyRxJSDetected(): void {
    if (detector.rxjsDetected) return;

    detector.rxjsDetected = true;
    console.log('🔄 RxJS DevTools: RxJS detected on this page');

    // Notify background script
    const message: RxJSDetectionMessage = {
      type: 'rxjs-detected',
      url: window.location.href,
      timestamp: Date.now()
    };

    chrome.runtime.sendMessage(message);

    // Inject monitoring script
    injectMonitoringScript();
  }

  // Initial check
  checkForRxJS().then((found: boolean): void => {
    if (found) {
      notifyRxJSDetected();
    } else {
      console.log('🔄 RxJS DevTools: No RxJS detected initially, will monitor for dynamic loading');
    }
  });

  // Monitor for RxJS being loaded dynamically
  const originalDefine = window.define;
  const originalRequire = window.require;

  // Intercept AMD/RequireJS
  if (typeof window.define === 'function' && window.define.amd) {
    window.define = function (...args: any[]): any {
      const result = originalDefine.apply(this, args);

      // Check if this might be RxJS
      setTimeout((): void => {
        checkForRxJS().then((found: boolean): void => {
          if (found) notifyRxJSDetected();
        });
      }, 100);

      return result;
    };

    // Copy properties
    Object.keys(originalDefine).forEach((key: string): void => {
      (window.define as any)[key] = (originalDefine as any)[key];
    });
  }

  // Intercept CommonJS require
  if (typeof window.require === 'function') {
    window.require = function (...args: any[]): any {
      const result = originalRequire.apply(this, args);

      // Check if this is RxJS
      if (args[0] && (args[0].includes('rxjs') || args[0] === 'rx')) {
        notifyRxJSDetected();
      }

      return result;
    };
  }

  // Monitor for script tags being added
  const observer = new MutationObserver((mutations: MutationRecord[]): void => {
    mutations.forEach((mutation: MutationRecord): void => {
      mutation.addedNodes.forEach((node: Node): void => {
        if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'SCRIPT') {
          const scriptElement = node as HTMLScriptElement;
          const src = scriptElement.src || '';
          const content = scriptElement.textContent || '';

          // Check if this script might be RxJS
          if (src.includes('rxjs') || src.includes('rx.') ||
            content.includes('Observable') || content.includes('rxjs')) {

            setTimeout((): void => {
              checkForRxJS().then((found: boolean): void => {
                if (found) notifyRxJSDetected();
              });
            }, 500);
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Periodic check for dynamically loaded RxJS
  let checkCount = 0;
  const maxChecks = 20; // Check for 10 seconds

  const periodicCheck = setInterval((): void => {
    checkCount++;

    if (detector.rxjsDetected || checkCount >= maxChecks) {
      clearInterval(periodicCheck);
      observer.disconnect();
      return;
    }

    checkForRxJS().then((found: boolean): void => {
      if (found) {
        notifyRxJSDetected();
        clearInterval(periodicCheck);
        observer.disconnect();
      }
    });
  }, 500);

  // Listen for messages from DevTools panel
  chrome.runtime.onMessage.addListener((
    request: CheckRxJSMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean => {
    if (request.action === 'checkRxJS') {
      checkForRxJS().then((found: boolean): void => {
        sendResponse({ rxjsDetected: found });
        if (found && !detector.rxjsDetected) {
          notifyRxJSDetected();
        }
      });
      return true; // Keep channel open for async response
    }
    return false;
  });

  // Listen for messages from injected script AND global hook
  window.addEventListener('message', (event: MessageEvent): void => {
    if (event.source !== window || !event.data.type) return;

    // Forward RxJS events to the DevTools (both injected script and global hook)
    if (event.data.source === 'rxjs-devtools-injected' || event.data.source === 'rxjs-devtools-global-hook') {
      console.log('🔄 RxJS DevTools: Content script forwarding message:', event.data);
      try {
        // Don't expect a response for forwarding messages
        chrome.runtime.sendMessage(event.data as DevToolsMessage);
      } catch (error) {
        console.error('🔄 RxJS DevTools: Error sending message to background:', error);
      }
    }
    
    // Special handling for DevTools hook ready signal
    if (event.data.type === 'devtools-ready' && event.data.source === 'rxjs-devtools-global-hook') {
      console.log('🔄 RxJS DevTools: Global hook is ready!');
      // Mark RxJS as detected since the global hook is available
      notifyRxJSDetected();
    }
  });

  console.log('🔄 RxJS DevTools: Content script loaded');
})();

