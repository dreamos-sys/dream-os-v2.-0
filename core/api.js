// ═══════════════════════════════════════════════════════
// core/api.js - Unified Supabase API Wrapper
// Dream OS v2.0 | Ocean Logic System
// "Setiap query dijaga oleh arus kesadaran"
// ═══════════════════════════════════════════════════════

import { config } from './config.js';
import { aiCore } from './aiCore.js'; // ← Integrasi dengan AI Core!

let supabase = null;
let _isInitialized = false;

// ========== SUPABASE INIT (Config-Driven) ==========
export async function initSupabase() {
    if (_isInitialized && supabase) return supabase;
    
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
        console.warn('⚠️ Supabase library not found, attempting auto-load...');
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Supabase CDN'));
                document.head.appendChild(script);
            });
        } catch (err) {
            aiCore.mood = 'ALERT';
            console.error('❌ Failed to load Supabase:', err);
            return null;
        }
    }
    
    try {
        supabase = window.supabase.createClient(
            config.supabase.url, 
            config.supabase.anonKey,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                },
                global: {
                    headers: {
                        'X-Client-Info': `dream-os/${config.version}`,
                        'X-AI-Core': aiCore.mood // ← AI mood sebagai header!
                    }
                }            }
        );
        
        _isInitialized = true;
        aiCore.mood = 'PEACEFUL'; // ← Reset mood setelah connect sukses
        console.log('✅ Supabase initialized - Ocean Logic Active');
        
        // Log initialization to audit
        await logAudit('SYSTEM_INIT', 'supabase', { 
            project: config.supabase.url.split('/')[2],
            mood: aiCore.mood 
        });
        
        return supabase;
    } catch (err) {
        aiCore.mood = 'HOSTILE';
        console.error('❌ Supabase init failed:', err);
        return null;
    }
}

export function getSupabase() {
    if (!supabase) return initSupabase();
    return supabase;
}

// ========== GEOFENCE CHECK (Optional Security Layer) ==========
export function isWithinGeofence(lat, lng) {
    if (!config.geofence.enabled) return true; // Skip if disabled
    
    const { lat: centerLat, lng: centerLng, radiusKm } = config.geofence;
    
    // Haversine formula approximation for short distances
    const dx = (lng - centerLng) * Math.cos((lat + centerLat) * Math.PI / 360);
    const dy = lat - centerLat;
    const distance = Math.sqrt(dx * dx + dy * dy) * 111.32; // km
    
    return distance <= radiusKm;
}

// ========== API WRAPPER WITH AI CORE INTEGRATION ==========
export const api = {
    // CREATE with AI threat detection
    async create(table, data, options = {}) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        // 🛡️ AI Core: Check for suspicious patterns
        if (aiCore.threats > 0 && options.requireSafeMode) {
            aiCore.checkPulse();            if (aiCore.mood === 'HOSTILE') {
                throw new Error('🛡️ System in defensive mode. Write operations blocked.');
            }
        }
        
        // 🌍 Geofence check (if enabled)
        if (config.geofence.enabled && options.checkGeofence && navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { 
                        enableHighAccuracy: true, 
                        timeout: 5000,
                        maximumAge: 0 
                    });
                });
                if (!isWithinGeofence(position.coords.latitude, position.coords.longitude)) {
                    aiCore.mood = 'CAUTIOUS';
                    console.warn('⚠️ Request outside geofence');
                    // Optional: block or allow with warning
                }
            } catch (e) {
                console.warn('⚠️ Geolocation unavailable, skipping geofence check');
            }
        }
        
        try {
            const { data: result, error } = await sb.from(table).insert(data).select().single();
            
            if (error) {
                // 🧠 AI Core: Log threat if RLS violation
                if (error.message?.includes('row-level security')) {
                    aiCore.threats++;
                    aiCore.checkPulse();
                }
                throw new Error(error.message);
            }
            
            // 📝 Audit log (non-blocking)
            if (config.features.auditLogging) {
                await this.logAudit('INSERT', table, result).catch(() => {});
            }
            
            return result;
        } catch (err) {
            aiCore.checkPulse(); // Update mood based on error
            throw err;
        }
    },
    
    // READ with smart filtering    async query(table, filters = {}) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        let query = sb.from(table).select('*');
        
        // Apply filters with AI-assisted validation
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.limit) query = query.limit(Math.min(filters.limit, 1000)); // Safety cap
        if (filters.order) {
            const [field, direction = 'asc'] = filters.order.split(':');
            query = query.order(field, { ascending: direction === 'asc', nullsFirst: false });
        }
        if (filters.eq) {
            Object.entries(filters.eq).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        if (filters.lt) query = query.lt(filters.lt.field, filters.lt.value);
        if (filters.gt) query = query.gt(filters.gt.field, filters.gt.value);
        if (filters.date) query = query.eq('tanggal', filters.date);
        
        // 🧠 AI Core: Add prayer-time adaptation to query
        if (config.features.prayerAdaptation) {
            const prayer = getCurrentPrayer();
            if (prayer === 'Maghrib' || prayer === 'Isya') {
                // Add subtle delay for "calm mode" during prayer times
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        
        return data || [];
    },
    
    // GET SINGLE with caching hint
    async get(table, id, options = {}) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        // 🧠 AI Core: Check cache first if enabled
        if (options.useCache && typeof caches !== 'undefined') {
            const cacheKey = `${table}:${id}`;
            const cached = sessionStorage.getItem(`cache:${cacheKey}`);
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    // Return cached if < 5 min old                    if (Date.now() - timestamp < 300000) {
                        console.log('🔄 Cache hit:', cacheKey);
                        return data;
                    }
                } catch (e) {
                    // Ignore cache errors, fetch fresh
                }
            }
        }
        
        const { data, error } = await sb.from(table).select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        
        // 🧠 AI Core: Cache successful reads
        if (options.useCache && data) {
            try {
                sessionStorage.setItem(`cache:${table}:${id}`, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            } catch (e) {
                // Ignore cache errors
            }
        }
        
        return data;
    },
    
    // UPDATE with optimistic locking
    async update(table, id, data, options = {}) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        // 🧠 AI Core: Optimistic concurrency check
        if (options.etag) {
            const current = await this.get(table, id);
            if (current?.updated_at !== options.etag) {
                throw new Error('🔄 Data was modified by another user. Please refresh.');
            }
        }
        
        const { data: result, error } = await sb.from(table)
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        
        // 📝 Audit + AI Core mood update        if (config.features.auditLogging) {
            await this.logAudit('UPDATE', table, result).catch(() => {});
        }
        
        // 🧠 AI Core: Positive reinforcement for successful writes
        if (aiCore.mood !== 'PEACEFUL') {
            aiCore.mood = 'PEACEFUL';
            console.log('🌊 AI Core: System stabilized after successful update');
        }
        
        return result;
    },
    
    // DELETE (Soft delete with AI Core protection)
    async delete(table, id, options = {}) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        // 🛡️ AI Core: Extra confirmation for destructive actions
        if (aiCore.mood === 'HOSTILE' && !options.force) {
            throw new Error('🛡️ System in defensive mode. Delete blocked.');
        }
        
        // Soft delete pattern
        const { error } = await sb.from(table)
            .update({ 
                status: 'cancelled', 
                updated_at: new Date().toISOString(),
                deleted_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw new Error(error.message);
        
        // 📝 Audit
        if (config.features.auditLogging) {
            await this.logAudit('SOFT_DELETE', table, { id }).catch(() => {});
        }
        
        return true;
    },
    
    // COUNT with AI-assisted estimation
    async count(table, filters = {}) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        let query = sb.from(table).select('*', { count: 'exact', head: true });
        
        if (filters.status) query = query.eq('status', filters.status);        if (filters.eq) {
            Object.entries(filters.eq).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        
        const { count, error } = await query;
        if (error) throw new Error(error.message);
        
        return count || 0;
    },
    
    // AUDIT LOGGING with AI Core context
    async logAudit(action, table, data, extra = {}) {
        try {
            const sb = getSupabase();
            if (!sb || !config.features.auditLogging) return;
            
            const userName = sessionStorage.getItem('dream_role') || 'System';
            
            await sb.from('audit_logs').insert({
                action,
                table_name: table,
                record_id: data?.id,
                user_name: userName,
                new_value: data,
                ai_mood: aiCore.mood, // ← AI mood context!
                geofence_ok: config.geofence.enabled ? isWithinGeofence(0, 0) : null, // Simplified
                created_at: new Date().toISOString(),
                ...extra
            });
        } catch (err) {
            // Silent fail for audit (don't block main operation)
            if (config.debug) console.warn('⚠️ Audit log failed:', err);
        }
    },
    
    // HEALTH CHECK with AI Core diagnostics
    async healthCheck() {
        try {
            const sb = getSupabase();
            if (!sb) return { ok: false, error: 'Supabase not initialized' };
            
            // Test 1: Basic connectivity
            const { error: connError } = await sb.from('system_settings').select('key').limit(1);
            if (connError) return { ok: false, error: connError.message };
            
            // Test 2: AI Core pulse
            const pulse = aiCore.checkPulse();
                        // Test 3: Geofence status
            const geofenceStatus = config.geofence.enabled ? 'enabled' : 'disabled';
            
            return { 
                ok: true, 
                supabase: 'connected',
                aiCore: { mood: pulse, threats: aiCore.threats },
                geofence: geofenceStatus,
                timestamp: new Date().toISOString()
            };
        } catch (err) {
            aiCore.mood = 'ALERT';
            return { ok: false, error: err.message };
        }
    },
    
    // 🧠 AI CORE: Batch operations with mood-aware throttling
    async batch(operations) {
        const results = [];
        
        for (const op of operations) {
            // 🧠 AI Core: Slow down if system is stressed
            if (aiCore.mood !== 'PEACEFUL') {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            try {
                const result = await this[op.method](op.table, op.data, op.options);
                results.push({ success: true, data: result });
            } catch (err) {
                results.push({ success: false, error: err.message });
                // 🧠 AI Core: Update mood on batch failure
                if (results.filter(r => !r.success).length >= 3) {
                    aiCore.mood = 'ALERT';
                }
            }
        }
        
        return results;
    }
};

// ========== HELPER: Get Current Prayer Time ==========
function getCurrentPrayer() {
    const now = new Date();
    const [h, m] = [now.getHours(), now.getMinutes()];
    const total = h * 60 + m;
    
    for (const [prayer, times] of Object.entries(config.prayerTimes)) {
        const [startH, startM] = times.start.split(':').map(Number);        const [endH, endM] = times.end.split(':').map(Number);
        let startTotal = startH * 60 + startM;
        let endTotal = endH * 60 + endM;
        
        // Handle overnight (Isya)
        if (endTotal < startTotal) {
            endTotal += 24 * 60;
            if (total < startTotal) {
                const checkTotal = total + 24 * 60;
                if (checkTotal >= startTotal && checkTotal < endTotal) return prayer;
            }
        }
        
        if (total >= startTotal && total < endTotal) return prayer;
    }
    return 'Isya';
}

// ========== GLOBAL EXPORT ==========
if (typeof window !== 'undefined') {
    window.api = api;
    window.initSupabase = initSupabase;
    window.getSupabase = getSupabase;
    console.log('🌊 API Core loaded - Ocean Logic Ready');
}
