// RxJS DevTools - DevTools Panel UI Logic

// Type definitions for panel
interface StreamEmission {
  type: 'next' | 'error' | 'complete';
  value: any;
  timestamp: number;
  stackTrace?: string;
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

interface DevToolsMessage {
  type: string;
  source?: string;
  data?: any;
  timestamp?: number;
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

interface PanelElements {
  statusDot: HTMLElement;
  statusText: HTMLElement;
  clearBtn: HTMLButtonElement;
  pauseBtn: HTMLButtonElement;
  streamFilter: HTMLInputElement;
  streamList: HTMLElement;
  streamDetails: HTMLElement;
}

class RxJSDevToolsPanel {
  private streams = new Map<string, StreamInfo>();
  private selectedStreamId: string | null = null;
  private isPaused = false;
  private isRxJSDetected = false;
  private port!: chrome.runtime.Port;
  private elements!: PanelElements;

  constructor() {
    console.log('🔄 RxJS DevTools Panel: Constructor called');
    
    console.log('🔄 RxJS DevTools Panel: Initializing elements...');
    this.initializeElements();
    console.log('🔄 RxJS DevTools Panel: Setting up event listeners...');
    this.setupEventListeners();
    console.log('🔄 RxJS DevTools Panel: Connecting to background...');
    this.connectToBackground();
    console.log('🔄 RxJS DevTools Panel: Initialization complete');
  }

  private initializeElements(): void {
    this.elements = {
      statusDot: document.getElementById('statusDot')!,
      statusText: document.getElementById('statusText')!,
      clearBtn: document.getElementById('clearBtn') as HTMLButtonElement,
      pauseBtn: document.getElementById('pauseBtn') as HTMLButtonElement,
      streamFilter: document.getElementById('streamFilter') as HTMLInputElement,
      streamList: document.getElementById('streamList')!,
      streamDetails: document.getElementById('streamDetails')!
    };
  }

  private setupEventListeners(): void {
    this.elements.clearBtn.addEventListener('click', (): void => this.clearAllStreams());
    this.elements.pauseBtn.addEventListener('click', (): void => this.togglePause());
    this.elements.streamFilter.addEventListener('input', (e: Event): void => {
      const target = e.target as HTMLInputElement;
      this.filterStreams(target.value);
    });

    // Create a connection to the background script for DevTools messaging
    this.port = chrome.runtime.connect({ name: 'devtools-panel' });
    this.port.onMessage.addListener((message: DevToolsMessage): void => {
      // Only log important messages, not every emission
      if (message.type !== 'stream-emission') {
        console.log('🔄 RxJS DevTools Panel: Received message via port:', message);
      }
      this.handleMessage(message);
    });

    // Also listen for regular runtime messages as backup
    chrome.runtime.onMessage.addListener((
      message: DevToolsMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ): void => {
      // Only log important messages, not every emission
      if (message.type !== 'stream-emission') {
        console.log('🔄 RxJS DevTools Panel: Received message via runtime:', message);
      }
      this.handleMessage(message);
    });

    // Send the current tab ID to background so it knows which tab this panel is for
    const panelMessage: DevToolsPanelMessage = {
      type: 'devtools-panel-connected',
      tabId: chrome.devtools.inspectedWindow.tabId
    };
    this.port.postMessage(panelMessage);

    console.log('🔄 RxJS DevTools Panel: Event listeners set up');
  }

  private connectToBackground(): void {
    // In DevTools context, we need to use chrome.devtools.inspectedWindow.tabId
    const tabId = chrome.devtools.inspectedWindow.tabId;
    console.log('🔄 RxJS DevTools Panel: Connecting to background for tab:', tabId);

    if (tabId) {
      // Retry mechanism for getting tab data
      const maxRetries = 5;
      let retryCount = 0;
      
      const tryGetTabData = (): void => {
        const getTabDataMessage: GetTabDataMessage = {
          action: 'getTabData',
          tabId: tabId
        };

        chrome.runtime.sendMessage(getTabDataMessage, (response: GetTabDataResponse): void => {
          if (chrome.runtime.lastError) {
            console.log('🔄 RxJS DevTools Panel: Runtime error:', chrome.runtime.lastError);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`🔄 RxJS DevTools Panel: Retrying connection (${retryCount}/${maxRetries})...`);
              setTimeout(tryGetTabData, 1000 * retryCount);
            } else {
              this.updateStatus(false, 'Connection error');
            }
          } else if (response && response.rxjsDetected) {
            console.log('🔄 RxJS DevTools Panel: RxJS detected via background');
            this.updateStatus(true, 'RxJS detected');
            this.isRxJSDetected = true;

            // Load existing streams if any
            if (response.streams && typeof response.streams === 'object') {
              const streams = Object.values(response.streams);
              console.log('🔄 RxJS DevTools Panel: Loading', streams.length, 'existing streams');

              for (const stream of streams) {
                this.addStream(stream);
                // Add existing emissions
                if (stream.emissions && Array.isArray(stream.emissions)) {
                  stream.emissions.forEach((emission: StreamEmission): void => {
                    this.addEmission({
                      streamId: stream.id,
                      type: emission.type,
                      value: emission.value,
                      timestamp: emission.timestamp
                    });
                  });
                }
              }
            }
          } else {
            console.log('🔄 RxJS DevTools Panel: No RxJS detected yet');
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`🔄 RxJS DevTools Panel: Retrying tab data check (${retryCount}/${maxRetries})...`);
              setTimeout(tryGetTabData, 2000 * retryCount);
            } else {
              this.updateStatus(false, 'No RxJS detected');
            }
          }
        });
      };
      
      // Start initial attempt
      tryGetTabData();
      
      // Also try direct tab messaging as fallback
      try {
        chrome.tabs.sendMessage(tabId, { action: 'checkRxJS' }, (response: any): void => {
          if (!chrome.runtime.lastError && response && response.rxjsDetected) {
            console.log('🔄 RxJS DevTools Panel: RxJS detected via tab message');
            this.updateStatus(true, 'RxJS detected');
            this.isRxJSDetected = true;
          }
        });
      } catch (error) {
        console.log('🔄 RxJS DevTools Panel: Tab messaging failed:', error);
      }
      
      // Periodic check for new streams that might have been missed
      setInterval(() => {
        if (this.isRxJSDetected && this.streams.size === 0) {
          console.log('🔄 RxJS DevTools Panel: Periodic check for missed streams...');
          tryGetTabData();
        }
      }, 5000);
      
    } else {
      console.log('🔄 RxJS DevTools Panel: No active tab');
      this.updateStatus(false, 'No active tab');
    }
  }

  private handleMessage(message: DevToolsMessage): void {
    // Don't pause console clearing messages
    if (message.type === 'clear-console') {
      this.clearDevToolsConsole();
      return;
    }
    
    if (this.isPaused) return;

    switch (message.type) {
      case 'rxjs-detected':
        this.updateStatus(true, 'RxJS detected');
        this.isRxJSDetected = true;
        break;

      case 'devtools-ready':
        console.log('🔄 RxJS DevTools Panel: DevTools hook is ready');
        this.updateStatus(true, 'DevTools ready');
        this.isRxJSDetected = true;
        break;

      case 'app-connected':
        console.log('🔄 RxJS DevTools Panel: App connected:', message.data?.name || 'Unknown App');
        this.updateStatus(true, `Connected: ${message.data?.name || 'App'}`);
        this.isRxJSDetected = true;
        break;

      case 'new-stream':
        if (message.data) {
          console.log('🔄 RxJS DevTools Panel: New stream received:', message.data.name);
          this.addStream(message.data);
        }
        break;

      case 'stream-emission':
        if (message.data) {
          this.addEmission(message.data);
        }
        break;

      case 'stream-complete':
        if (message.data) {
          this.markStreamComplete(message.data.id);
        }
        break;

      case 'stream-error':
        if (message.data) {
          this.markStreamError(message.data.id, message.data.error);
        }
        break;

      default:
        // Log unknown message types for debugging
        if (message.type !== 'stream-emission') {
          console.log('🔄 RxJS DevTools Panel: Unknown message type:', message.type, message);
        }
        break;
    }
  }

  private updateStatus(connected: boolean, text: string): void {
    this.elements.statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
    this.elements.statusText.textContent = text;
  }

  private addStream(streamData: any): void {
    const stream: StreamInfo = {
      id: streamData.id,
      name: streamData.name || `Observable #${streamData.id}`,
      type: streamData.type || 'Observable',
      createdAt: new Date(streamData.timestamp),
      emissions: [],
      status: 'active',
      subscriptions: streamData.subscriptions || 0
    };

    this.streams.set(stream.id, stream);
    this.renderStreamList();
  }

  private addEmission(emissionData: {
    streamId: string;
    type: 'next' | 'error' | 'complete';
    value: any;
    timestamp: number;
  }): void {
    const stream = this.streams.get(emissionData.streamId);
    if (!stream) return;

    const emission: StreamEmission = {
      type: emissionData.type,
      value: emissionData.value,
      timestamp: emissionData.timestamp
    };

    stream.emissions.push(emission);

    // Limit emissions to prevent memory issues
    if (stream.emissions.length > 1000) {
      stream.emissions = stream.emissions.slice(-500);
    }

    this.renderStreamList();

    if (this.selectedStreamId === stream.id) {
      this.renderStreamDetails(stream);
    }
  }

  private markStreamComplete(streamId: string): void {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.status = 'completed';
      this.renderStreamList();

      if (this.selectedStreamId === streamId) {
        this.renderStreamDetails(stream);
      }
    }
  }

  private markStreamError(streamId: string, error: any): void {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.status = 'error';
      stream.lastError = error;
      this.renderStreamList();

      if (this.selectedStreamId === streamId) {
        this.renderStreamDetails(stream);
      }
    }
  }

  private renderStreamList(): void {
    const filter = this.elements.streamFilter.value.toLowerCase();
    const filteredStreams = Array.from(this.streams.values())
      .filter((stream: StreamInfo): boolean => stream.name.toLowerCase().includes(filter));

    if (filteredStreams.length === 0) {
      this.elements.streamList.innerHTML = '<div class="no-streams">No streams match your filter</div>';
      return;
    }

    this.elements.streamList.innerHTML = filteredStreams
      .sort((a: StreamInfo, b: StreamInfo): number => b.createdAt.getTime() - a.createdAt.getTime())
      .map((stream: StreamInfo): string => this.createStreamItemHTML(stream))
      .join('');

    // Add click listeners
    this.elements.streamList.querySelectorAll('.stream-item').forEach((item: Element): void => {
      item.addEventListener('click', (): void => {
        const streamId = (item as HTMLElement).dataset.streamId;
        if (streamId) {
          this.selectStream(streamId);
        }
      });
    });
  }

  private createStreamItemHTML(stream: StreamInfo): string {
    const isActive = this.selectedStreamId === stream.id;
    const emissionCount = stream.emissions.length;

    return `
            <div class="stream-item ${isActive ? 'active' : ''}" data-stream-id="${stream.id}">
                <div class="stream-name">
                    <span class="stream-status ${stream.status}"></span>
                    ${stream.name}
                </div>
                <div class="stream-info">
                    <span>${emissionCount} emissions</span>
                    <span>${this.formatTime(stream.createdAt)}</span>
                </div>
            </div>
        `;
  }

  private selectStream(streamId: string): void {
    this.selectedStreamId = streamId;
    const stream = this.streams.get(streamId);

    if (stream) {
      this.renderStreamList(); // Update selection
      this.renderStreamDetails(stream);
    }
  }

  private renderStreamDetails(stream: StreamInfo): void {
    const html = `
            <div class="stream-detail-header">
                <div>
                    <div class="stream-detail-title">${stream.name}</div>
                    <div class="stream-detail-info">
                        Created: ${stream.createdAt.toLocaleString()} | 
                        Status: ${stream.status} | 
                        Emissions: ${stream.emissions.length}
                    </div>
                </div>
            </div>
            
            <div class="emissions-container">
                <div class="emissions-header">
                    Stream Emissions (latest first)
                </div>
                ${stream.emissions.length === 0
        ? '<div style="padding: 20px; text-align: center; color: #888;">No emissions yet</div>'
        : stream.emissions
          .slice()
          .reverse()
          .map((emission: StreamEmission): string => this.createEmissionHTML(emission))
          .join('')
      }
            </div>
        `;

    this.elements.streamDetails.innerHTML = html;
  }

  private createEmissionHTML(emission: StreamEmission): string {
    const value = this.formatValue(emission.value);

    return `
            <div class="emission-item">
                <span class="emission-timestamp">${this.formatTime(new Date(emission.timestamp))}</span>
                <span class="emission-type ${emission.type}">${emission.type.toUpperCase()}</span>
                <span class="emission-value">${value}</span>
            </div>
        `;
  }

  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    try {
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    } catch (e) {
      return '[Object - could not serialize]';
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }

  private clearAllStreams(): void {
    this.streams.clear();
    this.selectedStreamId = null;
    this.renderStreamList();
    this.elements.streamDetails.innerHTML = `
            <div class="welcome-message">
                <h2>Streams Cleared</h2>
                <p>All observable streams have been cleared from the DevTools.</p>
            </div>
        `;
    
    // Clear the DevTools console
    this.clearDevToolsConsole();
  }
  
  private clearDevToolsConsole(): void {
    // Multiple aggressive clearing methods for extension console logs
    
    // Method 1: Clear our panel context
    if (typeof console !== 'undefined' && console.clear) {
      console.clear();
    }
    
    // Method 2: Clear page console
    try {
      if (chrome.devtools && chrome.devtools.inspectedWindow) {
        chrome.devtools.inspectedWindow.eval('console.clear();');
      }
    } catch (error) {
      // Ignore
    }
    
    // Method 3: Try Command Line API clear function
    try {
      if (chrome.devtools && chrome.devtools.inspectedWindow) {
        chrome.devtools.inspectedWindow.eval(`
          if (typeof clear === 'function') {
            clear();
          } else {
            console.clear();
          }
        `);
      }
    } catch (error) {
      // Ignore
    }
    
    // Method 4: Multiple sequential clears to catch all contexts
    [50, 100, 200, 400].forEach(delay => {
      setTimeout(() => {
        try {
          if (console && console.clear) {
            console.clear();
          }
          
          // Try global clear
          if (typeof (window as any).clear === 'function') {
            (window as any).clear();
          }
          
          // Try DevTools clear again
          if (chrome.devtools) {
            chrome.devtools.inspectedWindow.eval('console.clear()');
          }
        } catch (e) {
          // Silent fail
        }
      }, delay);
    });
    
    // Final message
    setTimeout(() => {
      console.log('🔄 RxJS DevTools: Console cleared');
    }, 500);
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.elements.pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
    this.elements.pauseBtn.title = this.isPaused ? 'Resume recording' : 'Pause recording';

    if (this.isPaused) {
      this.updateStatus(false, 'Recording paused');
    } else {
      this.updateStatus(this.isRxJSDetected, this.isRxJSDetected ? 'RxJS detected' : 'No RxJS detected');
    }
  }

  private filterStreams(filterText: string): void {
    this.renderStreamList();
  }
}

// Initialize the panel when it's shown
function initializePanel(): void {
  if (!(window as any).rxjsDevToolsPanel) {
    (window as any).rxjsDevToolsPanel = new RxJSDevToolsPanel();
  }
}

// Auto-initialize if the panel is already visible
if (document.readyState === 'complete') {
  initializePanel();
} else {
  document.addEventListener('DOMContentLoaded', initializePanel);
}

// Export for devtools panel creation
(window as any).initializePanel = initializePanel;

