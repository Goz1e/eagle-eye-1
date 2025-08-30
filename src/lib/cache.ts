// Simple in-memory cache for client-side use
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttl: number = 300000): Promise<void> {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
        this.cache.delete(key);
      } else {
        validEntries++;
      }
    }

    return {
      total: validEntries + expiredEntries,
      valid: validEntries,
      expired: expiredEntries,
    };
  }
}

// Cache namespaces for organization
export const CACHE_NAMESPACES = {
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  BALANCES: 'balances',
  TOKENS: 'tokens',
  EVENTS: 'events',
  METADATA: 'metadata',
} as const;

// Build cache key with namespace
export function buildCacheKey(namespace: string, ...parts: string[]): string {
  return `${namespace}:${parts.join(':')}`;
}

// Cache stats interface
export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
}

// Export a singleton instance
export const cache = new SimpleCache();

// Export the class for testing
export { SimpleCache };
