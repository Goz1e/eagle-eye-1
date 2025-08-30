import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import NodeCache from 'node-cache';
import Redis from 'redis';

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

export interface AptosConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  maxRetries: number;
  cacheTTL: number;
  rateLimitPerSecond: number;
  enableRedis: boolean;
  redisUrl?: string;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
}

export interface PaginationParams extends Record<string, unknown> {
  limit?: number;
  start?: string;
}

export interface EventFilter {
  type?: string;
  fromEvent?: string;
  toEvent?: string;
}

export interface TransactionInfo {
  version: string;
  hash: string;
  timestamp: string;
  sender: string;
  receiver?: string;
  amount?: string;
  tokenType?: string;
  tokenSymbol?: string;
  status: 'success' | 'failure';
  gasUsed: string;
  gasPrice: string;
  sequenceNumber: string;
  expirationTime: string;
  function: string;
  events: Event[];
}

export interface Event {
  type: string;
  data: Record<string, unknown>;
  sequenceNumber: string;
  guid: {
    creationNumber: string;
    accountAddress: string;
  };
}

export interface AccountInfo {
  address: string;
  sequenceNumber: string;
  authenticationKey: string;
  coinResources: CoinResource[];
  tokenResources: TokenResource[];
}

export interface CoinResource {
  type: string;
  amount: string;
  coinType: string;
}

export interface TokenResource {
  type: string;
  amount: string;
  tokenId: string;
  tokenProperties: Record<string, unknown>;
}

export interface DepositEvent {
  type: string;
  data: {
    amount: string;
    tokenType: string;
    sender: string;
    recipient: string;
  };
  sequenceNumber: string;
  timestamp: string;
}

export interface WithdrawEvent {
  type: string;
  data: {
    amount: string;
    tokenType: string;
    sender: string;
    recipient: string;
  };
  sequenceNumber: string;
  timestamp: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface AptosEventResponse {
  data: Array<{
    type: string;
    data: {
      token_type: string;
      amount: string;
      sender: string;
      recipient: string;
    };
    sequence_number: string;
    timestamp: string;
  }>;
}

export interface AptosTransactionResponse {
  version: string;
  hash: string;
  timestamp: string;
  sender: string;
  payload?: {
    arguments?: string[];
    type_arguments?: string[];
    function?: string;
  };
  success: boolean;
  gas_used: string;
  gas_unit_price: string;
  sequence_number: string;
  expiration_timestamp_secs: string;
  events: Event[];
}

export interface AptosAccountResponse {
  address: string;
  sequence_number: string;
  authentication_key: string;
  coin_resources: CoinResource[];
  token_resources: TokenResource[];
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class AptosApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AptosApiError';
  }
}

export class RateLimitError extends AptosApiError {
  constructor(
    message: string,
    statusCode: number,
    endpoint: string,
    public resetTime: Date,
    public originalError?: Error
  ) {
    super(message, statusCode, endpoint, originalError);
    this.name = 'RateLimitError';
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public failureCount: number,
    public lastFailureTime: Date
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateJitter(baseDelay: number): number {
  return baseDelay + Math.random() * baseDelay * 0.1;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Remove unused utility functions
// export function convertMicroUnits(amount: string, decimals: number = 8): string {
//   const num = BigInt(amount);
//   const divisor = BigInt(10 ** decimals);
//   const whole = num / divisor;
//   const fraction = num % divisor;
//   
//   if (fraction === BigInt(0)) {
//     return whole.toString();
//   }
//   
//   const fractionStr = fraction.toString().padStart(decimals, '0');
//   return `${whole}.${fractionStr}`;
// }

// export function getTokenDecimals(tokenType: string): number {
//   // Default to 8 decimals for most Aptos tokens
//   return 8;
// }

// ============================================================================
// MAIN APTOS CLIENT CLASS
// ============================================================================

export class ResilientAptosClient {
  private axiosInstance: AxiosInstance;
  private cache: NodeCache;
  private redisClient?: Redis.RedisClientType;
  private requestQueue: Array<() => Promise<unknown>> = [];
  private isProcessingQueue = false;
  private failureCount = 0;
  private lastFailureTime = 0;
  private circuitBreakerOpen = false;
  private circuitBreakerThreshold = 5;
  private circuitBreakerTimeout = 60000; // 1 minute

  constructor(private config: AptosConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });

    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: config.cacheTTL,
      checkperiod: 60,
    });

    // Initialize Redis if enabled
    if (config.enableRedis && config.redisUrl) {
      this.initializeRedis();
    }

    // Setup request/response interceptors
    this.setupInterceptors();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = Redis.createClient({
        url: this.config.redisUrl,
      });
      
      await this.redisClient.connect();
      console.log('Redis client connected successfully');
    } catch (error) {
      console.warn('Failed to connect to Redis, falling back to in-memory cache:', error);
      this.redisClient = undefined;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.waitForRateLimit();
        return config;
      },
      async (error: AxiosError) => {
        await this.onError(error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for success tracking
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.onSuccess();
        return response;
      },
      async (error: AxiosError) => {
        await this.onError(error);
        return Promise.reject(error);
      }
    );
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const key = `rate_limit:${Math.floor(now / 1000)}`;
    
    const currentCount = (await this.getCacheValue(key) as number) || 0;
    
    if (currentCount >= this.config.rateLimitPerSecond) {
      const waitTime = 1000 - (now % 1000);
      await sleep(waitTime);
    }
    
    await this.setCacheValue(key, currentCount + 1, 1);
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.circuitBreakerOpen = false;
  }

  private async onError(error: AxiosError): Promise<void> {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.circuitBreakerThreshold) {
      this.circuitBreakerOpen = true;
      setTimeout(() => {
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
      }, this.circuitBreakerTimeout);
    }

    // Log error details
    console.error('Aptos API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });
  }

  private async getCacheValue(key: string): Promise<unknown> {
    if (this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.warn('Redis get failed, falling back to in-memory cache:', error);
        return this.cache.get(key);
      }
    }
    return this.cache.get(key);
  }

  private async setCacheValue(key: string, value: unknown, ttl?: number): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl || this.config.cacheTTL, JSON.stringify(value));
      } catch (error) {
        console.warn('Redis set failed, falling back to in-memory cache:', error);
        this.cache.set(key, value, ttl || this.config.cacheTTL);
      }
    } else {
      this.cache.set(key, value, ttl || this.config.cacheTTL);
    }
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown>,
    retries = 0
  ): Promise<T> {
    if (this.circuitBreakerOpen) {
      throw new CircuitBreakerError(
        'Circuit breaker is open due to repeated failures',
        this.failureCount,
        new Date(this.lastFailureTime)
      );
    }

    try {
      const cacheKey = `${method}:${endpoint}:${JSON.stringify(params)}`;
      const cachedResponse = await this.getCacheValue(cacheKey);
      
      if (cachedResponse) {
        return cachedResponse as T;
      }

      const response: AxiosResponse<T> = await this.axiosInstance.request({
        method,
        url: endpoint,
        params,
      });

      // Cache successful responses
      await this.setCacheValue(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        throw error;
      }

      if (retries < this.config.maxRetries) {
        const delay = calculateJitter(Math.pow(2, retries) * 1000);
        await sleep(delay);
        return this.makeRequest<T>(method, endpoint, params, retries + 1);
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.message;
        
        if (statusCode === 429) {
          const resetTime = new Date(Date.now() + 60000); // Default 1 minute
          throw new RateLimitError(message, statusCode, endpoint, resetTime, error);
        }
        
        throw new AptosApiError(message, statusCode, endpoint, error);
      }

      throw new AptosApiError(
        'Unknown error occurred',
        500,
        endpoint,
        error as Error
      );
    }
  }

  // ============================================================================
  // CORE API METHODS
  // ============================================================================

  async getDepositEvents(
    address: string,
    tokenType: string,
    limit: number = 100
  ): Promise<Array<{
    type: string
    data: Record<string, unknown>
  }>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        start: '0',
      })

      const response = await this.makeRequest<Array<{
        version: string
        timestamp: string
        events: Array<{
          type: string
          data: Record<string, unknown>
        }>
      }>>(
        'GET',
        `/accounts/${address}/transactions`,
        Object.fromEntries(params)
      )

      const transactions = Array.isArray(response) ? response : []
      const depositEvents: Array<{
        type: string
        data: Record<string, unknown>
      }> = []

      for (const tx of transactions) {
        if (tx.events && Array.isArray(tx.events)) {
          for (const event of tx.events) {
            if (event.type === tokenType && event.data) {
              depositEvents.push({
                type: 'deposit',
                data: event.data,
              })
            }
          }
        }
      }

      return depositEvents
    } catch (error) {
      console.error(`Failed to fetch deposit events for ${address}:`, error)
      throw new Error(`Failed to fetch deposit events for ${address}`)
    }
  }

  async getWithdrawEvents(
    address: string,
    tokenType: string,
    limit: number = 100
  ): Promise<Array<{
    type: string
    data: Record<string, unknown>
  }>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        start: '0',
      })

      const response = await this.makeRequest<Array<{
        version: string
        timestamp: string
        events: Array<{
          type: string
          data: Record<string, unknown>
        }>
      }>>(
        'GET',
        `/accounts/${address}/transactions`,
        Object.fromEntries(params)
      )

      const transactions = Array.isArray(response) ? response : []
      const withdrawEvents: Array<{
        type: string
        data: Record<string, unknown>
      }> = []

      for (const tx of transactions) {
        if (tx.events && Array.isArray(tx.events)) {
          for (const event of tx.events) {
            if (event.type === tokenType && event.data) {
              withdrawEvents.push({
                type: 'withdrawal',
                data: event.data,
              })
            }
          }
        }
      }

      return withdrawEvents
    } catch (error) {
      console.error(`Failed to fetch withdraw events for ${address}:`, error)
      throw new Error(`Failed to fetch withdraw events for ${address}`)
    }
  }

  async getTransactionCount(
    address: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const startVersion = Math.floor(startDate.getTime() / 1000);
      const endVersion = Math.floor(endDate.getTime() / 1000);
      
      const response = await this.makeRequest<{ data: Array<{ timestamp: string }> }>(
        'GET',
        `/accounts/${address}/transactions`,
        {
          start: startVersion,
          limit: 1000, // Max limit to get all transactions
        }
      );

      // Count transactions within date range
      const transactions = response.data.filter((tx) => {
        const txTimestamp = parseInt(tx.timestamp);
        return txTimestamp >= startVersion && txTimestamp <= endVersion;
      });

      return transactions.length;
    } catch (error) {
      throw new AptosApiError(
        `Failed to get transaction count for ${address}`,
        500,
        `/accounts/${address}/events`,
        error as Error
      );
    }
  }

  async getTransactionByVersion(version: string): Promise<TransactionInfo> {
    try {
      const response = await this.makeRequest<AptosTransactionResponse>(
        'GET',
        `/transactions/by_version/${version}`
      );

      const tx = response;
      
      return {
        version: tx.version,
        hash: tx.hash,
        timestamp: tx.timestamp,
        sender: tx.sender,
        receiver: tx.payload?.arguments?.[0] || undefined,
        amount: tx.payload?.arguments?.[1] || undefined,
        tokenType: tx.payload?.type_arguments?.[0] || undefined,
        tokenSymbol: this.extractTokenSymbol(tx.payload?.type_arguments?.[0]),
        status: tx.success ? 'success' : 'failure',
        gasUsed: tx.gas_used,
        gasPrice: tx.gas_unit_price,
        sequenceNumber: tx.sequence_number,
        expirationTime: tx.expiration_timestamp_secs,
        function: tx.payload?.function || '',
        events: tx.events || [],
      };
    } catch (error) {
      throw new AptosApiError(
        `Failed to get transaction ${version}`,
        500,
        `/transactions/by_version/${version}`,
        error as Error
      );
    }
  }

  async getAccountInfo(address: string): Promise<AccountInfo> {
    try {
      const response = await this.makeRequest<AptosAccountResponse>(
        'GET',
        `/accounts/${address}`
      );

      return {
        address: response.address,
        sequenceNumber: response.sequence_number,
        authenticationKey: response.authentication_key,
        coinResources: response.coin_resources || [],
        tokenResources: response.token_resources || [],
      };
    } catch (error) {
      throw new AptosApiError(
        `Failed to get account info for ${address}`,
        500,
        `/accounts/${address}`,
        error as Error
      );
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async batchGetAccountInfo(addresses: string[]): Promise<AccountInfo[]> {
    const promises = addresses.map(address => this.getAccountInfo(address));
    return Promise.allSettled(promises).then(results => 
      results
        .filter((result): result is PromiseFulfilledResult<AccountInfo> => result.status === 'fulfilled')
        .map(result => result.value)
    );
  }

  async batchGetDepositEvents(
    walletTokenPairs: Array<{ address: string; tokenType: string }>,
    limit: number = 100
  ): Promise<Array<{ 
    address: string; 
    tokenType: string; 
    events: Array<{
      type: string
      data: Record<string, unknown>
    }>
  }>> {
    const promises = walletTokenPairs.map(({ address, tokenType }) =>
      this.getDepositEvents(address, tokenType, limit)
        .then(events => ({ address, tokenType, events }))
        .catch(() => ({ address, tokenType, events: [] }))
    );
    
    return Promise.all(promises);
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    circuitBreaker: 'open' | 'closed';
    failureCount: number;
    lastFailureTime: Date | null;
    cacheSize: number;
    redisConnected: boolean;
  }> {
    const status = this.circuitBreakerOpen ? 'unhealthy' : 
                  this.failureCount > 0 ? 'degraded' : 'healthy';
    
    return {
      status,
      circuitBreaker: this.circuitBreakerOpen ? 'open' : 'closed',
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime > 0 ? new Date(this.lastFailureTime) : null,
      cacheSize: this.cache.keys().length,
      redisConnected: !!this.redisClient,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private extractTokenSymbol(tokenType?: string): string {
    if (!tokenType) return 'Unknown';
    
    const match = tokenType.match(/::([^:]+)::/);
    return match ? match[1] : 'Unknown';
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAptosClient(config?: Partial<AptosConfig>): ResilientAptosClient {
  const defaultConfig: AptosConfig = {
    baseUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    timeout: 30000,
    maxRetries: 3,
    cacheTTL: 300, // 5 minutes
    rateLimitPerSecond: 10,
    enableRedis: false,
    ...config,
  };

  return new ResilientAptosClient(defaultConfig);
}
