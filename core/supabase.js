import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { CONFIG } from './config.js';

export const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key);
// core/supabase.js
import { CONFIG } from './config.js';

const { createClient } = window.supabase;
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
