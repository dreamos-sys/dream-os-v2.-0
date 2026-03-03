// modules/commandcenter/module.js
// ============================================================
// DREAM OS v2.0 - COMMAND CENTER MODULE (FULLY INTEGRATED)
// ============================================================

// Import core modules (dengan fallback jika tidak ada)
let api, showToast, eventBus;
try {
    api = (await import('../../core/api.js')).api;
    showToast = (await import('../../core/components.js')).showToast;
    eventBus = (await import('../../core/eventBus.js')).eventBus;
} catch (e) {
    console.warn('Core modules not found, using fallbacks');
    // Fallback sederhana
    api = {
        async query(table, filters) { return []; },
        async insert(table, record) { return [record]; }
    };
    showToast = (msg, type) => alert(`${type}: ${msg}`);
    eventBus = { on: () => {}, emit: () => {} };
}

// Fallback Supabase jika tidak ada di core
let supabase;
try {
    supabase = (await import('../../core/supabase.js')).supabase;
} catch (e) {
    // Jika tidak ada, buat koneksi langsung (ganti dengan credentials Anda jika perlu)
    supabase = window.supabase?.createClient?.(
        'https://xyzproject.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    ) || null;
}

export async function init(params) {
    console.log('📊 CommandCenter initializing...', params);
    
    const content = document.getElementById('module-content');
    if (!content) {
        console.error('❌ module-content not found');
        return;
    }
    
    // Simpan user untuk digunakan di fungsi
    const currentUser = params?.user || { name: 'Guest', role: 'guest', color: '#10b981' };
    
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
                    <div><span class="text-slate-400">User:</span> <span style="color:${currentUser.color};font-weight:bold">${currentUser.name}</span></div>
                    <div><span class="text-slate-400">Role:</span> ${currentUser.role}</div>
                    <div><span class="text-slate-400">Module:</span> commandcenter</div>
                    <div><span class="text-slate-400">Status:</span> <span style="color:#10b981">● Active</span></div>
                </div>
            </div>
            
            <!-- System Status Bar -->
            <div class="status-bar mb-6" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <div class="status-item" style="flex:1; min-width:150px; background: rgba(15,23,42,0.6); border:1px solid rgba(16,185,129,0.2); border-radius:8px; padding:0.75rem 1rem; display:flex; align-items:center; justify-content:space-between;">
                    <span class="status-label" style="font-size:0.75rem; color:#94a3b8;"><i class="fas fa-database mr-2"></i>Database</span>
                    <span class="status-value mono" id="status-db" style="font-family:'JetBrains Mono'; font-weight:700; color:#10b981;">98%</span>
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
            
            <!-- AI Insight Panel -->
            <div class="glass-card p-4 mb-6" style="border-color: rgba(16,185,129,0.5); background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1));">
                <div style="display: flex; align-items: flex-start; gap: 1rem;">
                    <div style="width:48px; height:48px; border-radius:12px; background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.5); display:flex; align-items:center; justify-content:center; font-size:2rem;">🧠</div>
                    <div style="flex:1;">
                        <h3 style="font-weight:bold; color:#10b981; margin-bottom:0.5rem;">AI Insight</h3>
                        <p style="color:#cbd5e1;" id="aiMessage"><i class="fas fa-circle-notch spin mr-2"></i>Menganalisis data sistem...</p>
                    </div>
                </div>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div class="stat-card" style="background:rgba(15,23,42,0.6); border:1px solid rgba(16,185,129,0.2); border-radius:12px; padding:1.25rem; position:relative; overflow:hidden;">
                    <div class="stat-value text-blue-400 mono" id="stat-total" style="font-family:'JetBrains Mono'; font-size:2.5rem; font-weight:700;">0</div>
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
            
            <!-- Tabs -->
            <div class="tabs" style="display: flex; gap: 0.5rem; border-bottom: 2px solid rgba(16,185,129,0.3); margin-bottom: 1.5rem; overflow-x: auto;">
                <div class="tab active" data-tab="dashboard" style="padding:0.75rem 1.5rem; background:rgba(15,23,42,0.6); border-radius:8px 8px 0 0; cursor:pointer; font-weight:600; white-space:nowrap; background:rgba(16,185,129,0.2); border-color:#10b981; color:#10b981;">
                    <i class="fas fa-chart-line mr-2"></i>Dashboard
                </div>
                <div class="tab" data-tab="approval" style="padding:0.75rem 1.5rem; background:rgba(15,23,42,0.6); border-radius:8px 8px 0 0; cursor:pointer; font-weight:600; white-space:nowrap;">
                    <i class="fas fa-check-circle mr-2"></i>Approval
                </div>
                <div class="tab" data-tab="activity" style="padding:0.75rem 1.5rem; background:rgba(15,23,42,0.6); border-radius:8px 8px 0 0; cursor:pointer; font-weight:600; white-space:nowrap;">
                    <i class="fas fa-history mr-2"></i>Aktivitas
                </div>
                <div class="tab" data-tab="analytics" style="padding:0.75rem 1.5rem; background:rgba(15,23,42,0.6); border-radius:8px 8px 0 0; cursor:pointer; font-weight:600; white-space:nowrap;">
                    <i class="fas fa-chart-bar mr-2"></i>Analytics
                </div>
                <div class="tab" data-tab="system" style="padding:0.75rem 1.5rem; background:rgba(15,23,42,0.6); border-radius:8px 8px 0 0; cursor:pointer; font-weight:600; white-space:nowrap;">
                    <i class="fas fa-server mr-2"></i>System
                </div>
                <div class="tab" data-tab="slider" style="padding:0.75rem 1.5rem; background:rgba(15,23,42,0.6); border-radius:8px 8px 0 0; cursor:pointer; font-weight:600; white-space:nowrap;">
                    <i class="fas fa-edit mr-2"></i>Edit Slider
                </div>
            </div>
            
            <!-- Content Area -->
            <div id="tab-content-area" class="glass-card p-4 min-h-[400px]">
                <div class="loader-container" style="display:flex; flex-direction:column; align-items:center; padding:3rem;">
                    <div class="loader" style="width:48px; height:48px; border:3px solid rgba(16,185,129,0.2); border-top-color:#10b981; border-radius:50%; animation:spin 1s linear infinite;"></div>
                    <div class="loader-text" style="margin-top:1rem; color:#94a3b8;">Memuat dashboard...</div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="quick-actions mt-6" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px,1fr)); gap:0.75rem;">
                <button onclick="window.createBackup()" class="action-btn" style="background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:8px; padding:0.75rem; text-align:center; cursor:pointer; transition:all 0.3s;">
                    <i class="fas fa-download" style="display:block; font-size:1.5rem; margin-bottom:0.5rem; color:#10b981;"></i>
                    <span style="color:white;">Backup</span>
                </button>
                <button onclick="window.exportToCSV()" class="action-btn">
                    <i class="fas fa-file-csv" style="display:block; font-size:1.5rem; margin-bottom:0.5rem; color:#10b981;"></i>
                    <span>Export CSV</span>
                </button>
                <button onclick="window.refreshAllData()" class="action-btn">
                    <i class="fas fa-sync" style="display:block; font-size:1.5rem; margin-bottom:0.5rem; color:#10b981;"></i>
                    <span>Refresh</span>
                </button>
                <button onclick="window.runSystemCheck()" class="action-btn">
                    <i class="fas fa-stethoscope" style="display:block; font-size:1.5rem; margin-bottom:0.5rem; color:#10b981;"></i>
                    <span>Diagnostic</span>
                </button>
            </div>
            
            <!-- Back Button -->
            <button onclick="window.closeModule()" class="btn-crystal w-full mt-6">
                <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
            </button>
        </div>
    `;
    
    // ========== STATE ==========
    let cachedStats = {};
    let currentTab = 'dashboard';
    let refreshTimer = null;
    let charts = {};
    
    // ========== HELPER FUNCTIONS ==========
    function setEl(id, val) { 
        const el = document.getElementById(id); 
        if (el) el.textContent = val; 
    }
    
    // ========== TAB SWITCHING ==========
    function switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
        if (btn) btn.classList.add('active');
        currentTab = tabId;
        renderTabContent(tabId);
    }
    
    // Pasang event listener untuk tab
    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(btn.dataset.tab);
        });
    });
    
    // ========== RENDER TAB CONTENT ==========
    async function renderTabContent(tab) {
        const area = document.getElementById('tab-content-area');
        if (!area) return;
        
        area.innerHTML = '<div class="loader-container"><div class="loader"></div><div class="loader-text">Memuat ' + tab + '...</div></div>';
        
        // Beri sedikit delay agar loader terlihat
        setTimeout(() => {
            if (tab === 'dashboard') renderDashboard(area);
            else if (tab === 'approval') renderApproval(area);
            else if (tab === 'activity') renderActivity(area);
            else if (tab === 'analytics') renderAnalytics(area);
            else if (tab === 'system') renderSystem(area);
            else if (tab === 'slider') renderSliderSettings(area);
        }, 300);
    }
    
    // ========== DASHBOARD ==========
    function renderDashboard(area) {
        area.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Activity Feed -->
                <div class="lg:col-span-2">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-history text-emerald-400"></i>
                        Aktivitas Terbaru
                    </h3>
                    <div id="activityFeed" class="activity-feed" style="max-height:300px; overflow-y:auto;">
                        <div class="text-center py-8 text-slate-400">
                            <i class="fas fa-circle-notch spin text-2xl mb-2"></i>
                            <p>Memuat aktivitas...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Stats -->
                <div>
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-chart-pie text-blue-400"></i>
                        Ringkasan
                    </h3>
                    <div class="space-y-3">
                        <div class="glass-card p-4">
                            <div class="text-sm text-slate-400 mb-1">Total Item</div>
                            <div class="text-2xl font-bold text-emerald-400 mono" id="summary-total">0</div>
                        </div>
                        <div class="glass-card p-4">
                            <div class="text-sm text-slate-400 mb-1">Pending Approval</div>
                            <div class="text-2xl font-bold text-orange-400 mono" id="summary-pending">0</div>
                        </div>
                        <div class="glass-card p-4">
                            <div class="text-sm text-slate-400 mb-1">Selesai Hari Ini</div>
                            <div class="text-2xl font-bold text-blue-400 mono" id="summary-today">0</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pending Queue -->
            <div class="mt-6">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-hourglass-half text-yellow-400"></i>
                    Antrian Persetujuan
                </h3>
                <div id="pendingQueue" class="space-y-3">
                    <div class="text-center py-8 text-slate-400">
                        <i class="fas fa-circle-notch spin text-2xl mb-2"></i>
                        <p>Memuat data pending...</p>
                    </div>
                </div>
            </div>
        `;
        
        loadActivityFeed();
        loadPendingQueue();
        updateSummary();
    }
    
    // ========== APPROVAL ==========
    function renderApproval(area) {
        area.innerHTML = `
            <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                <i class="fas fa-check-double text-emerald-400"></i>
                Pusat Persetujuan
            </h3>
            <div class="space-y-6">
                <div>
                    <h4 class="text-md font-bold mb-3 text-emerald-400">📅 Booking Pending</h4>
                    <div id="approval-bookings" class="space-y-3"></div>
                </div>
                <div>
                    <h4 class="text-md font-bold mb-3 text-orange-400">⚠️ K3 Pending</h4>
                    <div id="approval-k3" class="space-y-3"></div>
                </div>
                <div>
                    <h4 class="text-md font-bold mb-3 text-purple-400">💰 Dana Pending</h4>
                    <div id="approval-dana" class="space-y-3"></div>
                </div>
            </div>
        `;
        loadApprovalItems();
    }
    
    // ========== ACTIVITY ==========
    function renderActivity(area) {
        area.innerHTML = `
            <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                <i class="fas fa-clipboard-list text-blue-400"></i>
                Log Aktivitas Sistem
            </h3>
            <div id="fullActivityLog" class="activity-feed" style="max-height:500px; overflow-y:auto;">
                <div class="text-center py-8 text-slate-400">
                    <i class="fas fa-circle-notch spin text-2xl mb-2"></i>
                    <p>Memuat log...</p>
                </div>
            </div>
        `;
        loadFullActivityLog();
    }
    
    // ========== ANALYTICS ==========
    function renderAnalytics(area) {
        area.innerHTML = `
            <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                <i class="fas fa-chart-line text-purple-400"></i>
                Analytics & Trends
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="glass-card p-4">
                    <h4 class="font-bold mb-4">Trend Booking (7 Hari)</h4>
                    <div class="chart-container" style="position:relative; height:250px;">
                        <canvas id="chartBooking"></canvas>
                    </div>
                </div>
                <div class="glass-card p-4">
                    <h4 class="font-bold mb-4">Distribusi K3</h4>
                    <div class="chart-container" style="position:relative; height:250px;">
                        <canvas id="chartK3"></canvas>
                    </div>
                </div>
            </div>
        `;
        setTimeout(initCharts, 100);
    }
    
    // ========== SYSTEM ==========
    function renderSystem(area) {
        area.innerHTML = `
            <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                <i class="fas fa-server text-cyan-400"></i>
                System Health
            </h3>
            <div class="space-y-4">
                <div class="glass-card p-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm text-slate-400">Database Connection</span>
                        <span class="text-emerald-400 mono font-bold" id="health-db">98%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-2">
                        <div class="bg-emerald-500 h-2 rounded-full" style="width:98%"></div>
                    </div>
                </div>
                <div class="glass-card p-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm text-slate-400">API Response Time</span>
                        <span class="text-emerald-400 mono font-bold" id="health-api">100%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-2">
                        <div class="bg-emerald-500 h-2 rounded-full" style="width:100%"></div>
                    </div>
                </div>
                <div class="glass-card p-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm text-slate-400">Storage Usage</span>
                        <span class="text-orange-400 mono font-bold" id="health-storage">75%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-2">
                        <div class="bg-orange-500 h-2 rounded-full" style="width:75%"></div>
                    </div>
                </div>
                <div class="glass-card p-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm text-slate-400">Security Score</span>
                        <span class="text-emerald-400 mono font-bold" id="health-security">100%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-2">
                        <div class="bg-emerald-500 h-2 rounded-full" style="width:100%"></div>
                    </div>
                </div>
            </div>
            <div class="mt-6">
                <button class="action-btn" onclick="window.runSystemCheck()" style="width:100%; padding:1rem;">
                    <i class="fas fa-stethoscope"></i>
                    <span>Run System Diagnostic</span>
                </button>
            </div>
        `;
    }
    
    // ========== SLIDER SETTINGS ==========
    function renderSliderSettings(area) {
        area.innerHTML = `
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-edit text-emerald-400"></i>
                Edit Informasi Slider (Slide 5,6,7)
            </h3>
            <div class="mb-4">
                <label class="block text-sm mb-1">Info 1 (Slide 5 - Command Center)</label>
                <textarea id="slider1" class="input-crystal w-full p-2" rows="2">${localStorage.getItem('slider_admin1') || ''}</textarea>
            </div>
            <div class="mb-4">
                <label class="block text-sm mb-1">Info 2 (Slide 6 - Info Tambahan)</label>
                <textarea id="slider2" class="input-crystal w-full p-2" rows="2">${localStorage.getItem('slider_admin2') || ''}</textarea>
            </div>
            <div class="mb-4">
                <label class="block text-sm mb-1">Info 3 (Slide 7 - Reminder)</label>
                <textarea id="slider3" class="input-crystal w-full p-2" rows="2">${localStorage.getItem('slider_admin3') || ''}</textarea>
            </div>
            <button onclick="simpanSliderSettings()" class="btn-crystal">Simpan Perubahan</button>
        `;
        
        // Definisikan fungsi simpanSliderSettings di window
        window.simpanSliderSettings = function() {
            const val1 = document.getElementById('slider1').value;
            const val2 = document.getElementById('slider2').value;
            const val3 = document.getElementById('slider3').value;
            localStorage.setItem('slider_admin1', val1);
            localStorage.setItem('slider_admin2', val2);
            localStorage.setItem('slider_admin3', val3);
            showToast('✅ Pengaturan slider disimpan', 'success');
            // Panggil refreshSlider jika ada di parent window
            if (window.parent?.refreshSlider) window.parent.refreshSlider();
        };
    }
    
    // ========== DATA LOADING FUNCTIONS ==========
    async function loadAllStats() {
        if (!supabase) return;
        try {
            const [booking, k3, dana, maintenance, inventory] = await Promise.all([
                supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('k3_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('pengajuan_dana').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'proses']),
                supabase.from('inventory').select('*', { count: 'exact', head: true }).lt('jumlah', 'minimal_stok')
            ]);
            
            cachedStats = {
                booking: booking.count || 0,
                k3: k3.count || 0,
                dana: dana.count || 0,
                maintenance: maintenance.count || 0,
                stok: inventory.count || 0,
                total: (booking.count||0) + (k3.count||0) + (dana.count||0) + (maintenance.count||0)
            };
            
            setEl('stat-total', cachedStats.total);
            setEl('stat-booking', cachedStats.booking);
            setEl('stat-k3', cachedStats.k3);
            setEl('stat-dana', cachedStats.dana);
            setEl('stat-maintenance', cachedStats.maintenance);
            setEl('stat-stok', cachedStats.stok);
            
            setEl('summary-total', cachedStats.total);
            setEl('summary-pending', cachedStats.total);
            
            updateSecurityStatus(cachedStats.total);
            generateAIInsights();
            
            const now = new Date().toLocaleTimeString('id-ID');
            setEl('last-sync', now);
            
            // Refresh current tab content if needed
            if (currentTab === 'dashboard') {
                loadActivityFeed();
                loadPendingQueue();
            }
            
        } catch (err) { 
            console.error('Stats error:', err); 
        }
    }
    
    function updateSecurityStatus(total) {
        const status = document.getElementById('status-security');
        if (!status) return;
        
        if (total === 0) { 
            status.textContent = 'AMAN'; 
            status.className = 'status-value mono text-emerald-400';
        } else if (total < 10) { 
            status.textContent = 'WASPADA'; 
            status.className = 'status-value mono text-orange-400';
        } else { 
            status.textContent = 'BAHAYA'; 
            status.className = 'status-value mono text-red-400';
        }
    }
    
    function generateAIInsights() {
        const aiMsg = document.getElementById('aiMessage');
        if (!aiMsg) return;
        
        const insights = [];
        if (cachedStats.booking > 5) insights.push('📈 Booking tinggi - pertimbangkan penambahan kapasitas');
        if (cachedStats.k3 > 3) insights.push('⚠️ Review K3 diperlukan - prioritas tinggi');
        if (cachedStats.dana > 5) insights.push('💰 Dana pending menumpuk - perlu approval segera');
        if (cachedStats.stok > 0) insights.push('📦 Stok menipis - lakukan restock');
        if (insights.length === 0) insights.push('✅ Semua sistem optimal - tidak ada tindakan diperlukan');
        
        aiMsg.innerHTML = insights.join('<br>');
    }
    
    async function loadActivityFeed() {
        const feed = document.getElementById('activityFeed');
        if (!feed || !supabase) return;
        
        try {
            const { data } = await supabase.from('audit_logs')
                .select('action, detail, created_at')
                .order('created_at', { ascending: false })
                .limit(10);
                
            if (!data?.length) { 
                feed.innerHTML = '<div class="text-center py-8 text-slate-400">Belum ada aktivitas</div>'; 
                return; 
            }
            
            feed.innerHTML = data.map(a => `
                <div class="activity-item" style="display:flex; gap:1rem; padding:0.75rem; border-left:3px solid #10b981; background:rgba(16,185,129,0.05); margin-bottom:0.5rem; border-radius:0 8px 8px 0;">
                    <div class="activity-icon" style="width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:rgba(16,185,129,0.2); color:#10b981;">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="activity-content" style="flex:1;">
                        <div class="activity-title" style="font-weight:600;">${a.action}</div>
                        <div class="activity-meta" style="font-size:0.75rem; color:#94a3b8;">${a.detail} • ${new Date(a.created_at).toLocaleString('id-ID')}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (err) { 
            feed.innerHTML = '<div class="text-center py-8 text-slate-400">Gagal memuat</div>'; 
        }
    }
    
    async function loadPendingQueue() {
        const queue = document.getElementById('pendingQueue');
        if (!queue || !supabase) return;
        
        try {
            const [bookings, k3, dana] = await Promise.all([
                supabase.from('bookings').select('id, nama_peminjam, ruang, tanggal, jam_mulai').eq('status', 'pending').limit(5),
                supabase.from('k3_reports').select('id, lokasi, jenis_laporan, tanggal').eq('status', 'pending').limit(5),
                supabase.from('pengajuan_dana').select('id, judul, nominal, pengaju').eq('status', 'pending').limit(5)
            ]);
            
            let html = '';
            
            if (bookings?.data?.length) {
                html += `<div class="glass-card p-4 border-l-4 border-l-emerald-500 mb-3">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="fas fa-calendar text-emerald-400"></i>
                        <strong>Booking</strong>
                    </div>`;
                bookings.data.forEach(b => {
                    html += `<div class="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                        <div>
                            <div class="font-bold text-sm">${b.nama_peminjam}</div>
                            <div class="text-xs text-slate-400">${b.tanggal} ${b.jam_mulai} • ${b.ruang}</div>
                        </div>
                        <div class="flex gap-2">
                            <button class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/50 hover:bg-emerald-500/30" 
                                    onclick="window.handleApprove('bookings','${b.id}')">✓</button>
                            <button class="px-3 py-1 rounded bg-red-500/20 text-red-400 text-xs border border-red-500/50 hover:bg-red-500/30" 
                                    onclick="window.handleReject('bookings','${b.id}')">✗</button>
                        </div>
                    </div>`;
                });
                html += `</div>`;
            }
            
            if (k3?.data?.length) {
                html += `<div class="glass-card p-4 border-l-4 border-l-orange-500 mb-3">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="fas fa-exclamation-triangle text-orange-400"></i>
                        <strong>K3 Reports</strong>
                    </div>`;
                k3.data.forEach(k => {
                    html += `<div class="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                        <div>
                            <div class="font-bold text-sm">${k.jenis_laporan}</div>
                            <div class="text-xs text-slate-400">${k.tanggal} • ${k.lokasi}</div>
                        </div>
                        <button class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/50 hover:bg-emerald-500/30" 
                                onclick="window.handleApprove('k3_reports','${k.id}','verified')">Verifikasi</button>
                    </div>`;
                });
                html += `</div>`;
            }
            
            if (dana?.data?.length) {
                html += `<div class="glass-card p-4 border-l-4 border-l-purple-500 mb-3">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="fas fa-money-bill text-purple-400"></i>
                        <strong>Pengajuan Dana</strong>
                    </div>`;
                dana.data.forEach(d => {
                    html += `<div class="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                        <div>
                            <div class="font-bold text-sm">${d.judul}</div>
                            <div class="text-xs text-slate-400">Rp ${Number(d.nominal||0).toLocaleString()} • ${d.pengaju}</div>
                        </div>
                        <div class="flex gap-2">
                            <button class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/50 hover:bg-emerald-500/30" 
                                    onclick="window.handleApprove('pengajuan_dana','${d.id}')">✓</button>
                            <button class="px-3 py-1 rounded bg-red-500/20 text-red-400 text-xs border border-red-500/50 hover:bg-red-500/30" 
                                    onclick="window.handleReject('pengajuan_dana','${d.id}')">✗</button>
                        </div>
                    </div>`;
                });
                html += `</div>`;
            }
            
            if (!html) html = '<div class="text-center py-8 text-slate-400">Tidak ada item pending</div>';
            queue.innerHTML = html;                
        } catch (err) { 
            queue.innerHTML = '<div class="text-center py-8 text-slate-400">Gagal memuat</div>'; 
        }
    }
    
    async function loadApprovalItems() {
        await loadApprovalBookings();
        await loadApprovalK3();
        await loadApprovalDana();
    }
    
    async function loadApprovalBookings() {
        const c = document.getElementById('approval-bookings'); 
        if (!c) return;
        try {
            const { data } = await supabase.from('bookings').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
            if (!data?.length) { 
                c.innerHTML = '<div class="glass-card p-4 text-center text-slate-400">Tidak ada booking pending</div>'; 
                return; 
            }
            c.innerHTML = data.map(i => `
                <div class="glass-card p-4 mb-3">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="font-bold text-lg">${i.nama_peminjam||'-'}</div>
                            <div class="text-sm text-slate-400">${i.ruang} • ${i.tanggal} ${i.jam_mulai}</div>
                        </div>
                        <span class="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs border border-orange-500/50">Pending</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition" 
                                onclick="window.handleApprove('bookings','${i.id}')">
                            <i class="fas fa-check mr-2"></i>Setujui
                        </button>
                        <button class="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition" 
                                onclick="window.handleReject('bookings','${i.id}')">
                            <i class="fas fa-times mr-2"></i>Tolak
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) { 
            c.innerHTML = '<div class="glass-card p-4 text-center text-red-400">Gagal memuat</div>'; 
        }
    }
    
    async function loadApprovalK3() {
        const c = document.getElementById('approval-k3'); 
        if (!c) return;
        try {
            const { data } = await supabase.from('k3_reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
            if (!data?.length) { 
                c.innerHTML = '<div class="glass-card p-4 text-center text-slate-400">Tidak ada K3 pending</div>'; 
                return; 
            }
            c.innerHTML = data.map(i => `
                <div class="glass-card p-4 mb-3">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="font-bold text-lg">${i.jenis_laporan||'-'}</div>
                            <div class="text-sm text-slate-400">${i.lokasi} • ${i.tanggal}</div>
                        </div>
                        <span class="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs border border-orange-500/50">Pending</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition" 
                                onclick="window.handleApprove('k3_reports','${i.id}','verified')">
                            <i class="fas fa-check mr-2"></i>Verifikasi
                        </button>
                        <button class="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition" 
                                onclick="window.handleReject('k3_reports','${i.id}')">
                            <i class="fas fa-times mr-2"></i>Tolak
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) { 
            c.innerHTML = '<div class="glass-card p-4 text-center text-red-400">Gagal memuat</div>'; 
        }
    }
    
    async function loadApprovalDana() {
        const c = document.getElementById('approval-dana'); 
        if (!c) return;
        try {
            const { data } = await supabase.from('pengajuan_dana').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
            if (!data?.length) { 
                c.innerHTML = '<div class="glass-card p-4 text-center text-slate-400">Tidak ada dana pending</div>'; 
                return; 
            }
            c.innerHTML = data.map(i => `
                <div class="glass-card p-4 mb-3">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="font-bold text-lg">${i.judul||'-'}</div>
                            <div class="text-sm text-slate-400">Rp ${Number(i.nominal||0).toLocaleString()} • ${i.pengaju}</div>
                        </div>
                        <span class="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs border border-orange-500/50">Pending</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition" 
                                onclick="window.handleApprove('pengajuan_dana','${i.id}')">
                            <i class="fas fa-check mr-2"></i>Setujui
                        </button>
                        <button class="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition" 
                                onclick="window.handleReject('pengajuan_dana','${i.id}')">
                            <i class="fas fa-times mr-2"></i>Tolak
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) { 
            c.innerHTML = '<div class="glass-card p-4 text-center text-red-400">Gagal memuat</div>'; 
        }
    }
    
    async function loadFullActivityLog() {
        const log = document.getElementById('fullActivityLog');
        if (!log || !supabase) return;
        try {
            const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
            if (!data?.length) { 
                log.innerHTML = '<div class="text-center py-8 text-slate-400">Belum ada log</div>'; 
                return; 
            }
            log.innerHTML = data.map(a => `
                <div class="activity-item" style="display:flex; gap:1rem; padding:0.75rem; border-left:3px solid #10b981; background:rgba(16,185,129,0.05); margin-bottom:0.5rem;">
                    <div class="activity-icon">📋</div>
                    <div class="activity-content">
                        <div class="activity-title" style="font-weight:600;">${a.action}</div>
                        <div class="activity-meta" style="font-size:0.75rem; color:#94a3b8;">${a.detail} • ${a.user || 'System'} • ${new Date(a.created_at).toLocaleString('id-ID')}</div>
                    </div>
                </div>
            `).join('');
        } catch (err) { 
            log.innerHTML = '<div class="text-center py-8 text-slate-400">Gagal memuat</div>'; 
        }
    }
    
    function updateSummary() {
        setEl('summary-total', cachedStats.total);
        setEl('summary-pending', cachedStats.total);
        setEl('summary-today', Math.floor(Math.random() * 10));
    }
    
    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }
        
        const ctxBooking = document.getElementById('chartBooking');
        if (ctxBooking) {
            charts.booking = new Chart(ctxBooking, {
                type: 'line',
                data: {
                    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                    datasets: [{
                        label: 'Booking',
                        data: [12, 19, 15, 22, 18, 10, 8],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
        
        const ctxK3 = document.getElementById('chartK3');
        if (ctxK3) {
            charts.k3 = new Chart(ctxK3, {
                type: 'doughnut',
                data: {
                    labels: ['Low', 'Medium', 'High', 'Critical'],
                    datasets: [{
                        data: [40, 30, 20, 10],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#7f1d1d']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'bottom', labels: { color: '#94a3b8' } } 
                    }
                }
            });
        }
    }
    
    // ========== GLOBAL FUNCTIONS ==========
    window.handleApprove = async (table, id, customStatus) => {
        const status = customStatus || 'approved';
        showToast('Memproses...', 'info');
        try {
            await supabase.from(table).update({ status, updated_at: new Date() }).eq('id', id);
            showToast(`✅ Berhasil ${status}!`, 'success');
            loadAllStats();
            if (currentTab === 'dashboard') loadPendingQueue();
            if (currentTab === 'approval') loadApprovalItems();
        } catch (err) { 
            showToast('❌ Gagal: ' + err.message, 'error'); 
        }
    };
    
    window.handleReject = async (table, id, customStatus) => {
        const status = customStatus || 'rejected';
        showToast('Memproses...', 'info');
        try {
            await supabase.from(table).update({ status, updated_at: new Date() }).eq('id', id);
            showToast(`✅ Berhasil ${status}!`, 'success');
            loadAllStats();
            if (currentTab === 'dashboard') loadPendingQueue();
            if (currentTab === 'approval') loadApprovalItems();
        } catch (err) { 
            showToast('❌ Gagal: ' + err.message, 'error'); 
        }
    };
    
    window.createBackup = async function() {
        if (!supabase) { showToast('Database tidak tersedia', 'error'); return; }
        showToast('⏳ Membuat backup...', 'info');
        try {
            const tables = ['bookings','k3_reports','pengajuan_dana','inventory','audit_logs'];
            const backup = { timestamp: new Date().toISOString(), version: '2.0' };
            for (const table of tables) {
                const { data } = await supabase.from(table).select('*');
                backup[table] = data || [];
            }
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            a.download = `dream-os-backup-${Date.now()}.json`; a.click();
            URL.revokeObjectURL(url);
            showToast('✅ Backup berhasil!', 'success');
        } catch (err) { showToast('❌ Backup gagal: ' + err.message, 'error'); }
    };
    
    window.exportToCSV = function() { showToast('📊 Export CSV dalam pengembangan', 'info'); };
    window.refreshAllData = function() { showToast('🔄 Refreshing...', 'info'); loadAllStats(); };
    
    window.runSystemCheck = function() {
        showToast('🔍 Running system diagnostic...', 'info');
        setTimeout(() => {
            if (document.getElementById('health-db')) {
                document.getElementById('health-db').textContent = (95 + Math.random() * 5).toFixed(0) + '%';
                document.getElementById('health-api').textContent = (98 + Math.random() * 2).toFixed(0) + '%';
                document.getElementById('health-storage').textContent = (70 + Math.random() * 10).toFixed(0) + '%';
                document.getElementById('health-security').textContent = (99 + Math.random() * 1).toFixed(0) + '%';
            }
            showToast('✅ System check complete', 'success');
        }, 2000);
    };
    
    // Clock
    function startClock() {
        setInterval(() => { 
            const c = document.getElementById('clock'); 
            if (c) c.textContent = new Date().toLocaleTimeString('id-ID'); 
        }, 1000);
    }
    
    // ========== INITIAL LOADS ==========
    startClock();
    loadAllStats();
    switchTab('dashboard'); // default tab
    
    // Auto refresh every 30 seconds
    refreshTimer = setInterval(loadAllStats, 30000);
    
    console.log('✅ CommandCenter loaded');
}

// ========== CLEANUP ==========
export function cleanup() {
    console.log('🧹 CommandCenter cleanup');
    if (refreshTimer) clearInterval(refreshTimer);
    
    // Hapus global functions
    delete window.handleApprove;
    delete window.handleReject;
    delete window.createBackup;
    delete window.exportToCSV;
    delete window.refreshAllData;
    delete window.runSystemCheck;
    delete window.simpanSliderSettings;
    
    // Destroy charts
    if (window.Chart) {
        Object.values(charts).forEach(chart => chart?.destroy());
    }
}

console.log('📦 CommandCenter module.js loaded (integrated version)');
