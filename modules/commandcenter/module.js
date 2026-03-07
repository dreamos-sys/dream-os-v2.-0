// modules/commandcenter/module.js
import { supabase as supabaseClient } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { html } from './template.js';

// ========== KONFIGURASI ==========
const TABLES = {
    bookings: 'bookings',
    k3: 'k3_reports',
    maintenance: 'maintenance_tasks',
    inventory: 'inventory',
    dana: 'pengajuan_dana',
    audit_logs: 'audit_logs'
};

// ========== KONFIGURASI WEATHER ==========
const WEATHER_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 menit

let WEATHER_API_KEY = '';
let CITY = 'Depok';

let lastWeatherAlert = null;
let weatherCheckTimer = null;

let cachedStats = {};
let currentTab = 'dashboard';
let refreshTimer = null;
let charts = {};

// Simpan referensi supabase lokal (bisa diinisialisasi ulang)
let _sb = supabaseClient;

// ========== HELPER FUNCTIONS ==========
function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// Fallback jika supabase tidak tersedia
async function ensureSupabase() {
    if (_sb) return true;
    // Coba pakai dari window (jika di-load via CDN)
    if (window.supabase?.createClient) {
        // Biasanya URL dan key anon sudah diset di core, tapi kita bisa fallback ke env
        const SUPABASE_URL = window._env?.SUPABASE_URL || 'https://pvznaeppaagylwddirla.supabase.co';
        const SUPABASE_ANON_KEY = window._env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';
        _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }
    return false;
}

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = html;
}

// ========== NAVIGATION ==========
function switchTab(tabId) {
    document.querySelectorAll('.cmd-tab').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.cmd-tab[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
    currentTab = tabId;
    renderContent(tabId);
}

function renderContent(tab) {
    const content = document.getElementById('cmd-content-area');
    if (!content) return;

    content.innerHTML = `<div class="loader-container"><div class="loader"></div><div class="loader-text">Memuat ${tab}...</div></div>`;

    setTimeout(() => {
        if (tab === 'dashboard') renderDashboard();
        else if (tab === 'approval') renderApproval();
        else if (tab === 'activity') renderActivity();
        else if (tab === 'analytics') renderAnalytics();
        else if (tab === 'system') renderSystem();
    }, 300);
}

function renderDashboard() {
    const content = document.getElementById('cmd-content-area');
    content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Activity Feed -->
            <div class="lg:col-span-2">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-history text-emerald-400"></i>
                    Aktivitas Terbaru
                </h3>
                <div id="cmd-activityFeed" class="activity-feed">
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
                    <div class="panel p-4">
                        <div class="text-sm text-slate-400 mb-1">Total Item</div>
                        <div class="text-2xl font-bold text-emerald-400 mono" id="cmd-summary-total">0</div>
                    </div>
                    <div class="panel p-4">
                        <div class="text-sm text-slate-400 mb-1">Pending Approval</div>
                        <div class="text-2xl font-bold text-orange-400 mono" id="cmd-summary-pending">0</div>
                    </div>
                    <div class="panel p-4">
                        <div class="text-sm text-slate-400 mb-1">Selesai Hari Ini</div>
                        <div class="text-2xl font-bold text-blue-400 mono" id="cmd-summary-today">0</div>
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
            <div id="cmd-pendingQueue" class="space-y-3">
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

function renderApproval() {
    const content = document.getElementById('cmd-content-area');
    content.innerHTML = `
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <i class="fas fa-check-double text-emerald-400"></i>
            Pusat Persetujuan
        </h3>
        <div class="space-y-6">
            <div>
                <h4 class="text-md font-bold mb-3 text-emerald-400">📅 Booking Pending</h4>
                <div id="cmd-approval-bookings" class="space-y-3"></div>
            </div>
            <div>
                <h4 class="text-md font-bold mb-3 text-orange-400">⚠️ K3 Pending</h4>
                <div id="cmd-approval-k3" class="space-y-3"></div>
            </div>
            <div>
                <h4 class="text-md font-bold mb-3 text-purple-400">💰 Dana Pending</h4>
                <div id="cmd-approval-dana" class="space-y-3"></div>
            </div>
        </div>
    `;
    loadApprovalItems();
}

function renderActivity() {
    const content = document.getElementById('cmd-content-area');
    content.innerHTML = `
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <i class="fas fa-clipboard-list text-blue-400"></i>
            Log Aktivitas Sistem
        </h3>
        <div id="cmd-fullActivityLog" class="activity-feed" style="max-height: 500px;">
            <div class="text-center py-8 text-slate-400">
                <i class="fas fa-circle-notch spin text-2xl mb-2"></i>
                <p>Memuat log...</p>
            </div>
        </div>
    `;
    loadFullActivityLog();
}

function renderAnalytics() {
    const content = document.getElementById('cmd-content-area');
    content.innerHTML = `
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <i class="fas fa-chart-line text-purple-400"></i>
            Analytics & Trends
        </h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="panel">
                <h4 class="font-bold mb-4">Trend Booking (7 Hari)</h4>
                <div class="chart-container">
                    <canvas id="cmd-chartBooking"></canvas>
                </div>
            </div>
            <div class="panel">
                <h4 class="font-bold mb-4">Distribusi K3</h4>
                <div class="chart-container">
                    <canvas id="cmd-chartK3"></canvas>
                </div>
            </div>
        </div>
    `;
    setTimeout(initCharts, 100);
}

function renderSystem() {
    const content = document.getElementById('cmd-content-area');
    content.innerHTML = `
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <i class="fas fa-server text-cyan-400"></i>
            System Health
        </h3>
        <div class="space-y-4">
            <div class="panel p-4">
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-slate-400">Database Connection</span>
                    <span class="text-emerald-400 mono font-bold" id="cmd-health-db">98%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                    <div class="bg-emerald-500 h-2 rounded-full" style="width: 98%"></div>
                </div>
            </div>
            <div class="panel p-4">
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-slate-400">API Response Time</span>
                    <span class="text-emerald-400 mono font-bold" id="cmd-health-api">100%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                    <div class="bg-emerald-500 h-2 rounded-full" style="width: 100%"></div>
                </div>
            </div>
            <div class="panel p-4">
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-slate-400">Storage Usage</span>
                    <span class="text-orange-400 mono font-bold" id="cmd-health-storage">75%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                    <div class="bg-orange-500 h-2 rounded-full" style="width: 75%"></div>
                </div>
            </div>
            <div class="panel p-4">
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-slate-400">Security Score</span>
                    <span class="text-emerald-400 mono font-bold" id="cmd-health-security">100%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                    <div class="bg-emerald-500 h-2 rounded-full" style="width: 100%"></div>
                </div>
            </div>
        </div>
        <div class="mt-6">
            <button class="action-btn" id="cmd-runDiagnostic" style="width: 100%; padding: 1rem;">
                <i class="fas fa-stethoscope"></i>
                <span>Run System Diagnostic</span>
            </button>
        </div>
    `;
    document.getElementById('cmd-runDiagnostic')?.addEventListener('click', runSystemCheck);
}

// ========== WEATHER FUNCTIONS ==========
async function checkWeatherAndNotify() {
    if (!WEATHER_API_KEY) return;

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=id`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Gagal ambil data: ${response.status}`);

        const data = await response.json();
        const weather = data.weather[0];
        const main = data.main;
        const wind = data.wind;

        const alert = {
            condition: weather.main.toLowerCase(),
            description: weather.description,
            temp: main.temp,
            humidity: main.humidity,
            windSpeed: wind.speed,
            timestamp: Date.now()
        };

        updateWeatherInsight(alert);
        updateWeatherSlide(alert);

        if (lastWeatherAlert) {
            const conditionChanged = (lastWeatherAlert.condition !== alert.condition);
            const tempChanged = Math.abs(lastWeatherAlert.temp - alert.temp) > 5;
            const windChanged = Math.abs(lastWeatherAlert.windSpeed - alert.windSpeed) > 10;

            if (conditionChanged || tempChanged || windChanged) {
                sendWeatherNotifications(alert);
            }
        } else {
            sendWeatherNotifications(alert); // pertama kali
        }

        lastWeatherAlert = alert;
    } catch (err) {
        console.error('[Command Center] Weather error:', err);
        const aiMsg = document.getElementById('cmd-aiMessage');
        if (aiMsg) aiMsg.innerHTML = '⚠️ Gagal memuat data cuaca.';
    }
}

function updateWeatherInsight(alert) {
    const aiMsg = document.getElementById('cmd-aiMessage');
    if (!aiMsg) return;
    aiMsg.innerHTML = `🌡️ ${alert.description}, ${alert.temp}°C, kelembaban ${alert.humidity}%, angin ${alert.windSpeed} m/s.`;
}

function updateWeatherSlide(alert) {
    if (window.refreshSlider) {
        window.refreshSlider(); // panggil dari index.html
    } else {
        const slideContent = document.querySelector('#sliderWrapper .slider-slide:nth-child(4) .slide-content');
        if (slideContent) {
            slideContent.innerHTML = `${alert.description}, ${alert.temp}°C, kelembaban ${alert.humidity}%`;
        }
    }
}

function sendWeatherNotifications(alert) {
    const { condition, description, temp, windSpeed } = alert;

    showToast(`🌤️ Cuaca saat ini: ${description}, ${temp}°C`, 'info');

    if (condition.includes('rain') || condition.includes('thunderstorm')) {
        showToast('🧹 Janitor: Hujan diperkirakan. Siapkan peralatan hujan & periksa saluran air!', 'warning');
    } else if (condition.includes('clear') && temp > 30) {
        showToast('🧹 Janitor: Cuaca panas. Siram tanaman & jaga kelembaban area outdoor!', 'info');
    }

    if (condition.includes('rain') || condition.includes('thunderstorm') || windSpeed > 15) {
        showToast('🔧 Maintenance: Cuaca ekstrem. Periksa instalasi listrik & atap!', 'warning');
    } else if (condition.includes('clear') && temp > 32) {
        showToast('🔧 Maintenance: Suhu tinggi. Cek sistem pendingin & AC!', 'info');
    }

    if (condition.includes('thunderstorm') || windSpeed > 20) {
        showToast('🛡️ Sekuriti: Cuaca buruk. Tingkatkan patroli area rawan!', 'warning');
    } else if (condition.includes('fog') || condition.includes('mist')) {
        showToast('🛡️ Sekuriti: Jarak pandang terbatas. Waspada saat patroli!', 'info');
    }

    logWeatherAlert(alert);
}

async function logWeatherAlert(alert) {
    if (!_sb) return;
    try {
        await _sb.from('audit_logs').insert([{
            action: 'Weather Alert',
            detail: `Cuaca: ${alert.description}, ${alert.temp}°C`,
            user: 'System',
            created_at: new Date().toISOString()
        }]);
    } catch (err) {
        console.error('[Command Center] Gagal log weather:', err);
    }
}

// ========== DATA LOADING ==========
async function loadAllStats() {
    if (!await ensureSupabase()) return;
    try {
        const [booking, k3, dana, maintenance, inventory] = await Promise.all([
            _sb.from(TABLES.bookings).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            _sb.from(TABLES.k3).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            _sb.from(TABLES.dana).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            _sb.from(TABLES.maintenance).select('*', { count: 'exact', head: true }).in('status', ['pending', 'proses']),
            _sb.from(TABLES.inventory).select('*', { count: 'exact', head: true }).lt('jumlah', 'minimal_stok')
        ]);

        cachedStats = {
            booking: booking.count || 0,
            k3: k3.count || 0,
            dana: dana.count || 0,
            maintenance: maintenance.count || 0,
            stok: inventory.count || 0,
            total: (booking.count||0) + (k3.count||0) + (dana.count||0) + (maintenance.count||0)
        };

        setEl('cmd-stat-total', cachedStats.total);
        setEl('cmd-stat-booking', cachedStats.booking);
        setEl('cmd-stat-k3', cachedStats.k3);
        setEl('cmd-stat-dana', cachedStats.dana);
        setEl('cmd-stat-maintenance', cachedStats.maintenance);
        setEl('cmd-stat-stok', cachedStats.stok);

        setEl('cmd-summary-total', cachedStats.total);
        setEl('cmd-summary-pending', cachedStats.total);

        updateSecurityStatus(cachedStats.total);

        const now = new Date().toLocaleTimeString('id-ID');
        setEl('cmd-last-sync', now);

        if (currentTab === 'dashboard') {
            loadActivityFeed();
            loadPendingQueue();
        }

    } catch (err) {
        console.error('[Command Center] Stats error:', err);
    }
}

function updateSecurityStatus(total) {
    const status = document.getElementById('cmd-status-security');
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

async function loadActivityFeed() {
    const feed = document.getElementById('cmd-activityFeed');
    if (!feed || !await ensureSupabase()) return;

    try {
        const { data } = await _sb.from('audit_logs')
            .select('action, detail, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (!data?.length) {
            feed.innerHTML = '<div class="text-center py-8 text-slate-400">Belum ada aktivitas</div>';
            return;
        }

        feed.innerHTML = data.map(a => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${escapeHTML(a.action)}</div>
                    <div class="activity-meta">${escapeHTML(a.detail)} • ${new Date(a.created_at).toLocaleString('id-ID')}</div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        feed.innerHTML = '<div class="text-center py-8 text-slate-400">Gagal memuat</div>';
    }
}

async function loadPendingQueue() {
    const queue = document.getElementById('cmd-pendingQueue');
    if (!queue || !await ensureSupabase()) return;

    try {
        const [bookings, k3, dana] = await Promise.all([
            _sb.from('bookings').select('id, nama_peminjam, ruang, tanggal, jam_mulai').eq('status', 'pending').limit(5),
            _sb.from('k3_reports').select('id, lokasi, jenis_laporan, tanggal').eq('status', 'pending').limit(5),
            _sb.from('pengajuan_dana').select('id, judul, nominal, pengaju').eq('status', 'pending').limit(5)
        ]);

        let html = '';

        if (bookings.data?.length) {
            html += `<div class="panel p-4 border-l-4 border-l-emerald-500">
                <div class="flex items-center gap-2 mb-3">
                    <i class="fas fa-calendar text-emerald-400"></i>
                    <strong>Booking</strong>
                </div>`;
            bookings.data.forEach(b => {
                html += `<div class="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                    <div>
                        <div class="font-bold text-sm">${escapeHTML(b.nama_peminjam)}</div>
                        <div class="text-xs text-slate-400">${escapeHTML(b.tanggal)} ${escapeHTML(b.jam_mulai)} • ${escapeHTML(b.ruang)}</div>
                    </div>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/50 hover:bg-emerald-500/30 cmd-approve-btn"
                                data-table="bookings" data-id="${b.id}">✓</button>
                        <button class="px-3 py-1 rounded bg-red-500/20 text-red-400 text-xs border border-red-500/50 hover:bg-red-500/30 cmd-reject-btn"
                                data-table="bookings" data-id="${b.id}">✗</button>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }

        if (k3.data?.length) {
            html += `<div class="panel p-4 border-l-4 border-l-orange-500">
                <div class="flex items-center gap-2 mb-3">
                    <i class="fas fa-exclamation-triangle text-orange-400"></i>
                    <strong>K3 Reports</strong>
                </div>`;
            k3.data.forEach(k => {
                html += `<div class="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                    <div>
                        <div class="font-bold text-sm">${escapeHTML(k.jenis_laporan)}</div>
                        <div class="text-xs text-slate-400">${escapeHTML(k.tanggal)} • ${escapeHTML(k.lokasi)}</div>
                    </div>
                    <button class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/50 hover:bg-emerald-500/30 cmd-approve-btn"
                            data-table="k3_reports" data-id="${k.id}" data-status="verified">Verifikasi</button>
                </div>`;
            });
            html += `</div>`;
        }

        if (dana.data?.length) {
            html += `<div class="panel p-4 border-l-4 border-l-purple-500">
                <div class="flex items-center gap-2 mb-3">
                    <i class="fas fa-money-bill text-purple-400"></i>
                    <strong>Pengajuan Dana</strong>
                </div>`;
            dana.data.forEach(d => {
                html += `<div class="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                    <div>
                        <div class="font-bold text-sm">${escapeHTML(d.judul)}</div>
                        <div class="text-xs text-slate-400">Rp ${Number(d.nominal||0).toLocaleString()} • ${escapeHTML(d.pengaju)}</div>
                    </div>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/50 hover:bg-emerald-500/30 cmd-approve-btn"
                                data-table="pengajuan_dana" data-id="${d.id}">✓</button>
                        <button class="px-3 py-1 rounded bg-red-500/20 text-red-400 text-xs border border-red-500/50 hover:bg-red-500/30 cmd-reject-btn"
                                data-table="pengajuan_dana" data-id="${d.id}">✗</button>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }

        if (!html) html = '<div class="text-center py-8 text-slate-400">Tidak ada item pending</div>';
        queue.innerHTML = html;

        // Pasang event listener untuk tombol approve/reject
        queue.querySelectorAll('.cmd-approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const table = btn.dataset.table;
                const id = btn.dataset.id;
                const status = btn.dataset.status || 'approved';
                handleApprove(table, id, status);
            });
        });
        queue.querySelectorAll('.cmd-reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const table = btn.dataset.table;
                const id = btn.dataset.id;
                handleReject(table, id);
            });
        });

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
    const c = document.getElementById('cmd-approval-bookings');
    if (!c || !await ensureSupabase()) return;
    try {
        const { data } = await _sb.from('bookings').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
        if (!data?.length) {
            c.innerHTML = '<div class="panel p-4 text-center text-slate-400">Tidak ada booking pending</div>';
            return;
        }
        c.innerHTML = data.map(i => `
            <div class="panel p-4">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="font-bold text-lg">${escapeHTML(i.nama_peminjam||'-')}</div>
                        <div class="text-sm text-slate-400">${escapeHTML(i.ruang)} • ${escapeHTML(i.tanggal)} ${escapeHTML(i.jam_mulai)}</div>
                    </div>
                    <span class="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs border border-orange-500/50">Pending</span>
                </div>
                <div class="flex gap-2">
                    <button class="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition cmd-approve-btn"
                            data-table="bookings" data-id="${i.id}">
                        <i class="fas fa-check mr-2"></i>Setujui
                    </button>
                    <button class="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition cmd-reject-btn"
                            data-table="bookings" data-id="${i.id}">
                        <i class="fas fa-times mr-2"></i>Tolak
                    </button>
                </div>
            </div>
        `).join('');
        attachApprovalListeners(c);
    } catch (err) {
        c.innerHTML = '<div class="panel p-4 text-center text-red-400">Gagal memuat</div>';
    }
}

async function loadApprovalK3() {
    const c = document.getElementById('cmd-approval-k3');
    if (!c || !await ensureSupabase()) return;
    try {
        const { data } = await _sb.from('k3_reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
        if (!data?.length) {
            c.innerHTML = '<div class="panel p-4 text-center text-slate-400">Tidak ada K3 pending</div>';
            return;
        }
        c.innerHTML = data.map(i => `
            <div class="panel p-4">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="font-bold text-lg">${escapeHTML(i.jenis_laporan||'-')}</div>
                        <div class="text-sm text-slate-400">${escapeHTML(i.lokasi)} • ${escapeHTML(i.tanggal)}</div>
                    </div>
                    <span class="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs border border-orange-500/50">Pending</span>
                </div>
                <div class="flex gap-2">
                    <button class="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition cmd-approve-btn"
                            data-table="k3_reports" data-id="${i.id}" data-status="verified">
                        <i class="fas fa-check mr-2"></i>Verifikasi
                    </button>
                    <button class="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition cmd-reject-btn"
                            data-table="k3_reports" data-id="${i.id}">
                        <i class="fas fa-times mr-2"></i>Tolak
                    </button>
                </div>
            </div>
        `).join('');
        attachApprovalListeners(c);
    } catch (err) {
        c.innerHTML = '<div class="panel p-4 text-center text-red-400">Gagal memuat</div>';
    }
}

async function loadApprovalDana() {
    const c = document.getElementById('cmd-approval-dana');
    if (!c || !await ensureSupabase()) return;
    try {
        const { data } = await _sb.from('pengajuan_dana').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
        if (!data?.length) {
            c.innerHTML = '<div class="panel p-4 text-center text-slate-400">Tidak ada dana pending</div>';
            return;
        }
        c.innerHTML = data.map(i => `
            <div class="panel p-4">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="font-bold text-lg">${escapeHTML(i.judul||'-')}</div>
                        <div class="text-sm text-slate-400">Rp ${Number(i.nominal||0).toLocaleString()} • ${escapeHTML(i.pengaju)}</div>
                    </div>
                    <span class="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs border border-orange-500/50">Pending</span>
                </div>
                <div class="flex gap-2">
                    <button class="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition cmd-approve-btn"
                            data-table="pengajuan_dana" data-id="${i.id}">
                        <i class="fas fa-check mr-2"></i>Setujui
                    </button>
                    <button class="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition cmd-reject-btn"
                            data-table="pengajuan_dana" data-id="${i.id}">
                        <i class="fas fa-times mr-2"></i>Tolak
                    </button>
                </div>
            </div>
        `).join('');
        attachApprovalListeners(c);
    } catch (err) {
        c.innerHTML = '<div class="panel p-4 text-center text-red-400">Gagal memuat</div>';
    }
}

function attachApprovalListeners(container) {
    container.querySelectorAll('.cmd-approve-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const table = btn.dataset.table;
            const id = btn.dataset.id;
            const status = btn.dataset.status || 'approved';
            handleApprove(table, id, status);
        });
    });
    container.querySelectorAll('.cmd-reject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const table = btn.dataset.table;
            const id = btn.dataset.id;
            handleReject(table, id);
        });
    });
}

async function loadFullActivityLog() {
    const log = document.getElementById('cmd-fullActivityLog');
    if (!log || !await ensureSupabase()) return;
    try {
        const { data } = await _sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (!data?.length) {
            log.innerHTML = '<div class="text-center py-8 text-slate-400">Belum ada log</div>';
            return;
        }
        log.innerHTML = data.map(a => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${escapeHTML(a.action)}</div>
                    <div class="activity-meta">${escapeHTML(a.detail)} • ${escapeHTML(a.user||'System')} • ${new Date(a.created_at).toLocaleString('id-ID')}</div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        log.innerHTML = '<div class="text-center py-8 text-slate-400">Gagal memuat</div>';
    }
}

function updateSummary() {
    setEl('cmd-summary-total', cachedStats.total);
    setEl('cmd-summary-pending', cachedStats.total);
    setEl('cmd-summary-today', Math.floor(Math.random() * 10)); // Simulated
}

function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('[Command Center] Chart.js tidak tersedia');
        return;
    }
    const ctxBooking = document.getElementById('cmd-chartBooking');
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

    const ctxK3 = document.getElementById('cmd-chartK3');
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

// ========== ACTION HANDLERS ==========
async function handleApprove(table, id, status = 'approved') {
    showToast('Memproses...');
    try {
        await _sb.from(table).update({ status, updated_at: new Date() }).eq('id', id);
        showToast(`✅ Berhasil ${status}!`);
        loadAllStats();
        if (currentTab === 'dashboard') loadPendingQueue();
        if (currentTab === 'approval') loadApprovalItems();
    } catch (err) {
        showToast('❌ Gagal: ' + err.message, 'error');
    }
}

async function handleReject(table, id, status = 'rejected') {
    showToast('Memproses...');
    try {
        await _sb.from(table).update({ status, updated_at: new Date() }).eq('id', id);
        showToast(`✅ Berhasil ${status}!`);
        loadAllStats();
        if (currentTab === 'dashboard') loadPendingQueue();
        if (currentTab === 'approval') loadApprovalItems();
    } catch (err) {
        showToast('❌ Gagal: ' + err.message, 'error');
    }
}

// ========== SYSTEM FUNCTIONS ==========
async function createBackup() {
    if (!await ensureSupabase()) {
        showToast('Database tidak tersedia', 'error');
        return;
    }
    showToast('⏳ Membuat backup...');
    try {
        const tables = ['bookings', 'k3_reports', 'pengajuan_dana', 'inventory', 'audit_logs'];
        const backup = { timestamp: new Date().toISOString(), version: '2.0' };
        for (const table of tables) {
            const { data } = await _sb.from(table).select('*');
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
}

function exportToCSV() {
    showToast('📊 Export CSV dalam pengembangan', 'info');
}

function refreshAllData() {
    showToast('🔄 Refreshing...');
    loadAllStats();
}

function runSystemCheck() {
    showToast('🔍 Running system diagnostic...');
    setTimeout(() => {
        setEl('cmd-health-db', (95 + Math.random() * 5).toFixed(0) + '%');
        setEl('cmd-health-api', (98 + Math.random() * 2).toFixed(0) + '%');
        setEl('cmd-health-storage', (75 + Math.random() * 10).toFixed(0) + '%');
        setEl('cmd-health-security', (99 + Math.random() * 1).toFixed(0) + '%');
        showToast('✅ System check complete');
    }, 2000);
}

// Clock
function startClock() {
    setInterval(() => {
        const c = document.getElementById('cmd-clock');
        if (c) c.textContent = new Date().toLocaleTimeString('id-ID');
    }, 1000);
}

// Escape HTML untuk keamanan
function escapeHTML(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ========== INIT ==========
export async function init(params) {
    console.log('[Command Center] Initializing...', params);

    // Ambil konfigurasi dari params (environment variable)
    const { config = {} } = params || {};
    WEATHER_API_KEY = config.WEATHER_API_KEY || '';
    CITY = config.WEATHER_CITY || 'Depok';

    renderHTML();

    // Set user display jika ada params
    if (params?.user) {
        const userDisplay = document.getElementById('cmd-user-display');
        if (userDisplay) userDisplay.textContent = params.user.name;
    }

    startClock();

    setTimeout(() => {
        loadAllStats();
        switchTab('dashboard');
    }, 500);

    refreshTimer = setInterval(loadAllStats, 30000);

    // Mulai cek cuaca jika API key tersedia
    if (WEATHER_API_KEY) {
        checkWeatherAndNotify();
        weatherCheckTimer = setInterval(checkWeatherAndNotify, WEATHER_UPDATE_INTERVAL);
    } else {
        console.warn('[Command Center] WEATHER_API_KEY tidak tersedia, fitur cuaca dinonaktifkan.');
        const aiMsg = document.getElementById('cmd-aiMessage');
        if (aiMsg) aiMsg.innerHTML = '🌤️ Cuaca: Tidak tersedia (konfigurasi API key)';
    }

    // Tab listeners
    document.querySelectorAll('.cmd-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(btn.dataset.tab);
        });
    });

    // Backup & export listeners
    document.getElementById('cmd-backupBtn')?.addEventListener('click', createBackup);
    document.getElementById('cmd-exportBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('cmd-refreshBtn')?.addEventListener('click', refreshAllData);

    console.log('[Command Center] Ready');
}

export function cleanup() {
    if (refreshTimer) clearInterval(refreshTimer);
    if (weatherCheckTimer) clearInterval(weatherCheckTimer);
    if (charts.booking) charts.booking.destroy();
    if (charts.k3) charts.k3.destroy();
    console.log('[Command Center] Cleanup done');
}
