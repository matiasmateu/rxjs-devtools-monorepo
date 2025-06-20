// RxJS DevTools - Background Service Worker

// Type definitions
interface StreamEmission {
  type: 'next' | 'error' | 'complete';
  value: any;
  timestamp: number;
}

interface StreamInfo {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  emissions: StreamEmission[];
  status: 'active' | 'completed' | 'error';
  subscriptions: number;
  lastError?: any;
}

interface TabData {
  rxjsDetected: boolean;
  streams: Map<string, StreamInfo>;
  url?: string;
}

interface RxJSDetectionMessage {
  type: 'rxjs-detected';
  url: string;
  timestamp: number;
}

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

interface GetTabDataMessage {
  action: 'getTabData';
  tabId: number;
}

interface GetTabDataResponse {
  rxjsDetected: boolean;
  streams: Record<string, StreamInfo>;
  url?: string;
}

interface DevToolsPanelMessage {
  type: 'devtools-panel-connected';
  tabId: number;
}

console.log('🔄 RxJS DevTools: Background script loaded');

// Store tab-specific RxJS data
const tabData = new Map<number, TabData>();
// Store DevTools panel connections
const devToolsPanels = new Map<number, chrome.runtime.Port>();

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails): void => {
    console.log('🔄 RxJS DevTools installed:', details.reason);
    
    if (details.reason === 'install') {
        console.log('🔄 First time installation - Welcome to RxJS DevTools!');
    } else if (details.reason === 'update') {
        console.log('🔄 RxJS DevTools updated');
    }
});

// Listen for messages from content scripts and DevTools
chrome.runtime.onMessage.addListener((
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
): boolean | void => {
    const tabId = sender.tab?.id;
    
    // Handle RxJS detection
    if ('type' in request && request.type === 'rxjs-detected') {
        const rxjsMessage = request as RxJSDetectionMessage;
        console.log('🔄 RxJS detected on tab:', tabId, rxjsMessage.url);
        
        if (tabId) {
            if (!tabData.has(tabId)) {
                tabData.set(tabId, {
                    rxjsDetected: true,
                    streams: new Map<string, StreamInfo>(),
                    url: rxjsMessage.url
                });
            }
            const data = tabData.get(tabId)!;
            data.rxjsDetected = true;
        }
        
        // Forward to DevTools if open
        forwardToDevTools(tabId, request);
        return;
    }
    
    // Handle stream events from both injected script and global hook
    if (request.source === 'rxjs-devtools-injected' || request.source === 'rxjs-devtools-global-hook') {
        // Handle global hook ready signal
        if (request.type === 'devtools-ready') {
            console.log('🔄 RxJS DevTools: Global hook ready on tab:', tabId);
            if (tabId) {
                if (!tabData.has(tabId)) {
                    tabData.set(tabId, {
                        rxjsDetected: true,
                        streams: new Map<string, StreamInfo>(),
                        url: request.data?.url || 'unknown'
                    });
                } else {
                    const data = tabData.get(tabId)!;
                    data.rxjsDetected = true;
                }
            }
            // Forward to DevTools
            forwardToDevTools(tabId, request);
            return;
        }
        
        if (tabId && tabData.has(tabId)) {
            const data = tabData.get(tabId)!;
            
            // Store stream data
            if (request.type === 'new-stream') {
                const newStreamMessage = request as NewStreamMessage;
                // Store all metadata fields from the new-stream message
                data.streams.set(newStreamMessage.data.id, {
                    ...newStreamMessage.data, // includes id, name, type, timestamp, and any custom metadata
                    createdAt: new Date(newStreamMessage.data.timestamp),
                    emissions: [],
                    status: 'active',
                    subscriptions: 0
                });
            } else if (request.type === 'stream-emission') {
                const emissionMessage = request as StreamEmissionMessage;
                const stream = data.streams.get(emissionMessage.data.streamId);
                if (stream) {
                    stream.emissions.push({
                        type: emissionMessage.data.type,
                        value: emissionMessage.data.value,
                        timestamp: emissionMessage.data.timestamp
                    });
                    
                    // Limit emissions to prevent memory issues
                    if (stream.emissions.length > 1000) {
                        stream.emissions = stream.emissions.slice(-500);
                    }
                }
            }
        }
        
        // Forward to DevTools
        forwardToDevTools(tabId, request);
        return;
    }
    
    // Handle DevTools requests
    if ('action' in request && request.action === 'getTabData') {
        const getTabDataMessage = request as GetTabDataMessage;
        const data = tabData.get(getTabDataMessage.tabId);
        if (data) {
            // Convert Map to plain object for JSON serialization
            const serializedData: GetTabDataResponse = {
                rxjsDetected: data.rxjsDetected,
                url: data.url,
                streams: Object.fromEntries(data.streams)
            };
            sendResponse(serializedData);
        } else {
            sendResponse({ rxjsDetected: false, streams: {} });
        }
        return true;
    }
    
    return true; // Keep the message channel open for async response
});

// Listen for DevTools panel connections
chrome.runtime.onConnect.addListener((port: chrome.runtime.Port): void => {
    if (port.name === 'devtools-panel') {
        console.log('🔄 RxJS DevTools: DevTools panel connected');
        
        port.onMessage.addListener((message: DevToolsPanelMessage): void => {
            if (message.type === 'devtools-panel-connected') {
                const tabId = message.tabId;
                devToolsPanels.set(tabId, port);
                console.log('🔄 RxJS DevTools: Panel registered for tab:', tabId);
                
                // Send any existing data for this tab
                const data = tabData.get(tabId);
                if (data && data.rxjsDetected) {
                    port.postMessage({ type: 'rxjs-detected' });
                    
                    // Send existing streams
                    for (const stream of data.streams.values()) {
                        port.postMessage({ type: 'new-stream', data: stream });
                        
                        // Send existing emissions
                        for (const emission of stream.emissions) {
                            port.postMessage({ 
                                type: 'stream-emission', 
                                data: {
                                    streamId: stream.id,
                                    type: emission.type,
                                    value: emission.value,
                                    timestamp: emission.timestamp
                                }
                            });
                        }
                    }
                }
            }
        });
        
        port.onDisconnect.addListener((): void => {
            console.log('🔄 RxJS DevTools: DevTools panel disconnected');
            // Remove from our tracking
            for (const [tabId, p] of devToolsPanels.entries()) {
                if (p === port) {
                    devToolsPanels.delete(tabId);
                    break;
                }
            }
        });
    }
});

// Forward messages to DevTools panel
function forwardToDevTools(tabId: number | undefined, message: any): void {
    if (!tabId) return;
    
    // Only log important messages, not every emission
    const messageType = message.type || message.action;
    if (messageType !== 'stream-emission') {
        console.log('🔄 RxJS DevTools: Background forwarding to DevTools:', messageType);
    }
    
    // Send via connection port if panel is connected
    const port = devToolsPanels.get(tabId);
    if (port) {
        try {
            port.postMessage(message);
            // Only log success for important messages
            if (messageType !== 'stream-emission') {
                console.log('🔄 RxJS DevTools: Message sent via port to panel');
            }
        } catch (error) {
            console.log('🔄 RxJS DevTools: Error sending via port:', error);
            devToolsPanels.delete(tabId);
        }
    } else {
        // Only log missing panel for important messages
        if (messageType !== 'stream-emission') {
            console.log('🔄 RxJS DevTools: No DevTools panel connected for tab:', tabId);
        }
    }
}

// Clean up tab data when tabs are closed
chrome.tabs.onRemoved.addListener((tabId: number): void => {
    if (tabData.has(tabId)) {
        console.log('🔄 Cleaning up data for closed tab:', tabId);
        tabData.delete(tabId);
    }
});

// Clean up tab data when tabs are updated (navigation)
chrome.tabs.onUpdated.addListener((
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
): void => {
    if (changeInfo.status === 'loading' && changeInfo.url) {
        // Page is navigating, clear old data
        if (tabData.has(tabId)) {
            tabData.delete(tabId);
        }
        
        // Send console clear message to DevTools panel immediately
        const port = devToolsPanels.get(tabId);
        if (port) {
            try {
                port.postMessage({ 
                    type: 'clear-console',
                    timestamp: Date.now()
                });
            } catch (error) {
                // Panel might be disconnected
            }
        }
        
        // Log page navigation after clearing attempt
        setTimeout(() => {
            console.log('🔄 Page navigation detected, cleared RxJS data for tab:', tabId);
        }, 600);
    }
    
    // Try programmatic injection when page is complete
    if (changeInfo.status === 'complete' && tab.url) {
        tryProgrammaticInjection(tabId, tab.url);
    }
});

// Programmatic injection fallback
async function tryProgrammaticInjection(tabId: number, url: string): Promise<void> {
    // Only try on HTTP/HTTPS pages, and specifically target SiriusXM
    if (!url.startsWith('http') || !url.includes('siriusxm.com')) {
        return;
    }
    
    try {
        console.log('🔄 Attempting programmatic injection for tab:', tabId, url);
        
        // First, inject the content script programmatically
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['dist/rxjs-detector.js']
        });
        
        console.log('🔄 Programmatic content script injection successful for tab:', tabId);
        
        // Give it a moment to execute
        setTimeout(async () => {
            try {
                // Use Redux DevTools-style global hook approach
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['dist/rxjs-global-hook.js'],
                    world: 'MAIN' // Inject into main world
                });
                
                console.log('🔄 Global hook injection successful for tab:', tabId);
            } catch (error) {
                console.log('🔄 Failed to inject global hook, trying fallback:', error);
                
                // Fallback: inject hook directly as code
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId },
                        func: () => {
                            console.log('🔄 RxJS DevTools: Installing global hook directly...');
                            
                            // Install global hook similar to Redux DevTools
                            if (!(window as any).__RXJS_DEVTOOLS_EXTENSION__) {
                                let streamCounter = 0;
                                
                                const devToolsHook = {
                                    version: '1.0.0',
                                    connect(options: any = {}) {
                                        console.log('🔄 RxJS DevTools: App connected to hook:', options.name || 'App');
                                        
                                        return {
                                            subscribe(observable: any) {
                                                const streamId = `hook-stream-${++streamCounter}`;
                                                const streamName = options.name || `Observable #${streamCounter}`;
                                                console.log('🔄 RxJS DevTools: Stream registered via hook:', streamId, streamName);
                                                
                                                window.postMessage({
                                                    type: 'new-stream',
                                                    source: 'rxjs-devtools-global-hook',
                                                    data: {
                                                        id: streamId,
                                                        name: streamName,
                                                        type: 'Observable',
                                                        appName: options.name || 'App',
                                                        timestamp: Date.now()
                                                    }
                                                }, '*');
                                                
                                                return streamId; // Return the stream ID for tracking
                                            },
                                            unsubscribe(observable: any) {
                                                // Handle unsubscribe if needed
                                                console.log('🔄 RxJS DevTools: Stream unsubscribed via hook');
                                            },
                                            emit(streamId: string, type: string, value: any) {
                                                console.log('🔄 RxJS DevTools: Emitting via hook:', streamId, type, typeof value);
                                                window.postMessage({
                                                    type: 'stream-emission',
                                                    source: 'rxjs-devtools-global-hook',
                                                    data: {
                                                        streamId,
                                                        type,
                                                        value,
                                                        timestamp: Date.now()
                                                    }
                                                }, '*');
                                            },
                                            error(streamId: string, error: any) {
                                                console.log('🔄 RxJS DevTools: Error via hook:', streamId, error);
                                                window.postMessage({
                                                    type: 'stream-error',
                                                    source: 'rxjs-devtools-global-hook',
                                                    data: {
                                                        id: streamId,
                                                        error,
                                                        timestamp: Date.now()
                                                    }
                                                }, '*');
                                            },
                                            complete(streamId: string) {
                                                console.log('🔄 RxJS DevTools: Complete via hook:', streamId);
                                                window.postMessage({
                                                    type: 'stream-complete',
                                                    source: 'rxjs-devtools-global-hook',
                                                    data: {
                                                        id: streamId,
                                                        timestamp: Date.now()
                                                    }
                                                }, '*');
                                            }
                                        };
                                    },
                                    isConnected() {
                                        return true;
                                    }
                                };
                                
                                (window as any).__RXJS_DEVTOOLS_EXTENSION__ = devToolsHook;
                                console.log('🔄 RxJS DevTools: Global hook installed');
                                
                                // Notify that hook is ready
                                window.postMessage({
                                    type: 'devtools-ready',
                                    source: 'rxjs-devtools-global-hook',
                                    data: { version: '1.0.0', timestamp: Date.now() }
                                }, '*');
                            }
                        },
                        world: 'MAIN'
                    });
                    
                    console.log('🔄 Fallback global hook injection successful for tab:', tabId);
                } catch (fallbackError) {
                    console.log('🔄 Both global hook injections failed:', fallbackError);
                }
            }
        }, 1000);
        
    } catch (error) {
        console.log('🔄 Failed to inject content script programmatically:', error);
    }
}

console.log('🔄 RxJS DevTools: Background script ready');

