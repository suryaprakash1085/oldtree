/**
 * Simple in-memory cache with TTL and automatic eviction
 * Useful for frequently accessed, semi-static data
 * For production at scale, replace with Redis
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate all keys matching pattern
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get metrics about cache performance
   */
  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.keys()),
    };
  }
}

export const queryCache = new QueryCache();

/**
 * Cache utilities for specific domains
 */
export const cacheKeys = {
  themes: (tenantId: string) => `themes:${tenantId}`,
  categories: (tenantId: string) => `categories:${tenantId}`,
  activeTheme: (tenantId: string) => `theme:active:${tenantId}`,
  tenantConfig: (tenantId: string) => `tenant:config:${tenantId}`,
  products: (tenantId: string, page?: number) => `products:${tenantId}:${page || 1}`,
};
