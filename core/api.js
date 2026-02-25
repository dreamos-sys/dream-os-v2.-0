import { supabase } from './supabase.js';
import { AppError } from './error.js';

export const api = {
    async getAll(table, options = {}) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw new AppError(error.message, 'FETCH_ALL_ERROR');
        return data;
    },

    async getById(table, id) {
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
        if (error) throw new AppError(error.message, 'FETCH_BY_ID_ERROR');
        return data;
    },

    async create(table, payload) {
        const { data, error } = await supabase.from(table).insert([payload]).select();
        if (error) throw new AppError(error.message, 'CREATE_ERROR');
        return data?.[0];
    },

    async update(table, id, payload) {
        const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
        if (error) throw new AppError(error.message, 'UPDATE_ERROR');
        return data?.[0];
    },

    async delete(table, id) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw new AppError(error.message, 'DELETE_ERROR');
        return true;
    },

    async query(table, filters = {}) {
        let query = supabase.from(table).select('*');
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        const { data, error } = await query;
        if (error) throw new AppError(error.message, 'QUERY_ERROR');
        return data;
    }
};
