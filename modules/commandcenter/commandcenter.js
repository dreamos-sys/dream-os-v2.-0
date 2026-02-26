import { supabase } from '../../core/supabase.js';

export async function init() {
    console.log('[COMMANDCENTER] Module loaded');
    
    // Load stats
    const [booking, k3, dana] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('k3_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('pengajuan_dana').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);
    
    document.getElementById('stats').innerHTML = `
        <div class="flex justify-between"><span>📅 Booking Pending:</span><span class="font-bold text-blue-400">${booking.count || 0}</span></div>
        <div class="flex justify-between"><span>⚠️ K3 Pending:</span><span class="font-bold text-orange-400">${k3.count || 0}</span></div>
        <div class="flex justify-between"><span>💰 Dana Pending:</span><span class="font-bold text-purple-400">${dana.count || 0}</span></div>
    `;
    
    document.getElementById('approvals').innerHTML = '<p class="text-slate-400">Total: ' + ((booking.count || 0) + (k3.count || 0) + (dana.count || 0)) + ' items need approval</p>';
}
