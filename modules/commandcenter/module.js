// modules/commandcenter/module.js
import { supabase } from '../../core/supabase.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/eventBus.js';
import { showToast } from '../../core/components.js';
import moduleConfig from '../../modules.config.js';  // <-- BARU: import konfigurasi modul

console.log('[COMMANDCENTER] Modul dimuat (dengan Module Registry)');

// Konfigurasi tabel
const TABLES = {
    bookings: 'bookings',
    k3: 'k3_reports',
    maintenance: 'maintenance_tasks',
    inventory: 'inventory',
    dana: 'pengajuan_dana',
    gudang: 'gudang_stok',
    audit_logs: 'audit_logs',
    janitor_indoor: 'janitor_indoor',
    janitor_outdoor: 'janitor_outdoor'
};

// State lokal
let cachedStats = {};
let currentTab = 'dashboard';
let refreshTimer = null;

// Utility update elemen
function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <!-- BACK BUTTON -->
        <button class="back-btn" onclick="window.doCloseModule()">
            <i class="fas fa-arrow-left"></i> <span>Kembali</span>
        </button>

        <!-- SHALAWAT SECTION -->
        <div class="shalawat-top text-center mb-4">
            <p class="arabic text-2xl text-emerald-400 mb-2 crystal-text">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <p class="arabic text-xl text-emerald-300 mb-1 crystal-text">اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ</p>
            <p class="text-xs tracking-[4px] text-slate-400 crystal-text">THE POWER SOUL OF SHALAWAT</p>
        </div>

        <!-- HEADER -->
        <div class="glass-card p-4 mb-4 flex flex-wrap justify-between items-center gap-2">
            <div class="flex items-center gap-3">
                <div class="text-3xl crystal-icon w-10 h-10">🚀</div>
                <div>
                    <h1 class="text-xl font-bold crystal-text">Command Center <span class="text-emerald-400">v2.0</span></h1>
                    <p class="text-[8px] text-slate-400 crystal-text">Real-time Monitoring & Control</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-right">
                    <div class="text-sm text-slate-300 crystal-text" id="user-display">${store.get('user')?.role || 'Guest'}</div>
                    <div class="text-[10px] text-slate-400 crystal-text" id="clock">--:--:--</div>
                </div>
                <button onclick="window.doLogout()" class="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg text-xs crystal-text">Logout</button>
            </div>
        </div>

        <!-- AI INSIGHT -->
        <div class="glass-card p-4 mb-4" style="background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%); border: 1px solid rgba(16,185,129,0.3);">
            <h3 class="text-lg font-bold mb-2 flex items-center gap-2 crystal-text">
                <i class="fas fa-brain text-emerald-400"></i> AI Insight
            </h3>
            <p id="aiMessage" class="text-sm crystal-text" style="color: rgba(255,255,255,0.7);">
                <i class="fas fa-circle-notch spin mr-2"></i> Menganalisis...
            </p>
        </div>

        <!-- SECURITY STATUS -->
        <div class="glass-card p-4 mb-4">
            <div class="text-[10px] opacity-50 text-right mb-2 crystal-text">Sinkronisasi: <span id="lastSync">—</span></div>
            <h3 class="text-sm font-bold mb-3 crystal-text">Status Keamanan</h3>
            <div class="security-status status-safe" id="securityStatus">
                <i class="fas fa-shield-check mr-2"></i><span>AMAN</span>
            </div>
        </div>

        <!-- STATS GRID -->
        <div class="stats-grid grid grid-cols-3 gap-2 mb-4">
            <div class="stat-box crystal-text" onclick="window.loadModule('all')">
                <div class="stat-value text-2xl font-bold text-blue-400" id="stat-total">0</div>
                <div class="text-xs">Total Pending</div>
            </div>
            <div class="stat-box crystal-text" onclick="window.loadModule('booking')">
                <div class="stat-value text-2xl font-bold text-emerald-400" id="stat-booking">0</div>
                <div class="text-xs">Booking</div>
            </div>
            <div class="stat-box crystal-text" onclick="window.loadModule('k3')">
                <div class="stat-value text-2xl font-bold text-orange-400" id="stat-k3">0</div>
                <div class="text-xs">K3</div>
            </div>
            <div class="stat-box crystal-text" onclick="window.loadModule('dana')">
                <div class="stat-value text-2xl font-bold text-purple-400" id="stat-dana">0</div>
                <div class="text-xs">Dana</div>
            </div>
            <div class="stat-box crystal-text" onclick="window.loadModule('stok')">
                <div class="stat-value text-2xl font-bold text-cyan-400" id="stat-stok">0</div>
                <div class="text-xs">Stok</div>
            </div>
            <div class="stat-box crystal-text" onclick="window.loadModule('maintenance')">
                <div class="stat-value text-2xl font-bold text-orange-400" id="stat-maintenance">0</div>
                <div class="text-xs">Maintenance</div>
            </div>
        </div>

        <!-- TABS -->
        <div class="tab-container flex gap-2 mb-4 overflow-x-auto">
            <button class="tab-btn active crystal-text" data-tab="dashboard">📊 Dashboard</button>
            <button class="tab-btn crystal-text" data-tab="kerja">🏢 R. Kerja</button>
            <button class="tab-btn crystal-text" data-tab="dana">💰 Dana</button>
            <button class="tab-btn crystal-text" data-tab="approval">✅ Approval</button>
            <button class="tab-btn crystal-text" data-tab="files">📁 Files</button>
            <button class="tab-btn crystal-text" data-tab="backup">💾 Backup</button>
        </div>

        <!-- SUBMENU (dinamis dari konfigurasi) -->
        <div id="submenu-container" class="submenu-grid grid grid-cols-3 gap-2 mb-4"></div>

        <!-- CONTENT AREA -->
        <div id="content-area" class="content-area glass-card p-4">
            <div class="text-center py-8 opacity-60 crystal-text">
                <i class="fas fa-circle-notch spin text-2xl mb-3"></i>
                <p>Memuat...</p>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="text-center mt-6 mb-4">
            <p class="text-[8px] text-slate-500 crystal-text">Dream Team © 2026 | ISO 27001 • ISO 55001 • ISO 9001</p>
        </div>

        <!-- TOAST CONTAINER -->
        <div id="toast-container"></div>
    `;
}

// ========== FUNGSI UTAMA ==========
async function loadAllStats() {
    if (!supabase) {
        console.warn('Supabase not available');
        return;
    }
    try {
        const [booking, k3, dana, maintenance] = await Promise.all([
            supabase.from(TABLES.bookings).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from(TABLES.k3).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from(TABLES.dana).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from(TABLES.maintenance).select('*', { count: 'exact', head: true }).in('status', ['pending', 'proses'])
        ]);

        cachedStats = {
            booking: booking.count || 0,
            k3: k3.count || 0,
            dana: dana.count || 0,
            maintenance: maintenance.count || 0,
            total: (booking.count||0) + (k3.count||0) + (dana.count||0) + (maintenance.count||0)
        };

        setEl('stat-total', cachedStats.total);
        setEl('stat-booking', cachedStats.booking);
        setEl('stat-k3', cachedStats.k3);
        setEl('stat-dana', cachedStats.dana);
        setEl('stat-maintenance', cachedStats.maintenance);

        updateSecurityStatus(cachedStats.total);
        generateAIInsights();
        setEl('lastSync', new Date().toLocaleTimeString('id-ID'));
        renderSubmenu(currentTab);
    } catch (err) {
        console.error('[COMMANDCENTER] loadAllStats error:', err);
        showToast('Gagal memuat statistik', 'error');
    }
}

function updateSecurityStatus(total) {
    const status = document.getElementById('securityStatus');
    if (!status) return;
    status.className = 'security-status crystal-text';
    if (total === 0) {
        status.classList.add('status-safe');
        status.innerHTML = '<i class="fas fa-shield-check mr-2"></i><span>AMAN</span>';
    } else if (total < 10) {
        status.classList.add('status-warning');
        status.innerHTML = '<i class="fas fa-triangle-exclamation mr-2"></i><span>WASPADA</span>';
    } else {
        status.classList.add('status-danger');
        status.innerHTML = '<i class="fas fa-circle-exclamation mr-2"></i><span>BAHAYA</span>';
    }
}

function generateAIInsights() {
    const aiMsg = document.getElementById('aiMessage');
    if (!aiMsg) return;
    const insights = [];
    if (cachedStats.booking > 5) insights.push('📈 Booking tinggi');
    if (cachedStats.k3 > 3) insights.push('⚠️ Review K3');
    if (cachedStats.dana > 5) insights.push('💰 Dana pending');
    if (cachedStats.stok > 0) insights.push('📦 Stok menipis');
    if (insights.length === 0) insights.push('✅ Semua optimal');
    aiMsg.innerHTML = insights.join(' | ');
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            renderSubmenu(currentTab);
            renderContent(currentTab);
        });
    });
}

// ========== SUBMENU DINAMIS DARI KONFIGURASI ==========
function renderSubmenu(tab) {
    const container = document.getElementById('submenu-container');
    if (!container) return;

    const modules = moduleConfig[tab] || [];
    container.innerHTML = modules.map(mod => {
        const badge = cachedStats[mod.id] ? `<span class="submenu-badge">${cachedStats[mod.id]}</span>` : '';
        return `<div class="module-card crystal-text" onclick="window.loadModule('${mod.id}')">
            <div class="crystal-icon">${mod.icon}</div>
            <div class="text-xs font-bold">${mod.name}</div>
            ${badge}
        </div>`;
    }).join('');
}

function renderContent(tab) {
    const content = document.getElementById('content-area');
    if (!content) return;
    if (tab === 'dashboard') {
        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <h4 class="text-sm font-bold mb-3 crystal-text">📋 Aktivitas Terbaru</h4>
                    <div id="activityFeed" class="space-y-2 max-h-40 overflow-y-auto"></div>
                </div>
                <div>
                    <h4 class="text-sm font-bold mb-3 crystal-text">🔮 Prediksi AI</h4>
                    <ul id="predictiveList" class="space-y-2">
                        <li class="text-sm opacity-60 crystal-text">Menganalisis...</li>
                    </ul>
                </div>
            </div>
            <div class="flex gap-2 mt-4">
                <button class="btn-crystal crystal-text" onclick="window.createBackup()"><i class="fas fa-download mr-2"></i>Backup</button>
                <button class="btn-crystal crystal-text" onclick="window.exportToExcel()"><i class="fas fa-file-excel mr-2"></i>Excel</button>
            </div>
        `;
        loadRecentActivities();
    } else {
        content.innerHTML = `<p class="text-center py-8 opacity-60 crystal-text">Pilih submenu ${tab.toUpperCase()} untuk melihat detail</p>`;
    }
}

async function loadRecentActivities() {
    if (!supabase) return;
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    try {
        const { data } = await supabase.from('audit_logs').select('action, detail, created_at').order('created_at', { ascending: false }).limit(8);
        if (data && data.length) {
            feed.innerHTML = data.map(a => `
                <div class="activity-item flex gap-2 items-start">
                    <div style="width:8px;height:8px;border-radius:50%;background:#10b981;margin-top:4px;flex-shrink:0"></div>
                    <div class="flex-1">
                        <div class="text-sm font-bold crystal-text">${a.action}</div>
                        <div class="text-xs opacity-60 crystal-text">${a.detail} • ${new Date(a.created_at).toLocaleString('id-ID')}</div>
                    </div>
                </div>
            `).join('');
        } else {
            feed.innerHTML = '<div class="text-center py-4 opacity-60 crystal-text">Belum ada aktivitas</div>';
        }
    } catch (err) {
        feed.innerHTML = '<div class="text-center py-4 opacity-60 crystal-text">Gagal memuat</div>';
    }
}

function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(loadAllStats, 30000);
}

function startClock() {
    setInterval(() => {
        const clock = document.getElementById('clock');
        if (clock) clock.textContent = new Date().toLocaleTimeString('id-ID');
    }, 1000);
}

// ========== FUNGSI GLOBAL ==========
window.createBackup = async () => {
    if (!supabase) {
        showToast('Database tidak tersedia', 'error');
        return;
    }
    showToast('⏳ Membuat backup...');
    try {
        const tables = ['bookings', 'k3_reports', 'pengajuan_dana', 'inventory'];
        const backup = { timestamp: new Date().toISOString() };
        for (const table of tables) {
            const { data } = await supabase.from(table).select('*');
            backup[table] = data || [];
        }
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dream-os-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Backup berhasil!', 'success');
    } catch (err) {
        showToast('❌ Backup gagal: ' + err.message, 'error');
    }
};

window.exportToExcel = () => showToast('📊 Fitur Excel dalam pengembangan', 'info');

// ========== INIT ==========
export async function init() {
    console.log('[COMMANDCENTER] Initializing...');

    renderHTML();
    startClock();
    await loadAllStats();
    setupTabs();
    renderSubmenu('dashboard');
    renderContent('dashboard');
    startAutoRefresh();

    // Listen events
    eventBus.on('stats-update', loadAllStats);
    eventBus.on('booking-approved', (data) => {
        showToast(`✅ Booking ${data.id} disetujui`, 'success');
        loadAllStats();
    });

    console.log('[COMMANDCENTER] Siap!');
}

// Cleanup
export function cleanup() {
    if (refreshTimer) clearInterval(refreshTimer);
    eventBus.off('stats-update', loadAllStats);
    eventBus.off('booking-approved');
    delete window.createBackup;
    delete window.exportToExcel;
}
