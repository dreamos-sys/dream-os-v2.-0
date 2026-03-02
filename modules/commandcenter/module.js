// ═══════════════════════════════════════════════════════
// DREAM OS v2.0 - COMMAND CENTER MODULE
// ═══════════════════════════════════════════════════════

export async function init(params) {
    console.log('📊 CommandCenter module initializing...', params);
    
    const content = document.getElementById('module-content');
    if (!content) {
        console.error('❌ module-content not found!');
        return;
    }
    
    // Render full Command Center UI
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
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="glass-card p-4 text-center">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">📅</div>
                    <div class="text-2xl font-bold text-emerald-400">0</div>
                    <div class="text-xs text-slate-400">Booking Pending</div>
                </div>
                <div class="glass-card p-4 text-center">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">⚠️</div>
                    <div class="text-2xl font-bold text-orange-400">0</div>
                    <div class="text-xs text-slate-400">K3 Reports</div>
                </div>
                <div class="glass-card p-4 text-center">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">💰</div>
                    <div class="text-2xl font-bold text-purple-400">0</div>
                    <div class="text-xs text-slate-400">Dana Pending</div>                </div>
                <div class="glass-card p-4 text-center">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">🔧</div>
                    <div class="text-2xl font-bold text-cyan-400">0</div>
                    <div class="text-xs text-slate-400">Maintenance</div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="mb-6">
                <h3 class="text-lg font-bold mb-3">Quick Actions</h3>
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="window.showToast('Backup feature coming soon!', 'info')" class="glass-card p-3 text-center hover:bg-emerald-500/20 transition cursor-pointer">
                        <div style="font-size:1.5rem;margin-bottom:0.5rem;">💾</div>
                        <div class="text-xs font-bold">Backup</div>
                    </button>
                    <button onclick="window.showToast('Export feature coming soon!', 'info')" class="glass-card p-3 text-center hover:bg-emerald-500/20 transition cursor-pointer">
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
                        <span style="color:#10b981">● Connected</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">API:</span>
                        <span style="color:#10b981">● Online</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">Storage:</span>
                        <span style="color:#f59e0b">● 75% Used</span>
                    </div>
                </div>
            </div>
            
            <!-- Back Button -->
            <button onclick="window.closeModule()" class="btn-crystal w-full">
                <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
            </button>
        </div>
    `;
    
    console.log('✅ CommandCenter module loaded successfully');}

// Cleanup function (called when module closes)
export function cleanup() {
    console.log('🧹 CommandCenter module cleanup');
}

console.log('📦 CommandCenter module.js loaded');
