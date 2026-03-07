/**
 * tests/sekuriti/cache.test.js
 * Smart Cache Unit Tests
 * ✅ L1 Memory • L2 localStorage • L3 IndexedDB
 * 
 * Bi idznillah 💚
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Cache } from '../../modules/sekuriti/core/cache.js';

describe('Smart Cache', () => {
  let cache;
  
  beforeEach(() => {
    cache = new Cache.SmartCache();
    localStorage.clear();
  });
  
  describe('L1 Memory Cache', () => {
    it('should store and retrieve items', () => {
      cache.l1.set('test:key', { hello: 'world' });
      expect(cache.l1.get('test:key')).toEqual({ hello: 'world' });
    });
    
    it('should return null for missing keys', () => {
      expect(cache.l1.get('nonexistent')).toBeNull();
    });
    
    it('should respect TTL', () => {
      // Set with very short TTL (manually override)
      cache.l1.cache.set('test:ttl', {
        data: { test: true },
        timestamp: Date.now() - 10000 // 10 seconds ago
      });
      
      // Should be expired with default TTL
      expect(cache.l1.get('test:ttl')).toBeNull();
    });
    
    it('should evict oldest items when at capacity', () => {
      cache.l1.maxItems = 3;
      cache.l1.set('key1', 'value1');
      cache.l1.set('key2', 'value2');
      cache.l1.set('key3', 'value3');
      cache.l1.set('key4', 'value4'); // Should evict key1
      
      expect(cache.l1.get('key1')).toBeNull();
      expect(cache.l1.get('key4')).toBe('value4');
    });    
    it('should track hit/miss statistics', () => {
      cache.l1.set('test:hit', 'value');
      cache.l1.get('test:hit'); // hit
      cache.l1.get('test:miss'); // miss
      
      const stats = cache.l1.stats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });
  
  describe('L2 LocalStorage Cache', () => {
    it('should store and retrieve from localStorage', () => {
      cache.l2.set('test:l2', { persistent: true });
      expect(cache.l2.get('test:l2')).toEqual({ persistent: true });
    });
    
    it('should handle quota exceeded gracefully', () => {
      // Mock localStorage to throw quota error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      const result = cache.l2.set('test:quota', { large: 'data' });
      expect(result).toBe(false);
      
      localStorage.setItem = originalSetItem;
    });
    
    it('should evict oldest items when quota exceeded', () => {
      // Fill localStorage
      for (let i = 0; i < 10; i++) {
        cache.l2.set(`test:${i}`, { index: i });
      }
      
      // Should evict some items
      cache.l2._evictOldest(5);
      
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sek:'));
      expect(keys.length).toBeLessThanOrEqual(5);
    });
    
    it('should invalidate by pattern', () => {
      cache.l2.set('test:keep', { keep: true });
      cache.l2.set('test:remove1', { remove: true });
      cache.l2.set('test:remove2', { remove: true });
      
      cache.l2.invalidate('test:remove');      
      expect(cache.l2.get('test:keep')).toEqual({ keep: true });
      expect(cache.l2.get('test:remove1')).toBeNull();
      expect(cache.l2.get('test:remove2')).toBeNull();
    });
  });
  
  describe('Smart Cache Orchestrator', () => {
    it('should fetch from network on cache miss', async () => {
      const mockFetcher = vi.fn(() => Promise.resolve({ fresh: 'data' }));
      
      const result = await cache.get('test:fetch', {
        fetcher: mockFetcher,
        type: 'default'
      });
      
      expect(mockFetcher).toHaveBeenCalled();
      expect(result.fromCache).toBe(false);
      expect(result.fresh).toBe(true);
      expect(result.data).toEqual({ fresh: 'data' });
    });
    
    it('should use cache on subsequent calls', async () => {
      const mockFetcher = vi.fn(() => Promise.resolve({ cached: 'data' }));
      
      // First call - cache miss
      await cache.get('test:cache', { fetcher: mockFetcher });
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      
      // Second call - cache hit
      await cache.get('test:cache', { fetcher: mockFetcher });
      expect(mockFetcher).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
    
    it('should populate all cache layers on fetch', async () => {
      const mockFetcher = vi.fn(() => Promise.resolve({ all: 'layers' }));
      
      await cache.get('test:populate', { fetcher: mockFetcher });
      
      // Should be in all layers
      expect(cache.l1.get('test:populate')).toEqual({ all: 'layers' });
      expect(cache.l2.get('test:populate')).toEqual({ all: 'layers' });
    });
    
    it('should return stale data on fetch failure', async () => {
      // Pre-populate cache
      await cache.set('test:stale', { stale: 'data' });
      
      const mockFetcher = vi.fn(() => Promise.reject(new Error('Network error')));
            const result = await cache.get('test:stale', {
        fetcher: mockFetcher,
        forceRefresh: true
      });
      
      expect(result.fromCache).toBe(true);
      expect(result.level).toBe('stale');
      expect(result.error).toBe(true);
      expect(result.data).toEqual({ stale: 'data' });
    });
    
    it('should invalidate across all layers', async () => {
      await cache.set('test:invalidate', { test: true });
      await cache.invalidate('test:invalidate');
      
      expect(cache.l1.get('test:invalidate')).toBeNull();
      expect(cache.l2.get('test:invalidate')).toBeNull();
    });
    
    it('should provide cache statistics', () => {
      const stats = cache.stats();
      expect(stats).toHaveProperty('L1');
      expect(stats).toHaveProperty('L2_usage');
      expect(stats).toHaveProperty('L2_limit');
    });
  });
});