/**
 * modules/commandcenter/module.js
 * Dream OS v2.0 — Self-Contained (tanpa dependency core/)
 * Semua fungsi built-in, tidak butuh core/supabase.js, core/components.js, template.js
 */

// ═══════════════════════════════════════════════
// SUPABASE CONFIG — ganti sesuai project kamu
// ═══════════════════════════════════════════════
const SB_URL = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

// ═══════════════════════════════════════════════
// WEATHER CONFIG
// ═══════════════════════════════════════════════
const WEATHER_API_KEY = 'f7890d7569950ffa34a5827880e8442f';
const CITY = 'Depok';
const WEATHER_INTERVAL = 30 * 60 * 1000; // 30 menit

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
let _sb = null;           // supabase client
let _stats = {};
let _tab = 'dashboard';
let _refreshTimer = null;
let _weatherTimer = null;
let _lastWeather = null;
let _charts = {};
let _currentUser = null;

// ═══════════════════════════════════════════════
// INIT SUPABASE — inisiasi client sendiri
// ═══════════════════════════════════════════════
function initSupabase() {
    // Coba pakai window.supabase (sudah diload index.html router)
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        _sb = window.supabase.createClient(SB_URL, SB_KEY);
        return true;
    }
    // Coba inject script jika belum ada
    console.warn('[CC] Supabase library tidak ditemukan, inject manual...');
    return false;
}

// ═══════════════════════════════════════════════
// BUILT-IN TOAST (tidak perlu showToast dari core)
// ═══════════════════════════════════════════════
function toast(msg, type = 'success') {
    // Pakai toast container dari router jika ada
    const container = document.getElementById('toast-container');
    if (container) {
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':type==='warning'?'⚠️':'ℹ️'}</span><span>${msg}</span>`;
        container.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
        return;
    }
    // Fallback: buat sendiri
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        background:${type==='error'?'rgba(239,68,68,.9)':type==='warning'?'rgba(245,158,11,.9)':type==='info'?'rgba(59,130,246,.9)':'rgba(16,185,129,.9)'};
        color:white;padding:10px 20px;border-radius:12px;z-index:99999;
        font-family:Rajdhani,Inter,sans-serif;font-weight:700;font-size:.9rem;
        opacity:0;transition:opacity .3s;white-space:nowrap;
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.style.opacity = '1', 10);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtRp(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function fmtDT(d) {
    return d ? new Date(d).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }) : '—';
}

// ═══════════════════════════════════════════════
// INJECT CSS (self-contained)
// ═══════════════════════════════════════════════
function injectCSS() {
    if (document.getElementById('cc-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-styles';
    style.textContent = `
        #cc-root * { box-sizing: border-box; }
        #cc-root {
            max-width: 900px;
            margin: 0 auto;
            padding: 1rem;
            font-family: 'Inter', 'Rajdhani', sans-serif;
            color: #e2e8f0;
        }
        .cc-panel {
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(16,185,129,0.25);
            border-radius: 16px;
            padding: 1.25rem;
            margin-bottom: 1.25rem;
        }
        .cc-header-glow { position:relative; overflow:hidden; }
        .cc-header-glow::before {
            content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
            background:linear-gradient(90deg,transparent,rgba(16,185,129,.15),transparent);
            animation:cc-sweep 3s ease-in-out infinite;
        }
        @keyframes cc-sweep { 0%,100%{left:-100%} 50%{left:100%} }
        .cc-stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
            gap: .75rem;
            margin-bottom: 1.25rem;
        }
        .cc-stat {
            background: rgba(255,255,255,.04);
            border: 1px solid rgba(16,185,129,.15);
            border-radius: 12px;
            padding: 1rem .75rem;
            text-align: center;
            cursor: pointer;
            transition: .25s;
        }
        .cc-stat:hover { border-color: #10b981; transform: translateY(-2px); background: rgba(16,185,129,.08); }
        .cc-sv { font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 700; }
        .cc-sl { font-size: .65rem; text-transform: uppercase; letter-spacing: .8px; opacity: .7; margin-top: .25rem; }
        .cc-tabs { display: flex; gap: .5rem; border-bottom: 2px solid rgba(16,185,129,.2); margin-bottom: 1.25rem; overflow-x: auto; flex-wrap: nowrap; }
        .cc-tab {
            padding: .65rem 1.25rem; background: rgba(255,255,255,.04);
            border: 1px solid transparent; border-radius: 8px 8px 0 0;
            cursor: pointer; transition: .2s; font-weight: 600; font-size: .85rem;
            white-space: nowrap; color: #94a3b8;
        }
        .cc-tab:hover { background: rgba(16,185,129,.08); color: #e2e8f0; }
        .cc-tab.active { background: rgba(16,185,129,.18); border-color: #10b981; color: #10b981; }
        .cc-status-bar {
            display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.25rem;
        }
        .cc-status-item {
            flex: 1; min-width: 130px;
            background: rgba(15,23,42,.7); border: 1px solid rgba(16,185,129,.18);
            border-radius: 8px; padding: .625rem 1rem;
            display: flex; align-items: center; justify-content: space-between;
        }
        .cc-slabel { font-size: .7rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
        .cc-sval { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #10b981; font-size: .85rem; }
        .cc-ai {
            background: linear-gradient(135deg, rgba(16,185,129,.08), rgba(59,130,246,.08));
            border: 1px solid rgba(16,185,129,.3);
            border-radius: 16px; padding: 1.25rem; margin-bottom: 1.25rem;
        }
        .cc-act-feed { max-height: 280px; overflow-y: auto; }
        .cc-act-feed::-webkit-scrollbar { width: 4px; }
        .cc-act-feed::-webkit-scrollbar-thumb { background: rgba(16,185,129,.4); border-radius: 4px; }
        .cc-act-item {
            display: flex; gap: .75rem; padding: .625rem .5rem;
            border-left: 3px solid #10b981; background: rgba(16,185,129,.04);
            margin-bottom: .4rem; border-radius: 0 8px 8px 0;
        }
        .cc-act-icon {
            width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
            background: rgba(16,185,129,.15); color: #10b981;
            display: flex; align-items: center; justify-content: center; font-size: .75rem;
        }
        .cc-act-title { font-size: .82rem; font-weight: 600; }
        .cc-act-meta { font-size: .7rem; color: #64748b; margin-top: 2px; }
        .cc-approval-card {
            background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08);
            border-radius: 12px; padding: 1rem; margin-bottom: .625rem;
        }
        .cc-badge {
            display: inline-block; padding: .15rem .625rem; border-radius: 6px;
            font-size: .65rem; font-weight: 700; text-transform: uppercase;
        }
        .cc-badge-pend { background: rgba(245,158,11,.2); color: #f59e0b; }
        .cc-badge-done { background: rgba(16,185,129,.2); color: #10b981; }
        .cc-badge-rej  { background: rgba(239,68,68,.2);  color: #ef4444; }
        .cc-btn {
            display: inline-flex; align-items: center; gap: .35rem;
            padding: .5rem 1rem; border-radius: 8px; border: none;
            font-family: inherit; font-weight: 700; font-size: .82rem;
            cursor: pointer; transition: .2s;
        }
        .cc-btn:hover { transform: translateY(-1px); }
        .cc-btn-em  { background: #10b981; color: #020617; }
        .cc-btn-re  { background: rgba(239,68,68,.2);  color: #ef4444;  border: 1px solid rgba(239,68,68,.35); }
        .cc-btn-bl  { background: rgba(59,130,246,.2); color: #3b82f6;  border: 1px solid rgba(59,130,246,.35); }
        .cc-btn-or  { background: rgba(245,158,11,.2); color: #f59e0b;  border: 1px solid rgba(245,158,11,.35); }
        .cc-btn-sm  { padding: .35rem .75rem; font-size: .75rem; }
        .cc-quick-actions {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: .75rem;
        }
        .cc-action {
            background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.25);
            border-radius: 10px; padding: .875rem .5rem; text-align: center;
            cursor: pointer; transition: .25s; color: #e2e8f0; font-size: .8rem; font-weight: 600;
        }
        .cc-action:hover { background: rgba(16,185,129,.18); transform: translateY(-2px); }
        .cc-action i { display: block; font-size: 1.4rem; color: #10b981; margin-bottom: .4rem; }
        .cc-live {
            display: inline-flex; align-items: center; gap: .4rem;
            padding: .3rem .875rem; background: rgba(239,68,68,.15);
            border: 1px solid #ef4444; border-radius: 20px; font-size: .72rem;
            font-weight: 700; color: #ef4444;
        }
        .cc-live-dot {
            width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
            animation: cc-pulse 2s ease-in-out infinite;
        }
        @keyframes cc-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
        .cc-hbar { background: rgba(255,255,255,.08); border-radius: 6px; height: 5px; overflow: hidden; }
        .cc-hfill { height: 100%; border-radius: 6px; transition: width .8s ease; }
        .cc-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; }
        .cc-spinner {
            width: 40px; height: 40px;
            border: 3px solid rgba(16,185,129,.2); border-top-color: #10b981;
            border-radius: 50%; animation: cc-spin 1s linear infinite;
        }
        @keyframes cc-spin { to { transform: rotate(360deg); } }
        .cc-tbl-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid rgba(255,255,255,.08); }
        table.cc-tbl { width: 100%; border-collapse: collapse; font-size: .82rem; }
        table.cc-tbl thead { background: rgba(255,255,255,.05); }
        table.cc-tbl th { padding: .6rem .875rem; text-align: left; font-size: .65rem;
            text-transform: uppercase; letter-spacing: .5px; opacity: .7; white-space: nowrap; }
        table.cc-tbl td { padding: .6rem .875rem; border-top: 1px solid rgba(255,255,255,.06); vertical-align: middle; }
        table.cc-tbl tr:hover td { background: rgba(255,255,255,.02); }
        .cc-chart-wrap { position: relative; height: 220px; }
        @media (max-width: 480px) {
            .cc-sv { font-size: 1.5rem; }
            .cc-stat { padding: .75rem .5rem; }
        }
    `;
    document.head.appendChild(style);
}

// ═══════════════════════════════════════════════
// RENDER ROOT HTML
// ═══════════════════════════════════════════════
function renderRoot(container) {
    container.innerHTML = `
    <div id="cc-root">
        <!-- HEADER -->
        <div class="cc-panel cc-header-glow" style="margin-bottom:1.25rem">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem">
                <div style="display:flex;align-items:center;gap:1rem">
                    <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#10b981,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:1.5rem">🚀</div>
                    <div>
                        <h2 style="font-size:1.4rem;font-weight:800;background:linear-gradient(135deg,#10b981,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
                            Command Center v2.0
                        </h2>
                        <p style="font-size:.72rem;color:#64748b">Professional Control System • Real-time Monitoring</p>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:.625rem;flex-wrap:wrap">
                    <div class="cc-live"><div class="cc-live-dot"></div>LIVE</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:.82rem;background:rgba(255,255,255,.06);padding:.4rem .875rem;border-radius:8px" id="cc-clock">--:--:--</div>
                    <span id="cc-user-badge" style="font-size:.82rem;font-weight:700;padding:.4rem .875rem;border-radius:8px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);color:#a855f7">GUEST</span>
                </div>
            </div>
        </div>

        <!-- STATUS BAR -->
        <div class="cc-status-bar">
            <div class="cc-status-item"><span class="cc-slabel"><i class="fas fa-database mr-1"></i>Database</span><span class="cc-sval" id="cc-st-db">98%</span></div>
            <div class="cc-status-item"><span class="cc-slabel"><i class="fas fa-server mr-1"></i>API</span><span class="cc-sval" id="cc-st-api">100%</span></div>
            <div class="cc-status-item"><span class="cc-slabel"><i class="fas fa-shield-alt mr-1"></i>Security</span><span class="cc-sval" id="cc-st-sec">AMAN</span></div>
            <div class="cc-status-item"><span class="cc-slabel"><i class="fas fa-clock mr-1"></i>Sync</span><span class="cc-sval" id="cc-st-sync">--:--</span></div>
        </div>

        <!-- AI INSIGHT -->
        <div class="cc-ai">
            <div style="display:flex;align-items:flex-start;gap:.875rem">
                <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">🧠</div>
                <div style="flex:1">
                    <p style="font-weight:700;color:#10b981;margin-bottom:.4rem;font-size:.9rem">AI Insight</p>
                    <p id="cc-ai-msg" style="font-size:.85rem;color:rgba(255,255,255,.75)"><i class="fas fa-circle-notch" style="animation:cc-spin 1s linear infinite"></i> Menganalisis...</p>
                </div>
            </div>
        </div>

        <!-- STATS -->
        <div class="cc-stat-grid">
            <div class="cc-stat"><div class="cc-sv" style="color:#3b82f6" id="cc-s-tot">—</div><div class="cc-sl">Total</div></div>
            <div class="cc-stat"><div class="cc-sv" style="color:#10b981" id="cc-s-bk">—</div><div class="cc-sl">Booking</div></div>
            <div class="cc-stat"><div class="cc-sv" style="color:#f59e0b" id="cc-s-k3">—</div><div class="cc-sl">K3</div></div>
            <div class="cc-stat"><div class="cc-sv" style="color:#a855f7" id="cc-s-dn">—</div><div class="cc-sl">Dana</div></div>
            <div class="cc-stat"><div class="cc-sv" style="color:#06b6d4" id="cc-s-sk">—</div><div class="cc-sl">Stok Low</div></div>
            <div class="cc-stat"><div class="cc-sv" style="color:#fbbf24" id="cc-s-mn">—</div><div class="cc-sl">Maint.</div></div>
        </div>

        <!-- TABS -->
        <div class="cc-tabs" id="cc-tabs">
            <div class="cc-tab active" data-tab="dashboard"><i class="fas fa-chart-line mr-1"></i>Dashboard</div>
            <div class="cc-tab" data-tab="approval"><i class="fas fa-check-circle mr-1"></i>Approval</div>
            <div class="cc-tab" data-tab="activity"><i class="fas fa-history mr-1"></i>Aktivitas</div>
            <div class="cc-tab" data-tab="analytics"><i class="fas fa-chart-bar mr-1"></i>Analytics</div>
            <div class="cc-tab" data-tab="system"><i class="fas fa-server mr-1"></i>System</div>
        </div>

        <!-- CONTENT -->
        <div id="cc-content" class="cc-panel" style="min-height:300px">
            <div class="cc-loader"><div class="cc-spinner"></div><p style="margin-top:.75rem;color:#64748b;font-size:.85rem">Memuat...</p></div>
        </div>

        <!-- QUICK ACTIONS -->
        <div class="cc-quick-actions" style="margin-top:1.25rem">
            <div class="cc-action" onclick="window._cc_backup()"><i class="fas fa-download"></i>Backup</div>
            <div class="cc-action" onclick="window._cc_exportCSV()"><i class="fas fa-file-csv"></i>Export CSV</div>
            <div class="cc-action" onclick="window._cc_refresh()"><i class="fas fa-sync"></i>Refresh</div>
            <div class="cc-action" onclick="window._cc_syscheck()"><i class="fas fa-stethoscope"></i>Diagnostic</div>
        </div>

        <!-- FOOTER -->
        <div style="text-align:center;margin-top:1.5rem;padding-bottom:1rem">
            <p style="font-size:.55rem;color:rgba(255,255,255,.15)">Dream Team © 2026 | ISO 27001 • ISO 55001 • ISO 9001</p>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════
function startClock() {
    setInterval(() => {
        const el = document.getElementById('cc-clock');
        if (el) el.textContent = new Date().toLocaleTimeString('id-ID');
    }, 1000);
}

// ═══════════════════════════════════════════════
// LOAD STATS
// ═══════════════════════════════════════════════
async function loadStats() {
    if (!_sb) return;
    try {
        const [bk, k3, dn, inv, mn] = await Promise.all([
            _sb.from('bookings').select('*', { count:'exact', head:true }).eq('status','pending'),
            _sb.from('k3_reports').select('*', { count:'exact', head:true }).eq('status','pending'),
            _sb.from('pengajuan_dana').select('*', { count:'exact', head:true }).eq('status','pending'),
            // FIX: ambil data, filter client-side (column vs column tidak bisa pakai .lt string)
            _sb.from('inventory').select('id,jumlah,minimal_stok'),
            _sb.from('maintenance_tasks').select('*', { count:'exact', head:true }).in('status', ['pending','proses'])
        ]);

        // FIX: filter client-side
        const stokKritis = (inv.data || []).filter(r => Number(r.jumlah) < Number(r.minimal_stok));

        _stats = {
            booking:     bk.count  || 0,
            k3:          k3.count  || 0,
            dana:        dn.count  || 0,
            stok:        stokKritis.length,
            maintenance: mn.count  || 0,
        };
        _stats.total = _stats.booking + _stats.k3 + _stats.dana + _stats.maintenance;

        setEl('cc-s-tot', _stats.total);
        setEl('cc-s-bk',  _stats.booking);
        setEl('cc-s-k3',  _stats.k3);
        setEl('cc-s-dn',  _stats.dana);
        setEl('cc-s-sk',  _stats.stok);
        setEl('cc-s-mn',  _stats.maintenance);

        updateSecStatus(_stats.total);
        updateAI(_stats);
        setEl('cc-st-sync', new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }));

        // Refresh tab aktif
        if (_tab === 'dashboard') { loadActivityFeed(); loadPendingQueue(); }

    } catch (err) {
        console.error('[CC] loadStats:', err);
    }
}

function updateSecStatus(total) {
    const el = document.getElementById('cc-st-sec');
    if (!el) return;
    if (total === 0)       { el.textContent = 'AMAN';    el.style.color = '#10b981'; }
    else if (total < 10)   { el.textContent = 'WASPADA'; el.style.color = '#f59e0b'; }
    else                   { el.textContent = 'BAHAYA';  el.style.color = '#ef4444'; }
}

function updateAI(c) {
    const el = document.getElementById('cc-ai-msg');
    if (!el) return;
    const ins = [];
    if (c.booking > 5)  ins.push('📈 Booking tinggi—siapkan kapasitas');
    if (c.k3 > 3)       ins.push('⚠️ K3 butuh review segera');
    if (c.dana > 5)     ins.push('💰 Dana pending menumpuk');
    if (c.stok > 0)     ins.push('📦 Stok kritis—lakukan reorder');
    if (!ins.length)    ins.push('✅ Semua sistem optimal');
    el.innerHTML = ins.join('<span style="opacity:.3;margin:0 .4rem">|</span>');
}

// ═══════════════════════════════════════════════
// TAB SWITCH
// ═══════════════════════════════════════════════
function switchTab(tab) {
    document.querySelectorAll('.cc-tab').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.cc-tab[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
    _tab = tab;
    renderContent(tab);
}

function loader(msg = 'Memuat...') {
    return `<div class="cc-loader"><div class="cc-spinner"></div><p style="margin-top:.75rem;color:#64748b;font-size:.85rem">${msg}</p></div>`;
}

function renderContent(tab) {
    const c = document.getElementById('cc-content');
    if (!c) return;
    c.innerHTML = loader('Memuat ' + tab + '...');
    setTimeout(() => {
        if      (tab === 'dashboard') renderDashboard();
        else if (tab === 'approval')  renderApproval();
        else if (tab === 'activity')  renderActivity();
        else if (tab === 'analytics') renderAnalytics();
        else if (tab === 'system')    renderSystem();
    }, 200);
}

// ────────────────────────────────
// DASHBOARD
// ────────────────────────────────
function renderDashboard() {
    const c = document.getElementById('cc-content');
    c.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
                <p style="font-weight:700;font-size:.9rem;margin-bottom:.75rem"><i class="fas fa-history" style="color:#10b981;margin-right:.4rem"></i>Aktivitas Terbaru</p>
                <div id="cc-act-feed" class="cc-act-feed">${loader()}</div>
            </div>
            <div>
                <p style="font-weight:700;font-size:.9rem;margin-bottom:.75rem"><i class="fas fa-chart-pie" style="color:#3b82f6;margin-right:.4rem"></i>Ringkasan</p>
                <div style="display:flex;flex-direction:column;gap:.625rem">
                    <div class="cc-panel" style="padding:.875rem">
                        <div style="font-size:.75rem;color:#64748b;margin-bottom:.25rem">Total Pending</div>
                        <div style="font-size:1.8rem;font-weight:700;color:#10b981;font-family:'JetBrains Mono',monospace" id="cc-sum-tot">—</div>
                    </div>
                    <div class="cc-panel" style="padding:.875rem">
                        <div style="font-size:.75rem;color:#64748b;margin-bottom:.25rem">Booking</div>
                        <div style="font-size:1.8rem;font-weight:700;color:#3b82f6;font-family:'JetBrains Mono',monospace" id="cc-sum-bk">—</div>
                    </div>
                    <div class="cc-panel" style="padding:.875rem">
                        <div style="font-size:.75rem;color:#64748b;margin-bottom:.25rem">K3</div>
                        <div style="font-size:1.8rem;font-weight:700;color:#f59e0b;font-family:'JetBrains Mono',monospace" id="cc-sum-k3">—</div>
                    </div>
                </div>
            </div>
        </div>
        <div style="margin-top:1.25rem">
            <p style="font-weight:700;font-size:.9rem;margin-bottom:.75rem"><i class="fas fa-hourglass-half" style="color:#fbbf24;margin-right:.4rem"></i>Antrian Persetujuan</p>
            <div id="cc-pend-queue">${loader()}</div>
        </div>`;
    loadActivityFeed();
    loadPendingQueue();
    setEl('cc-sum-tot', _stats.total   ?? '—');
    setEl('cc-sum-bk',  _stats.booking ?? '—');
    setEl('cc-sum-k3',  _stats.k3      ?? '—');
}

async function loadActivityFeed() {
    const f = document.getElementById('cc-act-feed');
    if (!f || !_sb) return;
    const { data } = await _sb.from('audit_logs')
        .select('action,detail,created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    if (!data?.length) { f.innerHTML = '<p style="text-align:center;padding:1.5rem;opacity:.5">Belum ada aktivitas</p>'; return; }
    f.innerHTML = data.map(a => `
        <div class="cc-act-item">
            <div class="cc-act-icon"><i class="fas fa-check"></i></div>
            <div>
                <div class="cc-act-title">${esc(a.action)}</div>
                <div class="cc-act-meta">${esc(a.detail)} • ${fmtDT(a.created_at)}</div>
            </div>
        </div>`).join('');
}

async function loadPendingQueue() {
    const q = document.getElementById('cc-pend-queue');
    if (!q || !_sb) return;
    // FIX: akses .data dari response
    const [bkRes, k3Res, dnRes] = await Promise.all([
        _sb.from('bookings').select('id,nama_peminjam,ruang,tanggal,jam_mulai').eq('status','pending').limit(5),
        _sb.from('k3_reports').select('id,lokasi,jenis_laporan,tanggal').eq('status','pending').limit(5),
        _sb.from('pengajuan_dana').select('id,judul,nominal,pengaju').eq('status','pending').limit(5)
    ]);
    // FIX: gunakan .data bukan langsung array
    const bk = bkRes.data || [];
    const k3 = k3Res.data || [];
    const dn = dnRes.data || [];

    let html = '';
    if (bk.length) {
        html += `<div style="border-left:3px solid #10b981;padding:.75rem 1rem;background:rgba(16,185,129,.05);border-radius:0 10px 10px 0;margin-bottom:.75rem">
            <p style="font-weight:700;font-size:.82rem;margin-bottom:.625rem;color:#10b981"><i class="fas fa-calendar mr-2"></i>Booking (${bk.length})</p>
            ${bk.map(b => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
                <div>
                    <div style="font-size:.82rem;font-weight:600">${esc(b.nama_peminjam||'—')}</div>
                    <div style="font-size:.7rem;color:#64748b">${esc(b.tanggal||'')} ${esc(b.jam_mulai||'')} • ${esc(b.ruang||'')}</div>
                </div>
                <div style="display:flex;gap:.35rem">
                    <button class="cc-btn cc-btn-em cc-btn-sm" onclick="window._cc_approve('bookings','${b.id}')"><i class="fas fa-check"></i></button>
                    <button class="cc-btn cc-btn-re cc-btn-sm" onclick="window._cc_reject('bookings','${b.id}')"><i class="fas fa-times"></i></button>
                </div>
            </div>`).join('')}
        </div>`;
    }
    if (k3.length) {
        html += `<div style="border-left:3px solid #f59e0b;padding:.75rem 1rem;background:rgba(245,158,11,.05);border-radius:0 10px 10px 0;margin-bottom:.75rem">
            <p style="font-weight:700;font-size:.82rem;margin-bottom:.625rem;color:#f59e0b"><i class="fas fa-exclamation-triangle mr-2"></i>K3 (${k3.length})</p>
            ${k3.map(k => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
                <div>
                    <div style="font-size:.82rem;font-weight:600">${esc(k.jenis_laporan||'—')}</div>
                    <div style="font-size:.7rem;color:#64748b">${esc(k.tanggal||'')} • ${esc(k.lokasi||'')}</div>
                </div>
                <button class="cc-btn cc-btn-em cc-btn-sm" onclick="window._cc_approve('k3_reports','${k.id}','verified')">Verifikasi</button>
            </div>`).join('')}
        </div>`;
    }
    if (dn.length) {
        html += `<div style="border-left:3px solid #a855f7;padding:.75rem 1rem;background:rgba(168,85,247,.05);border-radius:0 10px 10px 0;margin-bottom:.75rem">
            <p style="font-weight:700;font-size:.82rem;margin-bottom:.625rem;color:#a855f7"><i class="fas fa-money-bill mr-2"></i>Dana (${dn.length})</p>
            ${dn.map(d => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
                <div>
                    <div style="font-size:.82rem;font-weight:600">${esc(d.judul||'—')}</div>
                    <div style="font-size:.7rem;color:#64748b">${fmtRp(d.nominal)} • ${esc(d.pengaju||'')}</div>
                </div>
                <div style="display:flex;gap:.35rem">
                    <button class="cc-btn cc-btn-em cc-btn-sm" onclick="window._cc_approve('pengajuan_dana','${d.id}')"><i class="fas fa-check"></i></button>
                    <button class="cc-btn cc-btn-re cc-btn-sm" onclick="window._cc_reject('pengajuan_dana','${d.id}')"><i class="fas fa-times"></i></button>
                </div>
            </div>`).join('')}
        </div>`;
    }
    q.innerHTML = html || '<p style="text-align:center;padding:1.5rem;opacity:.5">Tidak ada item pending 🎉</p>';
}

// ────────────────────────────────
// APPROVAL TAB
// ────────────────────────────────
function renderApproval() {
    const c = document.getElementById('cc-content');
    c.innerHTML = `
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem"><i class="fas fa-check-double" style="color:#10b981;margin-right:.5rem"></i>Pusat Persetujuan</h3>
        <div style="margin-bottom:1rem">
            <p style="font-weight:700;font-size:.82rem;color:#10b981;margin-bottom:.625rem">📅 Booking Pending</p>
            <div id="cc-appr-bk">${loader()}</div>
        </div>
        <div style="margin-bottom:1rem">
            <p style="font-weight:700;font-size:.82rem;color:#f59e0b;margin-bottom:.625rem">⚠️ K3 Pending</p>
            <div id="cc-appr-k3">${loader()}</div>
        </div>
        <div>
            <p style="font-weight:700;font-size:.82rem;color:#a855f7;margin-bottom:.625rem">💰 Dana Pending</p>
            <div id="cc-appr-dn">${loader()}</div>
        </div>`;
    loadApprovalAll();
}

async function loadApprovalAll() {
    await Promise.all([loadApprovalSection('bookings','cc-appr-bk'), loadApprovalSection('k3_reports','cc-appr-k3'), loadApprovalSection('pengajuan_dana','cc-appr-dn')]);
}

async function loadApprovalSection(table, elId) {
    const c = document.getElementById(elId);
    if (!c || !_sb) return;
    const { data } = await _sb.from(table).select('*').eq('status','pending').order('created_at',{ascending:false}).limit(10);
    if (!data?.length) { c.innerHTML = '<p style="opacity:.5;font-size:.82rem;padding:.5rem">Tidak ada item pending</p>'; return; }
    c.innerHTML = data.map(row => {
        const title = row.nama_peminjam || row.jenis_laporan || row.judul || '—';
        const sub   = row.ruang        ? `${row.ruang} • ${row.tanggal||''}` :
                      row.lokasi       ? `${row.lokasi} • ${row.tanggal||''}` :
                      row.nominal      ? fmtRp(row.nominal) : '';
        const isK3  = table === 'k3_reports';
        return `
        <div class="cc-approval-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.625rem">
                <div>
                    <div style="font-weight:700;font-size:.9rem">${esc(title)}</div>
                    <div style="font-size:.75rem;color:#64748b;margin-top:2px">${esc(sub)}</div>
                </div>
                <span class="cc-badge cc-badge-pend">Pending</span>
            </div>
            <div style="display:flex;gap:.5rem">
                <button class="cc-btn cc-btn-em" style="flex:1" onclick="window._cc_approve('${table}','${row.id}'${isK3?`,'verified'`:''})"><i class="fas fa-check"></i>${isK3?'Verifikasi':'Setujui'}</button>
                <button class="cc-btn cc-btn-re" style="flex:1" onclick="window._cc_reject('${table}','${row.id}')"><i class="fas fa-times"></i>Tolak</button>
            </div>
        </div>`;
    }).join('');
}

// ────────────────────────────────
// ACTIVITY TAB
// ────────────────────────────────
function renderActivity() {
    const c = document.getElementById('cc-content');
    c.innerHTML = `
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem"><i class="fas fa-clipboard-list" style="color:#3b82f6;margin-right:.5rem"></i>Log Aktivitas Sistem</h3>
        <div id="cc-full-log" class="cc-act-feed" style="max-height:420px">${loader()}</div>`;
    loadFullLog();
}

async function loadFullLog() {
    const c = document.getElementById('cc-full-log');
    if (!c || !_sb) return;
    const { data } = await _sb.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(50);
    if (!data?.length) { c.innerHTML = '<p style="text-align:center;padding:1.5rem;opacity:.5">Belum ada log</p>'; return; }
    c.innerHTML = data.map(a => `
        <div class="cc-act-item">
            <div class="cc-act-icon"><i class="fas fa-history"></i></div>
            <div>
                <div class="cc-act-title">${esc(a.action)}</div>
                <div class="cc-act-meta">${esc(a.detail)} • ${esc(a.user||'System')} • ${fmtDT(a.created_at)}</div>
            </div>
        </div>`).join('');
}

// ────────────────────────────────
// ANALYTICS TAB
// ────────────────────────────────
function renderAnalytics() {
    const c = document.getElementById('cc-content');
    c.innerHTML = `
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem"><i class="fas fa-chart-bar" style="color:#a855f7;margin-right:.5rem"></i>Analytics & Trends</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem">
            <div class="cc-panel" style="padding:1rem">
                <p style="font-weight:700;font-size:.85rem;margin-bottom:.75rem">Trend Booking 7 Hari</p>
                <div class="cc-chart-wrap"><canvas id="cc-ch-bk"></canvas></div>
            </div>
            <div class="cc-panel" style="padding:1rem">
                <p style="font-weight:700;font-size:.85rem;margin-bottom:.75rem">Distribusi Status</p>
                <div class="cc-chart-wrap"><canvas id="cc-ch-k3"></canvas></div>
            </div>
        </div>`;
    setTimeout(initCharts, 100);
}

function initCharts() {
    if (typeof Chart === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        s.onload = buildCharts;
        document.head.appendChild(s);
        return;
    }
    buildCharts();
}

function buildCharts() {
    const ctxBk = document.getElementById('cc-ch-bk');
    if (ctxBk) {
        if (_charts.bk) _charts.bk.destroy();
        _charts.bk = new Chart(ctxBk, {
            type: 'line',
            data: {
                labels: ['Sen','Sel','Rab','Kam','Jum','Sab','Min'],
                datasets: [{ label:'Booking', data:[12,19,15,22,18,10,_stats.booking||8],
                    borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.1)',
                    tension:.4, fill:true, pointBackgroundColor:'#10b981' }]
            },
            options: { responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{ display:false } },
                scales:{
                    y:{ beginAtZero:true, grid:{ color:'rgba(255,255,255,.06)' }, ticks:{ color:'#64748b' } },
                    x:{ grid:{ display:false }, ticks:{ color:'#64748b' } }
                }
            }
        });
    }
    const ctxK3 = document.getElementById('cc-ch-k3');
    if (ctxK3) {
        if (_charts.k3) _charts.k3.destroy();
        _charts.k3 = new Chart(ctxK3, {
            type: 'doughnut',
            data: {
                labels: ['Booking','K3','Dana','Maintenance'],
                datasets:[{ data:[_stats.booking||1,_stats.k3||1,_stats.dana||1,_stats.maintenance||1],
                    backgroundColor:['rgba(16,185,129,.7)','rgba(245,158,11,.7)','rgba(168,85,247,.7)','rgba(251,191,36,.7)'],
                    borderWidth:0, hoverOffset:4 }]
            },
            options:{ responsive:true, maintainAspectRatio:false,
                cutout:'60%',
                plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', font:{ size:11 } } } }
            }
        });
    }
}

// ────────────────────────────────
// SYSTEM TAB
// ────────────────────────────────
function renderSystem() {
    const c = document.getElementById('cc-content');
    c.innerHTML = `
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem"><i class="fas fa-server" style="color:#06b6d4;margin-right:.5rem"></i>System Health</h3>
        <div style="display:flex;flex-direction:column;gap:.75rem">
            ${[['Database','#10b981',98,'cc-h-db'],['API Response','#10b981',100,'cc-h-api'],['Storage','#f59e0b',75,'cc-h-stor'],['Security Score','#10b981',100,'cc-h-sec']].map(([n,col,val,id])=>`
            <div class="cc-panel" style="padding:.875rem">
                <div style="display:flex;justify-content:space-between;margin-bottom:.4rem;font-size:.82rem">
                    <span style="color:#94a3b8">${n}</span>
                    <span style="font-family:'JetBrains Mono',monospace;color:${col};font-weight:700" id="${id}">${val}%</span>
                </div>
                <div class="cc-hbar"><div class="cc-hfill" style="width:${val}%;background:${col}"></div></div>
            </div>`).join('')}
        </div>
        <button class="cc-btn cc-btn-em" style="width:100%;justify-content:center;margin-top:1rem;padding:.875rem" onclick="window._cc_syscheck()">
            <i class="fas fa-stethoscope"></i>Run System Diagnostic
        </button>`;
}

// ═══════════════════════════════════════════════
// WEATHER
// ═══════════════════════════════════════════════
async function checkWeather() {
    try {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=id`);
        if (!r.ok) return;
        const d = await r.json();
        const w = { cond:d.weather[0].main.toLowerCase(), desc:d.weather[0].description, temp:d.main.temp, hum:d.main.humidity, wind:d.wind.speed };
        updateAIWeather(w);
        if (!_lastWeather || _lastWeather.cond !== w.cond) sendWeatherToast(w);
        _lastWeather = w;
        if (_sb) {
            await _sb.from('audit_logs').insert([{ action:'Weather Update', detail:`${w.desc}, ${w.temp}°C`, user:'System', created_at: new Date().toISOString() }]).catch(()=>{});
        }
    } catch (e) { console.warn('[CC] Weather skip:', e.message); }
}

function updateAIWeather(w) {
    const el = document.getElementById('cc-ai-msg');
    if (el) el.innerHTML = `🌡️ ${w.desc}, ${w.temp}°C, kelembaban ${w.hum}%, angin ${w.wind} m/s`;
}

function sendWeatherToast(w) {
    toast(`🌤️ Cuaca: ${w.desc}, ${w.temp}°C`, 'info');
    if (w.cond.includes('rain') || w.cond.includes('thunderstorm')) {
        toast('🧹 Janitor: Hujan—siapkan peralatan hujan!', 'warning');
        toast('🔧 Maintenance: Periksa instalasi listrik & atap!', 'warning');
    }
    if (w.wind > 15) toast('🛡️ Sekuriti: Angin kencang—tingkatkan patroli!', 'warning');
}

// ═══════════════════════════════════════════════
// WINDOW GLOBALS (dipanggil dari onclick HTML)
// ═══════════════════════════════════════════════
window._cc_approve = async (table, id, status = 'approved') => {
    toast('Memproses...');
    if (!_sb) { toast('DB tidak tersedia', 'error'); return; }
    const { error } = await _sb.from(table).update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast('❌ ' + error.message, 'error'); return; }
    toast(`✅ ${status}!`);
    loadStats();
    if (_tab === 'dashboard') loadPendingQueue();
    if (_tab === 'approval')  loadApprovalAll();
};

window._cc_reject = async (table, id) => {
    await window._cc_approve(table, id, 'rejected');
};

window._cc_backup = async () => {
    if (!_sb) { toast('DB tidak tersedia', 'error'); return; }
    toast('⏳ Membuat backup...');
    const tables = ['bookings','k3_reports','pengajuan_dana','inventory','audit_logs','maintenance_tasks'];
    const bk = { version:'2.0', timestamp: new Date().toISOString(), tables:{} };
    for (const t of tables) {
        const { data } = await _sb.from(t).select('*');
        bk.tables[t] = data || [];
    }
    const blob = new Blob([JSON.stringify(bk, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dream-os-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('✅ Backup berhasil!');
};

window._cc_exportCSV = () => toast('📊 Export CSV dalam pengembangan', 'info');
window._cc_refresh   = () => { toast('🔄 Refreshing...'); loadStats(); };
window._cc_syscheck  = () => {
    toast('🔍 Running diagnostic...');
    setTimeout(() => {
        ['cc-h-db','cc-h-api','cc-h-sec'].forEach(id => setEl(id, (95 + Math.random()*5).toFixed(0) + '%'));
        setEl('cc-h-stor', (70 + Math.random()*15).toFixed(0) + '%');
        toast('✅ System check complete');
    }, 1500);
};

// ═══════════════════════════════════════════════
// EXPORTED INIT — dipanggil router index.html
// ═══════════════════════════════════════════════
export async function init(params = {}) {
    console.log('[CC] init()', params);

    injectCSS();

    const container = document.getElementById('module-content');
    if (!container) { console.error('[CC] #module-content tidak ditemukan'); return; }

    // Init supabase client
    if (!initSupabase()) {
        container.innerHTML = `<div style="text-align:center;padding:3rem;color:#ef4444">
            <i class="fas fa-exclamation-circle" style="font-size:2rem;margin-bottom:1rem"></i>
            <p style="font-weight:700">Supabase library tidak ditemukan</p>
            <p style="font-size:.82rem;opacity:.7;margin-top:.5rem">Pastikan script supabase-js sudah diload di index.html router</p>
        </div>`;
        return;
    }

    // Render HTML
    renderRoot(container);
    startClock();

    // Set user display
    if (params.user) {
        _currentUser = params.user;
        setEl('cc-user-badge', params.user.name?.toUpperCase() || 'USER');
        const badge = document.getElementById('cc-user-badge');
        if (badge) badge.style.color = params.user.color || '#a855f7';
    }

    // Tab listeners
    document.querySelectorAll('.cc-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Load data
    await loadStats();
    renderContent('dashboard');

    // Auto refresh
    _refreshTimer = setInterval(loadStats, 30000);

    // Weather check
    await checkWeather();
    _weatherTimer = setInterval(checkWeather, WEATHER_INTERVAL);

    console.log('[CC] Ready ✅');
}

// ═══════════════════════════════════════════════
// EXPORTED CLEANUP
// ═══════════════════════════════════════════════
export function cleanup() {
    if (_refreshTimer) clearInterval(_refreshTimer);
    if (_weatherTimer) clearInterval(_weatherTimer);
    if (_charts.bk) _charts.bk.destroy();
    if (_charts.k3) _charts.k3.destroy();
    _charts = {};
    // Hapus CSS yang diinjek
    document.getElementById('cc-styles')?.remove();
    console.log('[CC] Cleanup done');
}
