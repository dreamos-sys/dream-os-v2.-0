/**
 * tests/setup.js
 * Global test setup and utilities
 * 
 * Bi idznillah 💚
 */

import { beforeEach, afterEach, vi } from 'vitest';

// ✅ Global mocks
beforeEach(() => {
  // Mock console to reduce noise
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // Mock localStorage
  const localStorageMock = {
    store: {},
    getItem: vi.fn((key) => this.store[key] || null),
    setItem: vi.fn((key, value) => { this.store[key] = value; }),
    removeItem: vi.fn((key) => { delete this.store[key]; }),
    clear: vi.fn(() => { this.store = {}; })
  };
  global.localStorage = localStorageMock;
  
  // Mock fetch
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    })
  );
  
  // Mock Performance API
  global.performance = {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000
    }
  };
  
  // Mock navigator
  global.navigator = {
    userAgent: 'Vitest Test Runner',
    geolocation: {
      getCurrentPosition: vi.fn((success) => {
        success({          coords: {
            latitude: -6.4000,
            longitude: 106.8200,
            accuracy: 10
          }
        });
      })
    },
    sendBeacon: vi.fn(() => true)
  };
  
  // Mock IndexedDB
  global.indexedDB = {
    open: vi.fn(() => ({
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({ onsuccess: null, onerror: null })),
            put: vi.fn(() => ({ onsuccess: null, onerror: null })),
            delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
            openCursor: vi.fn(() => ({ onsuccess: null, onerror: null }))
          }))
        }))
      }
    }))
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  global.localStorage.store = {};
});

// ✅ Test utilities
export const testUtils = {
  /**
   * Create mock user
   */
  createUser: (overrides = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    role: 'sekuriti',
    perms: ['sekuriti'],
    ...overrides
  }),  
  /**
   * Create mock report
   */
  createReport: (overrides = {}) => ({
    petugas: ['SUDARSONO'],
    lokasi: 'Pos Utama',
    deskripsi: 'Aman terkendali',
    foto_base64: 'data:image/jpeg;base64,test',
    ...overrides
  }),
  
  /**
   * Wait for async operation
   */
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Mock Supabase client
   */
  createMockSupabase: () => ({
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => Promise.resolve({ data: null, error: null })),
        delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(() => Promise.resolve({ error: null })),
          getPublicUrl: vi.fn(() => ({ publicUrl: 'https://test.com/file.jpg' }))
        }))
      }
    }))
  })
};

// ✅ Custom matchers
expect.extend({
  toBeValidDate(received) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid date`    };
  },
  
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`
    };
  }
});