// RxJS DevTools - Extension Popup Logic

// Type definitions
interface GetTabDataMessage {
  action: 'getTabData';
  tabId: number;
}

interface GetTabDataResponse {
  rxjsDetected: boolean;
  streams: Record<string, StreamInfo>;
  url?: string;
}

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

interface CheckRxJSMessage {
  action: 'checkRxJS';
}

interface PopupElements {
  statusDot: HTMLElement;
  statusText: HTMLElement;
  openDevToolsBtn: HTMLButtonElement;
  refreshPageBtn: HTMLButtonElement;
  stats: HTMLElement;
  streamCount: HTMLElement;
  emissionCount: HTMLElement;
}

class PopupController {
  private elements!: PopupElements;
  private currentTab: chrome.tabs.Tab | null = null;

  constructor() {
    this.initializeElements();
    this.init();
  }

  private initializeElements(): void {
    this.elements = {
      statusDot: document.getElementById('statusDot')!,
      statusText: document.getElementById('statusText')!,
      openDevToolsBtn: document.getElementById('openDevTools') as HTMLButtonElement,
      refreshPageBtn: document.getElementById('refreshPage') as HTMLButtonElement,
      stats: document.getElementById('stats')!,
      streamCount: document.getElementById('streamCount')!,
      emissionCount: document.getElementById('emissionCount')!
    };
  }

  private init(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]): void => {
      if (tabs[0]) {
        this.currentTab = tabs[0];
        this.setupEventListeners();
      }
    });
  }

  private setupEventListeners(): void {
    this.elements.openDevToolsBtn.addEventListener('click', (): void => {
      this.elements.statusText.textContent = 'Opening DevTools...';

      chrome.tabs.create({
        url: 'https://developer.chrome.com/docs/devtools/open/',
        active: false
      });

      const originalText = this.elements.statusText.textContent;
      this.elements.statusText.textContent = 'Press F12 or right-click → Inspect';

      setTimeout((): void => {
        this.setupEventListeners();
      }, 2000);
    });

    this.elements.refreshPageBtn.addEventListener('click', (): void => {
      if (this.currentTab && this.currentTab.id) {
        chrome.tabs.reload(this.currentTab.id);
        window.close();
      }
    });

    // Listen for RxJS detection updates
    chrome.runtime.onMessage.addListener((message: any): void => {
      if (message.type === 'rxjs-detected') {
        this.updateStatus(true, 'RxJS detected');
        this.loadStats();
      }
    });

    // Refresh stats periodically when popup is open
    const statsInterval = setInterval((): void => {
      if (this.elements.statusDot.classList.contains('connected')) {
        this.loadStats();
      }
    }, 2000);

    // Cleanup when popup closes
    window.addEventListener('beforeunload', (): void => {
      clearInterval(statsInterval);
    });
  }

  private updateStatus(detected: boolean, message: string): void {
    this.elements.statusDot.className = `status-dot ${detected ? 'connected' : 'disconnected'}`;
    this.elements.statusText.textContent = message;

    if (detected) {
      this.elements.stats.style.display = 'block';
    } else {
      this.elements.stats.style.display = 'none';
    }
  }

  private loadStats(): void {
    if (!this.currentTab || !this.currentTab.id) return;

    const getTabDataMessage: GetTabDataMessage = {
      action: 'getTabData',
      tabId: this.currentTab.id
    };

    chrome.runtime.sendMessage(getTabDataMessage, (response: GetTabDataResponse): void => {
      if (response && response.streams) {
        const streams = response.streams;
        let totalEmissions = 0;

        if (typeof streams === 'object') {
          const streamArray = Object.values(streams);
          this.elements.streamCount.textContent = streamArray.length.toString();

          for (const stream of streamArray) {
            totalEmissions += stream.emissions ? stream.emissions.length : 0;
          }
        } else {
          this.elements.streamCount.textContent = '0';
        }

        this.elements.emissionCount.textContent = totalEmissions.toString();
      } else {
        this.elements.streamCount.textContent = '0';
        this.elements.emissionCount.textContent = '0';
      }
    });
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', (): void => {
  const root = document.body;
  root.innerHTML = `<div style="padding: 1.5em; font-size: 1.1em; text-align: center;">
    <strong>RxJS DevTools is now <span style='color:#61dafb'>React-only</span>.</strong><br/><br/>
    Please use the <b>React integration hooks/utilities</b> to track observables.<br/><br/>
    <a href='https://github.com/matiasmateu/rxjs-devtools-monorepo' target='_blank'>Learn more</a>
  </div>`;
});

