/**
 * modules/sekuriti/core/security.js
 * Dream OS v2.0 — Security & RBAC Core
 * ✅ No hardcoded secrets • Role-based access • Input sanitization
 * 
 * Bi idznillah 💚
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   CONFIG — NO SECRETS HERE!
   Secrets must come from secure parent injection or env vars
══════════════════════════════════════════════════════════ */
export const SecurityConfig = {
    // ✅ Allowed roles for each action
    permissions: {
        'report:create': ['sekuriti', 'admin', 'master'],
        'report:read':   ['sekuriti', 'admin', 'master', 'janitor', 'maintenance'],
        'report:update': ['admin', 'master'],
        'report:delete': ['master'],
        
        'schedule:read':   ['sekuriti', 'admin', 'master'],
        'schedule:update': ['admin', 'master'],
        
        'audit:read': ['admin', 'master'],
        
        'system:config': ['master']
    },
    
    // ✅ GPS validation
    gps: {
        core: { lat: -6.4000, lng: 106.8200 }, // Depok core
        maxRadiusKm: 5.0,
        minAccuracy: 50 // meters
    },
    
    // ✅ Input limits
    limits: {
        reportDescMax: 2000,
        lokasiMax: 100,
        fotoMaxSize: 5 * 1024 * 1024 // 5MB
    }
};

/* ══════════════════════════════════════════════════════════
   RBAC — Role-Based Access Control
══════════════════════════════════════════════════════════ */
export const RBAC = {
    /**     * Check if user can perform action
     * @param {string} action - e.g., 'report:create'
     * @param {object} user - currentUser object
     * @returns {boolean}
     */
    can: function(action, user) {
        if (!user || !user.role) return false;
        
        const allowedRoles = SecurityConfig.permissions[action];
        if (!allowedRoles) {
            console.warn(`[RBAC] Unknown action: ${action}`);
            return false;
        }
        
        // Check direct role match
        if (allowedRoles.includes(user.role)) return true;
        
        // Check perms array (for granular permissions)
        if (user.perms?.some(p => allowedRoles.includes(p))) return true;
        
        // Master role has all access
        if (user.role === 'master') return true;
        
        return false;
    },
    
    /**
     * Enforce permission — throws if denied
     * @param {string} action
     * @param {object} user
     * @throws {Error} if access denied
     */
    enforce: function(action, user) {
        if (!this.can(action, user)) {
            const role = user?.role || 'guest';
            throw new Error(`Akses ditolak: "${action}" tidak diizinkan untuk role "${role}"`);
        }
    },
    
    /**
     * Get user's display title (Om/Kak system)
     * @param {string} role
     * @returns {string}
     */
    getTitle: function(role) {
        const titles = {
            'sekuriti': 'Om',
            'janitor': 'Om',
            'stok': 'Om',
            'maintenance': 'Om',            'inventaris': 'Om',
            'gudang': 'Om',
            'asset': 'Om',
            'booking': 'Kak',
            'k3': 'Kak',
            'admin': 'Kak',
            'master': 'Pak/Bu',
            'developer': 'Mas/Mbak'
        };
        return titles[role] || 'Kak';
    }
};

/* ══════════════════════════════════════════════════════════
   SANITIZATION — Prevent XSS & injection
══════════════════════════════════════════════════════════ */
export const Sanitizer = {
    /**
     * Escape HTML special characters
     * @param {string} str
     * @returns {string}
     */
    escape: function(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },
    
    /**
     * Sanitize user input for database
     * @param {string} str
     * @param {object} options
     * @returns {string}
     */
    sanitize: function(str, options = {}) {
        const {
            trim = true,
            maxLength = null,
            allowHTML = false
        } = options;
        
        if (typeof str !== 'string') return str;
        
        let result = trim ? str.trim() : str;
                if (!allowHTML) {
            result = this.escape(result);
        }
        
        if (maxLength && result.length > maxLength) {
            result = result.substring(0, maxLength);
        }
        
        return result;
    },
    
    /**
     * Validate and sanitize coordinates
     * @param {string} coords - "lat,lng" format
     * @returns {object} { valid, lat, lng, error }
     */
    validateCoords: function(coords) {
        if (!coords || typeof coords !== 'string') {
            return { valid: false, error: 'Koordinat wajib diisi' };
        }
        
        const parts = coords.split(',').map(p => parseFloat(p.trim()));
        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
            return { valid: false, error: 'Format koordinat tidak valid' };
        }
        
        const [lat, lng] = parts;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return { valid: false, error: 'Koordinat di luar rentang valid' };
        }
        
        return { valid: true, lat, lng };
    },
    
    /**
     * Calculate distance between two coordinates (Haversine)
     * @param {number} lat1, lng1, lat2, lng2
     * @returns {number} distance in km
     */
    getDistance: function(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }};

/* ══════════════════════════════════════════════════════════
   VALIDATION — Input validation rules
══════════════════════════════════════════════════════════ */
export const Validator = {
    /**
     * Validate patrol report data
     * @param {object} report
     * @returns {object} { valid, errors }
     */
    validateReport: function(report) {
        const errors = [];
        
        // Required fields
        if (!report.petugas?.length) {
            errors.push('Petugas wajib diisi');
        }
        if (!report.lokasi?.trim()) {
            errors.push('Lokasi patroli wajib diisi');
        } else if (report.lokasi.length > SecurityConfig.limits.lokasiMax) {
            errors.push(`Lokasi maksimal ${SecurityConfig.limits.lokasiMax} karakter`);
        }
        if (!report.deskripsi?.trim()) {
            errors.push('Deskripsi situasi wajib diisi');
        } else if (report.deskripsi.length > SecurityConfig.limits.reportDescMax) {
            errors.push(`Deskripsi maksimal ${SecurityConfig.limits.reportDescMax} karakter`);
        }
        if (!report.foto_base64) {
            errors.push('Foto bukti wajib diunggah');
        }
        
        // GPS validation if provided
        if (report.koordinat) {
            const coords = Sanitizer.validateCoords(report.koordinat);
            if (!coords.valid) {
                errors.push(`Koordinat: ${coords.error}`);
            } else {
                // Check if within safe radius
                const distance = Sanitizer.getDistance(
                    coords.lat, coords.lng,
                    SecurityConfig.gps.core.lat, SecurityConfig.gps.core.lng
                );
                if (distance > SecurityConfig.gps.maxRadiusKm) {
                    errors.push(`Anda berada ${distance.toFixed(1)}km dari area aman (maks ${SecurityConfig.gps.maxRadiusKm}km)`);
                }
            }
        }
        
        // File size validation        if (report.foto_base64?.length > SecurityConfig.limits.fotoMaxSize * 1.33) { // base64 ~33% overhead
            errors.push(`Foto terlalu besar (maks ${SecurityConfig.limits.fotoMaxSize / 1024 / 1024}MB)`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    /**
     * Validate schedule data
     * @param {object} schedule
     * @returns {object} { valid, errors }
     */
    validateSchedule: function(schedule) {
        const errors = [];
        
        if (!schedule.petugas_name?.trim()) {
            errors.push('Nama petugas wajib diisi');
        }
        if (!schedule.bulan || schedule.bulan < 1 || schedule.bulan > 12) {
            errors.push('Bulan tidak valid');
        }
        if (!schedule.tahun || schedule.tahun < 2020 || schedule.tahun > 2100) {
            errors.push('Tahun tidak valid');
        }
        if (!Array.isArray(schedule.jadwal_array) || schedule.jadwal_array.length < 28) {
            errors.push('Jadwal harus mencakup minimal 28 hari');
        }
        
        // Validate each day's shift
        const validShifts = ['P', 'M', 'L', 'CT'];
        schedule.jadwal_array?.forEach((shift, idx) => {
            if (!validShifts.includes(shift)) {
                errors.push(`Hari ${idx + 1}: shift "${shift}" tidak valid`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
};

/* ══════════════════════════════════════════════════════════
   AUDIT — Structured logging for compliance
══════════════════════════════════════════════════════════ */
export const Audit = {    /**
     * Log an action to audit trail
     * @param {string} action - e.g., 'REPORT_CREATED'
     * @param {object} context - additional data
     * @param {object} user - currentUser
     * @param {object} sb - Supabase client
     */
    log: async function(action, context = {}, user = null, sb = null) {
        // If no Supabase, log to console only (graceful degradation)
        if (!sb) {
            console.log(`[AUDIT] ${action}`, { user: user?.name, ...context });
            return;
        }
        
        const entry = {
            action,
            module: 'sekuriti',
            detail: JSON.stringify(context),
            user_id: user?.id,
            user_name: user?.name,
            user_role: user?.role,
            ip_address: await this._getClientIP(),
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
        };
        
        try {
            // Fire-and-forget: don't block main flow on audit log
            sb.from('audit_logs').insert([entry]).catch(e => {
                console.warn('[AUDIT] Failed to log:', e.message);
            });
        } catch (e) {
            console.warn('[AUDIT] Insert failed:', e.message);
        }
    },
    
    /**
     * Get client IP (fallback if API fails)
     * @returns {Promise<string>}
     */
    _getClientIP: async function() {
        try {
            const response = await fetch('https://api.ipify.org?format=json', {
                mode: 'cors',
                cache: 'no-store'
            });
            const data = await response.json();
            return data.ip || 'unknown';
        } catch {
            return 'unknown';        }
    }
};

/* ══════════════════════════════════════════════════════════
   EXPORT CONVENIENCE WRAPPERS
══════════════════════════════════════════════════════════ */
export const Security = {
    rbac: RBAC,
    sanitize: Sanitizer,
    validate: Validator,
    audit: Audit,
    config: SecurityConfig
};

// Console log for debugging
if (typeof window !== 'undefined') {
    console.log('🔐 Sekuriti Security Core loaded — Bi idznillah 💚');
}