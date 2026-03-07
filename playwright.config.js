/**
 * playwright.config.js
 * Dream OS v2.0 — E2E Test Configuration
 * ✅ Cross-browser • Mobile • Desktop • CI/CD
 * 
 * Bi idznillah 💚
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ✅ Test directory
  testDir: './tests/e2e',
  
  // ✅ Run tests in files in parallel
  fullyParallel: true,
  
  // ✅ Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // ✅ Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // ✅ Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // ✅ Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
  ],
  
  // ✅ Shared settings for all the projects
  use: {
    // ✅ Base URL for tests
    baseURL: 'http://localhost:5173',
    
    // ✅ Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // ✅ Screenshot on failure
    screenshot: 'only-on-failure',
    
    // ✅ Video on failure
    video: 'retain-on-failure',
    
    // ✅ Browser context options
    contextOptions: {
      permissions: ['geolocation'],      geolocation: {
        latitude: -6.4000,
        longitude: 106.8200
      }
    }
  },
  
  // ✅ Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // ✅ Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // ✅ Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  
  // ✅ Run your local dev server before starting the tests
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,  // },
});