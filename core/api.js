// ═══════════════════════════════════════════════════════
// DREAM OS v2.0 - API WRAPPER
// ═══════════════════════════════════════════════════════

import { supabase } from './supabase.js';

export const api = {
    /**
     * Query data from table
     */
    async query(table, filters = {}, options = {}) {
        try {
            let query = supabase.from(table).select('*');
            
            // Apply filters
            for (const [key, value] of Object.entries(filters)) {
                query = query.eq(key, value);
            }
            
            // Apply ordering
            if (options.order) {
                query = query.order(options.order, { ascending: options.ascending !== false });
            }
            
            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
            
        } catch (err) {
            console.error(`API query error (${table}):`, err);
            throw err;
        }
    },
    
    /**
     * Insert data
     */
    async insert(table, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .insert(data)
                .select();
            
            if (error) throw error;
            return result;
            
        } catch (err) {
            console.error(`API insert error (${table}):`, err);
            throw err;
        }
    },
    
    /**
     * Update data
     */
    async update(table, id, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return result;
            
        } catch (err) {
            console.error(`API update error (${table}):`, err);
            throw err;
        }
    },
    
    /**
     * Delete data
     */
    async delete(table, id) {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
            
        } catch (err) {
            console.error(`API delete error (${table}):`, err);
            throw err;
        }
    }
};

console.log('✅ API wrapper initialized');
