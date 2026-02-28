// modules/commandcenter/module.js
import { supabase } from '../../core/supabase.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/eventBus.js';
import { showToast } from '../../core/components.js';

console.log('[COMMANDCENTER] Modul dimuat');

// Konfigurasi tabel (bisa dipindah ke config jika perlu)
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

// State lokal modul
let cachedStats = {};
let currentTab = 'dashboard';
let refreshTimer = null;

// Utility untuk update elemen
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
        <button class="back-btn" onclick="window.dispatchEvent(new CustomEvent('close-module'))">
            <i class="fas fa-arrow-left"></i> <span>Kembali</span>
        </button>

        <!-- SHALAWAT SECTION -->
        <div class="shalawat-top">
            <p class="bismillah">بِسْمِ اللَّهِ</p>
            <p class="arabic text-lg text-emerald-400">اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ</p>
            <p class="text-[8px] text-white/30 tracking-[3px]">THE POWER SOUL OF SHALAWAT</p>
        </div>

        <!-- HEADER -->
        <div class="crystal-card">
            <div class="flex justify-between items-center flex-wrap gap-4">
                <div class="flex items-center gap-3">
                    <div class="text-3xl">🚀</div>
                    <div>
                        <h1 class="text-xl font-bold" style="color: var(--emerald);">Command Center <span class="text-white">v2.0</span></h1>
                        <p class="text-[8px] text-slate-400">Real-time Monitoring & Control</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <div class="text-sm text-slate-300" id="user-display">${store.get('user')?.role || 'Guest'}</div>
                        <div class="text-[10px] text-slate-400" id="clock">--:--:--</div>
                    </div>
                    <button onclick="window.logout()" class="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg text-xs transition">Logout</button>
                </div>
            </div>
        </div>

        <!-- AI INSIGHT -->
        <div class="crystal-card" style="background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%); border: 1px solid rgba(16,185,129,0.3);">
            <h3 class="text-lg font-bold mb-2 flex items-center gap-2">
                <i class="fas fa-brain text-emerald-400"></i> AI Insight
            </h3>
            <p id="aiMessage" class="text-sm" style="color: rgba(255,255,255,0.7);">
                <i class="fas fa-circle-notch spin mr-2"></i> Menganalisis...
            </p>
        </div>

        <!-- SECURITY STATUS -->
        <div class="crystal-card">
            <div style="font-size: 0.7rem; opacity: 0.5; text-align: right; margin-bottom: 0.5rem;">Sinkronisasi: <span id="lastSync">—</span></div>
            <h3 class="text-sm font-bold mb-3" style="opacity:0.6">Status Keamanan</h3>
            <div class="security-status status-safe" id="securityStatus">
                <i class="fas fa-shield-check mr-2"></i><span>AMAN</span>
            </div>
        </div>

        <!-- STATS GRID -->
        <div class="stats-grid">
            <div class="stat-box" onclick="window.goToModule('all')">
                <div class="stat-value" style="color: var(--blue);" id="stat-total">0</div>
                <div class="text-xs">Total Pending</div>
            </div>
            <div class="stat-box" onclick="window.goToModule('booking')">
                <div class="stat-value" style="color: var(--emerald);" id="stat-booking">0</div>
                <div class="text-xs">Booking</div>
            </div>
            <div class="stat-box" onclick="window.goToModule('k3')">
                <div class="stat-value" style="color: var(--orange);" id="stat-k3">0</div>
                <div class="text-xs">K3</div>
            </div>
            <div class="stat-box" onclick="window.goToModule('dana')">
                <div class="stat-value" style="color: var(--purple);" id="stat-dana">0</div>
                <div class="text-xs">Dana</div>
            </div>
            <div class="stat-box" onclick="window.goToModule('stok')">
                <div class="stat-value" style="color: var(--cyan);" id="stat-stok">0</div>
                <div class="text-xs">Stok</div>
            </div>
            <div class="stat-box" onclick="window.goToModule('maintenance')">
                <div class="stat-value" style="color: var(--orange);" id="stat-maintenance">0</div>
                <div class="text-xs">Maintenance</div>
            </div>
        </div>

        <!-- TABS -->
        <div class="tab-container flex gap-2 mb-6 overflow-x-auto">
            <button class="tab-btn active" data-tab="dashboard">📊 Dashboard</button>
            <button class="tab-btn" data-tab="kerja">🏢 R. Kerja</button>
            <button class="tab-btn" data-tab="dana">💰 Dana</button>
            <button class="tab-btn" data-tab="approval">✅ Approval</button>
            <button class="tab-btn" data-tab="files">📁 Files</button>
            <button class="tab-btn" data-tab="backup">💾 Backup</button>
        </div>

        <!-- SUBMENU -->
        <div id="submenu-container" class="submenu-grid"></div>

        <!-- CONTENT AREA -->
        <div id="content-area" class="content-area crystal-card">
            <div class="text-center py-8 opacity-60">
                <i class="fas fa-circle-notch spin text-2xl mb-3"></i>
                <p>Memuat...</p>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="text-center mt-6 mb-4">
            <p class="text-[8px] text-slate-500">Dream Team © 2026 | ISO 27001 • ISO 55001 • ISO 9001</p>
        </div>

        <!-- TOAST CONTAINER -->
        <div id="toast-container"></div>
    `;
}

// ========== FUNGSI UTAMA ==========
async function loadAllStats() {
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
        if (window.errorCollector) window.errorCollector.capture(err, 'CommandCenter');
    }
}

function updateSecurityStatus(total) {
    const status = document.getElementById('securityStatus');
    if (!status) return;
    status.className = 'security-status';
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

function renderSubmenu(tab) {
    const container = document.getElementById('submenu-container');
    if (!container) return;

    // Definisikan modul per tab (bisa juga diambil dari config)
    const modulesByTab = {
        dashboard: [
            { id: 'analytics', name: 'Analytics', icon: '📈' },
            { id: 'pengajuan', name: 'Pengajuan', icon: '📋' },
            { id: 'approval', name: 'Approval', icon: '✅' },
            { id: 'ai', name: 'AI', icon: '🤖' },
            { id: 'backup', name: 'Backup', icon: '💾' },
            { id: 'files', name: 'Files', icon: '📁' }
        ],
        kerja: [
            { id: 'booking', name: 'Booking', icon: '📅' },
            { id: 'k3', name: 'K3', icon: '⚠️' },
            { id: 'sekuriti', name: 'Sekuriti', icon: '🛡️' },
            { id: 'stok', name: 'Stok', icon: '📦' },
            { id: 'maintenance', name: 'Maintenance', icon: '🔧' },
            { id: 'asset', name: 'Asset', icon: '🏢' },
            { id: 'janitor-indoor', name: 'Janitor In', icon: '🧹' },
            { id: 'janitor-outdoor', name: 'Janitor Out', icon: '🌿' }
        ],
        dana: [
            { id: 'dana', name: 'Dana', icon: '💰' },
            { id: 'laporan', name: 'Laporan', icon: '📄' },
            { id: 'approval', name: 'Approval', icon: '✅' }
        ]
    };

    const modules = modulesByTab[tab] || [];
    container.innerHTML = modules.map(mod => {
        const badge = cachedStats[mod.id] ? `<span class="submenu-badge">${cachedStats[mod.id]}</span>` : '';
        return `<div class="submenu-item" onclick="window.goToModule('${mod.id}')">
            <span class="submenu-icon">${mod.icon}</span>
            <span class="submenu-name">${mod.name}</span>
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
                    <h4 class="text-sm font-bold mb-3">📋 Aktivitas Terbaru</h4>
                    <div id="activityFeed" class="space-y-2 max-h-40 overflow-y-auto">
                        <div class="text-center py-4 opacity-60">Memuat...</div>
                    </div>
                </div>
                <div>
                    <h4 class="text-sm font-bold mb-3">🔮 Prediksi AI</h4>
                    <ul id="predictiveList" class="space-y-2">
                        <li class="text-sm opacity-60">Menganalisis...</li>
                    </ul>
                </div>
            </div>
            <div class="mt-4">
                <h4 class="text-sm font-bold mb-3">📊 Kesehatan Sistem</h4>
                <!-- health items -->
            </div>
            <div class="flex gap-2 mt-4">
                <button class="btn-action" onclick="window.createBackup()"><i class="fas fa-download mr-2"></i>Backup</button>
                <button class="btn-action" onclick="window.exportToExcel()"><i class="fas fa-file-excel mr-2"></i>Excel</button>
            </div>
        `;
        loadRecentActivities();
    } else {
        content.innerHTML = `<p class="text-center py-8 opacity-60">Pilih submenu ${tab.toUpperCase()} untuk melihat detail</p>`;
    }
}

async function loadRecentActivities() {
    const feed = document.getElementById('activityFeed');
    if (!feed || !supabase) return;
    try {
        const { data } = await supabase.from('audit_logs').select('action, detail, created_at').order('created_at', { ascending: false }).limit(8);
        if (data && data.length) {
            feed.innerHTML = data.map(a => `
                <div class="activity-item">
                    <div style="width:8px;height:8px;border-radius:50%;background:#10b981;margin-top:4px;flex-shrink:0"></div>
                    <div class="flex-1">
                        <div class="text-sm font-bold">${a.action}</div>
                        <div class="text-xs opacity-60">${a.detail} • ${new Date(a.created_at).toLocaleString('id-ID')}</div>
                    </div>
                </div>
            `).join('');
        } else {
            feed.innerHTML = '<div class="text-center py-4 opacity-60">Belum ada aktivitas</div>';
        }
    } catch (err) {
        feed.innerHTML = '<div class="text-center py-4 opacity-60">Gagal memuat</div>';
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

// ========== INITIALIZATION ==========
export async function init() {
    console.log('[COMMANDCENTER] Initializing...');

    // Render HTML ke dalam module-content
    renderHTML();

    // Pasang fungsi-fungsi ke window agar bisa dipanggil dari HTML
    window.goToModule = (id) => {
        if (id === 'all') {
            showToast('Pilih modul spesifik');
            return;
        }
        // Panggil router untuk membuka modul lain
        import('../../core/router.js').then(r => r.loadModule(id));
    };

    window.logout = () => {
        store.clear();
        window.location.reload();
    };

    window.createBackup = async () => {
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
            showToast('✅ Backup berhasil!');
        } catch (err) {
            showToast('❌ Backup gagal: ' + err.message, 'error');
        }
    };

    window.exportToExcel = () => showToast('📊 Fitur Excel dalam pengembangan', 'info');

    // Mulai clock
    startClock();

    // Load data awal
    await loadAllStats();

    // Setup tab
    setupTabs();
    renderSubmenu('dashboard');
    renderContent('dashboard');

    // Auto refresh
    startAutoRefresh();

    // Listen event dari modul lain via eventBus
    eventBus.on('stats-update', loadAllStats);
    eventBus.on('booking-approved', (data) => {
        showToast(`✅ Booking ${data.id} disetujui`, 'success');
        loadAllStats();
    });

    console.log('[COMMANDCENTER] Siap!');
}

// Cleanup saat modul ditutup (opsional)
export function cleanup() {
    if (refreshTimer) clearInterval(refreshTimer);
    eventBus.off('stats-update', loadAllStats);
    eventBus.off('booking-approved');
    // Hapus fungsi dari window
    delete window.goToModule;
    delete window.logout;
    delete window.createBackup;
    delete window.exportToExcel;
}
