import NodeCache from 'node-cache';
import Redis from 'redis';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export interface CacheConfig {
  enableRedis: boolean;
  redisUrl?: string;
  defaultTTL: number;
  maxKeys: number;
  checkPeriod: number;
  enableCacheWarming: boolean;
  warmingBatchSize: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memoryUsage: number;
  hitRate: number;
}

// ============================================================================
// CACHE KEYS AND NAMESPACES
// ============================================================================

export const CACHE_NAMESPACES = {
  WALLET_ACTIVITY: 'wallet_activity',
  TRANSACTION_DATA: 'transaction_data',
  PRICE_DATA: 'price_data',
  ANALYTICS: 'analytics',
  USER_PREFERENCES: 'user_preferences',
  SYSTEM: 'system',
} as const;

export type CacheNamespace = typeof CACHE_NAMESPACES[keyof typeof CACHE_NAMESPACES];

export function buildCacheKey(namespace: CacheNamespace, key: string): string {
  return `${namespace}:${key}`;
}

export function buildPatternKey(namespace: CacheNamespace, pattern: string): string {
  return `${namespace}:${pattern}`;
}

// ============================================================================
// CACHE ENTRY INTERFACE
// ============================================================================

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MAIN CACHE CLASS
// ============================================================================

export class SmartCache {
  private memoryCache: NodeCache;
  private redisClient?: Redis.RedisClientType;
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    keys: 0,
  };

  constructor(config: CacheConfig) {
    this.config = config;
    
    // Initialize in-memory cache
    this.memoryCache = new NodeCache({
      stdTTL: config.defaultTTL,
      checkperiod: config.checkPeriod,
      maxKeys: config.maxKeys,
      useClones: false,
    });

    // Initialize Redis if enabled
    if (config.enableRedis && config.redisUrl) {
      this.initializeRedis();
    }

    // Setup cache warming if enabled
    if (config.enableCacheWarming) {
      this.setupCacheWarming();
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = Redis.createClient({
        url: this.config.redisUrl,
      });
      
      await this.redisClient.connect();
      console.log('Redis client connected successfully');
      
      // Test connection
      await this.redisClient.ping();
      console.log('Redis connection test successful');
    } catch (error) {
      console.warn('Failed to connect to Redis, falling back to in-memory cache:', error);
      this.redisClient = undefined;
    }
  }

  private setupEventListeners(): void {
    this.memoryCache.on('expired', (key: string) => {
      console.log(`Cache key expired: ${key}`);
      this.stats.keys--;
    });

    this.memoryCache.on('flush', () => {
      console.log('Memory cache flushed');
      this.stats.keys = 0;
    });
  }

  // ============================================================================
  // CORE CACHE OPERATIONS
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    try {
      // Try memory cache first
      const value = this.memoryCache.get<CacheEntry<T>>(key);
      
      if (value) {
        this.stats.hits++;
        this.updateAccessStats(key, value);
        return value.data;
      }

      // Try Redis if available
      if (this.redisClient) {
        try {
          const redisValue = await this.redisClient.get(key);
          if (redisValue) {
            const parsed = JSON.parse(redisValue) as CacheEntry<T>;
            
            // Store in memory cache for faster subsequent access
            this.memoryCache.set(key, parsed, parsed.ttl / 1000);
            
            this.stats.hits++;
            this.stats.keys++;
            return parsed.data;
          }
        } catch (error) {
          console.warn('Redis get failed, falling back to memory cache:', error);
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    ttl: number = this.config.defaultTTL,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        metadata,
      };

      // Store in memory cache
      this.memoryCache.set(key, entry, ttl / 1000);
      this.stats.keys++;

      // Store in Redis if available
      if (this.redisClient) {
        try {
          await this.redisClient.setEx(key, ttl / 1000, JSON.stringify(entry));
        } catch (error) {
          console.warn('Redis set failed:', error);
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const memoryDeleted = this.memoryCache.del(key) > 0;
      if (memoryDeleted) {
        this.stats.keys--;
      }

      let redisDeleted = false;
      if (this.redisClient) {
        try {
          redisDeleted = await this.redisClient.del(key) > 0;
        } catch (error) {
          console.warn('Redis delete failed:', error);
        }
      }

      return memoryDeleted || redisDeleted;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.memoryCache.has(key)) {
        return true;
      }

      if (this.redisClient) {
        try {
          return await this.redisClient.exists(key) > 0;
        } catch (error) {
          console.warn('Redis exists check failed:', error);
        }
      }

      return false;
    } catch (error) {
      console.error('Cache exists check error:', error);
      return false;
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    try {
      // Get from memory cache first
      for (const key of keys) {
        const value = this.memoryCache.get<CacheEntry<T>>(key);
        if (value) {
          results.set(key, value.data);
          this.stats.hits++;
          this.updateAccessStats(key, value);
        } else {
          results.set(key, null);
        }
      }

      // Get missing keys from Redis
      if (this.redisClient) {
        const missingKeys = keys.filter(key => !results.has(key) || results.get(key) === null);
        
        if (missingKeys.length > 0) {
          try {
            const redisValues = await this.redisClient.mGet(missingKeys);
            
            for (let i = 0; i < missingKeys.length; i++) {
              const key = missingKeys[i];
              const value = redisValues[i];
              
              if (value) {
                try {
                  const parsed = JSON.parse(value) as CacheEntry<T>;
                  results.set(key, parsed.data);
                  
                  // Store in memory cache
                  this.memoryCache.set(key, parsed, parsed.ttl / 1000);
                  this.stats.keys++;
                  
                  this.stats.hits++;
                } catch (parseError) {
                  console.warn(`Failed to parse Redis value for key ${key}:`, parseError);
                  results.set(key, null);
                }
              } else {
                this.stats.misses++;
              }
            }
          } catch (error) {
            console.warn('Redis mget failed:', error);
          }
        }
      }
    } catch (error) {
      console.error('Cache mget error:', error);
    }

    return results;
  }

  async mset<T>(
    entries: Array<{ key: string; data: T; ttl?: number; metadata?: Record<string, unknown> }>
  ): Promise<void> {
    try {
      for (const entry of entries) {
        await this.set(entry.key, entry.data, entry.ttl, entry.metadata);
      }
    } catch (error) {
      console.error('Cache mset error:', error);
    }
  }

  // ============================================================================
  // PATTERN-BASED OPERATIONS
  // ============================================================================

  async deletePattern(pattern: string): Promise<number> {
    let deletedCount = 0;
    
    try {
      // Delete from memory cache
      const memoryKeys = this.memoryCache.keys();
      const matchingMemoryKeys = memoryKeys.filter(key => key.includes(pattern));
      
      for (const key of matchingMemoryKeys) {
        if (this.memoryCache.del(key) > 0) {
          deletedCount++;
          this.stats.keys--;
        }
      }

      // Delete from Redis if available
      if (this.redisClient) {
        try {
          const redisKeys = await this.redisClient.keys(pattern);
          if (redisKeys.length > 0) {
            const deleted = await this.redisClient.del(redisKeys);
            deletedCount += deleted;
          }
        } catch (error) {
          console.warn('Redis pattern delete failed:', error);
        }
      }
    } catch (error) {
      console.error('Cache pattern delete error:', error);
    }

    return deletedCount;
  }

  async getKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    
    try {
      // Get from memory cache
      const memoryKeys = this.memoryCache.keys();
      const matchingMemoryKeys = memoryKeys.filter(key => key.includes(pattern));
      keys.push(...matchingMemoryKeys);

      // Get from Redis if available
      if (this.redisClient) {
        try {
          const redisKeys = await this.redisClient.keys(pattern);
          keys.push(...redisKeys);
        } catch (error) {
          console.warn('Redis keys pattern failed:', error);
        }
      }
    } catch (error) {
      console.error('Cache get keys error:', error);
    }

    return [...new Set(keys)]; // Remove duplicates
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  private setupCacheWarming(): void {
    // Warm cache every 5 minutes
    setInterval(() => {
      this.warmCache();
    }, 5 * 60 * 1000);
  }

  private async warmCache(): Promise<void> {
    try {
      console.log('Starting cache warming...');
      
      // Get frequently accessed keys
      const frequentKeys = await this.getFrequentlyAccessedKeys();
      
      // Warm cache in batches
      for (let i = 0; i < frequentKeys.length; i += this.config.warmingBatchSize) {
        const batch = frequentKeys.slice(i, i + this.config.warmingBatchSize);
        await this.warmCacheBatch(batch);
        
        // Small delay between batches to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  private async getFrequentlyAccessedKeys(): Promise<string[]> {
    // This would typically come from analytics or monitoring
    // For now, return some common patterns
    return [
      buildCacheKey(CACHE_NAMESPACES.PRICE_DATA, 'APT'),
      buildCacheKey(CACHE_NAMESPACES.PRICE_DATA, 'USDT'),
      buildCacheKey(CACHE_NAMESPACES.PRICE_DATA, 'USDC'),
    ];
  }

  private async warmCacheBatch(keys: string[]): Promise<void> {
    // Implement cache warming logic based on your data sources
    // This could involve pre-fetching data from APIs or databases
    console.log(`Warming cache batch: ${keys.length} keys`);
  }

  // ============================================================================
  // CACHE INVALIDATION STRATEGIES
  // ============================================================================

  async invalidateByNamespace(namespace: CacheNamespace): Promise<number> {
    return this.deletePattern(`${namespace}:*`);
  }

  async invalidateByTimeRange(startTime: number, endTime: number): Promise<number> {
    let deletedCount = 0;
    
    try {
      const allKeys = await this.getKeys('*');
      
      for (const key of allKeys) {
        const entry = await this.get(key);
        if (entry && typeof entry === 'object' && 'timestamp' in entry) {
          const timestamp = (entry as { timestamp: number }).timestamp;
          if (timestamp >= startTime && timestamp <= endTime) {
            await this.delete(key);
            deletedCount++;
          }
        }
      }
    } catch (error) {
      console.error('Cache time range invalidation error:', error);
    }

    return deletedCount;
  }

  async invalidateStaleData(maxAge: number): Promise<number> {
    const cutoffTime = Date.now() - maxAge;
    return this.invalidateByTimeRange(0, cutoffTime);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private updateAccessStats(key: string, entry: CacheEntry<unknown>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    // Update in memory cache
    this.memoryCache.set(key, entry, entry.ttl / 1000);
    
    // Update in Redis if available
    if (this.redisClient) {
      try {
        this.redisClient.setEx(key, entry.ttl / 1000, JSON.stringify(entry));
      } catch (error) {
        console.warn('Redis access stats update failed:', error);
      }
    }
  }

  getStats(): CacheStats {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.stats.keys,
      memoryUsage: this.memoryCache.getStats().vsize || 0,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  async clear(): Promise<void> {
    try {
      this.memoryCache.flushAll();
      this.stats.keys = 0;
      
      if (this.redisClient) {
        await this.redisClient.flushDb();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
  }
}

// ============================================================================
// CACHE INSTANCE
// ============================================================================

export const cache = new SmartCache({
  enableRedis: process.env.NODE_ENV === 'production',
  redisUrl: process.env.REDIS_URL,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxKeys: 10000,
  checkPeriod: 60,
  enableCacheWarming: true,
  warmingBatchSize: 10,
});
