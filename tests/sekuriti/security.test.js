/**
 * tests/sekuriti/security.test.js
 * Security Core Unit Tests
 * ✅ RBAC • Sanitization • Validation • Audit
 * 
 * Bi idznillah 💚
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Security } from '../../modules/sekuriti/core/security.js';
import { testUtils } from '../setup.js';

describe('Security Core', () => {
  describe('RBAC', () => {
    it('should allow sekuriti role to create reports', () => {
      const user = testUtils.createUser({ role: 'sekuriti' });
      expect(Security.rbac.can('report:create', user)).toBe(true);
    });
    
    it('should deny janitor role from updating reports', () => {
      const user = testUtils.createUser({ role: 'janitor' });
      expect(Security.rbac.can('report:update', user)).toBe(false);
    });
    
    it('should allow master role to do anything', () => {
      const user = testUtils.createUser({ role: 'master' });
      expect(Security.rbac.can('system:config', user)).toBe(true);
      expect(Security.rbac.can('report:delete', user)).toBe(true);
    });
    
    it('should enforce permissions and throw on denial', () => {
      const user = testUtils.createUser({ role: 'guest' });
      expect(() => Security.rbac.enforce('report:create', user))
        .toThrow('Akses ditolak');
    });
    
    it('should return correct title for role', () => {
      expect(Security.rbac.getTitle('sekuriti')).toBe('Om');
      expect(Security.rbac.getTitle('booking')).toBe('Kak');
      expect(Security.rbac.getTitle('master')).toBe('Pak/Bu');
    });
  });
  
  describe('Sanitization', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      expect(Security.sanitize.escape(input)).toBe(expected);
    });
        it('should sanitize with max length', () => {
      const input = 'This is a very long description';
      const result = Security.sanitize.sanitize(input, { maxLength: 10 });
      expect(result.length).toBe(10);
    });
    
    it('should validate coordinates', () => {
      const valid = Security.sanitize.validateCoords('-6.4000, 106.8200');
      expect(valid.valid).toBe(true);
      expect(valid.lat).toBe(-6.4);
      expect(valid.lng).toBe(106.82);
    });
    
    it('should reject invalid coordinates', () => {
      const invalid = Security.sanitize.validateCoords('999,999');
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toContain('tidak valid');
    });
    
    it('should calculate distance correctly', () => {
      const distance = Security.sanitize.getDistance(
        -6.4000, 106.8200,
        -6.4050, 106.8250
      );
      expect(distance).toBeWithinRange(0.5, 1.0); // ~0.7km
    });
  });
  
  describe('Validation', () => {
    it('should validate complete report', () => {
      const report = testUtils.createReport();
      const result = Security.validate.validateReport(report);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject report without petugas', () => {
      const report = testUtils.createReport({ petugas: [] });
      const result = Security.validate.validateReport(report);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Petugas wajib diisi');
    });
    
    it('should reject report without lokasi', () => {
      const report = testUtils.createReport({ lokasi: '' });
      const result = Security.validate.validateReport(report);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Lokasi patroli wajib diisi');
    });
        it('should reject report without foto', () => {
      const report = testUtils.createReport({ foto_base64: null });
      const result = Security.validate.validateReport(report);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Foto bukti wajib diunggah');
    });
    
    it('should reject report with description too long', () => {
      const report = testUtils.createReport({
        deskripsi: 'A'.repeat(3000)
      });
      const result = Security.validate.validateReport(report);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('maksimal');
    });
  });
  
  describe('Audit', () => {
    it('should log to console when no Supabase', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      await Security.audit.log('TEST_ACTION', { test: true }, null, null);
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    it('should log to Supabase when available', async () => {
      const mockSb = testUtils.createMockSupabase();
      await Security.audit.log('TEST_ACTION', { test: true }, null, mockSb);
      expect(mockSb.from).toHaveBeenCalledWith('audit_logs');
    });
    
    it('should handle audit log errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const mockSb = testUtils.createMockSupabase();
      mockSb.from().insert().catch(() => Promise.reject(new Error('Test error')));
      await Security.audit.log('TEST_ACTION', {}, null, mockSb);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});