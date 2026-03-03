// Template HTML untuk Command Center
export const html = `
<div class="max-w-7xl mx-auto p-4 md:p-6">
    <!-- HEADER -->
    <div class="panel header-glow mb-6">
        <div class="flex flex-wrap justify-between items-center gap-4">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30">
                    🚀
                </div>
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                        Command Center <span class="text-white">v2.0</span>
                    </h1>
                    <p class="text-sm text-slate-400">Professional Control System • Real-time Monitoring</p>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <div class="live-indicator">
                    <div class="live-dot"></div>
                    <span>LIVE</span>
                </div>
                <div class="text-right hidden md:block">
                    <div class="text-sm text-slate-300" id="user-display">Guest</div>
                    <div class="text-xs text-slate-400 mono" id="clock">--:--:--</div>
                </div>
                <button onclick="window.doLogout ? window.doLogout() : location.reload()" 
                        class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-600/30">
                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                </button>
            </div>
        </div>
    </div>
    
    <!-- ALERT BANNER -->
    <div class="alert-banner" id="alertBanner" style="display: none;">
        <div class="alert-icon">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="flex-1">
            <div class="font-bold text-red-400">System Alert</div>
            <div class="text-sm text-slate-300" id="alertMessage">Memerlukan perhatian segera</div>
        </div>
        <button onclick="document.getElementById('alertBanner').style.display='none'" 
                class="text-slate-400 hover:text-white">
            <i class="fas fa-times"></i>
        </button>
    </div>
    
    <!-- SYSTEM STATUS BAR -->
    <div class="status-bar">
        <div class="status-item">
            <span class="status-label"><i class="fas fa-database mr-2"></i>Database</span>
            <span class="status-value mono" id="status-db">98%</span>
        </div>
        <div class="status-item">
            <span class="status-label"><i class="fas fa-server mr-2"></i>API</span>
            <span class="status-value mono" id="status-api">100%</span>
        </div>
        <div class="status-item">
            <span class="status-label"><i class="fas fa-shield-alt mr-2"></i>Security</span>
            <span class="status-value mono" id="status-security">AMAN</span>
        </div>
        <div class="status-item">
            <span class="status-label"><i class="fas fa-clock mr-2"></i>Sync</span>
            <span class="status-value mono" id="last-sync">--:--:--</span>
        </div>
    </div>
    
    <!-- AI INSIGHT PANEL -->
    <div class="panel mb-6 border-emerald-500/50 bg-gradient-to-br from-emerald-900/20 to-blue-900/20">
        <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-2xl">
                🧠
            </div>
            <div class="flex-1">
                <h3 class="text-lg font-bold text-emerald-400 mb-2">AI Insight</h3>
                <p class="text-slate-300" id="aiMessage">
                    <i class="fas fa-circle-notch spin mr-2"></i>Menganalisis data sistem...
                </p>
            </div>
        </div>
    </div>
    
    <!-- STATS GRID -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div class="stat-card">
            <div class="stat-value text-blue-400 mono" id="stat-total">0</div>
            <div class="text-xs text-slate-400 mt-1">Total Pending</div>
        </div>
        <div class="stat-card">
            <div class="stat-value text-emerald-400 mono" id="stat-booking">0</div>
            <div class="text-xs text-slate-400 mt-1">Booking</div>
        </div>
        <div class="stat-card">
            <div class="stat-value text-orange-400 mono" id="stat-k3">0</div>
            <div class="text-xs text-slate-400 mt-1">K3</div>
        </div>
        <div class="stat-card">
            <div class="stat-value text-purple-400 mono" id="stat-dana">0</div>
            <div class="text-xs text-slate-400 mt-1">Dana</div>
        </div>
        <div class="stat-card">
            <div class="stat-value text-cyan-400 mono" id="stat-stok">0</div>
            <div class="text-xs text-slate-400 mt-1">Stok Low</div>
        </div>
        <div class="stat-card">
            <div class="stat-value text-orange-400 mono" id="stat-maintenance">0</div>
            <div class="text-xs text-slate-400 mt-1">Maintenance</div>
        </div>
    </div>
    
    <!-- TABS -->
    <div class="tabs">
        <div class="tab active" data-tab="dashboard">
            <i class="fas fa-chart-line mr-2"></i>Dashboard
        </div>
        <div class="tab" data-tab="approval">
            <i class="fas fa-check-circle mr-2"></i>Approval
        </div>
        <div class="tab" data-tab="activity">
            <i class="fas fa-history mr-2"></i>Aktivitas
        </div>
        <div class="tab" data-tab="analytics">
            <i class="fas fa-chart-bar mr-2"></i>Analytics
        </div>
        <div class="tab" data-tab="system">
            <i class="fas fa-server mr-2"></i>System
        </div>
    </div>
    
    <!-- CONTENT AREA -->
    <div id="content-area" class="panel min-h-[400px]">
        <div class="loader-container">
            <div class="loader"></div>
            <div class="loader-text">Memuat dashboard...</div>
        </div>
    </div>
    
    <!-- QUICK ACTIONS -->
    <div class="quick-actions mt-6">
        <div class="action-btn" onclick="window.createBackup()">
            <i class="fas fa-download"></i>
            <span>Backup</span>
        </div>
        <div class="action-btn" onclick="window.exportToCSV()">
            <i class="fas fa-file-csv"></i>
            <span>Export CSV</span>
        </div>
        <div class="action-btn" onclick="window.refreshAllData()">
            <i class="fas fa-sync"></i>
            <span>Refresh</span>
        </div>
        <div class="action-btn" onclick="window.runSystemCheck()">
            <i class="fas fa-stethoscope"></i>
            <span>Diagnostic</span>
        </div>
    </div>
    
    <!-- FOOTER -->
    <div class="text-center mt-8 pb-4">
        <p class="text-xs text-slate-500">
            Dream Team © 2026 | ISO 27001 • ISO 55001 • ISO 9001
        </p>
    </div>
</div>
`;
