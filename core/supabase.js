import { CONFIG } from './config.js';
const { createClient } = window.supabase;
export const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key);
