// core/api.js - Unified Supabase API Wrapper
// Zero-cost: Works with Supabase Free Tier

// Initialize Supabase client
const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

let supabase = null;

export function initSupabase() {
    if (supabase) return supabase;
    
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized');
        return supabase;
    }
    
    console.error('❌ Supabase library not loaded');
    return null;
}

export function getSupabase() {
    if (!supabase) return initSupabase();
    return supabase;
}

// ========== API WRAPPER ==========
export const api = {
    // CREATE
    async create(table, data) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        const { data: result, error } = await sb.from(table).insert(data).select().single();
        
        if (error) {
            throw new Error(error.message);
        }
        
        // Log to audit (optional)
        await this.logAudit('INSERT', table, result);
        
        return result;
    },
    
    // READ
    async query(table, filters = {}) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');        
        let query = sb.from(table).select('*');
        
        // Apply filters
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.limit) query = query.limit(filters.limit);
        if (filters.order) {
            const [field, direction = 'asc'] = filters.order.split(':');
            query = query.order(field, { ascending: direction === 'asc' });
        }
        if (filters.eq) {
            Object.entries(filters.eq).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        if (filters.lt) {
            Object.entries(filters.lt).forEach(([key, value]) => {
                query = query.lt(key, value);
            });
        }
        if (filters.gt) {
            Object.entries(filters.gt).forEach(([key, value]) => {
                query = query.gt(key, value);
            });
        }
        if (filters.date) {
            query = query.eq('tanggal', filters.date);
        }
        
        const { data, error } = await query;
        
        if (error) throw new Error(error.message);
        return data || [];
    },
    
    // GET SINGLE
    async get(table, id) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        const { data, error } = await sb.from(table).select('*').eq('id', id).single();
        
        if (error) throw new Error(error.message);
        return data;
    },
    
    // UPDATE
    async update(table, id, data) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');        
        const { data: result, error } = await sb.from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        
        await this.logAudit('UPDATE', table, result);
        
        return result;
    },
    
    // DELETE (Soft delete recommended)
    async delete(table, id) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        // Soft delete: update status instead of hard delete
        const { error } = await sb.from(table)
            .update({ status: 'cancelled', updated_at: new Date() })
            .eq('id', id);
        
        if (error) throw new Error(error.message);
        
        await this.logAudit('DELETE', table, { id });
        
        return true;
    },
    
    // COUNT
    async count(table, filters = {}) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not initialized');
        
        let query = sb.from(table).select('*', { count: 'exact', head: true });
        
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.eq) {
            Object.entries(filters.eq).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        
        const { count, error } = await query;
        
        if (error) throw new Error(error.message);
        return count || 0;
    },    
    // AUDIT LOGGING
    async logAudit(action, table, data) {
        try {
            const sb = getSupabase();
            const userName = sessionStorage.getItem('dream_role') || 'System';
            
            await sb.from('audit_logs').insert({
                action,
                table_name: table,
                record_id: data?.id,
                user_name: userName,
                new_value: data,
                created_at: new Date().toISOString()
            });
        } catch (err) {
            // Silent fail for audit (don't block main operation)
            console.warn('Audit log failed:', err);
        }
    },
    
    // HEALTH CHECK
    async healthCheck() {
        try {
            const sb = getSupabase();
            const { error } = await sb.from('system_settings').select('key').limit(1);
            return { ok: !error, error: error?.message };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }
};

// Auto-init on module load
if (typeof window !== 'undefined') {
    window.api = api;
}
