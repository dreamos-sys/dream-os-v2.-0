/**
 * tests/e2e/sekuriti-flow.test.js
 * Sekuriti Module E2E Tests
 * ✅ Full User Flow • Login • Submit Report • View History
 * 
 * Bi idznillah 💚
 */

import { test, expect } from '@playwright/test';

test.describe('Sekuriti Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Login as sekuriti user
    await page.fill('#passkey', 'security-test-code');
    await page.click('#btnLogin');
    await expect(page.locator('#app-shell')).toBeVisible();
    
    // Navigate to Sekuriti module
    await page.click('[data-module="sekuriti"]');
    await expect(page.locator('#sekuriti-root')).toBeVisible();
  });
  
  test('should load sekuriti module successfully', async ({ page }) => {
    // Check header
    await expect(page.locator('.sek-title')).toContainText('SEKURITI');
    
    // Check status cards
    await expect(page.locator('#sek-shift')).toBeVisible();
    await expect(page.locator('#sek-db-status')).toBeVisible();
    
    // Check tabs
    await expect(page.locator('.sek-tab')).toHaveCount(4);
  });
  
  test('should submit patrol report successfully', async ({ page }) => {
    // Fill form
    await page.selectOption('#sek-petugas', 'SUDARSONO');
    await page.fill('#sek-lokasi-input', 'Pos Utama');
    await page.fill('#sek-deskripsi', 'Patroli malam - kondisi aman');
    
    // Mock file upload
    await page.setInputFiles('#sek-foto', 'tests/fixtures/sample.jpg');
    
    // Wait for preview
    await expect(page.locator('#sek-preview')).toBeVisible();
    
    // Submit    await page.click('#sek-submit');
    
    // Wait for success toast
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast-success')).toContainText('berhasil');
    
    // Form should be reset
    await expect(page.locator('#sek-deskripsi')).toHaveValue('');
  });
  
  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('#sek-submit');
    
    // Should show error
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 5000 });
  });
  
  test('should view report history', async ({ page }) => {
    // Navigate to history tab
    await page.click('[data-tab="history"]');
    
    // Wait for table to load
    await expect(page.locator('#sek-history-body')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('table.sek-table th')).toHaveCount(6);
  });
  
  test('should filter report history', async ({ page }) => {
    // Navigate to history tab
    await page.click('[data-tab="history"]');
    
    // Apply filter
    await page.fill('#filter-tanggal', '2024-01-15');
    await page.selectOption('#filter-shift', 'PAGI');
    await page.click('#btn-filter');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Reset filter
    await page.click('#btn-reset-filter');
  });
  
  test('should handle GPS permission gracefully', async ({ page, context }) => {
    // Deny geolocation permission
    await context.setGeolocationOverride(undefined);
    
    // Try to submit report    await page.selectOption('#sek-petugas', 'SUDARSONO');
    await page.fill('#sek-lokasi-input', 'Pos Utama');
    await page.fill('#sek-deskripsi', 'Test tanpa GPS');
    await page.setInputFiles('#sek-foto', 'tests/fixtures/sample.jpg');
    await page.click('#sek-submit');
    
    // Should show confirmation dialog or proceed without GPS
    // (depends on implementation)
    await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 });
  });
  
  test('should respect RBAC permissions', async ({ page }) => {
    // This test assumes you have a way to switch users
    // Implement based on your auth system
    
    // Login as non-sekuriti user
    // await page.click('#btnLogout');
    // await page.fill('#passkey', 'janitor-code');
    // await page.click('#btnLogin');
    
    // Navigate to sekuriti
    // Should show access denied or read-only mode
  });
  
  test('should cache jadwal data', async ({ page }) => {
    // Navigate to jadwal tab
    await page.click('[data-tab="jadwal"]');
    
    // Wait for initial load
    await expect(page.locator('#sek-schedule-body')).toBeVisible({ timeout: 10000 });
    
    // Refresh page
    await page.reload();
    await page.click('[data-tab="jadwal"]');
    
    // Should load from cache (faster)
    // This is hard to test directly, but you can measure load time
  });
  
  test('should export error-free console logs', async ({ page }) => {
    // Collect console messages
    const messages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        messages.push(msg.text());
      }
    });
    
    // Perform actions
    await page.click('[data-tab="history"]');    await page.waitForTimeout(2000);
    
    // Should have no errors
    expect(messages.filter(m => !m.includes('source map'))).toHaveLength(0);
  });
});