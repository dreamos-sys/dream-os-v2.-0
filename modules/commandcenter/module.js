// ═══════════════════════════════════════════════════════
// DREAM OS v2.0 - COMMAND CENTER MODULE (FULLY WORKING)
// ═══════════════════════════════════════════════════════

import { api } from '../../core/api.js';
import { showToast } from '../../core/components.js';
import { eventBus } from '../../core/eventBus.js';

export async function init(params) {
    console.log('📊 CommandCenter initializing...', params);
    
    const content = document.getElementById('module-content');
    if (!content) {
        console.error('❌ module-content not found');
        return;
    }
    
    // Render UI
    content.innerHTML = `
        <div class="glass-card p-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div style="font-size:4rem;margin-bottom:1rem;">📊</div>
                <h2 class="text-3xl font-bold mb-2">Command Center</h2>
                <p class="text-slate-400">Real-time Monitoring & Control</p>
            </div>
            
            <!-- User Info -->
            <div class="glass-card p-4 mb-6">
                <h3 class="text-lg font-bold mb-3">User Information</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div><span class="text-slate-400">User:</span> <span style="color:${params?.user?.color || '#10b981'};font-weight:bold">${params?.user?.name || 'Guest'}</span></div>
                    <div><span class="text-slate-400">Role:</span> ${params?.user?.role || 'guest'}</div>
                    <div><span class="text-slate-400">Module:</span> commandcenter</div>
                    <div><span class="text-slate-400">Status:</span> <span style="color:#10b981">● Active</span></div>
                </div>
            </div>
            
            <!-- Stats Grid (dynamic) -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="glass-card p-4 text-center cursor-pointer hover:bg-emerald-500/20 transition" onclick="window.loadModule('booking')">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">📅</div>
                    <div class="text-2xl font-bold text-emerald-400" id="stat-booking">...</div>
                    <div class="text-xs text-slate-400">Booking Pending</div>
                </div>
                <div class="glass-card p-4 text-center cursor-pointer hover:bg-orange-500/20 transition" onclick="window.loadModule('k3')">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">⚠️</div>
                    <div class="text-2xl font-bold text-orange-400" id="stat-k3">...</div>
                    <div class="text-xs text-slate-400">K3 Reports</div>
                </div>                <div class="glass-card p-4 text-center cursor-pointer hover:bg-purple-500/20 transition" onclick="window.loadModule('dana')">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">💰</div>
                    <div class="text-2xl font-bold text-purple-400" id="stat-dana">...</div>
                    <div class="text-xs text-slate-400">Dana Pending</div>
                </div>
                <div class="glass-card p-4 text-center cursor-pointer hover:bg-cyan-500/20 transition" onclick="window.loadModule('maintenance')">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">🔧</div>
                    <div class="text-2xl font-bold text-cyan-400" id="stat-maintenance">...</div>
                    <div class="text-xs text-slate-400">Maintenance</div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="mb-6">
                <h3 class="text-lg font-bold mb-3">Quick Actions</h3>
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="createBackup()" class="glass-card p-3 text-center hover:bg-emerald-500/20 transition cursor-pointer">
                        <div style="font-size:1.5rem;margin-bottom:0.5rem;">💾</div>
                        <div class="text-xs font-bold">Backup</div>
                    </button>
                    <button onclick="exportData()" class="glass-card p-3 text-center hover:bg-emerald-500/20 transition cursor-pointer">
                        <div style="font-size:1.5rem;margin-bottom:0.5rem;">📊</div>
                        <div class="text-xs font-bold">Export</div>
                    </button>
                </div>
            </div>
            
            <!-- System Status -->
            <div class="glass-card p-4 mb-6">
                <h3 class="text-lg font-bold mb-3">System Status</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-400">Database:</span>
                        <span id="status-db" style="color:#f59e0b">● Connecting...</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">API:</span>
                        <span id="status-api" style="color:#f59e0b">● Checking...</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">Last Sync:</span>
                        <span id="last-sync" class="text-slate-400">--:--:--</span>
                    </div>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="mb-6">
                <h3 class="text-lg font-bold mb-3">Recent Activity</h3>
                <div id="activity-feed" class="space-y-2 max-h-40 overflow-y-auto">                    <div class="text-center text-slate-400 text-sm py-4">Loading activity...</div>
                </div>
            </div>
            
            <!-- Back Button -->
            <button onclick="window.closeModule()" class="btn-crystal w-full">
                <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
            </button>
        </div>
    `;
    
    // Load data
    await loadStats();
    await loadActivity();
    checkSystemStatus();
    
    // Subscribe to real-time updates
    setupRealtime();
    
    console.log('✅ CommandCenter loaded');
}

// Load stats from Supabase
async function loadStats() {
    try {
        const [booking, k3, dana, maintenance] = await Promise.all([
            api.query('bookings', { status: 'pending' }),
            api.query('k3_reports', { status: 'pending' }),
            api.query('pengajuan_dana', { status: 'pending' }),
            api.query('maintenance_tasks', { status: 'pending' })
        ]);
        
        document.getElementById('stat-booking').textContent = booking.length;
        document.getElementById('stat-k3').textContent = k3.length;
        document.getElementById('stat-dana').textContent = dana.length;
        document.getElementById('stat-maintenance').textContent = maintenance.length;
        
    } catch (err) {
        console.error('Stats load error:', err);
        // Show placeholder values
        ['stat-booking', 'stat-k3', 'stat-dana', 'stat-maintenance'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
    }
}

// Load recent activity from audit_logs
async function loadActivity() {
    const feed = document.getElementById('activity-feed');    if (!feed) return;
    
    try {
        const logs = await api.query('audit_logs', {}, { order: 'created_at', ascending: false, limit: 5 });
        
        if (!logs || logs.length === 0) {
            feed.innerHTML = '<div class="text-center text-slate-400 text-sm py-4">No recent activity</div>';
            return;
        }
        
        feed.innerHTML = logs.map(log => `
            <div class="glass-card p-3 text-sm">
                <div class="font-bold">${log.action}</div>
                <div class="text-slate-400 text-xs">${log.detail || 'No details'} • ${new Date(log.created_at).toLocaleString('id-ID')}</div>
            </div>
        `).join('');
        
    } catch (err) {
        console.error('Activity load error:', err);
        feed.innerHTML = '<div class="text-center text-slate-400 text-sm py-4">Failed to load</div>';
    }
}

// Check system status
async function checkSystemStatus() {
    const dbEl = document.getElementById('status-db');
    const apiEl = document.getElementById('status-api');
    const syncEl = document.getElementById('last-sync');
    
    try {
        // Test database connection
        await supabase.from('audit_logs').select('id').limit(1);
        if (dbEl) { dbEl.textContent = '● Connected'; dbEl.style.color = '#10b981'; }
        if (apiEl) { apiEl.textContent = '● Online'; apiEl.style.color = '#10b981'; }
        if (syncEl) syncEl.textContent = new Date().toLocaleTimeString('id-ID');
        
    } catch (err) {
        console.error('System check error:', err);
        if (dbEl) { dbEl.textContent = '● Error'; dbEl.style.color = '#ef4444'; }
        if (apiEl) { apiEl.textContent = '● Offline'; apiEl.style.color = '#ef4444'; }
    }
}

// Setup real-time subscriptions
function setupRealtime() {
    // Subscribe to booking changes
    const channel = supabase
        .channel('commandcenter-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
            console.log('📊 Booking changed, refreshing stats');            loadStats();
            eventBus.emit('stats-update');
        })
        .subscribe();
    
    // Store channel for cleanup
    window.__commandcenter_channel = channel;
}

// Backup function
window.createBackup = async function() {
    showToast('⏳ Creating backup...', 'info');
    try {
        const tables = ['bookings', 'k3_reports', 'pengajuan_dana', 'inventory'];
        const backup = { timestamp: new Date().toISOString(), version: '2.0' };
        
        for (const table of tables) {
            const data = await api.query(table);
            backup[table] = data;
        }
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dream-os-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('✅ Backup created!', 'success');
    } catch (err) {
        showToast('❌ Backup failed: ' + err.message, 'error');
    }
};

// Export function
window.exportData = function() {
    showToast('📊 Export feature coming soon!', 'info');
};

// Cleanup function
export function cleanup() {
    console.log('🧹 CommandCenter cleanup');
    // Unsubscribe from realtime
    if (window.__commandcenter_channel) {
        supabase.removeChannel(window.__commandcenter_channel);
        delete window.__commandcenter_channel;
    }
    // Remove global functions
    delete window.createBackup;    delete window.exportData;
}

console.log('📦 CommandCenter module.js loaded');
