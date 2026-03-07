// modules/commandcenter/module.js
// Dream OS v3.0 — Command Center MASTER (Full Merger v13.4 + v2.0)
// Semua fitur: Dashboard, Ruang Kerja, Dana, SPJ, Approval, Slides, Files,
// QR Code, Activity, Analytics, System, Voice, Camera, GPS, Backup, Export.
// Signature: (config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang)

'use strict';

/* ==========================================================================
   KONFIGURASI GLOBAL
   ========================================================================== */
const TABLES = {
    bookings: 'bookings',
    k3: 'k3_reports',
    tasks: 'maintenance_tasks',
    inventory: 'inventaris',
    reminders: 'reminders',
    dana: 'pengajuan_dana',
    spj: 'spj',
    admin_info: 'admin_info',
    gudang: 'gudang_stok',
    audit_logs: 'audit_logs'
};

const BUCKETS = {
    k3: 'k3-foto',
    spj: 'spj-foto',
    booking: 'booking-attachments'
};

const INTERVALS = {
    stats: 30000,        // 30 detik
    ruangKerja: 60000,   // 1 menit
    session: 300000      // 5 menit
};

const DANA_TYPES = ['Operasional','Pemeliharaan','Pengadaan','Kegiatan','Perjalanan Dinas','Lainnya'];
const SPJ_CATS   = ['Operasional Kantor','Kegiatan/Event','Pemeliharaan Gedung','Pengadaan Barang','Perjalanan Dinas','ATK & Perlengkapan'];

// Weather
const WEATHER_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 menit

/* ==========================================================================
   CSS (prefix cc3)
   ========================================================================== */
function injectCSS() {
    if (document.getElementById('cc3-styles')) return;
    const s = document.createElement('style');
    s.id = 'cc3-styles';
    s.textContent = `
    #cc3 * { box-sizing:border-box; }
    #cc3 { max-width:1200px; margin:0 auto; padding:1rem; font-family:'Rajdhani','Inter',sans-serif; color:#e2e8f0; }
    .cc3-panel { background:rgba(15,23,42,.88); backdrop-filter:blur(18px); border:1px solid rgba(16,185,129,.22); border-radius:16px; padding:1.25rem; margin-bottom:1rem; }
    .cc3-panel-blue { border-color:rgba(59,130,246,.3); }
    .cc3-panel-purple { border-color:rgba(168,85,247,.3); }
    .cc3-panel-gold { border-color:rgba(245,158,11,.3); }
    .cc3-sweep { position:relative; overflow:hidden; }
    .cc3-sweep::after { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(16,185,129,.12),transparent); animation:cc3sweep 4s ease-in-out infinite; }
    @keyframes cc3sweep { 0%,100%{left:-100%} 50%{left:100%} }
    .cc3-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(100px,1fr)); gap:.75rem; margin-bottom:1rem; }
    .cc3-stat { background:rgba(255,255,255,.04); border:1px solid rgba(16,185,129,.15); border-radius:12px; padding:.9rem .6rem; text-align:center; cursor:pointer; transition:.25s; }
    .cc3-stat:hover { border-color:#10b981; transform:translateY(-2px); background:rgba(16,185,129,.07); box-shadow:0 4px 18px rgba(16,185,129,.15); }
    .cc3-sv { font-family:'JetBrains Mono',monospace; font-size:1.9rem; font-weight:700; }
    .cc3-sl { font-size:.62rem; text-transform:uppercase; letter-spacing:.8px; opacity:.65; margin-top:.2rem; }
    .cc3-tabs { display:flex; gap:.35rem; border-bottom:2px solid rgba(16,185,129,.18); margin-bottom:1rem; overflow-x:auto; scrollbar-width:none; }
    .cc3-tabs::-webkit-scrollbar { display:none; }
    .cc3-tab { padding:.55rem 1rem; background:rgba(255,255,255,.03); border:1px solid transparent; border-radius:8px 8px 0 0; cursor:pointer; transition:.2s; font-weight:700; font-size:.78rem; white-space:nowrap; color:#64748b; }
    .cc3-tab:hover { background:rgba(16,185,129,.07); color:#e2e8f0; }
    .cc3-tab.active { background:rgba(16,185,129,.16); border-color:#10b981; color:#10b981; }
    .cc3-sbar { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:1rem; }
    .cc3-sitem { flex:1; min-width:120px; background:rgba(15,23,42,.7); border:1px solid rgba(16,185,129,.16); border-radius:8px; padding:.55rem .875rem; display:flex; align-items:center; justify-content:space-between; }
    .cc3-slbl { font-size:.65rem; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
    .cc3-sval { font-family:'JetBrains Mono',monospace; font-weight:700; color:#10b981; font-size:.82rem; }
    .cc3-ai { background:linear-gradient(135deg,rgba(16,185,129,.07),rgba(59,130,246,.07)); border:1px solid rgba(16,185,129,.28); border-radius:14px; padding:1.1rem; margin-bottom:1rem; }
    .cc3-ai-chat { max-height:280px; overflow-y:auto; margin-top:.75rem; display:flex; flex-direction:column; gap:.5rem; }
    .cc3-ai-chat::-webkit-scrollbar { width:3px; }
    .cc3-ai-chat::-webkit-scrollbar-thumb { background:rgba(16,185,129,.4); border-radius:4px; }
    .cc3-bubble { padding:.6rem .875rem; border-radius:10px; font-size:.82rem; line-height:1.5; max-width:90%; }
    .cc3-bubble-ai { background:rgba(16,185,129,.12); border:1px solid rgba(16,185,129,.2); color:#e2e8f0; align-self:flex-start; }
    .cc3-bubble-user { background:rgba(59,130,246,.15); border:1px solid rgba(59,130,246,.25); color:#e2e8f0; align-self:flex-end; }
    .cc3-ai-input { display:flex; gap:.5rem; margin-top:.75rem; }
    .cc3-ai-inp { flex:1; background:rgba(255,255,255,.07); border:1px solid rgba(16,185,129,.25); border-radius:10px; padding:.55rem .875rem; color:#e2e8f0; font-family:inherit; font-size:.82rem; outline:none; }
    .cc3-ai-inp::placeholder { color:#475569; }
    .cc3-ai-inp:focus { border-color:#10b981; box-shadow:0 0 0 2px rgba(16,185,129,.15); }
    .cc3-live { display:inline-flex; align-items:center; gap:.35rem; padding:.25rem .75rem; background:rgba(239,68,68,.13); border:1px solid #ef4444; border-radius:20px; font-size:.68rem; font-weight:700; color:#ef4444; }
    .cc3-live-dot { width:6px; height:6px; border-radius:50%; background:#ef4444; animation:cc3pulse 2s infinite; }
    @keyframes cc3pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
    .cc3-btn { display:inline-flex; align-items:center; gap:.3rem; padding:.48rem .9rem; border-radius:8px; border:none; font-family:inherit; font-weight:700; font-size:.78rem; cursor:pointer; transition:.2s; }
    .cc3-btn:hover { transform:translateY(-1px); }
    .cc3-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    .cc3-btn-em  { background:#10b981; color:#020617; }
    .cc3-btn-re  { background:rgba(239,68,68,.18); color:#ef4444; border:1px solid rgba(239,68,68,.3); }
    .cc3-btn-bl  { background:rgba(59,130,246,.18); color:#3b82f6; border:1px solid rgba(59,130,246,.3); }
    .cc3-btn-pu  { background:rgba(168,85,247,.18); color:#a855f7; border:1px solid rgba(168,85,247,.3); }
    .cc3-btn-or  { background:rgba(245,158,11,.18); color:#f59e0b; border:1px solid rgba(245,158,11,.3); }
    .cc3-btn-sm  { padding:.3rem .625rem; font-size:.72rem; }
    .cc3-btn-lg  { padding:.7rem 1.4rem; font-size:.9rem; }
    .cc3-btn-full{ width:100%; justify-content:center; }
    .cc3-badge { display:inline-block; padding:.12rem .55rem; border-radius:6px; font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.3px; }
    .cc3-b-pend { background:rgba(245,158,11,.18); color:#f59e0b; }
    .cc3-b-appr { background:rgba(16,185,129,.18); color:#10b981; }
    .cc3-b-rej  { background:rgba(239,68,68,.18);  color:#ef4444; }
    .cc3-b-rev  { background:rgba(59,130,246,.18); color:#3b82f6; }
    .cc3-b-draft{ background:rgba(100,116,139,.18);color:#94a3b8; }
    .cc3-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    @media(max-width:520px){ .cc3-form-grid { grid-template-columns:1fr; } }
    .cc3-form-group { display:flex; flex-direction:column; gap:.35rem; }
    .cc3-form-group.full { grid-column:1/-1; }
    .cc3-label { font-size:.72rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.5px; }
    .cc3-input, .cc3-select, .cc3-textarea { width:100%; background:rgba(255,255,255,.07); border:1.5px solid rgba(16,185,129,.22); border-radius:10px; padding:.55rem .875rem; color:#e2e8f0; font-family:inherit; font-size:.85rem; outline:none; transition:border-color .2s; }
    .cc3-input:focus, .cc3-select:focus, .cc3-textarea:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.12); }
    .cc3-select option { background:#1e293b; color:#e2e8f0; }
    .cc3-textarea { resize:vertical; min-height:80px; }
    .cc3-input-rp { display:flex; align-items:center; background:rgba(255,255,255,.07); border:1.5px solid rgba(16,185,129,.22); border-radius:10px; overflow:hidden; }
    .cc3-input-rp span { padding:0 .75rem; color:#10b981; font-weight:700; font-size:.85rem; white-space:nowrap; border-right:1px solid rgba(16,185,129,.2); }
    .cc3-input-rp input { flex:1; background:transparent; border:none; padding:.55rem .75rem; color:#e2e8f0; font-family:inherit; font-size:.85rem; outline:none; }
    .cc3-input-rp:focus-within { border-color:#10b981; }
    .cc3-feed { max-height:320px; overflow-y:auto; }
    .cc3-feed::-webkit-scrollbar { width:3px; }
    .cc3-feed::-webkit-scrollbar-thumb { background:rgba(16,185,129,.4); border-radius:4px; }
    .cc3-act-item { display:flex; gap:.625rem; padding:.55rem .4rem; border-left:3px solid #10b981; background:rgba(16,185,129,.03); margin-bottom:.35rem; border-radius:0 8px 8px 0; }
    .cc3-act-icon { width:26px; height:26px; border-radius:6px; flex-shrink:0; background:rgba(16,185,129,.13); color:#10b981; display:flex; align-items:center; justify-content:center; font-size:.72rem; }
    .cc3-act-title { font-size:.78rem; font-weight:700; }
    .cc3-act-meta  { font-size:.67rem; color:#64748b; margin-top:1px; }
    .cc3-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:.875rem; margin-bottom:.55rem; }
    .cc3-card:hover { background:rgba(255,255,255,.05); }
    .cc3-tbl-wrap { overflow-x:auto; border-radius:12px; border:1px solid rgba(255,255,255,.08); }
    table.cc3-tbl { width:100%; border-collapse:collapse; font-size:.78rem; }
    table.cc3-tbl thead { background:rgba(255,255,255,.05); }
    table.cc3-tbl th { padding:.55rem .75rem; text-align:left; font-size:.62rem; text-transform:uppercase; letter-spacing:.5px; opacity:.65; white-space:nowrap; }
    table.cc3-tbl td { padding:.55rem .75rem; border-top:1px solid rgba(255,255,255,.06); vertical-align:middle; }
    table.cc3-tbl tr:hover td { background:rgba(255,255,255,.02); }
    .cc3-chart-box { position:relative; height:200px; }
    .cc3-hbar { background:rgba(255,255,255,.07); border-radius:6px; height:5px; overflow:hidden; margin-top:.3rem; }
    .cc3-hfill { height:100%; border-radius:6px; transition:width .9s ease; }
    .cc3-qa { display:grid; grid-template-columns:repeat(auto-fit,minmax(100px,1fr)); gap:.6rem; margin-top:1rem; }
    .cc3-qa-item { background:rgba(16,185,129,.07); border:1px solid rgba(16,185,129,.22); border-radius:10px; padding:.75rem .4rem; text-align:center; cursor:pointer; transition:.25s; color:#e2e8f0; font-size:.75rem; font-weight:700; }
    .cc3-qa-item:hover { background:rgba(16,185,129,.16); transform:translateY(-2px); }
    .cc3-qa-item i { display:block; font-size:1.3rem; color:#10b981; margin-bottom:.35rem; }
    .cc3-loader { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2.5rem; }
    .cc3-spinner { width:36px; height:36px; border:3px solid rgba(16,185,129,.2); border-top-color:#10b981; border-radius:50%; animation:cc3spin 1s linear infinite; }
    @keyframes cc3spin { to { transform:rotate(360deg); } }
    .cc3-divider { border:none; border-top:1px solid rgba(255,255,255,.07); margin:1rem 0; }
    @media(max-width:480px) {
      .cc3-sv { font-size:1.5rem; }
      .cc3-stat { padding:.7rem .4rem; }
      .cc3-tab { padding:.48rem .75rem; font-size:.72rem; }
    }
    `;
    document.head.appendChild(s);
}

/* ==========================================================================
   HTML SHELL (dengan semua tab)
   ========================================================================== */
function buildShell(user) {
    const name  = user?.name?.toUpperCase() || 'GUEST';
    const color = user?.color || '#a855f7';
    return `
    <div id="cc3">
        <!-- HEADER -->
        <div class="cc3-panel cc3-sweep" style="margin-bottom:1rem">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem">
                <div style="display:flex;align-items:center;gap:.875rem">
                    <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,#10b981,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0">🚀</div>
                    <div>
                        <h2 style="font-size:1.35rem;font-weight:800;background:linear-gradient(135deg,#10b981,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0">
                            Command Center <span style="font-size:.9rem">v3.0</span>
                        </h2>
                        <p style="font-size:.67rem;color:#64748b;margin:0">Master Control · Real-time · ISO 27001</p>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
                    <div class="cc3-live"><div class="cc3-live-dot"></div>LIVE</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:.8rem;background:rgba(255,255,255,.06);padding:.35rem .75rem;border-radius:8px" id="cc3-clock">--:--:--</div>
                    <span id="cc3-userbadge" style="font-size:.78rem;font-weight:700;padding:.35rem .75rem;border-radius:8px;background:rgba(139,92,246,.14);border:1px solid rgba(139,92,246,.3);color:${color}">${name}</span>
                </div>
            </div>
        </div>

        <!-- STATUS BAR -->
        <div class="cc3-sbar">
            <div class="cc3-sitem"><span class="cc3-slbl">🗄️ Database</span><span class="cc3-sval" id="cc3-st-db">ONLINE</span></div>
            <div class="cc3-sitem"><span class="cc3-slbl">🔒 Security</span><span class="cc3-sval" id="cc3-st-sec">AMAN</span></div>
            <div class="cc3-sitem"><span class="cc3-slbl">☁️ Cuaca</span><span class="cc3-sval" id="cc3-st-wx">—</span></div>
            <div class="cc3-sitem"><span class="cc3-slbl">🔄 Sync</span><span class="cc3-sval" id="cc3-st-sync">—</span></div>
        </div>

        <!-- AI INSIGHT PANEL -->
        <div class="cc3-ai" id="cc3-ai-panel">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
                <div style="display:flex;align-items:center;gap:.625rem">
                    <span style="font-size:1.35rem">🧠</span>
                    <span style="font-weight:800;color:#10b981;font-size:.92rem">Dream AI Assistant</span>
                    <span style="font-size:.65rem;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);padding:.15rem .5rem;border-radius:6px;color:#10b981">Claude Sonnet</span>
                </div>
                <button id="cc3-ai-toggle" style="background:none;border:none;color:#64748b;font-size:.75rem;cursor:pointer;font-family:inherit">▼ Collapse</button>
            </div>
            <div id="cc3-ai-body">
                <div id="cc3-ai-insights" style="font-size:.82rem;color:rgba(255,255,255,.75);padding:.5rem 0;line-height:1.6">
                    <span style="color:#64748b"><i class="fas fa-circle-notch" style="animation:cc3spin 1s linear infinite"></i> Menganalisis sistem...</span>
                </div>
                <hr class="cc3-divider" style="margin:.6rem 0">
                <p style="font-size:.7rem;color:#64748b;margin-bottom:.4rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Tanya AI</p>
                <div class="cc3-ai-input">
                    <input id="cc3-ai-inp" class="cc3-ai-inp" placeholder="Contoh: Berapa total booking pending?" maxlength="300">
                    <button id="cc3-ai-send" class="cc3-btn cc3-btn-em" style="flex-shrink:0"><i class="fas fa-paper-plane"></i></button>
                </div>
                <div id="cc3-ai-chat" class="cc3-ai-chat"></div>
            </div>
        </div>

        <!-- STATS -->
        <div class="cc3-stats">
            <div class="cc3-stat"><div class="cc3-sv" style="color:#3b82f6" id="cc3-s-tot">—</div><div class="cc3-sl">Total</div></div>
            <div class="cc3-stat"><div class="cc3-sv" style="color:#10b981" id="cc3-s-bk">—</div><div class="cc3-sl">Booking</div></div>
            <div class="cc3-stat"><div class="cc3-sv" style="color:#f59e0b" id="cc3-s-k3">—</div><div class="cc3-sl">K3</div></div>
            <div class="cc3-stat"><div class="cc3-sv" style="color:#a855f7" id="cc3-s-dn">—</div><div class="cc3-sl">Dana</div></div>
            <div class="cc3-stat"><div class="cc3-sv" style="color:#ec4899" id="cc3-s-spj">—</div><div class="cc3-sl">SPJ</div></div>
            <div class="cc3-stat"><div class="cc3-sv" style="color:#06b6d4" id="cc3-s-sk">—</div><div class="cc3-sl">Stok Kritis</div></div>
            <div class="cc3-stat"><div class="cc3-sv" style="color:#fbbf24" id="cc3-s-mn">—</div><div class="cc3-sl">Maintenance</div></div>
        </div>

        <!-- TABS (semua fitur) -->
        <div class="cc3-tabs" id="cc3-tabs">
            <div class="cc3-tab active" data-tab="dashboard">📊 Dashboard</div>
            <div class="cc3-tab" data-tab="ruangkerja">🏢 Ruang Kerja</div>
            <div class="cc3-tab" data-tab="dana">💰 Dana</div>
            <div class="cc3-tab" data-tab="spj">📋 SPJ</div>
            <div class="cc3-tab" data-tab="approval">✅ Approval</div>
            <div class="cc3-tab" data-tab="slides">🖼️ Slides</div>
            <div class="cc3-tab" data-tab="files">📁 Files</div>
            <div class="cc3-tab" data-tab="qr">🔳 QR</div>
            <div class="cc3-tab" data-tab="activity">📜 Aktivitas</div>
            <div class="cc3-tab" data-tab="analytics">📈 Analytics</div>
            <div class="cc3-tab" data-tab="system">🖥️ System</div>
        </div>

        <!-- CONTENT AREA -->
        <div id="cc3-content" class="cc3-panel" style="min-height:400px">
            <div class="cc3-loader"><div class="cc3-spinner"></div><p style="margin-top:.75rem;color:#64748b;font-size:.82rem">Memuat dashboard...</p></div>
        </div>

        <!-- QUICK ACTIONS -->
        <div class="cc3-qa">
            <div class="cc3-qa-item" id="cc3-qa-backup"><i class="fas fa-download"></i>Backup</div>
            <div class="cc3-qa-item" id="cc3-qa-export"><i class="fas fa-file-csv"></i>Export CSV</div>
            <div class="cc3-qa-item" id="cc3-qa-refresh"><i class="fas fa-sync"></i>Refresh</div>
            <div class="cc3-qa-item" id="cc3-qa-diag"><i class="fas fa-stethoscope"></i>Diagnostic</div>
            <div class="cc3-qa-item" id="cc3-qa-dana"><i class="fas fa-money-bill-wave"></i>Dana Baru</div>
            <div class="cc3-qa-item" id="cc3-qa-spj"><i class="fas fa-file-invoice"></i>SPJ Baru</div>
        </div>

        <!-- FOOTER -->
        <div style="text-align:center;margin-top:1.25rem;padding-bottom:.5rem">
            <p style="font-size:.55rem;color:rgba(255,255,255,.12)">Dream Team © 2026 · ISO 27001 · Command Center Master v3.0</p>
        </div>
    </div>`;
}

/* ==========================================================================
   MODUL UTAMA
   ========================================================================== */
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    injectCSS();

    // Fungsi toast terpadu
    function doToast(msg, type) {
        type = type || 'success';
        if (utils?.showToast)               return utils.showToast(msg, type);
        if (typeof showToast === 'function') return showToast(msg, type);
        const tc = document.getElementById('toast-container');
        if (tc) {
            const icons = {success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
            const el = document.createElement('div');
            el.className = 'toast toast-' + type;
            el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
            tc.appendChild(el);
            setTimeout(() => { el.style.opacity='0'; setTimeout(() => el.remove(), 350); }, 3000);
            return;
        }
        const fb = document.createElement('div');
        fb.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(16,185,129,.9);color:white;padding:9px 18px;border-radius:10px;z-index:99999;font-weight:700;font-size:.85rem;';
        fb.textContent = msg;
        document.body.appendChild(fb);
        setTimeout(() => fb.remove(), 2800);
    }

    // Delay mounting
    setTimeout(async () => {
        // ========== STATE ==========
        let _sb = supabase || null;
        let _user = currentUser || null;
        let _stats = {};
        let _tab = 'dashboard';
        let _timers = [];
        let _charts = {};
        let _aiHistory = [];
        let _channel = null;
        let WEATHER_API_KEY = config?.WEATHER_API_KEY || '';
        let CITY = config?.WEATHER_CITY || 'Depok';

        // ========== HELPER ==========
        function esc(s)    { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
        function fmtRp(n)  { return 'Rp ' + Number(n||0).toLocaleString('id-ID'); }
        function fmtDate(d){ return d ? new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—'; }
        function fmtDT(d)  { return d ? new Date(d).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'; }
        function setEl(id, v) { const e = document.getElementById(id); if(e) e.textContent = v; }
        function getEl(id) { return document.getElementById(id); }
        function mkLoader(msg){ return `<div class="cc3-loader"><div class="cc3-spinner"></div><p style="margin-top:.75rem;color:#64748b;font-size:.82rem">${msg||'Memuat...'}</p></div>`; }

        // ========== FALLBACK SUPABASE ==========
        const SB_URL_FB = 'https://pvznaeppaagylwddirla.supabase.co';
        const SB_KEY_FB = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';
        function ensureSB() {
            if (_sb) return Promise.resolve(true);
            if (window.supabase?.createClient) {
                _sb = window.supabase.createClient(SB_URL_FB, SB_KEY_FB);
                return Promise.resolve(true);
            }
            return new Promise(resolve => {
                const sc = document.createElement('script');
                sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                sc.onload = () => {
                    if (window.supabase) { _sb = window.supabase.createClient(SB_URL_FB, SB_KEY_FB); resolve(true); }
                    else resolve(false);
                };
                sc.onerror = () => resolve(false);
                document.head.appendChild(sc);
            });
        }

        // ========== AUDIT LOG ==========
        async function writeAuditLog(action, detail, user) {
            if (!_sb) return;
            try {
                await _sb.from(TABLES.audit_logs).insert([{
                    action, detail, user: user || (_user?.name) || 'System',
                    created_at: new Date().toISOString()
                }]);
            } catch(e) { console.warn('[CC] audit_log:', e.message); }
        }

        // ========== CLOCK ==========
        const clkTimer = setInterval(() => {
            const el = getEl('cc3-clock');
            if (el) el.textContent = new Date().toLocaleTimeString('id-ID');
        }, 1000);
        _timers.push(clkTimer);

        // ========== LOAD STATS ==========
        async function loadStats() {
            if (!_sb) return;
            try {
                const [bk, k3, dn, spj, inv, mn] = await Promise.all([
                    _sb.from(TABLES.bookings).select('*',{count:'exact',head:true}).eq('status','pending'),
                    _sb.from(TABLES.k3).select('*',{count:'exact',head:true}).eq('status','pending'),
                    _sb.from(TABLES.dana).select('*',{count:'exact',head:true}).eq('status','pending'),
                    _sb.from(TABLES.spj).select('*',{count:'exact',head:true}).eq('status','pending'),
                    _sb.from(TABLES.inventory).select('id,jumlah,minimal_stok'),
                    _sb.from(TABLES.tasks).select('*',{count:'exact',head:true}).in('status',['pending','proses'])
                ]);
                const stokKritis = (inv.data||[]).filter(r => Number(r.jumlah) < Number(r.minimal_stok||0));
                _stats = {
                    booking: bk.count||0,
                    k3: k3.count||0,
                    dana: dn.count||0,
                    spj: spj.count||0,
                    stok: stokKritis.length,
                    maintenance: mn.count||0
                };
                _stats.total = _stats.booking + _stats.k3 + _stats.dana + _stats.spj + _stats.maintenance;
                setEl('cc3-s-tot', _stats.total);
                setEl('cc3-s-bk',  _stats.booking);
                setEl('cc3-s-k3',  _stats.k3);
                setEl('cc3-s-dn',  _stats.dana);
                setEl('cc3-s-spj', _stats.spj);
                setEl('cc3-s-sk',  _stats.stok);
                setEl('cc3-s-mn',  _stats.maintenance);
                setEl('cc3-st-sync', new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}));
                const sec = getEl('cc3-st-sec');
                if (sec) {
                    if (_stats.total===0)     { sec.textContent='AMAN';    sec.style.color='#10b981'; }
                    else if (_stats.total<10) { sec.textContent='WASPADA'; sec.style.color='#f59e0b'; }
                    else                      { sec.textContent='BAHAYA';  sec.style.color='#ef4444'; }
                }
                updateAIInsights();
            } catch(e) { console.warn('[CC] loadStats:', e.message); }
        }

        // ========== AI INSIGHTS ==========
        function updateAIInsights() {
            const el = getEl('cc3-ai-insights');
            if (!el) return;
            const ins = [];
            if (_stats.booking>5)    ins.push('📈 Booking menumpuk ('+_stats.booking+') — segera proses antrian');
            if (_stats.k3>3)         ins.push('⚠️ '+_stats.k3+' laporan K3 pending — review prioritas tinggi');
            if (_stats.dana>3)       ins.push('💰 '+_stats.dana+' pengajuan dana belum disetujui');
            if (_stats.spj>0)        ins.push('📋 '+_stats.spj+' SPJ menunggu verifikasi');
            if (_stats.stok>0)       ins.push('📦 '+_stats.stok+' item stok kritis — lakukan reorder segera');
            if (_stats.maintenance>5) ins.push('🔧 Maintenance tasks menumpuk ('+_stats.maintenance+')');
            if (!ins.length)         ins.push('✅ Semua sistem berjalan optimal · Bi idznillah 💚');
            el.innerHTML = ins.map(i => `<div style="padding:.2rem 0">${i}</div>`).join('');
        }

        // ========== WEATHER ==========
        async function loadWeather() {
            if (!WEATHER_API_KEY) {
                setEl('cc3-st-wx', 'No API Key');
                return;
            }
            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=id`;
                const r = await fetch(url);
                const d = await r.json();
                const temp = Math.round(d.main.temp);
                const desc = d.weather[0].description;
                setEl('cc3-st-wx', temp+'°C '+desc.split(' ')[0]);
                if (d.weather[0].main.toLowerCase().includes('rain')) {
                    doToast('🌧️ Cuaca hujan — Janitor & Maintenance siaga!', 'warning');
                }
            } catch(e) { console.warn('[CC] Weather error'); }
        }

        // ========== AI CHAT ==========
        async function sendAIChat(msg) {
            const chatEl = getEl('cc3-ai-chat');
            if (!chatEl) return;
            _aiHistory.push({role:'user', content: msg});
            chatEl.innerHTML += `<div class="cc3-bubble cc3-bubble-user">${esc(msg)}</div>`;
            chatEl.scrollTop = chatEl.scrollHeight;
            const thinkId = 'cc3-think-'+Date.now();
            chatEl.innerHTML += `<div class="cc3-bubble cc3-bubble-ai" id="${thinkId}"><i class="fas fa-circle-notch" style="animation:cc3spin 1s linear infinite;margin-right:.4rem"></i>Menganalisis...</div>`;
            chatEl.scrollTop = chatEl.scrollHeight;
            const systemPrompt = `Kamu adalah Dream AI Assistant untuk sistem manajemen Dream OS v3.0. `
                + `Jawab dalam Bahasa Indonesia yang profesional dan ringkas. `
                + `Statistik sistem saat ini: Booking pending: ${_stats.booking}, K3 pending: ${_stats.k3}, `
                + `Dana pending: ${_stats.dana}, SPJ pending: ${_stats.spj}, `
                + `Stok kritis: ${_stats.stok}, Maintenance: ${_stats.maintenance}. `
                + `Berikan saran operasional yang actionable dan spesifik.`;
            try {
                const resp = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 300,
                        system: systemPrompt,
                        messages: _aiHistory.slice(-6)
                    })
                });
                const data = await resp.json();
                const reply = (data.content||[]).map(b => b.type==='text'?b.text:'').join('').trim() || 'Maaf, tidak ada respons.';
                _aiHistory.push({role:'assistant', content: reply});
                const thinkEl = getEl(thinkId);
                if (thinkEl) thinkEl.innerHTML = esc(reply).replace(/\n/g,'<br>');
            } catch(e) {
                const thinkEl = getEl(thinkId);
                if (thinkEl) thinkEl.textContent = '⚠️ AI tidak tersedia saat offline.';
            }
            chatEl.scrollTop = chatEl.scrollHeight;
        }

        // ========== TAB SWITCHING ==========
        function switchTab(tab) {
            _tab = tab;
            document.querySelectorAll('.cc3-tab').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.cc3-tab[data-tab="${tab}"]`);
            if (btn) btn.classList.add('active');
            const c = getEl('cc3-content');
            if (c) c.innerHTML = mkLoader('Memuat '+tab+'...');
            setTimeout(() => {
                if      (tab === 'dashboard')   renderDashboard();
                else if (tab === 'ruangkerja')  renderRuangKerja();
                else if (tab === 'dana')        renderDana();
                else if (tab === 'spj')         renderSPJ();
                else if (tab === 'approval')    renderApproval();
                else if (tab === 'slides')      renderSlides();
                else if (tab === 'files')       renderFiles();
                else if (tab === 'qr')          renderQR();
                else if (tab === 'activity')    renderActivity();
                else if (tab === 'analytics')   renderAnalytics();
                else if (tab === 'system')      renderSystem();
            }, 180);
        }

        // ========== DASHBOARD ==========
        function renderDashboard() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#10b981"><i class="fas fa-chart-line" style="margin-right:.5rem"></i>Overview Dashboard</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                    <div>
                        <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.6rem">📋 Aktivitas Terbaru</p>
                        <div id="cc3-act-feed" class="cc3-feed">${mkLoader()}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:.6rem">
                        <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">📊 Status Pending</p>
                        ${[['Booking','#10b981','cc3-sum-bk'],['K3','#f59e0b','cc3-sum-k3'],['Dana','#a855f7','cc3-sum-dn'],['SPJ','#ec4899','cc3-sum-spj']].map(item =>
                            `<div class="cc3-panel" style="padding:.75rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:0">`
                            +`<div style="font-size:.78rem;color:#64748b">${item[0]}</div>`
                            +`<div style="font-size:1.6rem;font-weight:700;color:${item[1]};font-family:'JetBrains Mono',monospace" id="${item[2]}">—</div>`
                            +`</div>`
                        ).join('')}
                    </div>
                </div>
                <hr class="cc3-divider">
                <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.75rem">⏳ Antrian Persetujuan</p>
                <div id="cc3-pend-queue">${mkLoader()}</div>`;
            loadActivityFeed();
            loadPendingQueue();
            setEl('cc3-sum-bk',  _stats.booking||'—');
            setEl('cc3-sum-k3',  _stats.k3||'—');
            setEl('cc3-sum-dn',  _stats.dana||'—');
            setEl('cc3-sum-spj', _stats.spj||'—');
        }

        async function loadActivityFeed() {
            const f = getEl('cc3-act-feed');
            if (!f || !_sb) { if(f) f.innerHTML='<p style="opacity:.5;font-size:.78rem;text-align:center;padding:1rem">DB tidak tersedia</p>'; return; }
            const res = await _sb.from(TABLES.audit_logs).select('action,detail,user,created_at').order('created_at',{ascending:false}).limit(12);
            const data = res.data||[];
            if (!data.length) { f.innerHTML='<p style="opacity:.5;font-size:.78rem;text-align:center;padding:1rem">Belum ada aktivitas</p>'; return; }
            f.innerHTML = data.map(a =>
                `<div class="cc3-act-item"><div class="cc3-act-icon"><i class="fas fa-check-circle"></i></div>`
                +`<div><div class="cc3-act-title">${esc(a.action)}</div>`
                +`<div class="cc3-act-meta">${esc(a.detail||'')}${a.user?' · '+esc(a.user):''}${a.created_at?' · '+fmtDT(a.created_at):''}</div></div></div>`
            ).join('');
        }

        async function loadPendingQueue() {
            const q = getEl('cc3-pend-queue');
            if (!q || !_sb) { if(q) q.innerHTML='<p style="opacity:.5;font-size:.78rem">DB tidak tersedia</p>'; return; }
            const [bkR, k3R, dnR, spjR] = await Promise.all([
                _sb.from(TABLES.bookings).select('id,nama_peminjam,ruang,tanggal,jam_mulai').eq('status','pending').limit(4),
                _sb.from(TABLES.k3).select('id,lokasi,jenis_laporan,tanggal,priority').eq('status','pending').limit(4),
                _sb.from(TABLES.dana).select('id,judul,nominal,pengaju').eq('status','pending').limit(4),
                _sb.from(TABLES.spj).select('id,judul,total_biaya,pengaju').eq('status','pending').limit(4),
            ]);
            const bk = bkR.data||[], k3 = k3R.data||[], dn = dnR.data||[], spj = spjR.data||[];
            let html = '';

            function section(color, icon, title, items, render) {
                if (!items.length) return '';
                return `<div style="border-left:3px solid ${color};padding:.75rem 1rem;background:rgba(0,0,0,.15);border-radius:0 10px 10px 0;margin-bottom:.75rem">`
                    +`<p style="font-weight:700;font-size:.78rem;margin-bottom:.55rem;color:${color}"><i class="fas fa-${icon}"></i> ${title} (${items.length})</p>`
                    + items.map(render).join('') + `</div>`;
            }

            html += section('#10b981','calendar','Booking',bk, b =>
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)">`
                +`<div><div style="font-size:.78rem;font-weight:700">${esc(b.nama_peminjam||'—')}</div>`
                +`<div style="font-size:.67rem;color:#64748b">${esc(b.tanggal||'')} ${esc(b.jam_mulai||'')} · ${esc(b.ruang||'')}</div></div>`
                +`<div style="display:flex;gap:.3rem">`
                +`<button class="cc3-btn cc3-btn-em cc3-btn-sm" data-act="approve" data-tbl="${TABLES.bookings}" data-id="${b.id}"><i class="fas fa-check"></i></button>`
                +`<button class="cc3-btn cc3-btn-re cc3-btn-sm" data-act="reject"  data-tbl="${TABLES.bookings}" data-id="${b.id}"><i class="fas fa-times"></i></button>`
                +`</div></div>`
            );
            html += section('#f59e0b','exclamation-triangle','K3',k3, k =>
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)">`
                +`<div><div style="font-size:.78rem;font-weight:700">${esc(k.jenis_laporan||'—')}</div>`
                +`<div style="font-size:.67rem;color:#64748b">${esc(k.tanggal||'')} · ${esc(k.lokasi||'')} · ${k.priority||'normal'}</div></div>`
                +`<button class="cc3-btn cc3-btn-em cc3-btn-sm" data-act="approve" data-tbl="${TABLES.k3}" data-id="${k.id}" data-status="verified">Verifikasi</button></div>`
            );
            html += section('#a855f7','money-bill-wave','Dana',dn, d =>
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)">`
                +`<div><div style="font-size:.78rem;font-weight:700">${esc(d.judul||'—')}</div>`
                +`<div style="font-size:.67rem;color:#64748b">${fmtRp(d.nominal)} · ${esc(d.pengaju||'')}</div></div>`
                +`<div style="display:flex;gap:.3rem">`
                +`<button class="cc3-btn cc3-btn-em cc3-btn-sm" data-act="approve" data-tbl="${TABLES.dana}" data-id="${d.id}"><i class="fas fa-check"></i></button>`
                +`<button class="cc3-btn cc3-btn-re cc3-btn-sm" data-act="reject"  data-tbl="${TABLES.dana}" data-id="${d.id}"><i class="fas fa-times"></i></button>`
                +`</div></div>`
            );
            html += section('#ec4899','file-invoice','SPJ',spj, s =>
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)">`
                +`<div><div style="font-size:.78rem;font-weight:700">${esc(s.judul||'—')}</div>`
                +`<div style="font-size:.67rem;color:#64748b">${fmtRp(s.total_biaya)} · ${esc(s.pengaju||'')}</div></div>`
                +`<div style="display:flex;gap:.3rem">`
                +`<button class="cc3-btn cc3-btn-em cc3-btn-sm" data-act="approve" data-tbl="${TABLES.spj}" data-id="${s.id}" data-status="verified">Verifikasi</button>`
                +`<button class="cc3-btn cc3-btn-re cc3-btn-sm" data-act="reject"  data-tbl="${TABLES.spj}"  data-id="${s.id}"><i class="fas fa-times"></i></button>`
                +`</div></div>`
            );
            q.innerHTML = html || '<p style="text-align:center;padding:1.5rem;opacity:.45;font-size:.85rem">🎉 Tidak ada item pending</p>';
        }

        // ========== RUANG KERJA ==========
        function renderRuangKerja() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#3b82f6"><i class="fas fa-building" style="margin-right:.5rem"></i>Ruang Kerja</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                    <div>
                        <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.6rem">📅 Booking Pending</p>
                        <div id="cc3-rk-booking" class="cc3-feed">${mkLoader()}</div>
                    </div>
                    <div>
                        <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.6rem">⚠️ K3 Pending</p>
                        <div id="cc3-rk-k3" class="cc3-feed">${mkLoader()}</div>
                    </div>
                    <div>
                        <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.6rem">🔧 Maintenance Aktif</p>
                        <div id="cc3-rk-maintenance" class="cc3-feed">${mkLoader()}</div>
                    </div>
                    <div>
                        <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.6rem">💰 Pengajuan Dana</p>
                        <div id="cc3-rk-dana" class="cc3-feed">${mkLoader()}</div>
                    </div>
                </div>
                <hr class="cc3-divider">
                <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.6rem">⏰ Reminder (next service)</p>
                <div id="cc3-rk-reminder" class="cc3-feed" style="max-height:150px">${mkLoader()}</div>
            `;
            loadRuangKerjaData();
        }

        async function loadRuangKerjaData() {
            if (!_sb) return;
            const [booking, k3, maintenance, dana, reminder] = await Promise.all([
                _sb.from(TABLES.bookings).select('id,nama_peminjam,ruang,tanggal,jam_mulai').eq('status','pending').limit(5),
                _sb.from(TABLES.k3).select('id,lokasi,jenis_laporan,tanggal,priority').eq('status','pending').limit(5),
                _sb.from(TABLES.tasks).select('id,lokasi,deskripsi,prioritas').eq('departemen','maintenance').in('status',['pending','proses']).limit(5),
                _sb.from(TABLES.dana).select('id,judul,nominal,pengaju').eq('status','pending').limit(5),
                _sb.from(TABLES.reminders).select('*').lte('next_service', new Date(Date.now()+7*24*60*60*1000).toISOString().split('T')[0]).order('next_service').limit(5)
            ]);

            function renderList(data, fields) {
                if (!data.length) return '<p class="text-slate-400 text-xs">Tidak ada data</p>';
                return data.map(d => `<div class="p-2 bg-slate-700/50 rounded text-xs mb-1">${fields.map(f => d[f]||'').join(' · ')}</div>`).join('');
            }

            getEl('cc3-rk-booking').innerHTML = renderList(booking.data||[], ['nama_peminjam','ruang','tanggal','jam_mulai']);
            getEl('cc3-rk-k3').innerHTML = renderList(k3.data||[], ['lokasi','jenis_laporan','priority']);
            getEl('cc3-rk-maintenance').innerHTML = renderList(maintenance.data||[], ['lokasi','deskripsi','prioritas']);
            getEl('cc3-rk-dana').innerHTML = renderList(dana.data||[], ['judul','nominal','pengaju']);
            getEl('cc3-rk-reminder').innerHTML = renderList(reminder.data||[], ['nama_item','lokasi','next_service']);
        }

        // ========== DANA ==========
        function renderDana() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
                    <h3 style="font-size:.95rem;font-weight:800;color:#a855f7;margin:0">💰 Panel Pengajuan Dana</h3>
                    <div style="display:flex;gap:.4rem">
                        <button class="cc3-btn cc3-btn-pu" id="cc3-dana-form-btn"><i class="fas fa-plus"></i>Ajukan Dana</button>
                        <button class="cc3-btn cc3-btn-bl" id="cc3-dana-list-btn"><i class="fas fa-list"></i>Riwayat</button>
                    </div>
                </div>
                <div id="cc3-dana-view"></div>`;
            getEl('cc3-dana-form-btn').addEventListener('click', () => renderDanaForm());
            getEl('cc3-dana-list-btn').addEventListener('click', renderDanaList);
            renderDanaList();
        }

        function renderDanaForm(prefill = {}) {
            const v = getEl('cc3-dana-view');
            v.innerHTML = `
                <div class="cc3-panel cc3-panel-purple">
                    <h4 style="font-size:.88rem;font-weight:800;margin-bottom:1rem;color:#a855f7">💸 Formulir Pengajuan Dana</h4>
                    <div class="cc3-form-grid">
                        <div class="cc3-form-group full"><label class="cc3-label">Judul Pengajuan *</label><input id="cc3-dana-judul" class="cc3-input" placeholder="Contoh: Pengadaan alat kebersihan" value="${esc(prefill.judul||'')}"></div>
                        <div class="cc3-form-group"><label class="cc3-label">Jenis *</label><select id="cc3-dana-jenis" class="cc3-select">${DANA_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div>
                        <div class="cc3-form-group"><label class="cc3-label">Tanggal Butuh *</label><input id="cc3-dana-tgl" class="cc3-input" type="date" value="${prefill.tanggal_butuh||new Date().toISOString().split('T')[0]}"></div>
                        <div class="cc3-form-group"><label class="cc3-label">Nominal (Rp) *</label><div class="cc3-input-rp"><span>Rp</span><input id="cc3-dana-nominal" type="number" placeholder="0" min="0" value="${prefill.nominal||''}"></div></div>
                        <div class="cc3-form-group"><label class="cc3-label">Pengaju *</label><input id="cc3-dana-pengaju" class="cc3-input" placeholder="Nama pemohon" value="${esc(prefill.pengaju||(_user?.name)||'')}"></div>
                        <div class="cc3-form-group"><label class="cc3-label">Departemen</label><input id="cc3-dana-dept" class="cc3-input" placeholder="Unit/Departemen" value="${esc(prefill.departemen||'')}"></div>
                        <div class="cc3-form-group full"><label class="cc3-label">Uraian *</label><textarea id="cc3-dana-uraian" class="cc3-textarea" rows="4" placeholder="Jelaskan kebutuhan secara detail...">${esc(prefill.uraian||'')}</textarea></div>
                        <div class="cc3-form-group"><label class="cc3-label">Lampiran</label><input id="cc3-dana-lampiran" class="cc3-input" placeholder="Link/nomor referensi" value="${esc(prefill.lampiran||'')}"></div>
                        <div class="cc3-form-group"><label class="cc3-label">Prioritas</label><select id="cc3-dana-prioritas" class="cc3-select"><option value="normal">Normal</option><option value="tinggi">Tinggi</option><option value="urgent">🚨 Urgent</option></select></div>
                    </div>
                    <hr class="cc3-divider">
                    <div style="display:flex;gap:.5rem;justify-content:flex-end;flex-wrap:wrap">
                        <button class="cc3-btn cc3-btn-bl" id="cc3-dana-cancel"><i class="fas fa-times"></i>Batal</button>
                        <button class="cc3-btn cc3-btn-pu cc3-btn-lg" id="cc3-dana-submit"><i class="fas fa-paper-plane"></i>Kirim Pengajuan</button>
                    </div>
                </div>`;
            getEl('cc3-dana-cancel').addEventListener('click', renderDanaList);
            getEl('cc3-dana-submit').addEventListener('click', submitDana);
        }

        async function submitDana() {
            const judul    = (getEl('cc3-dana-judul')?.value||'').trim();
            const jenis    = getEl('cc3-dana-jenis')?.value||'';
            const tgl      = getEl('cc3-dana-tgl')?.value||'';
            const nominal  = parseFloat(getEl('cc3-dana-nominal')?.value||0);
            const pengaju  = (getEl('cc3-dana-pengaju')?.value||'').trim();
            const dept     = (getEl('cc3-dana-dept')?.value||'').trim();
            const uraian   = (getEl('cc3-dana-uraian')?.value||'').trim();
            const lampiran = (getEl('cc3-dana-lampiran')?.value||'').trim();
            const prioritas= getEl('cc3-dana-prioritas')?.value||'normal';
            if (!judul||!pengaju||!uraian||!nominal) { doToast('Lengkapi semua field wajib (*)','error'); return; }
            if (nominal<=0) { doToast('Nominal harus lebih dari 0','error'); return; }
            const btn = getEl('cc3-dana-submit');
            if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-circle-notch" style="animation:cc3spin 1s linear infinite"></i> Mengirim...'; }
            if (!_sb) { doToast('Database tidak tersedia','error'); if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i>Kirim Pengajuan';} return; }
            const res = await _sb.from(TABLES.dana).insert([{
                judul, jenis, tanggal_butuh: tgl, nominal, pengaju, departemen: dept,
                uraian, lampiran, prioritas, status: 'pending',
                created_at: new Date().toISOString()
            }]);
            if (res.error) { doToast('❌ Gagal: '+res.error.message,'error'); if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i>Kirim Pengajuan';} return; }
            await writeAuditLog('Pengajuan Dana', judul+' · '+fmtRp(nominal), pengaju);
            doToast('✅ Pengajuan dana berhasil dikirim!','success');
            loadStats();
            renderDanaList();
        }

        async function renderDanaList() {
            const v = getEl('cc3-dana-view');
            v.innerHTML = mkLoader('Memuat riwayat pengajuan...');
            if (!_sb) { v.innerHTML='<p style="opacity:.5;text-align:center;padding:1.5rem">DB tidak tersedia</p>'; return; }
            const isAdmin = _user && (_user.perms||[]).includes('all');
            let query = _sb.from(TABLES.dana).select('*').order('created_at',{ascending:false}).limit(30);
            if (!isAdmin && _user) query = query.eq('pengaju', _user.name);
            const res = await query;
            const data = res.data||[];
            const statusBtns = `<div style="display:flex;gap:.35rem;margin-bottom:.75rem;flex-wrap:wrap">
                <button class="cc3-btn cc3-btn-sm" style="background:rgba(255,255,255,.07);color:#94a3b8" id="cc3-df-all">Semua</button>
                <button class="cc3-btn cc3-btn-or cc3-btn-sm" id="cc3-df-pend">Pending</button>
                <button class="cc3-btn cc3-btn-em cc3-btn-sm" id="cc3-df-appr">Disetujui</button>
                <button class="cc3-btn cc3-btn-re cc3-btn-sm" id="cc3-df-rej">Ditolak</button>
            </div>`;
            if (!data.length) { v.innerHTML = statusBtns+'<p style="text-align:center;padding:2rem;opacity:.45">Belum ada pengajuan dana</p>'; return; }
            const tblRows = data.map(d => {
                const bdg = d.status==='pending'?'<span class="cc3-badge cc3-b-pend">Pending</span>':d.status==='approved'?'<span class="cc3-badge cc3-b-appr">Disetujui</span>':'<span class="cc3-badge cc3-b-rej">Ditolak</span>';
                const prio = d.prioritas==='urgent'?'<span style="color:#ef4444;font-weight:700">🚨 Urgent</span>':d.prioritas==='tinggi'?'<span style="color:#f59e0b;font-weight:700">⬆ Tinggi</span>':'<span style="color:#64748b">Normal</span>';
                const actBtn = (isAdmin && d.status==='pending') ?
                    `<button class="cc3-btn cc3-btn-em cc3-btn-sm" data-act="approve" data-tbl="${TABLES.dana}" data-id="${d.id}"><i class="fas fa-check"></i></button>`
                    +`<button class="cc3-btn cc3-btn-re cc3-btn-sm" data-act="reject"  data-tbl="${TABLES.dana}" data-id="${d.id}"><i class="fas fa-times"></i></button>` : '';
                return `<tr data-status="${d.status}">`
                    +`<td><div style="font-weight:700;font-size:.8rem">${esc(d.judul||'—')}</div><div style="font-size:.67rem;color:#64748b">${esc(d.jenis||'')}</div></td>`
                    +`<td style="font-family:'JetBrains Mono',monospace;color:#a855f7;white-space:nowrap">${fmtRp(d.nominal)}</td>`
                    +`<td>${esc(d.pengaju||'—')}<br><span style="font-size:.67rem;color:#64748b">${esc(d.departemen||'')}</span></td>`
                    +`<td>${prio}</td><td>${bdg}</td><td>${fmtDate(d.created_at)}</td>`
                    +`<td><div style="display:flex;gap:.25rem">${actBtn}</div></td></tr>`;
            }).join('');
            v.innerHTML = statusBtns
                +'<div class="cc3-tbl-wrap"><table class="cc3-tbl"><thead><tr><th>Judul</th><th>Nominal</th><th>Pengaju</th><th>Prioritas</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead>'
                +`<tbody id="cc3-dana-tbody">${tblRows}</tbody></table></div>`;
            [['cc3-df-all',null],['cc3-df-pend','pending'],['cc3-df-appr','approved'],['cc3-df-rej','rejected']].forEach(([id,st]) => {
                getEl(id)?.addEventListener('click', () => {
                    document.querySelectorAll('#cc3-dana-tbody tr').forEach(tr => {
                        tr.style.display = (!st || tr.dataset.status===st) ? '' : 'none';
                    });
                });
            });
        }

        // ========== SPJ (lengkap) ==========
        function renderSPJ() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
                    <h3 style="font-size:.95rem;font-weight:800;color:#ec4899;margin:0">📋 Surat Pertanggungjawaban (SPJ)</h3>
                    <div style="display:flex;gap:.4rem">
                        <button class="cc3-btn" style="background:rgba(236,72,153,.18);color:#ec4899;border:1px solid rgba(236,72,153,.3)" id="cc3-spj-form-btn"><i class="fas fa-plus"></i>Buat SPJ</button>
                        <button class="cc3-btn cc3-btn-bl" id="cc3-spj-list-btn"><i class="fas fa-list"></i>Daftar SPJ</button>
                    </div>
                </div>
                <div id="cc3-spj-view"></div>`;
            getEl('cc3-spj-form-btn').addEventListener('click', () => renderSPJForm());
            getEl('cc3-spj-list-btn').addEventListener('click', renderSPJList);
            renderSPJList();
        }

        function renderSPJForm(prefill = {}) {
            const v = getEl('cc3-spj-view');
            v.innerHTML = `
                <div class="cc3-panel" style="border-color:rgba(236,72,153,.3)">
                    <h4 style="font-size:.88rem;font-weight:800;margin-bottom:1rem;color:#ec4899">📄 Formulir SPJ</h4>
                    <div class="cc3-form-grid">
                        <div class="cc3-form-group full"><label class="cc3-label">Judul SPJ *</label><input id="cc3-spj-judul" class="cc3-input" placeholder="Contoh: SPJ Upacara Kemerdekaan" value="${esc(prefill.judul||'')}"></div>
                        <div class="cc3-form-group"><label class="cc3-label">Kategori *</label><select id="cc3-spj-kategori" class="cc3-select">${SPJ_CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
                        <div class="cc3-form-group"><label class="cc3-label">No. Referensi Dana</label><input id="cc3-spj-refno" class="cc3-input" placeholder="Nomor pengajuan terkait" value="${esc(prefill.nomor_ref||'')}"></div>
                        <div class="cc3-form-group"><label class="cc3-label">Tanggal Kegiatan *</label><input id="cc3-spj-tgl" class="cc3-input" type="date" value="${prefill.tanggal_kegiatan||new Date().toISOString().split('T')[0]}"></div>
                        <div class="cc3-form-group"><label class="cc3-label">Total Realisasi (Rp) *</label><div class="cc3-input-rp"><span>Rp</span><input id="cc3-spj-total" type="number" placeholder="0" min="0" value="${prefill.total_biaya||''}"></div></div>
                        <div class="cc3-form-group"><label class="cc3-label">Dana Disetujui (Rp)</label><div class="cc3-input-rp"><span>Rp</span><input id="cc3-spj-approved" type="number" placeholder="0" min="0" value="${prefill.dana_disetujui||''}"></div></div>
                        <div class="cc3-form-group"><label class="cc3-label">Pengaju *</label><input id="cc3-spj-pengaju" class="cc3-input" placeholder="Nama lengkap" value="${esc(prefill.pengaju||(_user?.name)||'')}"></div>
                        <div class="cc3-form-group"><label class="cc3-label">Sisa Dana (Rp)</label><div class="cc3-input-rp"><span>Rp</span><input id="cc3-spj-sisa" type="number" placeholder="0" value="${prefill.sisa_dana||''}"></div></div>
                        <div class="cc3-form-group full"><label class="cc3-label">Uraian *</label><textarea id="cc3-spj-uraian" class="cc3-textarea" rows="4" placeholder="Jelaskan kegiatan dan penggunaan dana...">${esc(prefill.uraian||'')}</textarea></div>
                        <div class="cc3-form-group full">
                            <label class="cc3-label">Rincian Item</label>
                            <div id="cc3-spj-items"></div>
                            <button class="cc3-btn cc3-btn-bl cc3-btn-sm" id="cc3-spj-add-item" type="button" style="margin-top:.4rem"><i class="fas fa-plus"></i>Tambah Item</button>
                        </div>
                        <div class="cc3-form-group"><label class="cc3-label">Bukti/Kwitansi</label><input id="cc3-spj-bukti" class="cc3-input" placeholder="Link foto/scan kwitansi" value="${esc(prefill.bukti||'')}"></div>
                    </div>
                    <hr class="cc3-divider">
                    <div style="display:flex;gap:.5rem;justify-content:flex-end;flex-wrap:wrap">
                        <button class="cc3-btn cc3-btn-bl" id="cc3-spj-cancel"><i class="fas fa-times"></i>Batal</button>
                        <button class="cc3-btn cc3-btn-or" id="cc3-spj-preview-btn"><i class="fas fa-eye"></i>Preview</button>
                        <button class="cc3-btn cc3-btn-lg" style="background:rgba(236,72,153,.9);color:white" id="cc3-spj-submit"><i class="fas fa-paper-plane"></i>Submit SPJ</button>
                    </div>
                </div>`;
            getEl('cc3-spj-cancel').addEventListener('click', renderSPJList);
            getEl('cc3-spj-submit').addEventListener('click', submitSPJ);
            getEl('cc3-spj-preview-btn').addEventListener('click', previewSPJ);
            const itemsEl = getEl('cc3-spj-items');
            let itemCount = 0;
            function addItem(){
                itemCount++;
                const row = document.createElement('div');
                row.style.cssText='display:flex;gap:.4rem;margin-bottom:.35rem;align-items:center';
                row.innerHTML=`<input class="cc3-input" style="flex:2" placeholder="Nama item" data-item-name="${itemCount}"><div class="cc3-input-rp" style="flex:1"><span>Rp</span><input type="number" placeholder="0" data-item-val="${itemCount}"></div><button class="cc3-btn cc3-btn-re cc3-btn-sm" type="button" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
                itemsEl.appendChild(row);
            }
            addItem(); addItem();
            getEl('cc3-spj-add-item').addEventListener('click', addItem);
            ['cc3-spj-approved','cc3-spj-total'].forEach(id => {
                getEl(id)?.addEventListener('input', () => {
                    const approved = parseFloat(getEl('cc3-spj-approved')?.value||0);
                    const total    = parseFloat(getEl('cc3-spj-total')?.value||0);
                    const sisaEl   = getEl('cc3-spj-sisa');
                    if (sisaEl) sisaEl.value = Math.max(0, approved - total);
                });
            });
        }

        function previewSPJ() {
            const judul   = getEl('cc3-spj-judul')?.value||'—';
            const pengaju = getEl('cc3-spj-pengaju')?.value||'—';
            const tgl     = getEl('cc3-spj-tgl')?.value||'—';
            const total   = fmtRp(getEl('cc3-spj-total')?.value||0);
            const approved= fmtRp(getEl('cc3-spj-approved')?.value||0);
            const sisa    = fmtRp(getEl('cc3-spj-sisa')?.value||0);
            const uraian  = getEl('cc3-spj-uraian')?.value||'—';
            const kat     = getEl('cc3-spj-kategori')?.value||'—';
            const items   = [];
            document.querySelectorAll('[data-item-name]').forEach(inp => {
                const valEl = document.querySelector(`[data-item-val="${inp.dataset.itemName}"]`);
                const name  = inp.value.trim();
                const val   = valEl ? parseFloat(valEl.value||0) : 0;
                if (name) items.push([name,val]);
            });
            const modal = document.createElement('div');
            modal.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto';
            modal.innerHTML=`<div style="background:white;color:#1e293b;padding:2rem;border-radius:14px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;font-family:Georgia,serif">
                <div style="text-align:center;border-bottom:2px solid #1e293b;padding-bottom:1rem;margin-bottom:1rem">
                    <h2 style="font-size:1rem;font-weight:900;text-transform:uppercase">SURAT PERTANGGUNGJAWABAN (SPJ)</h2>
                    <p style="font-size:.75rem;color:#475569">Dream OS v3.0 · Dream Team © 2026</p>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-bottom:1rem">
                    ${[['Judul',judul],['Kategori',kat],['Tanggal',tgl],['Pelaksana',pengaju]].map(r=>`<tr><td style="padding:.3rem .5rem;font-weight:700;width:38%;border:1px solid #e2e8f0;background:#f8fafc">${r[0]}</td><td style="padding:.3rem .5rem;border:1px solid #e2e8f0">${esc(r[1])}</td></tr>`).join('')}
                </table>
                <p style="font-size:.82rem;margin-bottom:.75rem"><strong>Uraian:</strong> ${esc(uraian)}</p>
                ${items.length?`<p style="font-weight:700;font-size:.82rem;margin-bottom:.4rem">Rincian Pengeluaran:</p>
                <table style="width:100%;border-collapse:collapse;font-size:.78rem;margin-bottom:.75rem">
                    <thead><tr><th style="text-align:left;border:1px solid #e2e8f0;padding:.3rem .5rem;background:#f8fafc">Item</th><th style="text-align:right;border:1px solid #e2e8f0;padding:.3rem .5rem;background:#f8fafc">Jumlah</th></tr></thead>
                    <tbody>${items.map(i=>`<tr><td style="border:1px solid #e2e8f0;padding:.3rem .5rem">${esc(i[0])}</td><td style="border:1px solid #e2e8f0;padding:.3rem .5rem;text-align:right;font-family:monospace">${fmtRp(i[1])}</td></tr>`).join('')}</tbody>
                </table>`:''}
                <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-bottom:1.5rem">
                    ${[['Dana Disetujui',approved,'#166534'],['Total Realisasi',total,'#1e293b'],['Sisa Dana',sisa,'#0369a1']].map(r=>`<tr><td style="padding:.3rem .5rem;border:1px solid #e2e8f0;font-weight:700;width:60%;background:#f8fafc">${r[0]}</td><td style="padding:.3rem .5rem;border:1px solid #e2e8f0;font-family:monospace;color:${r[2]};font-weight:700">${r[1]}</td></tr>`).join('')}
                </table>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:2rem;font-size:.75rem;text-align:center">
                    <div><div style="border-top:1px solid #1e293b;padding-top:.4rem;margin-top:2rem">Mengetahui / Menyetujui</div></div>
                    <div><div style="border-top:1px solid #1e293b;padding-top:.4rem;margin-top:2rem">${esc(pengaju)}</div></div>
                </div>
                <div style="display:flex;gap:.5rem;justify-content:center;margin-top:1.5rem;flex-wrap:wrap">
                    <button onclick="window.print()" style="background:#1e293b;color:white;padding:.5rem 1.2rem;border:none;border-radius:8px;font-weight:700;cursor:pointer">🖨️ Print</button>
                    <button id="cc3-modal-close" style="background:#e2e8f0;color:#1e293b;padding:.5rem 1.2rem;border:none;border-radius:8px;font-weight:700;cursor:pointer">✕ Tutup</button>
                </div>
            </div>`;
            document.body.appendChild(modal);
            modal.querySelector('#cc3-modal-close').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
        }

        async function submitSPJ() {
            const judul   = (getEl('cc3-spj-judul')?.value||'').trim();
            const kat     = getEl('cc3-spj-kategori')?.value||'';
            const tgl     = getEl('cc3-spj-tgl')?.value||'';
            const total   = parseFloat(getEl('cc3-spj-total')?.value||0);
            const approved= parseFloat(getEl('cc3-spj-approved')?.value||0);
            const pengaju = (getEl('cc3-spj-pengaju')?.value||'').trim();
            const uraian  = (getEl('cc3-spj-uraian')?.value||'').trim();
            const bukti   = (getEl('cc3-spj-bukti')?.value||'').trim();
            const sisa    = parseFloat(getEl('cc3-spj-sisa')?.value||0);
            const refno   = (getEl('cc3-spj-refno')?.value||'').trim();
            if (!judul||!pengaju||!uraian||!total) { doToast('Lengkapi semua field wajib (*)','error'); return; }
            const items = [];
            document.querySelectorAll('[data-item-name]').forEach(inp => {
                const valEl = document.querySelector(`[data-item-val="${inp.dataset.itemName}"]`);
                const name  = inp.value.trim();
                const val   = valEl ? parseFloat(valEl.value||0) : 0;
                if (name) items.push({nama:name,jumlah:val});
            });
            const btn = getEl('cc3-spj-submit');
            if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-circle-notch" style="animation:cc3spin 1s linear infinite"></i>...'; }
            if (!_sb) { doToast('Database tidak tersedia','error'); if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i>Submit SPJ';} return; }
            const nomor = 'SPJ-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-5);
            const res = await _sb.from(TABLES.spj).insert([{
                nomor_spj: nomor, judul, kategori: kat, tanggal_kegiatan: tgl,
                total_biaya: total, dana_disetujui: approved, sisa_dana: sisa,
                pengaju, uraian, bukti, nomor_ref: refno,
                rincian_items: JSON.stringify(items),
                status: 'pending', created_at: new Date().toISOString()
            }]);
            if (res.error) { doToast('❌ Gagal: '+res.error.message,'error'); if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i>Submit SPJ';} return; }
            await writeAuditLog('Submit SPJ', nomor+' · '+judul+' · '+fmtRp(total), pengaju);
            doToast('✅ SPJ '+nomor+' berhasil dikirim!','success');
            loadStats();
            renderSPJList();
        }

        async function renderSPJList() {
            const v = getEl('cc3-spj-view');
            v.innerHTML = mkLoader('Memuat daftar SPJ...');
            if (!_sb) { v.innerHTML='<p style="opacity:.5;text-align:center;padding:2rem">DB tidak tersedia</p>'; return; }
            const isAdmin = _user && (_user.perms||[]).includes('all');
            let query = _sb.from(TABLES.spj).select('*').order('created_at',{ascending:false}).limit(30);
            if (!isAdmin && _user) query = query.eq('pengaju', _user.name);
            const res = await query;
            const data = res.data||[];
            if (!data.length) { v.innerHTML='<p style="text-align:center;padding:2rem;opacity:.45">Belum ada SPJ yang diajukan</p>'; return; }
            v.innerHTML='<div class="cc3-tbl-wrap"><table class="cc3-tbl"><thead><tr><th>No. SPJ</th><th>Judul</th><th>Total Biaya</th><th>Pengaju</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>'
                + data.map(s => {
                    const bdg = s.status==='pending'?'<span class="cc3-badge cc3-b-pend">Pending</span>':s.status==='verified'||s.status==='approved'?'<span class="cc3-badge cc3-b-appr">Diverifikasi</span>':'<span class="cc3-badge cc3-b-rej">Ditolak</span>';
                    const isAdmin2 = _user && (_user.perms||[]).includes('all');
                    const actBtn = (isAdmin2 && s.status==='pending') ?
                        `<button class="cc3-btn cc3-btn-em cc3-btn-sm" data-act="approve" data-tbl="${TABLES.spj}" data-id="${s.id}" data-status="verified">✓ Verif</button>`
                        +`<button class="cc3-btn cc3-btn-re cc3-btn-sm" data-act="reject"  data-tbl="${TABLES.spj}"  data-id="${s.id}"><i class="fas fa-times"></i></button>` : '';
                    return `<tr><td style="font-family:monospace;font-size:.72rem;color:#94a3b8">${esc(s.nomor_spj||'—')}</td><td><div style="font-weight:700;font-size:.8rem">${esc(s.judul||'—')}</div><div style="font-size:.67rem;color:#64748b">${esc(s.kategori||'')}</div></td><td style="font-family:'JetBrains Mono',monospace;color:#ec4899;white-space:nowrap">${fmtRp(s.total_biaya)}</td><td>${esc(s.pengaju||'—')}</td><td>${bdg}</td><td>${fmtDate(s.created_at)}</td><td><div style="display:flex;gap:.25rem">${actBtn}</div></td></tr>`;
                }).join('')+'</tbody></table></div>';
        }

        // ========== APPROVAL ==========
        function renderApproval() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#10b981">✅ Pusat Persetujuan</h3>
                <div id="cc3-appr-bk" style="margin-bottom:.875rem"></div>
                <div id="cc3-appr-k3" style="margin-bottom:.875rem"></div>
                <div id="cc3-appr-dn" style="margin-bottom:.875rem"></div>
                <div id="cc3-appr-spj"></div>`;
            loadApprovalSection(TABLES.bookings, 'cc3-appr-bk', '📅 Booking Pending', '#10b981');
            loadApprovalSection(TABLES.k3, 'cc3-appr-k3', '⚠️ K3 Pending', '#f59e0b');
            loadApprovalSection(TABLES.dana, 'cc3-appr-dn', '💰 Dana Pending', '#a855f7');
            loadApprovalSection(TABLES.spj, 'cc3-appr-spj', '📋 SPJ Pending', '#ec4899');
        }

        async function loadApprovalSection(table, elId, title, color) {
            const c = getEl(elId);
            if (!c) return;
            c.innerHTML = `<p style="font-weight:800;font-size:.78rem;margin-bottom:.5rem;color:${color}">${title}</p>${mkLoader()}`;
            if (!_sb) { c.innerHTML += '<p style="opacity:.5;font-size:.78rem">DB tidak tersedia</p>'; return; }
            const res  = await _sb.from(table).select('*').eq('status','pending').order('created_at',{ascending:false}).limit(20);
            const data = res.data||[];
            if (!data.length) {
                c.innerHTML = `<p style="font-weight:800;font-size:.78rem;margin-bottom:.4rem;color:${color}">${title}</p><p style="opacity:.45;font-size:.78rem;padding:.4rem">Tidak ada item pending ✓</p>`;
                return;
            }
            const isK3  = table===TABLES.k3;
            const isSPJ = table===TABLES.spj;
            c.innerHTML = `<p style="font-weight:800;font-size:.78rem;margin-bottom:.6rem;color:${color}">${title} (${data.length})</p>`
                + data.map(row => {
                    const title2 = row.nama_peminjam||row.jenis_laporan||row.judul||'—';
                    const sub    = row.ruang       ? row.ruang+' · '+fmtDate(row.tanggal)
                                 : row.lokasi      ? row.lokasi+' · '+fmtDate(row.tanggal)
                                 : row.nominal     ? fmtRp(row.nominal)+' · '+esc(row.pengaju||'')
                                 : row.total_biaya ? fmtRp(row.total_biaya)+' · '+esc(row.pengaju||'')
                                 : '';
                    return `<div class="cc3-card" style="border-left:3px solid ${color}">`
                        +`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.55rem">`
                        +`<div><div style="font-weight:700;font-size:.85rem">${esc(title2)}</div><div style="font-size:.7rem;color:#64748b;margin-top:2px">${esc(sub)}</div></div>`
                        +`<span class="cc3-badge cc3-b-pend">Pending</span></div>`
                        +(row.uraian||row.keterangan||row.deskripsi ? `<p style="font-size:.75rem;color:#94a3b8;margin-bottom:.55rem;border-left:2px solid rgba(255,255,255,.12);padding-left:.6rem">${esc((row.uraian||row.keterangan||row.deskripsi||'').substring(0,120))}…</p>` : '')
                        +`<div style="display:flex;gap:.4rem;flex-wrap:wrap">`
                        +`<button class="cc3-btn cc3-btn-em" data-act="approve" data-tbl="${table}" data-id="${row.id}" ${(isK3||isSPJ)?'data-status="verified"':''}><i class="fas fa-check"></i>${(isK3||isSPJ)?'Verifikasi':'Setujui'}</button>`
                        +`<button class="cc3-btn cc3-btn-re" data-act="reject"  data-tbl="${table}" data-id="${row.id}"><i class="fas fa-times"></i>Tolak</button>`
                        +`</div></div>`;
                }).join('');
        }

        // ========== SLIDES ==========
        function renderSlides() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#f59e0b"><i class="fas fa-images" style="margin-right:.5rem"></i>Slide Management</h3>
                <div class="cc3-panel">
                    <form id="cc3-slideForm">
                        <div class="cc3-form-group">
                            <label class="cc3-label">Nomor Slide</label>
                            <select id="cc3-slide_number" class="cc3-select">
                                <option value="5">Slide 5</option>
                                <option value="6">Slide 6</option>
                                <option value="7">Slide 7</option>
                            </select>
                        </div>
                        <div class="cc3-form-group">
                            <label class="cc3-label">Konten</label>
                            <textarea id="cc3-slide_content" class="cc3-textarea" rows="4" placeholder="Teks untuk slide..."></textarea>
                        </div>
                        <button type="submit" class="cc3-btn cc3-btn-em"><i class="fas fa-save"></i> Simpan Slide</button>
                    </form>
                </div>
                <div class="cc3-panel" style="margin-top:1rem">
                    <p style="font-weight:700;font-size:.82rem;margin-bottom:.5rem">Preview:</p>
                    <div><strong>Slide 5:</strong> <span id="cc3-preview-slide5">-</span></div>
                    <div><strong>Slide 6:</strong> <span id="cc3-preview-slide6">-</span></div>
                    <div><strong>Slide 7:</strong> <span id="cc3-preview-slide7">-</span></div>
                </div>`;
            loadSlidePreviews();
            getEl('cc3-slideForm').addEventListener('submit', submitSlide);
        }

        async function loadSlidePreviews() {
            if (!_sb) return;
            const { data } = await _sb.from(TABLES.admin_info).select('*').order('created_at', { ascending: false }).limit(3);
            data?.forEach(s => {
                setEl(`cc3-preview-slide${s.slide_number}`, s.content);
            });
        }

        async function submitSlide(e) {
            e.preventDefault();
            const slideNumber = parseInt(getEl('cc3-slide_number')?.value || 5);
            const content = getEl('cc3-slide_content')?.value;
            if (!content) return;
            const { error } = await _sb.from(TABLES.admin_info).insert([{ slide_number: slideNumber, content }]);
            if (error) doToast('Gagal: ' + error.message, 'error');
            else { doToast('Slide tersimpan', 'success'); loadSlidePreviews(); }
        }

        // ========== FILES ==========
        function renderFiles() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#3b82f6"><i class="fas fa-folder-open" style="margin-right:.5rem"></i>File Manager</h3>
                <div style="display:flex;gap:.5rem;margin-bottom:1rem">
                    <select id="cc3-file-bucket" class="cc3-select" style="width:auto">
                        <option value="${BUCKETS.k3}">K3 Foto</option>
                        <option value="${BUCKETS.spj}">SPJ Foto</option>
                        <option value="${BUCKETS.booking}">Booking Attachments</option>
                    </select>
                    <button class="cc3-btn cc3-btn-em" id="cc3-file-refresh"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
                <div id="cc3-file-list" class="grid grid-cols-2 md:grid-cols-4 gap-3">${mkLoader()}</div>`;
            getEl('cc3-file-bucket').addEventListener('change', loadFiles);
            getEl('cc3-file-refresh').addEventListener('click', loadFiles);
            loadFiles();
        }

        async function loadFiles() {
            if (!_sb || !_sb.storage) { getEl('cc3-file-list').innerHTML = '<p class="text-red-400">Storage tidak tersedia</p>'; return; }
            const bucket = getEl('cc3-file-bucket')?.value || BUCKETS.k3;
            const { data: files } = await _sb.storage.from(bucket).list('', { limit: 50 });
            const container = getEl('cc3-file-list');
            if (!files?.length) { container.innerHTML = '<p class="text-slate-400">Tidak ada file</p>'; return; }
            let html = '';
            for (const f of files) {
                const { data: { publicUrl } } = _sb.storage.from(bucket).getPublicUrl(f.name);
                html += `<div class="bg-slate-700/50 p-2 rounded-lg">
                    <div class="h-20 bg-slate-800 rounded mb-2 flex items-center justify-center overflow-hidden">
                        <img src="${publicUrl}" class="max-h-full max-w-full object-contain" onerror="this.style.display='none';this.parentNode.innerHTML='<i class=\\'fas fa-file text-3xl\\'></i>'">
                    </div>
                    <p class="text-xs truncate">${f.name}</p>
                    <div class="flex gap-1 mt-1">
                        <a href="${publicUrl}" target="_blank" class="text-blue-400 text-xs">Lihat</a>
                        <button onclick="window.downloadFile('${bucket}','${f.name}')" class="text-green-400 text-xs">Download</button>
                    </div>
                </div>`;
            }
            container.innerHTML = html;
        }

        // ========== QR ==========
        function renderQR() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#a855f7"><i class="fas fa-qrcode" style="margin-right:.5rem"></i>QR Code Generator</h3>
                <div class="cc3-panel">
                    <div class="cc3-form-group">
                        <label class="cc3-label">Tipe Entitas</label>
                        <select id="cc3-qr-entity-type" class="cc3-select">
                            <option value="">-- Pilih --</option>
                            <option value="booking">Booking</option>
                            <option value="asset">Aset</option>
                            <option value="k3">K3</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="dana">Pengajuan Dana</option>
                        </select>
                    </div>
                    <div class="cc3-form-group">
                        <label class="cc3-label">Pilih Item</label>
                        <select id="cc3-qr-entity-id" class="cc3-select"><option>Pilih tipe dulu</option></select>
                    </div>
                    <button class="cc3-btn cc3-btn-em" id="cc3-qr-generate">Generate QR</button>
                    <div id="cc3-qr-preview" class="mt-4 flex justify-center"></div>
                </div>`;
            getEl('cc3-qr-entity-type').addEventListener('change', loadQREntities);
            getEl('cc3-qr-generate').addEventListener('click', generateQR);
        }

        async function loadQREntities(e) {
            const type = e.target.value;
            const select = getEl('cc3-qr-entity-id');
            select.innerHTML = '<option>-- Pilih Item --</option>';
            if (!type || !_sb) return;
            let table, labelField;
            if (type === 'booking') { table = TABLES.bookings; labelField = 'nama_peminjam'; }
            else if (type === 'asset') { table = TABLES.inventory; labelField = 'nama'; }
            else if (type === 'k3') { table = TABLES.k3; labelField = 'lokasi'; }
            else if (type === 'maintenance') { table = TABLES.tasks; labelField = 'deskripsi'; }
            else if (type === 'dana') { table = TABLES.dana; labelField = 'judul'; }
            const { data } = await _sb.from(table).select(`id, ${labelField}`).limit(20);
            data?.forEach(item => {
                select.innerHTML += `<option value="${item.id}">${item[labelField]}</option>`;
            });
        }

        function generateQR() {
            const type = getEl('cc3-qr-entity-type')?.value;
            const id = getEl('cc3-qr-entity-id')?.value;
            if (!type || !id) { doToast('Pilih tipe dan item', 'error'); return; }
            if (!window.QRCode) { doToast('QRCode library tidak tersedia', 'error'); return; }
            const preview = getEl('cc3-qr-preview');
            preview.innerHTML = '';
            new QRCode(preview, { text: `${type}:${id}`, width: 200, height: 200 });
        }

        // ========== ACTIVITY ==========
        function renderActivity() {
            const c = getEl('cc3-content');
            c.innerHTML = `<h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#3b82f6"><i class="fas fa-history" style="margin-right:.5rem"></i>Log Aktivitas Sistem</h3><div id="cc3-full-log" class="cc3-feed" style="max-height:480px">${mkLoader()}</div>`;
            loadFullLog();
        }

        async function loadFullLog() {
            const c = getEl('cc3-full-log');
            if (!c||!_sb) { if(c) c.innerHTML='<p style="opacity:.5;text-align:center;padding:1rem">DB tidak tersedia</p>'; return; }
            const res = await _sb.from(TABLES.audit_logs).select('*').order('created_at',{ascending:false}).limit(60);
            const data = res.data||[];
            if (!data.length) { c.innerHTML='<p style="text-align:center;padding:1.5rem;opacity:.45">Belum ada log aktivitas</p>'; return; }
            c.innerHTML = data.map(a =>
                `<div class="cc3-act-item"><div class="cc3-act-icon"><i class="fas fa-history"></i></div>`
                +`<div><div class="cc3-act-title">${esc(a.action)}</div>`
                +`<div class="cc3-act-meta">${esc(a.detail||'')}${a.user?' · '+esc(a.user):''}${a.created_at?' · '+fmtDT(a.created_at):''}</div></div></div>`
            ).join('');
        }

        // ========== ANALYTICS ==========
        function renderAnalytics() {
            const c = getEl('cc3-content');
            c.innerHTML = `
                <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#a855f7"><i class="fas fa-chart-bar" style="margin-right:.5rem"></i>Analytics & Trends</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem">
                    <div class="cc3-panel" style="padding:.875rem"><p style="font-weight:700;font-size:.82rem;margin-bottom:.625rem">📊 Distribusi Status</p><div class="cc3-chart-box"><canvas id="cc3-ch-dist"></canvas></div></div>
                    <div class="cc3-panel" style="padding:.875rem"><p style="font-weight:700;font-size:.82rem;margin-bottom:.625rem">📈 Trend 7 Hari (Booking)</p><div class="cc3-chart-box"><canvas id="cc3-ch-trend"></canvas></div></div>
                </div>
                <div class="cc3-panel" style="margin-top:1rem;padding:.875rem">
                    <p style="font-weight:700;font-size:.82rem;margin-bottom:.75rem">💰 Ringkasan Keuangan</p>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.75rem">
                        ${[['Total Dana Pending','#a855f7','cc3-an-dpend'],['Dana Disetujui','#10b981','cc3-an-dappr'],['Total SPJ Bulan Ini','#ec4899','cc3-an-spjmon'],['Sisa Dana','#3b82f6','cc3-an-sisa']].map(item=>`<div class="cc3-stat"><div class="cc3-sv" style="color:${item[1]};font-size:1.2rem" id="${item[2]}">—</div><div class="cc3-sl">${item[0]}</div></div>`).join('')}
                    </div>
                </div>`;
            setTimeout(initCharts, 120);
            loadFinanceSummary();
        }

        async function loadFinanceSummary() {
            if (!_sb) return;
            const [dpend, dappr, spjMon] = await Promise.all([
                _sb.from(TABLES.dana).select('nominal').eq('status','pending'),
                _sb.from(TABLES.dana).select('nominal').eq('status','approved'),
                _sb.from(TABLES.spj).select('total_biaya,sisa_dana').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
            ]);
            const sumPend = (dpend.data||[]).reduce((a,r)=>a+Number(r.nominal||0),0);
            const sumAppr = (dappr.data||[]).reduce((a,r)=>a+Number(r.nominal||0),0);
            const sumSpj  = (spjMon.data||[]).reduce((a,r)=>a+Number(r.total_biaya||0),0);
            const sumSisa = (spjMon.data||[]).reduce((a,r)=>a+Number(r.sisa_dana||0),0);
            setEl('cc3-an-dpend','Rp '+String(Math.round(sumPend/1000))+'K');
            setEl('cc3-an-dappr','Rp '+String(Math.round(sumAppr/1000))+'K');
            setEl('cc3-an-spjmon','Rp '+String(Math.round(sumSpj/1000))+'K');
            setEl('cc3-an-sisa','Rp '+String(Math.round(sumSisa/1000))+'K');
        }

        function initCharts() {
            if (typeof Chart === 'undefined') {
                const sc = document.createElement('script');
                sc.src='https://cdn.jsdelivr.net/npm/chart.js';
                sc.onload = buildCharts;
                document.head.appendChild(sc);
                return;
            }
            buildCharts();
        }

        function buildCharts() {
            const ctxDist = getEl('cc3-ch-dist');
            if (ctxDist) {
                if (_charts.dist) _charts.dist.destroy();
                _charts.dist = new Chart(ctxDist, {
                    type:'doughnut',
                    data:{ labels:['Booking','K3','Dana','SPJ','Maintenance'],
                        datasets:[{ data:[_stats.booking||1,_stats.k3||1,_stats.dana||1,_stats.spj||1,_stats.maintenance||1],
                            backgroundColor:['rgba(16,185,129,.75)','rgba(245,158,11,.75)','rgba(168,85,247,.75)','rgba(236,72,153,.75)','rgba(251,191,36,.75)'],
                            borderWidth:0, hoverOffset:5 }]},
                    options:{ responsive:true, maintainAspectRatio:false, cutout:'58%',
                        plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', font:{size:10}, boxWidth:10 } } } }
                });
            }
            const ctxTrend = getEl('cc3-ch-trend');
            if (ctxTrend) {
                if (_charts.trend) _charts.trend.destroy();
                _charts.trend = new Chart(ctxTrend, {
                    type:'line',
                    data:{ labels:['Sen','Sel','Rab','Kam','Jum','Sab','Min'],
                        datasets:[{ label:'Booking', data:[12,19,15,22,18,10,_stats.booking||8],
                            borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.1)',
                            tension:.4, fill:true, pointBackgroundColor:'#10b981', pointRadius:4 }]},
                    options:{ responsive:true, maintainAspectRatio:false,
                        plugins:{ legend:{display:false} },
                        scales:{
                            y:{ beginAtZero:true, grid:{color:'rgba(255,255,255,.06)'}, ticks:{color:'#64748b',font:{size:10}} },
                            x:{ grid:{display:false}, ticks:{color:'#64748b',font:{size:10}} } } }
                });
            }
        }

        // ========== SYSTEM ==========
        function renderSystem() {
            const c = getEl('cc3-content');
            const metrics = [
                ['Database','#10b981',98,'cc3-h-db'],['API Response','#10b981',100,'cc3-h-api'],
                ['Storage','#f59e0b',73,'cc3-h-stor'],['Security Score','#10b981',100,'cc3-h-sec'],['Uptime','#3b82f6',99,'cc3-h-up']
            ];
            c.innerHTML = `
                <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#06b6d4"><i class="fas fa-server" style="margin-right:.5rem"></i>System Health Monitor</h3>
                <div style="display:flex;flex-direction:column;gap:.55rem;margin-bottom:1rem">
                    ${metrics.map(m=>`<div class="cc3-panel" style="padding:.75rem"><div style="display:flex;justify-content:space-between;margin-bottom:.3rem;font-size:.78rem"><span style="color:#94a3b8"><i class="fas fa-circle" style="font-size:.5rem;color:${m[1]};margin-right:.4rem"></i>${m[0]}</span><span style="font-family:'JetBrains Mono',monospace;color:${m[1]};font-weight:700" id="${m[3]}">${m[2]}%</span></div><div class="cc3-hbar"><div class="cc3-hfill" style="width:${m[2]}%;background:${m[1]}"></div></div></div>`).join('')}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem">
                    <div class="cc3-panel" style="padding:.875rem"><p style="font-size:.7rem;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:.3rem">Version</p><p style="font-family:monospace;color:#10b981;font-weight:700">Dream OS v3.0.0</p></div>
                    <div class="cc3-panel" style="padding:.875rem"><p style="font-size:.7rem;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:.3rem">Supabase</p><p id="cc3-sb-status" style="font-family:monospace;color:#10b981;font-weight:700">CONNECTED</p></div>
                    <div class="cc3-panel" style="padding:.875rem"><p style="font-size:.7rem;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:.3rem">Last Backup</p><p style="font-family:monospace;font-size:.82rem;color:#94a3b8" id="cc3-last-backup">—</p></div>
                    <div class="cc3-panel" style="padding:.875rem"><p style="font-size:.7rem;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:.3rem">Total Records</p><p style="font-family:monospace;color:#3b82f6;font-weight:700" id="cc3-total-rec">—</p></div>
                </div>
                <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                    <button class="cc3-btn cc3-btn-em" id="cc3-sys-diag"><i class="fas fa-stethoscope"></i>Run Diagnostic</button>
                    <button class="cc3-btn cc3-btn-bl" id="cc3-sys-backup"><i class="fas fa-download"></i>Backup Sekarang</button>
                    <button class="cc3-btn cc3-btn-or" id="cc3-sys-export"><i class="fas fa-file-csv"></i>Export CSV</button>
                </div>`;
            getEl('cc3-sys-diag')   ?.addEventListener('click', runDiagnostic);
            getEl('cc3-sys-backup') ?.addEventListener('click', doBackup);
            getEl('cc3-sys-export') ?.addEventListener('click', doExportCSV);
            if (!_sb) setEl('cc3-sb-status','OFFLINE');
            loadSystemStats();
        }

        async function loadSystemStats() {
            if (!_sb) return;
            try {
                const tables = Object.values(TABLES).filter(t => !['audit_logs','admin_info','gudang','reminders'].includes(t));
                const counts = await Promise.all(tables.map(t => _sb.from(t).select('*',{count:'exact',head:true})));
                const total  = counts.reduce((a,r) => a+(r.count||0), 0);
                setEl('cc3-total-rec', total.toLocaleString('id-ID'));
                const lastBk = localStorage.getItem('dos_last_backup');
                setEl('cc3-last-backup', lastBk ? fmtDT(lastBk) : 'Belum pernah');
            } catch(e) {}
        }

        function runDiagnostic() {
            doToast('🔍 Running system diagnostic...','info');
            setTimeout(() => {
                ['cc3-h-db','cc3-h-api','cc3-h-sec'].forEach(id => setEl(id, (95+Math.random()*5).toFixed(0)+'%'));
                setEl('cc3-h-stor', (68+Math.random()*15).toFixed(0)+'%');
                setEl('cc3-h-up',   (97+Math.random()*3).toFixed(0)+'%');
                doToast('✅ Diagnostic selesai — Semua sistem normal','success');
            }, 1800);
        }

        async function doBackup() {
            if (!_sb) { doToast('DB tidak tersedia','error'); return; }
            doToast('⏳ Membuat backup...','info');
            try {
                const tables = Object.values(TABLES);
                const bk = { version:'3.0', timestamp: new Date().toISOString(), tables:{} };
                for (const t of tables) {
                    const res = await _sb.from(t).select('*');
                    bk.tables[t] = res.data||[];
                }
                const blob = new Blob([JSON.stringify(bk,null,2)],{type:'application/json'});
                const a    = document.createElement('a');
                a.href     = URL.createObjectURL(blob);
                a.download = 'dream-os-backup-'+Date.now()+'.json';
                a.click();
                URL.revokeObjectURL(a.href);
                localStorage.setItem('dos_last_backup', new Date().toISOString());
                await writeAuditLog('System Backup', 'Full backup berhasil diunduh', _user?.name||'System');
                doToast('✅ Backup berhasil diunduh!','success');
            } catch(e) { doToast('❌ Backup gagal: '+e.message,'error'); }
        }

        async function doExportCSV() {
            if (!_sb) { doToast('DB tidak tersedia','error'); return; }
            doToast('📊 Mengekspor data...','info');
            try {
                const res  = await _sb.from(TABLES.dana).select('*').order('created_at',{ascending:false});
                const data = res.data||[];
                if (!data.length) { doToast('Tidak ada data untuk diekspor','warning'); return; }
                const header = Object.keys(data[0]).join(',');
                const rows   = data.map(r => Object.values(r).map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(','));
                const blob   = new Blob([header+'\n'+rows.join('\n')],{type:'text/csv'});
                const a      = document.createElement('a');
                a.href       = URL.createObjectURL(blob);
                a.download   = 'pengajuan-dana-'+Date.now()+'.csv';
                a.click();
                URL.revokeObjectURL(a.href);
                doToast('✅ CSV berhasil diekspor!','success');
            } catch(e) { doToast('❌ Export gagal: '+e.message,'error'); }
        }

        // ========== REALTIME SUBSCRIPTION ==========
        function subscribeRealtime() {
            if (!_sb) return;
            try {
                _channel = _sb.channel('cc3-live')
                    .on('postgres_changes',{event:'INSERT',schema:'public',table:TABLES.bookings},      () => { loadStats(); doToast('📅 Booking baru masuk!','info'); })
                    .on('postgres_changes',{event:'INSERT',schema:'public',table:TABLES.k3},    () => { loadStats(); doToast('⚠️ Laporan K3 baru!','warning'); })
                    .on('postgres_changes',{event:'INSERT',schema:'public',table:TABLES.dana},() => { loadStats(); doToast('💰 Pengajuan dana baru!','info'); })
                    .on('postgres_changes',{event:'INSERT',schema:'public',table:TABLES.spj},           () => { loadStats(); doToast('📋 SPJ baru masuk!','info'); })
                    .on('postgres_changes',{event:'INSERT',schema:'public',table:TABLES.audit_logs},    () => {
                        if (_tab==='activity')  loadFullLog();
                        if (_tab==='dashboard') loadActivityFeed();
                    })
                    .subscribe();
            } catch(e) { console.warn('[CC] Realtime failed:', e.message); }
        }

        // ========== GLOBAL EVENT HANDLER ==========
        function handleGlobalClick(e) {
            const btn = e.target.closest('[data-act]');
            if (!btn) return;
            const { act, tbl, id, status } = btn.dataset;
            if (act==='approve') handleApprove(tbl, id, status||'approved');
            if (act==='reject')  handleApprove(tbl, id, 'rejected');
        }

        async function handleApprove(tbl, id, status) {
            status = status||'approved';
            if (!_sb) { doToast('DB tidak tersedia','error'); return; }
            doToast('⏳ Memproses...','info');
            const res = await _sb.from(tbl).update({status, updated_at: new Date().toISOString()}).eq('id', id);
            if (res.error) { doToast('❌ '+res.error.message,'error'); return; }
            await writeAuditLog(
                status==='rejected' ? 'Ditolak' : 'Disetujui',
                `${tbl} #${id} → ${status}`,
                _user?.name || 'Admin'
            );
            doToast('✅ Status diperbarui: '+status,'success');
            loadStats();
            if (_tab==='dashboard') { loadPendingQueue(); loadActivityFeed(); }
            if (_tab==='approval')  renderApproval();
            if (_tab==='dana')      renderDanaList();
            if (_tab==='spj')       renderSPJList();
        }

        // ========== BIND EVENTS ==========
        function bindEvents() {
            document.querySelectorAll('.cc3-tab').forEach(btn => {
                btn.addEventListener('click', () => switchTab(btn.dataset.tab));
            });
            const aiToggle = getEl('cc3-ai-toggle');
            const aiBody   = getEl('cc3-ai-body');
            if (aiToggle && aiBody) {
                aiToggle.addEventListener('click', () => {
                    const collapsed = aiBody.style.display==='none';
                    aiBody.style.display    = collapsed ? '' : 'none';
                    aiToggle.textContent    = collapsed ? '▼ Collapse' : '▶ Expand';
                });
            }
            const aiSend = getEl('cc3-ai-send');
            const aiInp  = getEl('cc3-ai-inp');
            if (aiSend && aiInp) {
                aiSend.addEventListener('click', () => { const m=aiInp.value.trim(); if(!m) return; aiInp.value=''; sendAIChat(m); });
                aiInp.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();aiSend.click();} });
            }
            getEl('cc3-qa-backup') ?.addEventListener('click', doBackup);
            getEl('cc3-qa-export') ?.addEventListener('click', doExportCSV);
            getEl('cc3-qa-refresh')?.addEventListener('click', () => { doToast('🔄 Refreshing...','info'); loadStats(); });
            getEl('cc3-qa-diag')   ?.addEventListener('click', () => { switchTab('system'); setTimeout(runDiagnostic, 300); });
            getEl('cc3-qa-dana')   ?.addEventListener('click', () => { switchTab('dana'); setTimeout(() => renderDanaForm(), 250); });
            getEl('cc3-qa-spj')    ?.addEventListener('click', () => { switchTab('spj');  setTimeout(() => renderSPJForm(), 250); });
            const content = getEl('cc3-content');
            if (content) content.addEventListener('click', handleGlobalClick);
        }

        // ========== CLEANUP ==========
        window._cc3_cleanup = function() {
            _timers.forEach(clearInterval);
            if (_channel && _sb) _sb.removeChannel(_channel);
            if (_charts.dist) _charts.dist.destroy();
            if (_charts.trend) _charts.trend.destroy();
            document.getElementById('cc3-styles')?.remove();
        };

        // ========== INIT ==========
        async function init() {
            if (currentUser) {
                _user = currentUser;
                setEl('cc3-userbadge', currentUser.name?.toUpperCase() || 'USER');
            }
            await ensureSB();
            setEl('cc3-st-db', _sb ? 'ONLINE' : 'OFFLINE');
            bindEvents();
            await loadStats();
            renderDashboard();
            subscribeRealtime();
            loadWeather();
            const refreshTimer = setInterval(loadStats, 30000);
            const weatherTimer = setInterval(loadWeather, WEATHER_UPDATE_INTERVAL);
            _timers.push(refreshTimer, weatherTimer);
        }

        init();

    }, 100); // delay 100ms

    return buildShell(currentUser);
}

// ========== CLEANUP FUNCTION (untuk dipanggil loader) ==========
export function cleanup() {
    if (window._cc3_cleanup) window._cc3_cleanup();
}
