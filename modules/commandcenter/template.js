// modules/commandcenter/template.js
export const html = `
<div style="padding: 1rem; max-width: 1400px; margin: 0 auto;">
    <!-- Header -->
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <div>
            <h1 style="font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #14b8a6, #0d9488); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">COMMAND CENTER</h1>
            <p style="font-size: 0.75rem; color: #64748b;">Dream OS v2.0 · Real-time Monitoring & Control</p>
        </div>
        <div style="margin-left: auto; display: flex; align-items: center; gap: 1rem;">
            <div style="background: rgba(20,184,166,0.1); border: 1px solid rgba(20,184,166,0.25); border-radius: 30px; padding: 0.3rem 1rem;">
                <i class="fas fa-user text-emerald-400"></i>
                <span id="cmd-user-display" style="margin-left: 0.3rem; font-size: 0.85rem;">GUEST</span>
            </div>
            <div style="font-size: 1.2rem; font-weight: 700; color: #14b8a6; font-family: 'JetBrains Mono', monospace;" id="cmd-clock"></div>
        </div>
    </div>

    <!-- Tabs -->
    <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid rgba(20,184,166,0.25); margin-bottom: 1.5rem; overflow-x: auto;" class="tabs-container">
        <button class="cmd-tab active" data-tab="dashboard" style="padding: 0.5rem 1.2rem; background: rgba(20,184,166,0.1); border: 1px solid rgba(20,184,166,0.25); border-radius: 8px 8px 0 0; color: #14b8a6; font-weight: 600; cursor: pointer; white-space: nowrap;">📊 Dashboard</button>
        <button class="cmd-tab" data-tab="approval" style="padding: 0.5rem 1.2rem; background: none; border: 1px solid transparent; border-radius: 8px 8px 0 0; color: #64748b; font-weight: 600; cursor: pointer; white-space: nowrap;">✅ Approval</button>
        <button class="cmd-tab" data-tab="activity" style="padding: 0.5rem 1.2rem; background: none; border: 1px solid transparent; border-radius: 8px 8px 0 0; color: #64748b; font-weight: 600; cursor: pointer; white-space: nowrap;">📋 Activity</button>
        <button class="cmd-tab" data-tab="analytics" style="padding: 0.5rem 1.2rem; background: none; border: 1px solid transparent; border-radius: 8px 8px 0 0; color: #64748b; font-weight: 600; cursor: pointer; white-space: nowrap;">📈 Analytics</button>
        <button class="cmd-tab" data-tab="system" style="padding: 0.5rem 1.2rem; background: none; border: 1px solid transparent; border-radius: 8px 8px 0 0; color: #64748b; font-weight: 600; cursor: pointer; white-space: nowrap;">⚙️ System</button>
    </div>

    <!-- AI Insight Panel -->
    <div style="background: linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05)); border-left: 6px solid #14b8a6; border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <div style="font-size: 2.5rem;">🤖</div>
        <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 0.9rem; color: #14b8a6; margin-bottom: 0.2rem;">AI INSIGHT</div>
            <div id="cmd-aiMessage" style="font-size: 1rem; font-weight: 500;">Memuat data cuaca...</div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">⚠️ Pending: <span id="cmd-stat-total">0</span></span>
            <span style="background: rgba(59,130,246,0.15); color: #3b82f6; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">📅 Booking: <span id="cmd-stat-booking">0</span></span>
            <span style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">⚠️ K3: <span id="cmd-stat-k3">0</span></span>
            <span style="background: rgba(139,92,246,0.15); color: #a855f7; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">💰 Dana: <span id="cmd-stat-dana">0</span></span>
            <span style="background: rgba(249,115,22,0.15); color: #f97316; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">🔧 Maint: <span id="cmd-stat-maintenance">0</span></span>
            <span style="background: rgba(236,72,153,0.15); color: #ec4899; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">📦 Stok: <span id="cmd-stat-stok">0</span></span>
        </div>
    </div>

    <!-- Content Area (diisi oleh JS) -->
    <div id="cmd-content-area"></div>

    <!-- Footer -->
    <div style="margin-top: 2rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem;">
        <div style="display: flex; gap: 1rem;">
            <button id="cmd-backupBtn" class="action-btn" style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); color: #3b82f6;">
                <i class="fas fa-database"></i> Backup
            </button>
            <button id="cmd-exportBtn" class="action-btn" style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981;">
                <i class="fas fa-file-csv"></i> Export
            </button>
            <button id="cmd-refreshBtn" class="action-btn" style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); color: #a855f7;">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
        </div>
        <div style="font-size: 0.7rem; color: #64748b;">
            Terakhir sinkron: <span id="cmd-last-sync">—</span>
        </div>
    </div>

    <!-- Status Bar -->
    <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem; font-size: 0.7rem; color: #94a3b8;">
        <span><i class="fas fa-shield-alt text-emerald-400"></i> Security: <span id="cmd-status-security" class="status-value mono text-emerald-400">AMAN</span></span>
        <span><i class="fas fa-plug text-blue-400"></i> API: <span class="mono">98%</span></span>
        <span><i class="fas fa-clock text-amber-400"></i> Mode: Real-time</span>
    </div>
</div>
`;
