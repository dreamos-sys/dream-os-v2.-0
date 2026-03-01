// core/api.js
import { supabase } from './supabase.js';
import { AppError } from './error.js';

export const api = {
    async query(table, filters = {}) {
        try {
            let query = supabase.from(table).select('*');
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            });
            const { data, error } = await query;
            if (error) throw new AppError(error.message, error.code);
            return data;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err.message, 'QUERY_FAILED');
        }
    },

    async create(table, payload) {
        try {
            const { data, error } = await supabase.from(table).insert([payload]).select();
            if (error) throw new AppError(error.message, error.code);
            return data?.[0];
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err.message, 'CREATE_FAILED');
        }
    },

    async update(table, id, updates) {
        try {
            const { data, error } = await supabase.from(table).update(updates).eq('id', id).select();
            if (error) throw new AppError(error.message, error.code);
            return data?.[0];
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err.message, 'UPDATE_FAILED');
        }
    },

    async remove(table, id) {
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw new AppError(error.message, error.code);
            return true;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err.message, 'DELETE_FAILED');
        }
    }
};
