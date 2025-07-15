interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 1000;

  // Get or set cache with automatic expiration
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  // Get from cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Set cache item
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Delete specific key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: this.getHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Clean expired items
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Preload cache with data
  async preload<T>(entries: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>): Promise<void> {
    const promises = entries.map(async ({ key, fetcher, ttl }) => {
      try {
        const data = await fetcher();
        this.set(key, data, ttl);
      } catch (error) {
        console.warn(`Failed to preload cache for key: ${key}`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Batch operations
  async getBatch<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    
    return results;
  }

  setBatch<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const { key, data, ttl } of entries) {
      this.set(key, data, ttl);
    }
  }

  // Private methods
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private hitCount = 0;
  private missCount = 0;

  private getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let size = 0;
    for (const [key, item] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(item.data).length * 2;
      size += 24; // Overhead for timestamp, ttl, etc.
    }
    return size;
  }
}

// Specialized cache for different data types
export class ClothingItemCache extends CacheService {
  constructor() {
    super();
  }

  async getClothingItems(filters: any): Promise<any[]> {
    const key = `clothing:${JSON.stringify(filters)}`;
    return this.getOrSet(key, async () => {
      // Fetch from API
      const response = await fetch(`/api/clothing?${new URLSearchParams(filters)}`);
      return response.json();
    }, 10 * 60 * 1000); // 10 minutes
  }

  invalidateClothingCache(): void {
    this.invalidatePattern('clothing:*');
  }
}

export class RecommendationCache extends CacheService {
  constructor() {
    super();
  }

  async getRecommendations(userId: string, preferences: any): Promise<any[]> {
    const key = `recommendations:${userId}:${JSON.stringify(preferences)}`;
    return this.getOrSet(key, async () => {
      // Fetch recommendations
      const response = await fetch('/api/users/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      return response.json();
    }, 30 * 60 * 1000); // 30 minutes
  }

  invalidateUserRecommendations(userId: string): void {
    this.invalidatePattern(`recommendations:${userId}:*`);
  }
}

// Global cache instances
export const globalCache = new CacheService();
export const clothingCache = new ClothingItemCache();
export const recommendationCache = new RecommendationCache();

// Auto cleanup every 5 minutes
setInterval(() => {
  globalCache.cleanup();
  clothingCache.cleanup();
  recommendationCache.cleanup();
}, 5 * 60 * 1000);

export default CacheService;