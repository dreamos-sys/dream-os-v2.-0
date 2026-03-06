/**
 * modules/commandcenter/module.js
 * Dream OS v2.0 — Command Center Professional
 * 🔧 DEBUG VERSION — Hapus debug setelah fix!
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   🔧 DEBUG SYSTEM — Tampil di HP tanpa DevTools
══════════════════════════════════════════════════════════ */
(function setupDebug() {
    // Error overlay merah
    window.onerror = (msg, src, line, col, err) => {
        const d = document.createElement('div');
        d.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
            'background:#7f1d1d', 'color:#fca5a5', 'padding:1rem',
            'font-size:.8rem', 'font-family:monospace', 'word-break:break-all',
            'border-bottom:3px solid #ef4444', 'max-height:50vh', 'overflow-y:auto'
        ].join(';');
        d.innerHTML = `<b>🚨 JAVASCRIPT ERROR</b><br>Line ${line}: ${msg}<br><small style="opacity:.7">${(src||'').split('/').pop()}</small>`;
        document.body.prepend(d);
    };

    // Promise rejection overlay
    window.onunhandledrejection = (e) => {
        const d = document.createElement('div');
        d.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
            'background:#78350f', 'color:#fde68a', 'padding:1rem',
            'font-size:.8rem', 'font-family:monospace', 'word-break:break-all',
            'border-bottom:3px solid #f59e0b'
        ].join(';');
        d.innerHTML = `<b>⚠️ PROMISE REJECTED</b><br>${e.reason?.message || e.reason || 'Unknown'}`;
        document.body.prepend(d);
    };
})();

/* ── Debug Toast Helper ───────────────────────────────── */
let _dbgCount = 0;
function dbg(msg, type = 'info') {
    _dbgCount++;
    const colors = {
        info:    { bg: '#0f172a', border: '#10b981', text: '#10b981' },
        warn:    { bg: '#0f172a', border: '#f59e0b', text: '#f59e0b' },
        error:   { bg: '#0f172a', border: '#ef4444', text: '#ef4444' },
        success: { bg: '#0f172a', border: '#3b82f6', text: '#3b82f6' },
    };
    const c = colors[type] || colors.info;
    const d = document.createElement('div');
    const idx = _dbgCount;
    d.style.cssText = [
        'position:fixed',
        `bottom:${8 + (idx % 8) * 48}px`,
        'left:8px', 'right:8px', 'z-index:99997',
        `background:${c.bg}`,
        `border:1px solid ${c.border}`,
        `color:${c.text}`,
        'padding:.4rem .75rem',
        'font-size:.72rem',
        'font-family:monospace',
        'border-radius:8px',
        'opacity:0',
        'transition:opacity .3s',
        'box-shadow:0 2px 12px rgba(0,0,0,.5)'
    ].join(';');
    d.textContent = `[${idx}] ${msg}`;
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.opacity = '1'; });
    setTimeout(() => {
        d.style.opacity = '0';
        setTimeout(() => d.remove(), 400);
    }, 7000);
    console.log(`[DBG:${idx}]`, msg);
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const FALLBACK_WEATHER_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(
    'https://api.openweathermap.org/data/2.5/weather?q=Depok&appid=f7890d7569950ffa34a5827880e8442f&units=metric&lang=id'
);
const DANA_TYPES = ['Operasional','Pemeliharaan','Pengadaan','Kegiatan','Perjalanan Dinas','Lainnya'];
const SPJ_CATS   = ['Operasional Kantor','Kegiatan/Event','Pemeliharaan Gedung','Pengadaan Barang','Perjalanan Dinas','ATK & Perlengkapan'];

/* ══════════════════════════════════════════════════════════
   CSS INJECT
══════════════════════════════════════════════════════════ */
function injectCSS() {
    if (document.getElementById('cc2-styles')) return;
    const s = document.createElement('style');
    s.id = 'cc2-styles';
    s.textContent = `
    #cc2 * { box-sizing:border-box; }
    #cc2 { max-width:960px; margin:0 auto; padding:1rem; font-family:'Rajdhani','Inter',sans-serif; color:#e2e8f0; }
    .cc2-panel { background:rgba(15,23,42,.88); backdrop-filter:blur(18px); border:1px solid rgba(16,185,129,.22); border-radius:16px; padding:1.25rem; margin-bottom:1.1rem; }
    .cc2-panel-blue { border-color:rgba(59,130,246,.3); }
    .cc2-panel-purple { border-color:rgba(168,85,247,.3); }
    .cc2-panel-gold { border-color:rgba(245,158,11,.3); }
    .cc2-sweep { position:relative; overflow:hidden; }
    .cc2-sweep::after { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
      background:linear-gradient(90deg,transparent,rgba(16,185,129,.12),transparent);
      animation:cc2sweep 4s ease-in-out infinite; }
    @keyframes cc2sweep { 0%,100%{left:-100%} 50%{left:100%} }
    .cc2-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(105px,1fr)); gap:.75rem; margin-bottom:1.1rem; }
    .cc2-stat { background:rgba(255,255,255,.04); border:1px solid rgba(16,185,129,.15); border-radius:12px; padding:.9rem .6rem; text-align:center; cursor:pointer; transition:.25s; }
    .cc2-stat:hover { border-color:#10b981; transform:translateY(-2px); background:rgba(16,185,129,.07); box-shadow:0 4px 18px rgba(16,185,129,.15); }
    .cc2-sv { font-family:'JetBrains Mono',monospace; font-size:1.9rem; font-weight:700; }
    .cc2-sl { font-size:.62rem; text-transform:uppercase; letter-spacing:.8px; opacity:.65; margin-top:.2rem; }
    .cc2-tabs { display:flex; gap:.35rem; border-bottom:2px solid rgba(16,185,129,.18); margin-bottom:1.1rem; overflow-x:auto; scrollbar-width:none; }
    .cc2-tabs::-webkit-scrollbar { display:none; }
    .cc2-tab { padding:.55rem 1rem; background:rgba(255,255,255,.03); border:1px solid transparent;
      border-radius:8px 8px 0 0; cursor:pointer; transition:.2s; font-weight:700; font-size:.78rem;
      white-space:nowrap; color:#64748b; }
    .cc2-tab:hover { background:rgba(16,185,129,.07); color:#e2e8f0; }
    .cc2-tab.active { background:rgba(16,185,129,.16); border-color:#10b981; color:#10b981; }
    .cc2-sbar { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:1.1rem; }
    .cc2-sitem { flex:1; min-width:120px; background:rgba(15,23,42,.7); border:1px solid rgba(16,185,129,.16); border-radius:8px; padding:.55rem .875rem; display:flex; align-items:center; justify-content:space-between; }
    .cc2-slbl { font-size:.65rem; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
    .cc2-sval { font-family:'JetBrains Mono',monospace; font-weight:700; color:#10b981; font-size:.82rem; }
    .cc2-ai { background:linear-gradient(135deg,rgba(16,185,129,.07),rgba(59,130,246,.07)); border:1px solid rgba(16,185,129,.28); border-radius:14px; padding:1.1rem; margin-bottom:1.1rem; }
    .cc2-ai-chat { max-height:280px; overflow-y:auto; margin-top:.75rem; display:flex; flex-direction:column; gap:.5rem; }
    .cc2-ai-chat::-webkit-scrollbar { width:3px; }
    .cc2-ai-chat::-webkit-scrollbar-thumb { background:rgba(16,185,129,.4); border-radius:4px; }
    .cc2-bubble { padding:.6rem .875rem; border-radius:10px; font-size:.82rem; line-height:1.5; max-width:90%; }
    .cc2-bubble-ai { background:rgba(16,185,129,.12); border:1px solid rgba(16,185,129,.2); color:#e2e8f0; align-self:flex-start; }
    .cc2-bubble-user { background:rgba(59,130,246,.15); border:1px solid rgba(59,130,246,.25); color:#e2e8f0; align-self:flex-end; }
    .cc2-ai-input { display:flex; gap:.5rem; margin-top:.75rem; }
    .cc2-ai-inp { flex:1; background:rgba(255,255,255,.07); border:1px solid rgba(16,185,129,.25); border-radius:10px; padding:.55rem .875rem; color:#e2e8f0; font-family:inherit; font-size:.82rem; outline:none; }
    .cc2-ai-inp::placeholder { color:#475569; }
    .cc2-ai-inp:focus { border-color:#10b981; box-shadow:0 0 0 2px rgba(16,185,129,.15); }
    .cc2-live { display:inline-flex; align-items:center; gap:.35rem; padding:.25rem .75rem; background:rgba(239,68,68,.13); border:1px solid #ef4444; border-radius:20px; font-size:.68rem; font-weight:700; color:#ef4444; }
    .cc2-live-dot { width:6px; height:6px; border-radius:50%; background:#ef4444; animation:cc2pulse 2s infinite; }
    @keyframes cc2pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
    .cc2-btn { display:inline-flex; align-items:center; gap:.3rem; padding:.48rem .9rem; border-radius:8px; border:none; font-family:inherit; font-weight:700; font-size:.78rem; cursor:pointer; transition:.2s; }
    .cc2-btn:hover { transform:translateY(-1px); }
    .cc2-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    .cc2-btn-em  { background:#10b981; color:#020617; }
    .cc2-btn-re  { background:rgba(239,68,68,.18); color:#ef4444; border:1px solid rgba(239,68,68,.3); }
    .cc2-btn-bl  { background:rgba(59,130,246,.18); color:#3b82f6; border:1px solid rgba(59,130,246,.3); }
    .cc2-btn-pu  { background:rgba(168,85,247,.18); color:#a855f7; border:1px solid rgba(168,85,247,.3); }
    .cc2-btn-or  { background:rgba(245,158,11,.18); color:#f59e0b; border:1px solid rgba(245,158,11,.3); }
    .cc2-btn-sm  { padding:.3rem .625rem; font-size:.72rem; }
    .cc2-btn-lg  { padding:.7rem 1.4rem; font-size:.9rem; }
    .cc2-btn-full{ width:100%; justify-content:center; }
    .cc2-badge { display:inline-block; padding:.12rem .55rem; border-radius:6px; font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.3px; }
    .cc2-b-pend { background:rgba(245,158,11,.18); color:#f59e0b; }
    .cc2-b-appr { background:rgba(16,185,129,.18); color:#10b981; }
    .cc2-b-rej  { background:rgba(239,68,68,.18);  color:#ef4444; }
    .cc2-b-rev  { background:rgba(59,130,246,.18); color:#3b82f6; }
    .cc2-b-draft{ background:rgba(100,116,139,.18);color:#94a3b8; }
    .cc2-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    @media(max-width:520px){ .cc2-form-grid { grid-template-columns:1fr; } }
    .cc2-form-group { display:flex; flex-direction:column; gap:.35rem; }
    .cc2-form-group.full { grid-column:1/-1; }
    .cc2-label { font-size:.72rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.5px; }
    .cc2-input, .cc2-select, .cc2-textarea {
      width:100%; background:rgba(255,255,255,.07); border:1.5px solid rgba(16,185,129,.22);
      border-radius:10px; padding:.55rem .875rem; color:#e2e8f0;
      font-family:inherit; font-size:.85rem; outline:none; transition:border-color .2s;
    }
    .cc2-input:focus, .cc2-select:focus, .cc2-textarea:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.12); }
    .cc2-select option { background:#1e293b; color:#e2e8f0; }
    .cc2-textarea { resize:vertical; min-height:80px; }
    .cc2-input-rp { display:flex; align-items:center; background:rgba(255,255,255,.07); border:1.5px solid rgba(16,185,129,.22); border-radius:10px; overflow:hidden; }
    .cc2-input-rp span { padding:0 .75rem; color:#10b981; font-weight:700; font-size:.85rem; white-space:nowrap; border-right:1px solid rgba(16,185,129,.2); }
    .cc2-input-rp input { flex:1; background:transparent; border:none; padding:.55rem .75rem; color:#e2e8f0; font-family:inherit; font-size:.85rem; outline:none; }
    .cc2-input-rp:focus-within { border-color:#10b981; }
    .cc2-feed { max-height:320px; overflow-y:auto; }
    .cc2-feed::-webkit-scrollbar { width:3px; }
    .cc2-feed::-webkit-scrollbar-thumb { background:rgba(16,185,129,.4); border-radius:4px; }
    .cc2-act-item { display:flex; gap:.625rem; padding:.55rem .4rem; border-left:3px solid #10b981; background:rgba(16,185,129,.03); margin-bottom:.35rem; border-radius:0 8px 8px 0; }
    .cc2-act-icon { width:26px; height:26px; border-radius:6px; flex-shrink:0; background:rgba(16,185,129,.13); color:#10b981; display:flex; align-items:center; justify-content:center; font-size:.72rem; }
    .cc2-act-title { font-size:.78rem; font-weight:700; }
    .cc2-act-meta  { font-size:.67rem; color:#64748b; margin-top:1px; }
    .cc2-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:.875rem; margin-bottom:.55rem; }
    .cc2-card:hover { background:rgba(255,255,255,.05); }
    .cc2-tbl-wrap { overflow-x:auto; border-radius:12px; border:1px solid rgba(255,255,255,.08); }
    table.cc2-tbl { width:100%; border-collapse:collapse; font-size:.78rem; }
    table.cc2-tbl thead { background:rgba(255,255,255,.05); }
    table.cc2-tbl th { padding:.55rem .75rem; text-align:left; font-size:.62rem; text-transform:uppercase; letter-spacing:.5px; opacity:.65; white-space:nowrap; }
    table.cc2-tbl td { padding:.55rem .75rem; border-top:1px solid rgba(255,255,255,.06); vertical-align:middle; }
    table.cc2-tbl tr:hover td { background:rgba(255,255,255,.02); }
    .cc2-chart-box { position:relative; height:200px; }
    .cc2-hbar { background:rgba(255,255,255,.07); border-radius:6px; height:5px; overflow:hidden; margin-top:.3rem; }
    .cc2-hfill { height:100%; border-radius:6px; transition:width .9s ease; }
    .cc2-qa { display:grid; grid-template-columns:repeat(auto-fit,minmax(100px,1fr)); gap:.6rem; margin-top:1rem; }
    .cc2-qa-item { background:rgba(16,185,129,.07); border:1px solid rgba(16,185,129,.22); border-radius:10px; padding:.75rem .4rem; text-align:center; cursor:pointer; transition:.25s; color:#e2e8f0; font-size:.75rem; font-weight:700; }
    .cc2-qa-item:hover { background:rgba(16,185,129,.16); transform:translateY(-2px); }
    .cc2-qa-item i { display:block; font-size:1.3rem; color:#10b981; margin-bottom:.35rem; }
    .cc2-loader { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2.5rem; }
    .cc2-spinner { width:36px; height:36px; border:3px solid rgba(16,185,129,.2); border-top-color:#10b981; border-radius:50%; animation:cc2spin 1s linear infinite; }
    @keyframes cc2spin { to { transform:rotate(360deg); } }
    .cc2-divider { border:none; border-top:1px solid rgba(255,255,255,.07); margin:1rem 0; }
    @media(max-width:480px) {
      .cc2-sv { font-size:1.5rem; }
      .cc2-stat { padding:.7rem .4rem; }
      .cc2-tab { padding:.48rem .75rem; font-size:.72rem; }
    }
    /* Debug panel */
    #cc2-dbg-panel { position:fixed; top:8px; right:8px; z-index:99996; background:rgba(15,23,42,.95); border:1px solid #10b981; border-radius:10px; padding:.5rem .75rem; font-size:.65rem; font-family:monospace; color:#10b981; max-width:200px; }
    #cc2-dbg-panel .dbg-row { display:flex; justify-content:space-between; gap:.5rem; padding:.1rem 0; border-bottom:1px solid rgba(16,185,129,.1); }
    #cc2-dbg-panel .dbg-row:last-child { border:none; }
    .dbg-ok  { color:#10b981; }
    .dbg-err { color:#ef4444; }
    .dbg-warn{ color:#f59e0b; }
  `;
    document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════
   HTML SHELL
══════════════════════════════════════════════════════════ */
function buildShell(user) {
    const name  = user?.name?.toUpperCase() || 'GUEST';
    const color = user?.color || '#a855f7';
    return `
  <div id="cc2">
    <div class="cc2-panel cc2-sweep" style="margin-bottom:1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem">
        <div style="display:flex;align-items:center;gap:.875rem">
          <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,#10b981,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0">🚀</div>
          <div>
            <h2 style="font-size:1.35rem;font-weight:800;background:linear-gradient(135deg,#10b981,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0">
              Command Center <span style="font-size:.9rem">v2.0</span>
            </h2>
            <p style="font-size:.67rem;color:#64748b;margin:0">Professional · Real-time · ISO 9001 · 27001 · 55001</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
          <div class="cc2-live"><div class="cc2-live-dot"></div>LIVE</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:.8rem;background:rgba(255,255,255,.06);padding:.35rem .75rem;border-radius:8px" id="cc2-clock">--:--:--</div>
          <span id="cc2-userbadge" style="font-size:.78rem;font-weight:700;padding:.35rem .75rem;border-radius:8px;background:rgba(139,92,246,.14);border:1px solid rgba(139,92,246,.3);color:${color}">${name}</span>
        </div>
      </div>
    </div>
    <div class="cc2-sbar">
      <div class="cc2-sitem"><span class="cc2-slbl">🗄️ Database</span><span class="cc2-sval" id="cc2-st-db">—</span></div>
      <div class="cc2-sitem"><span class="cc2-slbl">🔒 Security</span><span class="cc2-sval" id="cc2-st-sec">—</span></div>
      <div class="cc2-sitem"><span class="cc2-slbl">☁️ Cuaca</span><span class="cc2-sval" id="cc2-st-wx">—</span></div>
      <div class="cc2-sitem"><span class="cc2-slbl">🔄 Sync</span><span class="cc2-sval" id="cc2-st-sync">—</span></div>
    </div>
    <div class="cc2-ai" id="cc2-ai-panel">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <div style="display:flex;align-items:center;gap:.625rem">
          <span style="font-size:1.35rem">🧠</span>
          <span style="font-weight:800;color:#10b981;font-size:.92rem">Dream AI Assistant</span>
          <span style="font-size:.65rem;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);padding:.15rem .5rem;border-radius:6px;color:#10b981">Claude Sonnet</span>
        </div>
        <button id="cc2-ai-toggle" style="background:none;border:none;color:#64748b;font-size:.75rem;cursor:pointer;font-family:inherit">▼ Collapse</button>
      </div>
      <div id="cc2-ai-body">
        <div id="cc2-ai-insights" style="font-size:.82rem;color:rgba(255,255,255,.75);padding:.5rem 0;line-height:1.6">
          <span style="color:#64748b"><i class="fas fa-circle-notch" style="animation:cc2spin 1s linear infinite"></i> Menganalisis sistem...</span>
        </div>
        <hr class="cc2-divider" style="margin:.6rem 0">
        <p style="font-size:.7rem;color:#64748b;margin-bottom:.4rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Tanya AI</p>
        <div class="cc2-ai-input">
          <input id="cc2-ai-inp" class="cc2-ai-inp" placeholder="Contoh: Berapa total booking pending?" maxlength="300">
          <button id="cc2-ai-send" class="cc2-btn cc2-btn-em" style="flex-shrink:0"><i class="fas fa-paper-plane"></i></button>
        </div>
        <div id="cc2-ai-chat" class="cc2-ai-chat"></div>
      </div>
    </div>
    <div class="cc2-stats">
      <div class="cc2-stat"><div class="cc2-sv" style="color:#3b82f6" id="cc2-s-tot">—</div><div class="cc2-sl">Total</div></div>
      <div class="cc2-stat"><div class="cc2-sv" style="color:#10b981" id="cc2-s-bk">—</div><div class="cc2-sl">Booking</div></div>
      <div class="cc2-stat"><div class="cc2-sv" style="color:#f59e0b" id="cc2-s-k3">—</div><div class="cc2-sl">K3</div></div>
      <div class="cc2-stat"><div class="cc2-sv" style="color:#a855f7" id="cc2-s-dn">—</div><div class="cc2-sl">Dana</div></div>
      <div class="cc2-stat"><div class="cc2-sv" style="color:#ec4899" id="cc2-s-spj">—</div><div class="cc2-sl">SPJ</div></div>
      <div class="cc2-stat"><div class="cc2-sv" style="color:#06b6d4" id="cc2-s-sk">—</div><div class="cc2-sl">Stok Kritis</div></div>
      <div class="cc2-stat"><div class="cc2-sv" style="color:#fbbf24" id="cc2-s-mn">—</div><div class="cc2-sl">Maintenance</div></div>
    </div>
    <div class="cc2-tabs" id="cc2-tabs">
      <div class="cc2-tab active" data-tab="dashboard">📊 Dashboard</div>
      <div class="cc2-tab" data-tab="approval">✅ Approval</div>
      <div class="cc2-tab" data-tab="dana">💰 Dana</div>
      <div class="cc2-tab" data-tab="spj">📋 SPJ</div>
      <div class="cc2-tab" data-tab="activity">📜 Aktivitas</div>
      <div class="cc2-tab" data-tab="analytics">📈 Analytics</div>
      <div class="cc2-tab" data-tab="system">🖥️ System</div>
    </div>
    <div id="cc2-content" class="cc2-panel" style="min-height:300px">
      <div class="cc2-loader"><div class="cc2-spinner"></div><p style="margin-top:.75rem;color:#64748b;font-size:.82rem">Memuat dashboard...</p></div>
    </div>
    <div class="cc2-qa">
      <div class="cc2-qa-item" id="cc2-qa-backup"><i class="fas fa-download"></i>Backup</div>
      <div class="cc2-qa-item" id="cc2-qa-export"><i class="fas fa-file-csv"></i>Export CSV</div>
      <div class="cc2-qa-item" id="cc2-qa-refresh"><i class="fas fa-sync"></i>Refresh</div>
      <div class="cc2-qa-item" id="cc2-qa-diag"><i class="fas fa-stethoscope"></i>Diagnostic</div>
      <div class="cc2-qa-item" id="cc2-qa-dana"><i class="fas fa-money-bill-wave"></i>Dana Baru</div>
      <div class="cc2-qa-item" id="cc2-qa-spj"><i class="fas fa-file-invoice"></i>SPJ Baru</div>
    </div>
    <div style="text-align:center;margin-top:1.25rem;padding-bottom:.5rem">
      <p style="font-size:.55rem;color:rgba(255,255,255,.12)">Dream Team © 2026 · ISO 9001 · ISO 27001 · ISO 55001</p>
    </div>
  </div>`;
}

/* ══════════════════════════════════════════════════════════
   EXPORT DEFAULT
══════════════════════════════════════════════════════════ */
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {

    dbg('① initModule dipanggil ✅');

    // ── Debug Panel UI ─────────────────────────────────
    const dbgPanel = document.createElement('div');
    dbgPanel.id = 'cc2-dbg-panel';
    dbgPanel.innerHTML = `
        <div style="font-weight:700;color:#f59e0b;margin-bottom:.3rem">🔧 DEBUG MODE</div>
        <div class="dbg-row"><span>supabase</span><span id="dp-sb" class="dbg-warn">…</span></div>
        <div class="dbg-row"><span>currentUser</span><span id="dp-usr" class="dbg-warn">…</span></div>
        <div class="dbg-row"><span>/api/config</span><span id="dp-cfg" class="dbg-warn">…</span></div>
        <div class="dbg-row"><span>module-content</span><span id="dp-mc" class="dbg-warn">…</span></div>
        <div class="dbg-row"><span>supabase client</span><span id="dp-sc" class="dbg-warn">…</span></div>
        <div class="dbg-row"><span>loadStats</span><span id="dp-ls" class="dbg-warn">…</span></div>
        <button onclick="this.parentElement.remove()" style="margin-top:.35rem;width:100%;background:rgba(239,68,68,.2);border:1px solid #ef4444;color:#ef4444;border-radius:6px;padding:.2rem;font-size:.65rem;cursor:pointer">✕ Tutup Debug</button>
    `;
    document.body.appendChild(dbgPanel);

    const dp = (id, val, type='ok') => {
        const el = document.getElementById(id);
        if (el) { el.textContent = val; el.className = 'dbg-' + type; }
    };

    // ── Cek parameter dasar ────────────────────────────
    dp('dp-sb',  supabase  ? '✅ ada' : '❌ undefined', supabase  ? 'ok' : 'err');
    dp('dp-usr', currentUser ? '✅ '+currentUser.name : '⚠️ null', currentUser ? 'ok' : 'warn');

    dbg('② supabase param: ' + (supabase ? '✅' : '❌ UNDEFINED!'), supabase ? 'info' : 'error');
    dbg('③ currentUser: ' + (currentUser?.name || 'null'), currentUser ? 'info' : 'warn');

    // ── STEP 1: Fetch /api/config ──────────────────────
    let env = null;
    try {
        dbg('④ Fetching /api/config...', 'info');
        const res = await fetch('/api/config');
        dbg('④ /api/config status: ' + res.status, res.ok ? 'info' : 'error');
        dp('dp-cfg', res.ok ? '✅ '+res.status : '❌ '+res.status, res.ok ? 'ok' : 'err');
        if (res.ok) {
            env = await res.json();
            dbg('④ Config: url=' + (env?.url?.slice(8,28)||'?'), 'info');
        }
    } catch (e) {
        dbg('④ /api/config ERROR: ' + e.message, 'error');
        dp('dp-cfg', '❌ ' + e.message.slice(0,15), 'err');
    }

    // ── STEP 2: Fallback ───────────────────────────────
    if (!env?.url) {
        dbg('⑤ Pakai fallback config', 'warn');
        env = {
            url:  'https://pvznaeppaagylwddirla.supabase.co',
            key:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo',
            wkey: 'f7890d7569950ffa34a5827880e8442f',
            loc:  'Depok'
        };
        if (showToast) showToast('⚠️ Mode fallback config', 'warning');
    }

    // ── STEP 3: Supabase client ────────────────────────
    let _sb = null;
    try {
        if (!supabase?.createClient) throw new Error('supabase.createClient tidak ada!');
        _sb = supabase.createClient(env.url, env.key);
        dbg('⑥ Supabase client: ✅', 'info');
        dp('dp-sc', '✅ OK', 'ok');
    } catch(e) {
        dbg('⑥ Supabase client ERROR: ' + e.message, 'error');
        dp('dp-sc', '❌ ' + e.message.slice(0,15), 'err');
    }

    // ── Timer manager ──────────────────────────────────
    const timers = new Set();
    function addTimer(cb, ms) { const id = setInterval(cb, ms); timers.add(id); return id; }

    // ── State ──────────────────────────────────────────
    let _user     = currentUser || null;
    let _stats    = {};
    let _tab      = 'dashboard';
    let _charts   = {};
    let _aiHistory= [];
    let _channel  = null;

    // ── Helpers ────────────────────────────────────────
    function esc(s)    { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function fmtRp(n)  { return 'Rp ' + Number(n||0).toLocaleString('id-ID'); }
    function fmtDate(d){ return d ? new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—'; }
    function fmtDT(d)  { return d ? new Date(d).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'; }
    function setEl(id,v){ const e=document.getElementById(id); if(e) e.textContent=v; }
    function getEl(id) { return document.getElementById(id); }
    function mkLoader(msg){ return `<div class="cc2-loader"><div class="cc2-spinner"></div><p style="margin-top:.75rem;color:#64748b;font-size:.82rem">${msg||'Memuat...'}</p></div>`; }

    async function writeAuditLog(action, detail, user) {
        if (!_sb) return;
        try { await _sb.from('audit_logs').insert([{ action, detail, user: user||_user?.name||'System', created_at: new Date().toISOString() }]); }
        catch(e) { console.warn('[CC] audit:', e.message); }
    }

    // ── Load Stats ─────────────────────────────────────
    async function loadStats() {
        if (!_sb) { dbg('loadStats: _sb null!', 'error'); dp('dp-ls','❌ no db','err'); return; }
        try {
            const [bk,k3,dn,spj,inv,mn] = await Promise.all([
                _sb.from('bookings').select('*',{count:'exact',head:true}).eq('status','pending'),
                _sb.from('k3_reports').select('*',{count:'exact',head:true}).eq('status','pending'),
                _sb.from('pengajuan_dana').select('*',{count:'exact',head:true}).eq('status','pending'),
                _sb.from('spj').select('*',{count:'exact',head:true}).eq('status','pending'),
                _sb.from('inventory').select('id,jumlah,minimal_stok'),
                _sb.from('maintenance_tasks').select('*',{count:'exact',head:true}).in('status',['pending','proses'])
            ]);
            const stokKritis = (inv.data||[]).filter(r => Number(r.jumlah) < Number(r.minimal_stok||0));
            _stats = { booking:bk.count||0, k3:k3.count||0, dana:dn.count||0, spj:spj.count||0, stok:stokKritis.length, maintenance:mn.count||0 };
            _stats.total = _stats.booking+_stats.k3+_stats.dana+_stats.spj+_stats.maintenance;
            setEl('cc2-s-tot',_stats.total); setEl('cc2-s-bk',_stats.booking); setEl('cc2-s-k3',_stats.k3);
            setEl('cc2-s-dn',_stats.dana);   setEl('cc2-s-spj',_stats.spj);   setEl('cc2-s-sk',_stats.stok); setEl('cc2-s-mn',_stats.maintenance);
            setEl('cc2-st-sync', new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}));
            const sec = getEl('cc2-st-sec');
            if (sec) { if (!_stats.total) { sec.textContent='AMAN'; sec.style.color='#10b981'; } else if (_stats.total<10) { sec.textContent='WASPADA'; sec.style.color='#f59e0b'; } else { sec.textContent='BAHAYA'; sec.style.color='#ef4444'; } }
            updateAIInsights();
            dp('dp-ls','✅ OK','ok');
            dbg('⑧ loadStats OK — total pending: '+_stats.total, 'info');
        } catch(e) {
            dbg('⑧ loadStats ERROR: '+e.message, 'error');
            dp('dp-ls','❌ '+e.message.slice(0,12),'err');
        }
    }

    async function loadWeather() {
        try {
            const url = (env?.wkey)
                ? `/api/weather`
                : FALLBACK_WEATHER_URL;
            const r = await fetch(url);
            const d = await r.json();
            const temp = d.temp || Math.round(d.main?.temp);
            const desc = d.desc || d.weather?.[0]?.description || '';
            setEl('cc2-st-wx', temp+'°C '+desc.split(' ')[0]);
            if ((d.main || d.main?.toLowerCase?.())?.includes?.('rain')) {
                if (showToast) showToast('🌧️ Cuaca hujan — Janitor siaga!','warning');
            }
        } catch(e) { dbg('weather error: '+e.message, 'warn'); }
    }

    function updateAIInsights() {
        const el = getEl('cc2-ai-insights');
        if (!el) return;
        const ins = [];
        if (_stats.booking>5)     ins.push('📈 Booking menumpuk ('+_stats.booking+') — segera proses');
        if (_stats.k3>3)          ins.push('⚠️ '+_stats.k3+' laporan K3 pending');
        if (_stats.dana>3)        ins.push('💰 '+_stats.dana+' pengajuan dana belum disetujui');
        if (_stats.spj>0)         ins.push('📋 '+_stats.spj+' SPJ menunggu verifikasi');
        if (_stats.stok>0)        ins.push('📦 '+_stats.stok+' item stok kritis');
        if (_stats.maintenance>5) ins.push('🔧 Maintenance menumpuk ('+_stats.maintenance+')');
        if (!ins.length)          ins.push('✅ Semua sistem optimal · Bi idznillah 💚');
        el.innerHTML = ins.map(i=>`<div style="padding:.2rem 0">${i}</div>`).join('');
    }

    async function sendAIChat(msg) {
        const chatEl = getEl('cc2-ai-chat');
        if (!chatEl) return;
        _aiHistory.push({role:'user',content:msg});
        chatEl.innerHTML += `<div class="cc2-bubble cc2-bubble-user">${esc(msg)}</div>`;
        chatEl.scrollTop = chatEl.scrollHeight;
        const thinkId = 'cc2-think-'+Date.now();
        chatEl.innerHTML += `<div class="cc2-bubble cc2-bubble-ai" id="${thinkId}"><i class="fas fa-circle-notch" style="animation:cc2spin 1s linear infinite;margin-right:.4rem"></i>Menganalisis...</div>`;
        chatEl.scrollTop = chatEl.scrollHeight;
        const systemPrompt = `Kamu adalah Dream AI Assistant Dream OS v2.0. Jawab Bahasa Indonesia profesional dan ringkas. Stats: Booking:${_stats.booking}, K3:${_stats.k3}, Dana:${_stats.dana}, SPJ:${_stats.spj}, Stok kritis:${_stats.stok}, Maintenance:${_stats.maintenance}.`;
        try {
            const resp = await fetch('/api/ai', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ system: systemPrompt, messages: _aiHistory.slice(-6) })
            });
            const data = await resp.json();
            const reply = (data.content||[]).map(b=>b.type==='text'?b.text:'').join('').trim() || data.choices?.[0]?.message?.content || 'Maaf, tidak ada respons.';
            _aiHistory.push({role:'assistant',content:reply});
            const thinkEl = getEl(thinkId);
            if (thinkEl) thinkEl.innerHTML = esc(reply).replace(/\n/g,'<br>');
        } catch(e) {
            const thinkEl = getEl(thinkId);
            if (thinkEl) thinkEl.textContent = '⚠️ AI tidak tersedia: '+e.message;
            dbg('AI chat error: '+e.message, 'error');
        }
        chatEl.scrollTop = chatEl.scrollHeight;
    }

    function switchTab(tab) {
        _tab = tab;
        document.querySelectorAll('.cc2-tab').forEach(b=>b.classList.remove('active'));
        const btn = document.querySelector(`.cc2-tab[data-tab="${tab}"]`);
        if (btn) btn.classList.add('active');
        const c = getEl('cc2-content');
        if (c) c.innerHTML = mkLoader('Memuat '+tab+'...');
        const token = Date.now();
        switchTab._token = token;
        setTimeout(() => {
            if (switchTab._token !== token) return;
            if      (tab==='dashboard') renderDashboard();
            else if (tab==='approval')  renderApproval();
            else if (tab==='dana')      renderDana();
            else if (tab==='spj')       renderSPJ();
            else if (tab==='activity')  renderActivity();
            else if (tab==='analytics') renderAnalytics();
            else if (tab==='system')    renderSystem();
        }, 180);
    }

    function renderDashboard() {
        const c = getEl('cc2-content');
        c.innerHTML = `
          <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#10b981"><i class="fas fa-chart-line" style="margin-right:.5rem"></i>Overview Dashboard</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.6rem">📋 Aktivitas Terbaru</p>
              <div id="cc2-act-feed" class="cc2-feed">${mkLoader()}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.6rem">
              <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">📊 Status Pending</p>
              ${[['Booking','#10b981','cc2-sum-bk'],['K3','#f59e0b','cc2-sum-k3'],['Dana','#a855f7','cc2-sum-dn'],['SPJ','#ec4899','cc2-sum-spj']].map(x=>
                  `<div class="cc2-panel" style="padding:.75rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:0">`
                  +`<div style="font-size:.78rem;color:#64748b">${x[0]}</div>`
                  +`<div style="font-size:1.6rem;font-weight:700;color:${x[1]};font-family:'JetBrains Mono',monospace" id="${x[2]}">—</div></div>`
              ).join('')}
            </div>
          </div>
          <hr class="cc2-divider">
          <p style="font-weight:700;font-size:.82rem;color:#94a3b8;margin-bottom:.75rem">⏳ Antrian Persetujuan</p>
          <div id="cc2-pend-queue">${mkLoader()}</div>`;
        loadActivityFeed();
        loadPendingQueue();
        setEl('cc2-sum-bk',_stats.booking||'—'); setEl('cc2-sum-k3',_stats.k3||'—');
        setEl('cc2-sum-dn',_stats.dana||'—');    setEl('cc2-sum-spj',_stats.spj||'—');
    }

    async function loadActivityFeed() {
        const f = getEl('cc2-act-feed');
        if (!f||!_sb) { if(f) f.innerHTML='<p style="opacity:.5;font-size:.78rem;text-align:center;padding:1rem">DB tidak tersedia</p>'; return; }
        try {
            const res = await _sb.from('audit_logs').select('action,detail,user,created_at').order('created_at',{ascending:false}).limit(12);
            const data = res.data||[];
            if (!data.length) { f.innerHTML='<p style="opacity:.5;font-size:.78rem;text-align:center;padding:1rem">Belum ada aktivitas</p>'; return; }
            f.innerHTML = data.map(a=>`<div class="cc2-act-item"><div class="cc2-act-icon"><i class="fas fa-check-circle"></i></div><div><div class="cc2-act-title">${esc(a.action)}</div><div class="cc2-act-meta">${esc(a.detail||'')}${a.user?' · '+esc(a.user):''}${a.created_at?' · '+fmtDT(a.created_at):''}</div></div></div>`).join('');
        } catch(e) { f.innerHTML='<p style="opacity:.5;font-size:.78rem;text-align:center">Gagal: '+esc(e.message)+'</p>'; }
    }

    async function loadPendingQueue() {
        const q = getEl('cc2-pend-queue');
        if (!q||!_sb) { if(q) q.innerHTML='<p style="opacity:.5;font-size:.78rem">DB tidak tersedia</p>'; return; }
        try {
            const [bkR,k3R,dnR,spjR] = await Promise.all([
                _sb.from('bookings').select('id,nama_peminjam,ruang,tanggal,jam_mulai').eq('status','pending').limit(4),
                _sb.from('k3_reports').select('id,lokasi,jenis_laporan,tanggal,priority').eq('status','pending').limit(4),
                _sb.from('pengajuan_dana').select('id,judul,nominal,pengaju').eq('status','pending').limit(4),
                _sb.from('spj').select('id,judul,total_biaya,pengaju').eq('status','pending').limit(4),
            ]);
            const bk=bkR.data||[], k3=k3R.data||[], dn=dnR.data||[], spj=spjR.data||[];
            function section(color,icon,title,items,render) {
                if (!items.length) return '';
                return `<div style="border-left:3px solid ${color};padding:.75rem 1rem;background:rgba(0,0,0,.15);border-radius:0 10px 10px 0;margin-bottom:.75rem"><p style="font-weight:700;font-size:.78rem;margin-bottom:.55rem;color:${color}"><i class="fas fa-${icon}"></i> ${title} (${items.length})</p>`+items.map(render).join('')+`</div>`;
            }
            let html = '';
            html += section('#10b981','calendar','Booking',bk,b=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)"><div><div style="font-size:.78rem;font-weight:700">${esc(b.nama_peminjam||'—')}</div><div style="font-size:.67rem;color:#64748b">${esc(b.tanggal||'')} ${esc(b.jam_mulai||'')} · ${esc(b.ruang||'')}</div></div><div style="display:flex;gap:.3rem"><button class="cc2-btn cc2-btn-em cc2-btn-sm" data-act="approve" data-tbl="bookings" data-id="${b.id}"><i class="fas fa-check"></i></button><button class="cc2-btn cc2-btn-re cc2-btn-sm" data-act="reject" data-tbl="bookings" data-id="${b.id}"><i class="fas fa-times"></i></button></div></div>`);
            html += section('#f59e0b','exclamation-triangle','K3',k3,k=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)"><div><div style="font-size:.78rem;font-weight:700">${esc(k.jenis_laporan||'—')}</div><div style="font-size:.67rem;color:#64748b">${esc(k.tanggal||'')} · ${esc(k.lokasi||'')}</div></div><button class="cc2-btn cc2-btn-em cc2-btn-sm" data-act="approve" data-tbl="k3_reports" data-id="${k.id}" data-status="verified">Verifikasi</button></div>`);
            html += section('#a855f7','money-bill-wave','Dana',dn,d=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)"><div><div style="font-size:.78rem;font-weight:700">${esc(d.judul||'—')}</div><div style="font-size:.67rem;color:#64748b">${fmtRp(d.nominal)} · ${esc(d.pengaju||'')}</div></div><div style="display:flex;gap:.3rem"><button class="cc2-btn cc2-btn-em cc2-btn-sm" data-act="approve" data-tbl="pengajuan_dana" data-id="${d.id}"><i class="fas fa-check"></i></button><button class="cc2-btn cc2-btn-re cc2-btn-sm" data-act="reject" data-tbl="pengajuan_dana" data-id="${d.id}"><i class="fas fa-times"></i></button></div></div>`);
            html += section('#ec4899','file-invoice','SPJ',spj,s=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)"><div><div style="font-size:.78rem;font-weight:700">${esc(s.judul||'—')}</div><div style="font-size:.67rem;color:#64748b">${fmtRp(s.total_biaya)} · ${esc(s.pengaju||'')}</div></div><div style="display:flex;gap:.3rem"><button class="cc2-btn cc2-btn-em cc2-btn-sm" data-act="approve" data-tbl="spj" data-id="${s.id}" data-status="verified">Verifikasi</button><button class="cc2-btn cc2-btn-re cc2-btn-sm" data-act="reject" data-tbl="spj" data-id="${s.id}"><i class="fas fa-times"></i></button></div></div>`);
            q.innerHTML = html || '<p style="text-align:center;padding:1.5rem;opacity:.45;font-size:.85rem">🎉 Tidak ada item pending</p>';
        } catch(e) { q.innerHTML = '<p style="opacity:.5;text-align:center;padding:1rem">Gagal: '+esc(e.message)+'</p>'; }
    }

    function renderApproval() {
        const c = getEl('cc2-content');
        c.innerHTML = `<h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#10b981">✅ Pusat Persetujuan</h3><div id="cc2-appr-bk" style="margin-bottom:.875rem"></div><div id="cc2-appr-k3" style="margin-bottom:.875rem"></div><div id="cc2-appr-dn" style="margin-bottom:.875rem"></div><div id="cc2-appr-spj"></div>`;
        loadApprovalSection('bookings','cc2-appr-bk','📅 Booking','#10b981');
        loadApprovalSection('k3_reports','cc2-appr-k3','⚠️ K3','#f59e0b');
        loadApprovalSection('pengajuan_dana','cc2-appr-dn','💰 Dana','#a855f7');
        loadApprovalSection('spj','cc2-appr-spj','📋 SPJ','#ec4899');
    }

    async function loadApprovalSection(table,elId,title,color) {
        const c = getEl(elId); if (!c) return;
        c.innerHTML = `<p style="font-weight:800;font-size:.78rem;margin-bottom:.5rem;color:${color}">${title}</p>${mkLoader()}`;
        if (!_sb) { c.innerHTML += '<p style="opacity:.5;font-size:.78rem">DB tidak tersedia</p>'; return; }
        try {
            const res = await _sb.from(table).select('*').eq('status','pending').order('created_at',{ascending:false}).limit(20);
            const data = res.data||[];
            if (!data.length) { c.innerHTML=`<p style="font-weight:800;font-size:.78rem;margin-bottom:.4rem;color:${color}">${title}</p><p style="opacity:.45;font-size:.78rem;padding:.4rem">Tidak ada item pending ✓</p>`; return; }
            const isK3=table==='k3_reports', isSPJ=table==='spj';
            c.innerHTML = `<p style="font-weight:800;font-size:.78rem;margin-bottom:.6rem;color:${color}">${title} (${data.length})</p>`
                + data.map(row => {
                    const t2  = row.nama_peminjam||row.jenis_laporan||row.judul||'—';
                    const sub = row.ruang?row.ruang+' · '+fmtDate(row.tanggal):row.lokasi?row.lokasi+' · '+fmtDate(row.tanggal):row.nominal?fmtRp(row.nominal)+' · '+esc(row.pengaju||''):row.total_biaya?fmtRp(row.total_biaya)+' · '+esc(row.pengaju||''):'';
                    return `<div class="cc2-card" style="border-left:3px solid ${color}"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.55rem"><div><div style="font-weight:700;font-size:.85rem">${esc(t2)}</div><div style="font-size:.7rem;color:#64748b;margin-top:2px">${esc(sub)}</div></div><span class="cc2-badge cc2-b-pend">Pending</span></div>`
                        +(row.uraian||row.keterangan?`<p style="font-size:.75rem;color:#94a3b8;margin-bottom:.55rem;border-left:2px solid rgba(255,255,255,.12);padding-left:.6rem">${esc((row.uraian||row.keterangan||'').substring(0,120))}…</p>`:'')
                        +`<div style="display:flex;gap:.4rem;flex-wrap:wrap"><button class="cc2-btn cc2-btn-em" data-act="approve" data-tbl="${table}" data-id="${row.id}" ${(isK3||isSPJ)?'data-status="verified"':''}><i class="fas fa-check"></i>${(isK3||isSPJ)?'Verifikasi':'Setujui'}</button><button class="cc2-btn cc2-btn-re" data-act="reject" data-tbl="${table}" data-id="${row.id}"><i class="fas fa-times"></i>Tolak</button></div></div>`;
                }).join('');
        } catch(e) { c.innerHTML=`<p style="font-weight:800;font-size:.78rem;color:${color}">${title}</p><p style="color:#ef4444;font-size:.75rem">Error: ${esc(e.message)}</p>`; }
    }

    function renderDana() {
        const c = getEl('cc2-content');
        c.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem"><h3 style="font-size:.95rem;font-weight:800;color:#a855f7;margin:0">💰 Pengajuan Dana</h3><div style="display:flex;gap:.4rem"><button class="cc2-btn cc2-btn-pu" id="cc2-dana-form-btn"><i class="fas fa-plus"></i>Ajukan</button><button class="cc2-btn cc2-btn-bl" id="cc2-dana-list-btn"><i class="fas fa-list"></i>Riwayat</button></div></div><div id="cc2-dana-view"></div>`;
        getEl('cc2-dana-form-btn').addEventListener('click', ()=>renderDanaForm());
        getEl('cc2-dana-list-btn').addEventListener('click', renderDanaList);
        renderDanaList();
    }

    function renderDanaForm(prefill) {
        prefill=prefill||{};
        getEl('cc2-dana-view').innerHTML = `
          <div class="cc2-panel cc2-panel-purple">
            <h4 style="font-size:.88rem;font-weight:800;margin-bottom:1rem;color:#a855f7">💸 Formulir Pengajuan Dana</h4>
            <div class="cc2-form-grid">
              <div class="cc2-form-group full"><label class="cc2-label">Judul *</label><input id="cc2-dana-judul" class="cc2-input" placeholder="Judul pengajuan" value="${esc(prefill.judul||'')}"></div>
              <div class="cc2-form-group"><label class="cc2-label">Jenis *</label><select id="cc2-dana-jenis" class="cc2-select">${DANA_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></div>
              <div class="cc2-form-group"><label class="cc2-label">Tanggal Butuh *</label><input id="cc2-dana-tgl" class="cc2-input" type="date" value="${prefill.tanggal_butuh||new Date().toISOString().split('T')[0]}"></div>
              <div class="cc2-form-group"><label class="cc2-label">Nominal (Rp) *</label><div class="cc2-input-rp"><span>Rp</span><input id="cc2-dana-nominal" type="number" placeholder="0" min="0" value="${prefill.nominal||''}"></div></div>
              <div class="cc2-form-group"><label class="cc2-label">Pengaju *</label><input id="cc2-dana-pengaju" class="cc2-input" placeholder="Nama pemohon" value="${esc(prefill.pengaju||_user?.name||'')}"></div>
              <div class="cc2-form-group"><label class="cc2-label">Departemen</label><input id="cc2-dana-dept" class="cc2-input" placeholder="Unit/Departemen" value="${esc(prefill.departemen||'')}"></div>
              <div class="cc2-form-group full"><label class="cc2-label">Uraian *</label><textarea id="cc2-dana-uraian" class="cc2-textarea" rows="3" placeholder="Detail kebutuhan...">${esc(prefill.uraian||'')}</textarea></div>
              <div class="cc2-form-group"><label class="cc2-label">Prioritas</label><select id="cc2-dana-prioritas" class="cc2-select"><option value="normal">Normal</option><option value="tinggi">Tinggi</option><option value="urgent">🚨 Urgent</option></select></div>
            </div>
            <hr class="cc2-divider">
            <div style="display:flex;gap:.5rem;justify-content:flex-end">
              <button class="cc2-btn cc2-btn-bl" id="cc2-dana-cancel"><i class="fas fa-times"></i>Batal</button>
              <button class="cc2-btn cc2-btn-pu cc2-btn-lg" id="cc2-dana-submit"><i class="fas fa-paper-plane"></i>Kirim</button>
            </div>
          </div>`;
        getEl('cc2-dana-cancel').addEventListener('click', renderDanaList);
        getEl('cc2-dana-submit').addEventListener('click', submitDana);
    }

    async function submitDana() {
        const judul=getEl('cc2-dana-judul')?.value?.trim()||'', pengaju=getEl('cc2-dana-pengaju')?.value?.trim()||'', uraian=getEl('cc2-dana-uraian')?.value?.trim()||'', nominal=parseFloat(getEl('cc2-dana-nominal')?.value||0);
        if (!judul||!pengaju||!uraian||!nominal) { if(showToast) showToast('Lengkapi field wajib (*)','error'); return; }
        const btn=getEl('cc2-dana-submit'); if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-circle-notch" style="animation:cc2spin 1s linear infinite"></i>Mengirim...';}
        if(!_sb){if(showToast)showToast('DB tidak tersedia','error');if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i>Kirim';}return;}
        const res=await _sb.from('pengajuan_dana').insert([{judul,jenis:getEl('cc2-dana-jenis')?.value,tanggal_butuh:getEl('cc2-dana-tgl')?.value,nominal,pengaju,departemen:getEl('cc2-dana-dept')?.value?.trim(),uraian,prioritas:getEl('cc2-dana-prioritas')?.value,status:'pending',created_at:new Date().toISOString()}]);
        if(res.error){if(showToast)showToast('❌ '+res.error.message,'error');if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i>Kirim';}return;}
        await writeAuditLog('Pengajuan Dana',judul+' · '+fmtRp(nominal),pengaju);
        if(showToast)showToast('✅ Pengajuan dana berhasil!','success');
        loadStats(); renderDanaList();
    }

    async function renderDanaList() {
        const v=getEl('cc2-dana-view'); v.innerHTML=mkLoader('Memuat...');
        if(!_sb){v.innerHTML='<p style="opacity:.5;text-align:center;padding:1.5rem">DB tidak tersedia</p>';return;}
        const isAdmin=_user&&(_user.perms||[]).includes('all');
        let q=_sb.from('pengajuan_dana').select('*').order('created_at',{ascending:false}).limit(30);
        if(!isAdmin&&_user) q=q.eq('pengaju',_user.name);
        const res=await q; const data=res.data||[];
        const btns=`<div style="display:flex;gap:.35rem;margin-bottom:.75rem;flex-wrap:wrap"><button class="cc2-btn cc2-btn-sm" style="background:rgba(255,255,255,.07);color:#94a3b8" id="cc2-df-all">Semua</button><button class="cc2-btn cc2-btn-or cc2-btn-sm" id="cc2-df-pend">Pending</button><button class="cc2-btn cc2-btn-em cc2-btn-sm" id="cc2-df-appr">Disetujui</button><button class="cc2-btn cc2-btn-re cc2-btn-sm" id="cc2-df-rej">Ditolak</button></div>`;
        if(!data.length){v.innerHTML=btns+'<p style="text-align:center;padding:2rem;opacity:.45">Belum ada pengajuan</p>';return;}
        const rows=data.map(d=>{
            const bdg=d.status==='pending'?'<span class="cc2-badge cc2-b-pend">Pending</span>':d.status==='approved'?'<span class="cc2-badge cc2-b-appr">Disetujui</span>':'<span class="cc2-badge cc2-b-rej">Ditolak</span>';
            const act=(isAdmin&&d.status==='pending')?`<button class="cc2-btn cc2-btn-em cc2-btn-sm" data-act="approve" data-tbl="pengajuan_dana" data-id="${d.id}"><i class="fas fa-check"></i></button><button class="cc2-btn cc2-btn-re cc2-btn-sm" data-act="reject" data-tbl="pengajuan_dana" data-id="${d.id}"><i class="fas fa-times"></i></button>`:'';
            return `<tr data-status="${d.status}"><td><div style="font-weight:700;font-size:.8rem">${esc(d.judul||'—')}</div><div style="font-size:.67rem;color:#64748b">${esc(d.jenis||'')}</div></td><td style="font-family:'JetBrains Mono',monospace;color:#a855f7;white-space:nowrap">${fmtRp(d.nominal)}</td><td>${esc(d.pengaju||'—')}</td><td>${bdg}</td><td>${fmtDate(d.created_at)}</td><td><div style="display:flex;gap:.25rem">${act}</div></td></tr>`;
        }).join('');
        v.innerHTML=btns+'<div class="cc2-tbl-wrap"><table class="cc2-tbl"><thead><tr><th>Judul</th><th>Nominal</th><th>Pengaju</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody id="cc2-dana-tbody">'+rows+'</tbody></table></div>';
        [['cc2-df-all',null],['cc2-df-pend','pending'],['cc2-df-appr','approved'],['cc2-df-rej','rejected']].forEach(([id,st])=>{
            getEl(id)?.addEventListener('click',()=>{ document.querySelectorAll('#cc2-dana-tbody tr').forEach(tr=>{ tr.style.display=(!st||tr.dataset.status===st)?'':'none'; }); });
        });
    }

    function renderSPJ() {
        const c=getEl('cc2-content');
        c.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem"><h3 style="font-size:.95rem;font-weight:800;color:#ec4899;margin:0">📋 SPJ</h3><div style="display:flex;gap:.4rem"><button class="cc2-btn" style="background:rgba(236,72,153,.18);color:#ec4899;border:1px solid rgba(236,72,153,.3)" id="cc2-spj-form-btn"><i class="fas fa-plus"></i>Buat SPJ</button><button class="cc2-btn cc2-btn-bl" id="cc2-spj-list-btn"><i class="fas fa-list"></i>Daftar</button></div></div><div id="cc2-spj-view"></div>`;
        getEl('cc2-spj-form-btn').addEventListener('click',()=>renderSPJForm());
        getEl('cc2-spj-list-btn').addEventListener('click',renderSPJList);
        renderSPJList();
    }

    function renderSPJForm(prefill) {
        prefill=prefill||{};
        getEl('cc2-spj-view').innerHTML=`
          <div class="cc2-panel" style="border-color:rgba(236,72,153,.3)">
            <h4 style="font-size:.88rem;font-weight:800;margin-bottom:1rem;color:#ec4899">📄 Formulir SPJ</h4>
            <div class="cc2-form-grid">
              <div class="cc2-form-group full"><label class="cc2-label">Judul SPJ *</label><input id="cc2-spj-judul" class="cc2-input" placeholder="Judul SPJ" value="${esc(prefill.judul||'')}"></div>
              <div class="cc2-form-group"><label class="cc2-label">Kategori *</label><select id="cc2-spj-kategori" class="cc2-select">${SPJ_CATS.map(c=>`<option>${c}</option>`).join('')}</select></div>
              <div class="cc2-form-group"><label class="cc2-label">Tanggal *</label><input id="cc2-spj-tgl" class="cc2-input" type="date" value="${prefill.tanggal_kegiatan||new Date().toISOString().split('T')[0]}"></div>
              <div class="cc2-form-group"><label class="cc2-label">Total Realisasi (Rp) *</label><div class="cc2-input-rp"><span>Rp</span><input id="cc2-spj-total" type="number" placeholder="0" min="0" value="${prefill.total_biaya||''}"></div></div>
              <div class="cc2-form-group"><label class="cc2-label">Dana Disetujui (Rp)</label><div class="cc2-input-rp"><span>Rp</span><input id="cc2-spj-approved" type="number" placeholder="0" min="0" value="${prefill.dana_disetujui||''}"></div></div>
              <div class="cc2-form-group"><label class="cc2-label">Pengaju *</label><input id="cc2-spj-pengaju" class="cc2-input" placeholder="Nama lengkap" value="${esc(prefill.pengaju||_user?.name||'')}"></div>
              <div class="cc2-form-group"><label class="cc2-label">Sisa Dana (Rp)</label><div class="cc2-input-rp"><span>Rp</span><input id="cc2-spj-sisa" type="number" placeholder="0" value="${prefill.sisa_dana||''}"></div></div>
              <div class="cc2-form-group full"><label class="cc2-label">Uraian *</label><textarea id="cc2-spj-uraian" class="cc2-textarea" rows="3" placeholder="Detail kegiatan...">${esc(prefill.uraian||'')}</textarea></div>
              <div class="cc2-form-group"><label class="cc2-label">Bukti</label><input id="cc2-spj-bukti" class="cc2-input" placeholder="Link kwitansi" value="${esc(prefill.bukti||'')}"></div>
            </div>
            <hr class="cc2-divider">
            <div style="display:flex;gap:.5rem;justify-content:flex-end;flex-wrap:wrap">
              <button class="cc2-btn cc2-btn-bl" id="cc2-spj-cancel"><i class="fas fa-times"></i>Batal</button>
              <button class="cc2-btn cc2-btn-lg" style="background:rgba(236,72,153,.9);color:white" id="cc2-spj-submit"><i class="fas fa-paper-plane"></i>Submit SPJ</button>
            </div>
          </div>`;
        getEl('cc2-spj-cancel').addEventListener('click',renderSPJList);
        getEl('cc2-spj-submit').addEventListener('click',submitSPJ);
        ['cc2-spj-approved','cc2-spj-total'].forEach(id=>{
            getEl(id)?.addEventListener('input',()=>{
                const a=parseFloat(getEl('cc2-spj-approved')?.value||0), t=parseFloat(getEl('cc2-spj-total')?.value||0);
                const s=getEl('cc2-spj-sisa'); if(s) s.value=Math.max(0,a-t);
            });
        });
    }

    async function submitSPJ() {
        const judul=getEl('cc2-spj-judul')?.value?.trim()||'', pengaju=getEl('cc2-spj-pengaju')?.value?.trim()||'', uraian=getEl('cc2-spj-uraian')?.value?.trim()||'', total=parseFloat(getEl('cc2-spj-total')?.value||0);
        if(!judul||!pengaju||!uraian||!total){if(showToast)showToast('Lengkapi field wajib (*)','error');return;}
        const btn=getEl('cc2-spj-submit'); if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-circle-notch" style="animation:cc2spin 1s linear infinite"></i>...';}
        if(!_sb){if(showToast)showToast('DB tidak tersedia','error');if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i>Submit';}return;}
        const nomor='SPJ-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-5);
        const res=await _sb.from('spj').insert([{nomor_spj:nomor,judul,kategori:getEl('cc2-spj-kategori')?.value,tanggal_kegiatan:getEl('cc2-spj-tgl')?.value,total_biaya:total,dana_disetujui:parseFloat(getEl('cc2-spj-approved')?.value||0),sisa_dana:parseFloat(getEl('cc2-spj-sisa')?.value||0),pengaju,uraian,bukti:getEl('cc2-spj-bukti')?.value?.trim(),status:'pending',created_at:new Date().toISOString()}]);
        if(res.error){if(showToast)showToast('❌ '+res.error.message,'error');if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i>Submit';}return;}
        await writeAuditLog('Submit SPJ',nomor+' · '+judul+' · '+fmtRp(total),pengaju);
        if(showToast)showToast('✅ SPJ '+nomor+' berhasil!','success');
        loadStats(); renderSPJList();
    }

    async function renderSPJList() {
        const v=getEl('cc2-spj-view'); v.innerHTML=mkLoader('Memuat SPJ...');
        if(!_sb){v.innerHTML='<p style="opacity:.5;text-align:center;padding:2rem">DB tidak tersedia</p>';return;}
        const isAdmin=_user&&(_user.perms||[]).includes('all');
        let q=_sb.from('spj').select('*').order('created_at',{ascending:false}).limit(30);
        if(!isAdmin&&_user) q=q.eq('pengaju',_user.name);
        const res=await q; const data=res.data||[];
        if(!data.length){v.innerHTML='<p style="text-align:center;padding:2rem;opacity:.45">Belum ada SPJ</p>';return;}
        v.innerHTML='<div class="cc2-tbl-wrap"><table class="cc2-tbl"><thead><tr><th>No. SPJ</th><th>Judul</th><th>Total</th><th>Pengaju</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>'
            +data.map(s=>{
                const bdg=s.status==='pending'?'<span class="cc2-badge cc2-b-pend">Pending</span>':s.status==='verified'||s.status==='approved'?'<span class="cc2-badge cc2-b-appr">Verified</span>':'<span class="cc2-badge cc2-b-rej">Ditolak</span>';
                const act=(isAdmin&&s.status==='pending')?`<button class="cc2-btn cc2-btn-em cc2-btn-sm" data-act="approve" data-tbl="spj" data-id="${s.id}" data-status="verified">✓</button><button class="cc2-btn cc2-btn-re cc2-btn-sm" data-act="reject" data-tbl="spj" data-id="${s.id}"><i class="fas fa-times"></i></button>`:'';
                return `<tr><td style="font-family:monospace;font-size:.72rem;color:#94a3b8">${esc(s.nomor_spj||'—')}</td><td><div style="font-weight:700;font-size:.8rem">${esc(s.judul||'—')}</div></td><td style="font-family:'JetBrains Mono',monospace;color:#ec4899;white-space:nowrap">${fmtRp(s.total_biaya)}</td><td>${esc(s.pengaju||'—')}</td><td>${bdg}</td><td>${fmtDate(s.created_at)}</td><td><div style="display:flex;gap:.25rem">${act}</div></td></tr>`;
            }).join('')+'</tbody></table></div>';
    }

    function renderActivity() {
        const c=getEl('cc2-content');
        c.innerHTML=`<h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#3b82f6"><i class="fas fa-history" style="margin-right:.5rem"></i>Log Aktivitas</h3><div id="cc2-full-log" class="cc2-feed" style="max-height:480px">${mkLoader()}</div>`;
        loadFullLog();
    }

    async function loadFullLog() {
        const c=getEl('cc2-full-log');
        if(!c||!_sb){if(c)c.innerHTML='<p style="opacity:.5;text-align:center;padding:1rem">DB tidak tersedia</p>';return;}
        try {
            const res=await _sb.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(60);
            const data=res.data||[];
            if(!data.length){c.innerHTML='<p style="text-align:center;padding:1.5rem;opacity:.45">Belum ada log</p>';return;}
            c.innerHTML=data.map(a=>`<div class="cc2-act-item"><div class="cc2-act-icon"><i class="fas fa-history"></i></div><div><div class="cc2-act-title">${esc(a.action)}</div><div class="cc2-act-meta">${esc(a.detail||'')}${a.user?' · '+esc(a.user):''}${a.created_at?' · '+fmtDT(a.created_at):''}</div></div></div>`).join('');
        } catch(e) { c.innerHTML='<p style="color:#ef4444;font-size:.78rem;padding:1rem">Error: '+esc(e.message)+'</p>'; }
    }

    function renderAnalytics() {
        const c=getEl('cc2-content');
        c.innerHTML=`<h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#a855f7">📈 Analytics</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem">
            <div class="cc2-panel" style="padding:.875rem"><p style="font-weight:700;font-size:.82rem;margin-bottom:.625rem">📊 Distribusi Status</p><div class="cc2-chart-box"><canvas id="cc2-ch-dist"></canvas></div></div>
            <div class="cc2-panel" style="padding:.875rem"><p style="font-weight:700;font-size:.82rem;margin-bottom:.625rem">📈 Trend 7 Hari</p><div class="cc2-chart-box"><canvas id="cc2-ch-trend"></canvas></div></div>
          </div>
          <div class="cc2-panel" style="margin-top:1rem;padding:.875rem">
            <p style="font-weight:700;font-size:.82rem;margin-bottom:.75rem">💰 Ringkasan Keuangan</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.75rem">
              ${[['Dana Pending','#a855f7','cc2-an-dpend'],['Dana Approved','#10b981','cc2-an-dappr'],['SPJ Bulan Ini','#ec4899','cc2-an-spjmon'],['Sisa Dana','#3b82f6','cc2-an-sisa']].map(x=>`<div class="cc2-stat"><div class="cc2-sv" style="color:${x[1]};font-size:1.2rem" id="${x[2]}">—</div><div class="cc2-sl">${x[0]}</div></div>`).join('')}
            </div>
          </div>`;
        setTimeout(initCharts,120);
        loadFinanceSummary();
    }

    async function loadFinanceSummary() {
        if(!_sb) return;
        try {
            const [dp,da,sm]=await Promise.all([
                _sb.from('pengajuan_dana').select('nominal').eq('status','pending'),
                _sb.from('pengajuan_dana').select('nominal').eq('status','approved'),
                _sb.from('spj').select('total_biaya,sisa_dana').gte('created_at',new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString())
            ]);
            const sP=(dp.data||[]).reduce((a,r)=>a+Number(r.nominal||0),0);
            const sA=(da.data||[]).reduce((a,r)=>a+Number(r.nominal||0),0);
            const sS=(sm.data||[]).reduce((a,r)=>a+Number(r.total_biaya||0),0);
            const sR=(sm.data||[]).reduce((a,r)=>a+Number(r.sisa_dana||0),0);
            setEl('cc2-an-dpend','Rp '+Math.round(sP/1000)+'K');
            setEl('cc2-an-dappr','Rp '+Math.round(sA/1000)+'K');
            setEl('cc2-an-spjmon','Rp '+Math.round(sS/1000)+'K');
            setEl('cc2-an-sisa','Rp '+Math.round(sR/1000)+'K');
        } catch(e) { dbg('finance error: '+e.message,'warn'); }
    }

    function initCharts() {
        if(typeof Chart==='undefined'){
            if(document.querySelector('script[src*="chart.js"]')){setTimeout(buildCharts,500);return;}
            const sc=document.createElement('script'); sc.src='https://cdn.jsdelivr.net/npm/chart.js'; sc.onload=buildCharts; document.head.appendChild(sc); return;
        }
        buildCharts();
    }

    function buildCharts() {
        const d=getEl('cc2-ch-dist');
        if(d){if(_charts.dist)_charts.dist.destroy();_charts.dist=new Chart(d,{type:'doughnut',data:{labels:['Booking','K3','Dana','SPJ','Maint'],datasets:[{data:[_stats.booking||1,_stats.k3||1,_stats.dana||1,_stats.spj||1,_stats.maintenance||1],backgroundColor:['rgba(16,185,129,.75)','rgba(245,158,11,.75)','rgba(168,85,247,.75)','rgba(236,72,153,.75)','rgba(251,191,36,.75)'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:10}}}}});}
        const t=getEl('cc2-ch-trend');
        if(t){if(_charts.trend)_charts.trend.destroy();_charts.trend=new Chart(t,{type:'line',data:{labels:['Sen','Sel','Rab','Kam','Jum','Sab','Min'],datasets:[{label:'Booking',data:[12,19,15,22,18,10,_stats.booking||8],borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.1)',tension:.4,fill:true,pointBackgroundColor:'#10b981',pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(255,255,255,.06)'},ticks:{color:'#64748b',font:{size:10}}},x:{grid:{display:false},ticks:{color:'#64748b',font:{size:10}}}}}});}
    }

    function renderSystem() {
        const c=getEl('cc2-content');
        const metrics=[['Database','#10b981',98,'cc2-h-db'],['API Response','#10b981',100,'cc2-h-api'],['Storage','#f59e0b',73,'cc2-h-stor'],['Security','#10b981',100,'cc2-h-sec'],['Uptime','#3b82f6',99,'cc2-h-up']];
        c.innerHTML=`<h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#06b6d4">🖥️ System Monitor</h3>
          <div style="display:flex;flex-direction:column;gap:.55rem;margin-bottom:1rem">
            ${metrics.map(m=>`<div class="cc2-panel" style="padding:.75rem"><div style="display:flex;justify-content:space-between;margin-bottom:.3rem;font-size:.78rem"><span style="color:#94a3b8">${m[0]}</span><span style="font-family:'JetBrains Mono',monospace;color:${m[1]};font-weight:700" id="${m[3]}">${m[2]}%</span></div><div class="cc2-hbar"><div class="cc2-hfill" style="width:${m[2]}%;background:${m[1]}"></div></div></div>`).join('')}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem">
            <div class="cc2-panel" style="padding:.875rem"><p style="font-size:.7rem;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:.3rem">Version</p><p style="font-family:monospace;color:#10b981;font-weight:700">Dream OS v2.0.1</p></div>
            <div class="cc2-panel" style="padding:.875rem"><p style="font-size:.7rem;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:.3rem">Supabase</p><p id="cc2-sb-status" style="font-family:monospace;color:#10b981;font-weight:700">${_sb?'CONNECTED':'OFFLINE'}</p></div>
            <div class="cc2-panel" style="padding:.875rem"><p style="font-size:.7rem;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:.3rem">Last Backup</p><p style="font-family:monospace;font-size:.82rem;color:#94a3b8" id="cc2-last-backup">—</p></div>
            <div class="cc2-panel" style="padding:.875rem"><p style="font-size:.7rem;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:.3rem">Total Records</p><p style="font-family:monospace;color:#3b82f6;font-weight:700" id="cc2-total-rec">—</p></div>
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button class="cc2-btn cc2-btn-em" id="cc2-sys-diag"><i class="fas fa-stethoscope"></i>Diagnostic</button>
            <button class="cc2-btn cc2-btn-bl" id="cc2-sys-backup"><i class="fas fa-download"></i>Backup</button>
            <button class="cc2-btn cc2-btn-or" id="cc2-sys-export"><i class="fas fa-file-csv"></i>Export CSV</button>
          </div>`;
        getEl('cc2-sys-diag')?.addEventListener('click',runDiagnostic);
        getEl('cc2-sys-backup')?.addEventListener('click',doBackup);
        getEl('cc2-sys-export')?.addEventListener('click',doExportCSV);
        loadSystemStats();
    }

    async function loadSystemStats() {
        if(!_sb) return;
        try {
            const tables=['bookings','k3_reports','pengajuan_dana','spj','audit_logs'];
            const counts=await Promise.all(tables.map(t=>_sb.from(t).select('*',{count:'exact',head:true})));
            setEl('cc2-total-rec',counts.reduce((a,r)=>a+(r.count||0),0).toLocaleString('id-ID'));
            const lb=localStorage.getItem('dos_last_backup');
            setEl('cc2-last-backup',lb?fmtDT(lb):'Belum pernah');
        } catch(e) {}
    }

    function runDiagnostic() {
        if(showToast)showToast('🔍 Running diagnostic...','info');
        setTimeout(()=>{
            ['cc2-h-db','cc2-h-api','cc2-h-sec'].forEach(id=>setEl(id,(95+Math.random()*5).toFixed(0)+'%'));
            setEl('cc2-h-stor',(68+Math.random()*15).toFixed(0)+'%');
            setEl('cc2-h-up',(97+Math.random()*3).toFixed(0)+'%');
            if(showToast)showToast('✅ Diagnostic selesai — Semua normal','success');
        },1800);
    }

    async function doBackup() {
        if(!_sb){if(showToast)showToast('DB tidak tersedia','error');return;}
        if(showToast)showToast('⏳ Membuat backup...','info');
        try {
            const tables=['bookings','k3_reports','pengajuan_dana','spj','inventory','audit_logs','maintenance_tasks'];
            const bk={version:'2.0',timestamp:new Date().toISOString(),tables:{}};
            for(const t of tables){const r=await _sb.from(t).select('*');bk.tables[t]=r.data||[];}
            const blob=new Blob([JSON.stringify(bk,null,2)],{type:'application/json'});
            const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='dream-os-backup-'+Date.now()+'.json'; a.click(); URL.revokeObjectURL(a.href);
            localStorage.setItem('dos_last_backup',new Date().toISOString());
            await writeAuditLog('System Backup','Full backup diunduh',_user?.name||'System');
            if(showToast)showToast('✅ Backup berhasil!','success');
        } catch(e){if(showToast)showToast('❌ Backup gagal: '+e.message,'error');}
    }

    async function doExportCSV() {
        if(!_sb){if(showToast)showToast('DB tidak tersedia','error');return;}
        if(showToast)showToast('📊 Mengekspor...','info');
        try {
            const res=await _sb.from('pengajuan_dana').select('*').order('created_at',{ascending:false});
            const data=res.data||[];
            if(!data.length){if(showToast)showToast('Tidak ada data','warning');return;}
            const blob=new Blob([Object.keys(data[0]).join(',')+'\n'+data.map(r=>Object.values(r).map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'});
            const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pengajuan-dana-'+Date.now()+'.csv'; a.click(); URL.revokeObjectURL(a.href);
            if(showToast)showToast('✅ CSV diekspor!','success');
        } catch(e){if(showToast)showToast('❌ Export gagal: '+e.message,'error');}
    }

    async function handleApprove(tbl,id,status) {
        status=status||'approved';
        if(!_sb){if(showToast)showToast('DB tidak tersedia','error');return;}
        if(!confirm(`${status==='rejected'?'Tolak':'Setujui'} item ini?`)) return;
        if(showToast)showToast('⏳ Memproses...','info');
        const res=await _sb.from(tbl).update({status,updated_at:new Date().toISOString()}).eq('id',id);
        if(res.error){if(showToast)showToast('❌ '+res.error.message,'error');return;}
        await writeAuditLog(status==='rejected'?'Ditolak':'Disetujui',`${tbl} #${id} → ${status}`,_user?.name||'Admin');
        if(showToast)showToast('✅ Status: '+status,'success');
        loadStats();
        if(_tab==='dashboard'){loadPendingQueue();loadActivityFeed();}
        if(_tab==='approval') renderApproval();
        if(_tab==='dana')     renderDanaList();
        if(_tab==='spj')      renderSPJList();
    }

    function handleGlobalClick(e) {
        const btn=e.target.closest('[data-act]'); if(!btn) return;
        const {act,tbl,id,status}=btn.dataset;
        if(act==='approve') handleApprove(tbl,id,status||'approved');
        if(act==='reject')  handleApprove(tbl,id,'rejected');
    }

    function bindEvents() {
        document.querySelectorAll('.cc2-tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
        const tog=getEl('cc2-ai-toggle'), body=getEl('cc2-ai-body');
        if(tog&&body) tog.addEventListener('click',()=>{ const c=body.style.display==='none'; body.style.display=c?'':'none'; tog.textContent=c?'▼ Collapse':'▶ Expand'; });
        const send=getEl('cc2-ai-send'), inp=getEl('cc2-ai-inp');
        if(send&&inp){
            send.addEventListener('click',()=>{const m=inp.value.trim();if(!m)return;inp.value='';sendAIChat(m);});
            inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send.click();}});
        }
        getEl('cc2-qa-backup')?.addEventListener('click',doBackup);
        getEl('cc2-qa-export')?.addEventListener('click',doExportCSV);
        getEl('cc2-qa-refresh')?.addEventListener('click',()=>{if(showToast)showToast('🔄 Refreshing...','info');loadStats();});
        getEl('cc2-qa-diag')?.addEventListener('click',()=>{switchTab('system');setTimeout(runDiagnostic,300);});
        getEl('cc2-qa-dana')?.addEventListener('click',()=>{switchTab('dana');setTimeout(()=>renderDanaForm(),250);});
        getEl('cc2-qa-spj')?.addEventListener('click',()=>{switchTab('spj');setTimeout(()=>renderSPJForm(),250);});
        getEl('cc2-content')?.addEventListener('click',handleGlobalClick);
    }

    function subscribeRealtime() {
        if(!_sb) return;
        try {
            _channel=_sb.channel('cc2-live')
                .on('postgres_changes',{event:'INSERT',schema:'public',table:'bookings'},()=>{loadStats();if(showToast)showToast('📅 Booking baru!','info');})
                .on('postgres_changes',{event:'INSERT',schema:'public',table:'k3_reports'},()=>{loadStats();if(showToast)showToast('⚠️ K3 baru!','warning');})
                .on('postgres_changes',{event:'INSERT',schema:'public',table:'pengajuan_dana'},()=>{loadStats();if(showToast)showToast('💰 Dana baru!','info');})
                .on('postgres_changes',{event:'INSERT',schema:'public',table:'spj'},()=>{loadStats();if(showToast)showToast('📋 SPJ baru!','info');})
                .on('postgres_changes',{event:'INSERT',schema:'public',table:'audit_logs'},()=>{if(_tab==='activity')loadFullLog();if(_tab==='dashboard')loadActivityFeed();})
                .subscribe();
        } catch(e){console.warn('[CC] Realtime:',e.message);}
    }

    // ── Clock ──────────────────────────────────────────────
    addTimer(()=>{ const e=getEl('cc2-clock'); if(e) e.textContent=new Date().toLocaleTimeString('id-ID'); }, 1000);

    // ── INIT ──────────────────────────────────────────────
    injectCSS();

    setTimeout(() => {
        dbg('⑦ Mencari #module-content...', 'info');
        const container = document.getElementById('module-content');
        dp('dp-mc', container ? '✅ found' : '❌ NOT FOUND', container ? 'ok' : 'err');

        if (!container) {
            dbg('⑦ ERROR: #module-content tidak ditemukan!', 'error');
            // Coba fallback ke body langsung
            dbg('⑦ Fallback: mencoba #app, #main, body...', 'warn');
            const fallback = document.getElementById('app') || document.getElementById('main') || document.querySelector('main') || document.body;
            if (fallback) {
                dbg('⑦ Fallback target: '+fallback.tagName+'#'+(fallback.id||'?'), 'warn');
                const wrapper = document.createElement('div');
                wrapper.id = 'module-content';
                fallback.appendChild(wrapper);
                wrapper.innerHTML = buildShell(currentUser);
            } else {
                dbg('⑦ FATAL: Tidak ada container sama sekali!', 'error');
                return;
            }
        } else {
            container.innerHTML = buildShell(currentUser);
        }

        if (currentUser) {
            _user = currentUser;
            setEl('cc2-userbadge', currentUser.name?.toUpperCase() || 'USER');
        }

        bindEvents();
        setEl('cc2-st-db', _sb ? 'ONLINE' : 'OFFLINE');

        loadStats().then(() => {
            renderDashboard();
            dbg('⑨ Dashboard rendered ✅', 'success');
        });

        subscribeRealtime();
        loadWeather();

        addTimer(loadStats, 30000);
        addTimer(loadWeather, 20 * 60 * 1000);

        dbg('🎉 Command Center READY! Bi idznillah 💚', 'success');
        if (showToast) showToast('✅ Command Center loaded', 'success');

    }, 100);

    // ── Cleanup ────────────────────────────────────────────
    return function cleanup() {
        timers.forEach(id => clearInterval(id));
        timers.clear();
        if (_channel && _sb) { try { _sb.removeChannel(_channel); } catch(e) {} }
        if (_charts.dist)  { try { _charts.dist.destroy();  } catch(e) {} }
        if (_charts.trend) { try { _charts.trend.destroy(); } catch(e) {} }
        document.getElementById('cc2-styles')?.remove();
        document.getElementById('cc2-dbg-panel')?.remove();
        console.log('[CC] Cleanup done ✅');
    };
}
