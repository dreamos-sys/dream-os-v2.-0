import { supabase } from './supabase.js';
import { createHash } from './utils.js';

export async function logAudit(action, detail, userId) {
    const hash = createHash(`${action}|${detail}|${userId}|${Date.now()}`);
    try {
        await supabase.from('audit_logs').insert({
            action,
            detail,
            user_id: userId,
            hash,
            created_at: new Date().toISOString()
        });
    } catch (e) {
        console.warn('Audit log failed', e);
    }
}
