/**
 * Market WebSocket Service
 * Handles connections to the WebSocket gateway for market data and user-specific streams
 */

import { getWebsocketUrl } from "@/constants/urls/urls-config";

// Types for WebSocket messages
export interface WebSocketSubscribeMessage {
  method: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'LIST_SUBSCRIPTIONS';
  params?: string[];
  id: number;
}

export interface ExecutionReportEvent {
  e: 'executionReport';
  E: number; // Event time
  s: string; // Symbol
  i: string; // Order ID
  S: 'BUY' | 'SELL'; // Side
  o: 'MARKET' | 'LIMIT'; // Order type
  x: 'NEW' | 'TRADE' | 'CANCELED'; // Execution type
  X: 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED'; // Order status
  q: string; // Total order quantity
  z: string; // Cumulative filled quantity
  p: string; // Limit price
  L: string; // Last executed price
  T: number; // Timestamp
}

export interface BalanceUpdateEvent {
  e: 'balanceUpdate';
  E: number; // Event time
  a: string; // Token address
  b: string; // Available balance
  l: string; // Locked balance
}

export interface DepthEvent {
  e: 'depthUpdate';
  E: number; // Event time
  s: string; // Symbol
  b: [string, string][]; // Bids [price, quantity]
  a: [string, string][]; // Asks [price, quantity]
}

export interface TradeEvent {
  e: 'trade';
  E: number; // Event time
  s: string; // Symbol
  t: string; // Trade ID
  p: string; // Price
  q: string; // Quantity
  T: number; // Trade time
  m: boolean; // Is buyer market maker
}

export interface KlineEvent {
  e: 'kline';
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Volume
  };
}

export interface MiniTickerEvent {
  e: 'miniTicker' | '24hrMiniTicker';
  E: number; // Event time
  s: string; // Symbol
  c: string; // Close price
  h: string; // High price
  l: string; // Low price
  v: string; // Volume
}

// We can add more event types here as needed in the future

export type WebSocketEvent = 
  | ExecutionReportEvent 
  | BalanceUpdateEvent 
  | DepthEvent 
  | TradeEvent 
  | KlineEvent 
  | MiniTickerEvent;

// Message ID counter
let messageIdCounter = 1;

/**
 * Market WebSocket class for handling market data streams
 */
export class MarketWebSocket {
  private socket: WebSocket | null = null;
  private subscriptions: Set<string> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private messageHandlers: ((event: WebSocketEvent) => void)[] = [];
  private chainId: number = 31337;
  private isConnecting = false;

  /**
   * Connect to the market WebSocket
   */
  public connect(chainId: number): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection is in progress');
      return;
    }

    this.isConnecting = true;

    try {
      console.log('Connecting to market WebSocket...');
      this.socket = new WebSocket(`${getWebsocketUrl(chainId)}/ws`);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = false;
    this.subscriptions.clear();
  }

  /**
   * Subscribe to a market stream
   * @param symbol Symbol (e.g., 'ethusdc')
   * @param streamType Stream type (e.g., 'depth', 'trade', 'kline_1m')
   */
  public subscribe(symbol: string, streamType: string, chainId: number): void {
    const stream = `${symbol.toLowerCase()}@${streamType}`;

    this.chainId = chainId;
    
    if (this.subscriptions.has(stream)) {
      console.log(`Already subscribed to ${stream}`);
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected, connecting first...');
      this.subscriptions.add(stream);
      this.connect(chainId);
      return;
    }

    const message: WebSocketSubscribeMessage = {
      method: 'SUBSCRIBE',
      params: [stream],
      id: messageIdCounter++
    };

    this.socket.send(JSON.stringify(message));
    this.subscriptions.add(stream);
    console.log(`Subscribed to ${stream}`);
  }

  /**
   * Unsubscribe from a market stream
   * @param symbol Symbol (e.g., 'ethusdc')
   * @param streamType Stream type (e.g., 'depth', 'trade', 'kline_1m')
   */
  public unsubscribe(symbol: string, streamType: string): void {
    const stream = `${symbol.toLowerCase()}@${streamType}`;
    
    if (!this.subscriptions.has(stream)) {
      console.log(`Not subscribed to ${stream}`);
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected');
      this.subscriptions.delete(stream);
      return;
    }

    const message: WebSocketSubscribeMessage = {
      method: 'UNSUBSCRIBE',
      params: [stream],
      id: messageIdCounter++
    };

    this.socket.send(JSON.stringify(message));
    this.subscriptions.delete(stream);
    console.log(`Unsubscribed from ${stream}`);
  }

  /**
   * List current subscriptions
   */
  public listSubscriptions(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected');
      return;
    }

    const message: WebSocketSubscribeMessage = {
      method: 'LIST_SUBSCRIPTIONS',
      id: messageIdCounter++
    };

    this.socket.send(JSON.stringify(message));
  }

  /**
   * Add a message handler
   * @param handler Function to handle WebSocket messages
   */
  public addMessageHandler(handler: (event: WebSocketEvent) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a message handler
   * @param handler Function to remove
   */
  public removeMessageHandler(handler: (event: WebSocketEvent) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('Market WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Resubscribe to all streams
    if (this.subscriptions.size > 0) {
      const streams = Array.from(this.subscriptions);
      const message: WebSocketSubscribeMessage = {
        method: 'SUBSCRIBE',
        params: streams,
        id: messageIdCounter++
      };

      this.socket?.send(JSON.stringify(message));
      console.log(`Resubscribed to ${streams.length} streams`);
    }
  }

  /**
   * Handle WebSocket messages
   * @param event WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // Safely parse the message data
      const data = JSON.parse(event.data);
      
      // Add validation to ensure data is a valid WebSocketEvent
      if (data && typeof data === 'object') {
        console.log('Market WebSocket message:', data);
        
        // Notify all handlers with the validated data
        for (const handler of this.messageHandlers) {
          try {
            handler(data);
          } catch (handlerError) {
            console.error('Error in WebSocket message handler:', handlerError);
          }
        }
      } else {
        console.warn('Received invalid WebSocket message format:', data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`Market WebSocket closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error
   * @param event WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('Market WebSocket error:', event);
    this.isConnecting = false;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect(this.chainId);
      }, delay);
    } else {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
    }
  }
}

/**
 * User WebSocket class for handling user-specific streams
 */
export class UserWebSocket {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private messageHandlers: ((event: WebSocketEvent) => void)[] = [];
  private walletAddress: string;
  private chainId: number;
  private isConnecting = false;

  /**
   * Create a new UserWebSocket instance
   * @param walletAddress User's wallet address
   */
  constructor(walletAddress: string, chainId: number) {
    this.walletAddress = walletAddress;
    this.chainId = chainId;
  }

  /**
   * Connect to the user WebSocket
   */
  public connect(chainId: number): void {
    if (!this.walletAddress) {
      console.error('Wallet address is required for user WebSocket');
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('User WebSocket is already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      console.log('User WebSocket connection is in progress');
      return;
    }

    this.isConnecting = true;

    try {
      console.log(`Connecting to user WebSocket for ${this.walletAddress}...`);
      this.socket = new WebSocket(`${getWebsocketUrl(chainId)}/ws/${this.walletAddress}`);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error connecting to user WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = false;
  }

  /**
   * Update the wallet address and reconnect
   * @param walletAddress New wallet address
   */
  public updateWalletAddress(walletAddress: string, chainId: number): void {
    if (this.walletAddress === walletAddress) {
      return;
    }

    this.walletAddress = walletAddress;
    this.chainId = chainId;
    
    // Disconnect and reconnect with new address
    this.disconnect();
    if (walletAddress) {
      this.connect(chainId);
    }
  }

  /**
   * Add a message handler
   * @param handler Function to handle WebSocket messages
   */
  public addMessageHandler(handler: (event: WebSocketEvent) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a message handler
   * @param handler Function to remove
   */
  public removeMessageHandler(handler: (event: WebSocketEvent) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log(`User WebSocket connected for ${this.walletAddress}`);
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Handle WebSocket messages
   * @param event WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('User WebSocket message:', data);

      // Notify all handlers
      for (const handler of this.messageHandlers) {
        handler(data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`User WebSocket closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error
   * @param event WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('User WebSocket error:', event);
    this.isConnecting = false;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Scheduling user WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect(this.chainId);
      }, delay);
    } else {
      console.error(`Failed to reconnect user WebSocket after ${this.maxReconnectAttempts} attempts`);
    }
  }
}

// Create singleton instances
const marketWs = new MarketWebSocket();
const userWsInstances = new Map<string, UserWebSocket>();

/**
 * Get the market WebSocket instance
 */
export const getMarketWebSocket = (): MarketWebSocket => {
  return marketWs;
};

/**
 * Get a user WebSocket instance for a specific wallet address
 * @param walletAddress User's wallet address
 */
export const getUserWebSocket = (walletAddress: string, chainId: number): UserWebSocket => {
  if (!userWsInstances.has(walletAddress)) {
    userWsInstances.set(walletAddress, new UserWebSocket(walletAddress, chainId));
  }
  return userWsInstances.get(walletAddress)!;
};
