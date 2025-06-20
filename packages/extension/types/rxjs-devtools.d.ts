// RxJS DevTools Type Definitions

export interface StreamEmission {
  type: 'next' | 'error' | 'complete';
  value: any;
  timestamp: number;
  stackTrace?: string;
}

export interface StreamInfo {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  emissions: StreamEmission[];
  status: 'active' | 'completed' | 'error';
  subscriptions: number;
  lastError?: any;
}

export interface TabData {
  rxjsDetected: boolean;
  streams: Map<string, StreamInfo>;
  url?: string;
}

export interface DevToolsMessage {
  type: string;
  source?: string;
  data?: any;
  timestamp: number;
  tabId?: number;
}

export interface RxJSDetectionMessage extends DevToolsMessage {
  type: 'rxjs-detected';
  url: string;
}

export interface NewStreamMessage extends DevToolsMessage {
  type: 'new-stream';
  data: {
    id: string;
    name: string;
    type: string;
    timestamp: number;
    stackTrace?: string;
  };
}

export interface StreamEmissionMessage extends DevToolsMessage {
  type: 'stream-emission';
  data: {
    streamId: string;
    type: 'next' | 'error' | 'complete';
    value: any;
    timestamp: number;
  };
}

export interface StreamCompleteMessage extends DevToolsMessage {
  type: 'stream-complete';
  data: {
    id: string;
    timestamp: number;
  };
}

export interface StreamErrorMessage extends DevToolsMessage {
  type: 'stream-error';
  data: {
    id: string;
    error: any;
    timestamp: number;
  };
}

export interface CheckRxJSMessage {
  action: 'checkRxJS';
}

export interface GetTabDataMessage {
  action: 'getTabData';
  tabId: number;
}

export interface GetTabDataResponse {
  rxjsDetected: boolean;
  streams: Record<string, StreamInfo>;
  url?: string;
}

export interface DevToolsPanelMessage {
  type: 'devtools-panel-connected';
  tabId: number;
}

// RxJS Related Types
export interface RxJSObservable {
  subscribe(observer?: any): any;
  pipe(...operators: any[]): RxJSObservable;
  __rxjsDevToolsId?: string;
  __rxjsDevToolsOriginalSubscribe?: Function;
}

export interface RxJSOperator {
  (source: RxJSObservable): RxJSObservable;
}

// Window extensions for RxJS detection
declare global {
  interface Window {
    rxjs?: {
      Observable: any;
      [key: string]: any;
    };
    Rx?: {
      Observable: any;
      [key: string]: any;
    };
    Observable?: any;
    ng?: any;
    angular?: any;
    Zone?: any;
    React?: any;
    ReactDOM?: any;
    getAllAngularTestabilities?: any;
    __webpack_require__?: any;
    System?: any;
    require?: any;
    define?: any;
    initializePanel?: () => void;
  }

  // Declare require as optional global
  declare var require: {
    (id: string): any;
    [key: string]: any;
  } | undefined;
}

export {};

