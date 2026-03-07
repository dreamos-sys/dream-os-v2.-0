/**
 * vitest.config.js
 * Dream OS v2.0 — Vitest Configuration
 * ✅ Unit Testing • Coverage • CI/CD Ready
 * 
 * Bi idznillah 💚
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ✅ Test environment
    environment: 'jsdom',
    
    // ✅ Test file patterns
    include: ['tests/**/*.test.js'],
    exclude: ['tests/**/*.skip.test.js', 'node_modules/**'],
    
    // ✅ Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['modules/sekuriti/**/*.js'],
      exclude: [
        'modules/sekuriti/**/*.skip.js',
        'node_modules/**',
        'tests/**'
      ],
      thresholds: {
        // ✅ Enforce minimum coverage (adjust as needed)
        lines: 70,
        functions: 60,
        branches: 50,
        statements: 70
      }
    },
    
    // ✅ Test timeout
    testTimeout: 10000, // 10 seconds
    
    // ✅ Setup files
    setupFiles: ['./tests/setup.js'],
    
    // ✅ Global test utilities
    globals: true,
    
    // ✅ Watch mode options
    watch: {
      exclude: ['node_modules', 'coverage', 'dist']
    },
    
    // ✅ Reporter options
    reporters: ['default', 'html'],
    
    // ✅ CI/CD optimization
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    }
  },
  
  // ✅ Resolve aliases for imports
  resolve: {
    alias: {
      '@sekuriti': '/modules/sekuriti',
      '@core': '/modules/sekuriti/core'
    }
  }
});