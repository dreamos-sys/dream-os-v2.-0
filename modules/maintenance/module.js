/**
 * modules/maintenance/module.js
 * Dream OS v2.0 — Modul Maintenance
 * ✅ Signature: (config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang)
 * ✅ Fitur: Manajemen tugas perbaikan, sparepart, QR asset, integrasi K3
 * ✅ CSS variabel, print styles, tier-low, audit logs
 */

'use strict';

/* ============================================================
   FALLBACK CONFIG (hanya jika supabase tidak diberikan)
============================================================ */
const SB_URL_FALLBACK = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

/* ============================================================
   CSS (menggunakan variabel, print styles, reduced motion, tier-low)
============================================================ */
function injectCSS() {
    if (document.getElementById('maint-styles')) return;
    const s = document.createElement('style');
    s.id = 'maint-styles';
    s.textContent = `
        :root {
            --maint-primary: #f97316;
            --maint-primary-light: rgba(249,115,22,0.1);
            --maint-primary-border: rgba(249,115,22,0.25);
            --maint-bg-panel: rgba(15,23,42,0.88);
            --maint-text: #e2e8f0;
            --maint-text-muted: #94a3b8;
            --maint-text-dim: #64748b;
            --maint-border: rgba(255,255,255,0.08);
            --maint-border-strong: rgba(255,255,255,0.15);
            --maint-radius: 16px;
            --maint-radius-sm: 12px;
            --maint-radius-xs: 8px;
            --maint-transition: 0.2s ease;
            --maint-shadow: 0 4px 18px rgba(249,115,22,0.15);
            --maint-font-mono: 'JetBrains Mono', monospace;
            --maint-font-sans: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        #maint-root * { box-sizing: border-box; }
        #maint-root {
            max-width: 1100px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--maint-font-sans);
            color: var(--maint-text);
        }
        .maint-panel {
            background: var(--maint-bg-panel);
            backdrop-filter: blur(18px);
            border: 1px solid var(--maint-primary-border);
            border-radius: var(--maint-radius);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: background var(--maint-transition), border-color var(--maint-transition);
        }
        .maint-panel:hover {
            background: rgba(15,23,42,0.92);
            border-color: var(--maint-primary);
        }
        .maint-header {
            background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05));
            border-left: 4px solid var(--maint-primary);
        }
        .maint-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--maint-primary), #ea580c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .maint-stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .maint-stat-card {
            background: rgba(0,0,0,0.2);
            border-radius: var(--maint-radius-sm);
            padding: 1rem;
            border-left: 3px solid var(--maint-primary);
        }
        .maint-stat-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: var(--maint-text-muted);
            letter-spacing: 0.5px;
        }
        .maint-stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 0.25rem;
            color: var(--maint-text);
        }
        .maint-tabs {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-bottom: 1.5rem;
        }
        .maint-tab {
            padding: 0.5rem 1.25rem;
            background: rgba(255,255,255,0.05);
            border-radius: 30px;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--maint-text-dim);
            cursor: pointer;
            transition: var(--maint-transition);
            border: 1px solid transparent;
        }
        .maint-tab:hover { background: var(--maint-primary-light); color: var(--maint-primary); }
        .maint-tab.active { background: var(--maint-primary); color: #020617; border-color: var(--maint-primary); }
        .maint-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.6rem 1.2rem;
            border-radius: var(--maint-radius-xs);
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: transform var(--maint-transition), background var(--maint-transition), border-color var(--maint-transition);
            border: none;
            background: rgba(255,255,255,0.08);
            color: var(--maint-text);
        }
        .maint-btn:hover:not(:disabled) { transform: translateY(-1px); background: rgba(255,255,255,0.15); }
        .maint-btn-primary {
            background: var(--maint-primary);
            color: #020617;
        }
        .maint-btn-primary:hover { background: #ea580c; }
        .maint-btn-sm {
            padding: 0.3rem 1rem;
            font-size: 0.75rem;
            border-radius: 20px;
        }
        .task-card {
            background: rgba(0,0,0,0.2);
            border-radius: var(--maint-radius);
            padding: 1rem;
            margin-bottom: 1rem;
            border: 1px solid var(--maint-border);
        }
        .task-header {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .badge {
            display: inline-block;
            padding: 0.2rem 0.75rem;
            border-radius: 30px;
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-high { background: rgba(239,68,68,0.2); color: #ef4444; }
        .badge-normal { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .badge-low { background: rgba(16,185,129,0.2); color: #10b981; }
        .badge-pending { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .badge-proses { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .badge-selesai { background: rgba(16,185,129,0.2); color: #10b981; }
        .badge-butuh { background: rgba(249,115,22,0.2); color: var(--maint-primary); }
        .maint-modal {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(4px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .maint-modal.active { display: flex; }
        .maint-modal-content {
            background: #1e293b;
            border-radius: var(--maint-radius);
            padding: 1.5rem;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid var(--maint-primary-border);
        }
        .maint-input, .maint-select, .maint-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1.5px solid var(--maint-primary-border);
            border-radius: var(--maint-radius-xs);
            color: var(--maint-text);
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            transition: border-color var(--maint-transition), box-shadow var(--maint-transition);
        }
        .maint-input:focus, .maint-select:focus, .maint-textarea:focus {
            border-color: var(--maint-primary);
            box-shadow: 0 0 0 3px var(--maint-primary-light);
        }
        .maint-select option { background: #1e293b; color: var(--maint-text); }
        .maint-textarea { resize: vertical; min-height: 80px; }
        .maint-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }
        .maint-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--maint-primary-light);
            border-top-color: var(--maint-primary);
            border-radius: 50%;
            animation: maint-spin 1s linear infinite;
        }
        @keyframes maint-spin { to { transform: rotate(360deg); } }

        /* Print styles */
        @media print {
            #maint-root {
                background: white;
                color: #1e293b;
                padding: 0.5in;
            }
            .maint-panel {
                background: white;
                backdrop-filter: none;
                border: 1px solid #ccc;
                box-shadow: none;
            }
            .maint-tabs, .maint-btn, .maint-modal {
                display: none;
            }
        }

        /* Device tier low */
        .tier-low .maint-panel {
            backdrop-filter: none;
            background: rgba(15,23,42,0.95);
        }
        .tier-low .maint-spinner {
            animation: none;
        }
    `;
    document.head.appendChild(s);
}

/* ============================================================
   EXPORT DEFAULT — signature seragam dengan modul lain
============================================================ */
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    injectCSS();

    // Gunakan fungsi yang disediakan, fallback ke lokal
    const toast = showToast || function(msg, type) {
        const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
        const el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
        const tc = document.getElementById('toast-container');
        if (tc) {
            tc.appendChild(el);
            setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 350); }, 3000);
        } else {
            el.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(16,185,129,.9);color:white;padding:9px 18px;border-radius:10px;z-index:99999;font-weight:700;font-size:.85rem;`;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2800);
        }
    };

    // Helper sanitasi
    const esc = utils?.esc || function(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    };

    // Format tanggal
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '—';
    const fmtDateTime = (d) => d ? new Date(d).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '';

    // State lokal
    let _sb = supabase || null;
    let _user = currentUser || null;
    let _lang = currentLang || 'id';
    let _currentFilter = 'semua';
    let _stokList = [];
    let _qrStream = null;
    let _beforeImage = null;
    let _afterImage = null;
    let _scannedAssetId = null;

    // Fallback inisialisasi supabase jika tidak diberikan
    function ensureSB() {
        if (_sb) return Promise.resolve(true);
        if (window.supabase?.createClient) {
            _sb = window.supabase.createClient(SB_URL_FALLBACK, SB_KEY_FALLBACK);
            return Promise.resolve(true);
        }
        return new Promise((resolve) => {
            const sc = document.createElement('script');
            sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            sc.onload = () => {
                if (window.supabase) { _sb = window.supabase.createClient(SB_URL_FALLBACK, SB_KEY_FALLBACK); resolve(true); }
                else resolve(false);
            };
            sc.onerror = () => resolve(false);
            document.head.appendChild(sc);
        });
    }

    // Helper menulis ke audit_logs
    async function writeAuditLog(action, detail) {
        if (!_sb) return;
        try {
            await _sb.from('audit_logs').insert([{
                action,
                detail,
                user: _user?.name || 'System',
                created_at: new Date().toISOString()
            }]);
        } catch (e) { console.warn('[MAINT] audit_log error:', e.message); }
    }

    /* ============================================================
       RENDER HTML (sama seperti sebelumnya, tapi dengan esc)
    ============================================================ */
    function renderRoot(container) {
        const userName = _user?.name?.toUpperCase() || 'GUEST';
        container.innerHTML = `
        <div id="maint-root">
            <!-- HEADER -->
            <div class="maint-panel maint-header" style="margin-bottom:1.5rem">
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="font-size:3rem;">🔧</div>
                    <div>
                        <div class="maint-title">MAINTENANCE</div>
                        <div style="font-size:0.75rem;color:var(--maint-text-muted);">Professional Task Management System</div>
                    </div>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">${esc(userName)}</span>
                    </div>
                </div>
            </div>

            <!-- STATS -->
            <div class="maint-stat-grid">
                <div class="maint-stat-card"><div class="maint-stat-label">TOTAL</div><div class="maint-stat-value" id="maint-stat-total">0</div></div>
                <div class="maint-stat-card"><div class="maint-stat-label">PENDING</div><div class="maint-stat-value" id="maint-stat-pending">0</div></div>
                <div class="maint-stat-card"><div class="maint-stat-label">PROSES</div><div class="maint-stat-value" id="maint-stat-proses">0</div></div>
                <div class="maint-stat-card"><div class="maint-stat-label">SELESAI</div><div class="maint-stat-value" id="maint-stat-selesai">0</div></div>
            </div>

            <!-- FILTER TABS -->
            <div class="maint-tabs" id="maint-tabs">
                <button class="maint-tab active" data-filter="semua">📋 Semua</button>
                <button class="maint-tab" data-filter="pending">⏳ Pending</button>
                <button class="maint-tab" data-filter="proses">🔨 Proses</button>
                <button class="maint-tab" data-filter="selesai">✅ Selesai</button>
                <button class="maint-tab" data-filter="history">📜 Riwayat</button>
            </div>

            <!-- NEW TASK BUTTON -->
            <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
                <button class="maint-btn maint-btn-primary" id="maint-new-task-btn">
                    <i class="fas fa-plus"></i> Buat Tugas Baru
                </button>
            </div>

            <!-- TASKS LIST -->
            <div id="maint-tasks-list" style="margin-top:1rem;">
                <div class="maint-loader"><div class="maint-spinner"></div><p style="margin-top:1rem;">Memuat tugas...</p></div>
            </div>
        </div>

        <!-- MODAL NEW TASK -->
        <div id="maint-new-task-modal" class="maint-modal">
            <div class="maint-modal-content">
                <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem; color:var(--maint-primary);">Buat Tugas Maintenance</h3>
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    <div>
                        <label class="maint-label" style="display:block; font-size:0.75rem; color:var(--maint-text-muted); margin-bottom:0.25rem;">Lokasi *</label>
                        <input type="text" id="maint-new-lokasi" class="maint-input" placeholder="Gedung A Lantai 2">
                    </div>
                    <div>
                        <label class="maint-label">Deskripsi *</label>
                        <textarea id="maint-new-deskripsi" rows="3" class="maint-textarea" placeholder="Jelaskan perbaikan..."></textarea>
                    </div>
                    <div>
                        <label class="maint-label">Prioritas</label>
                        <select id="maint-new-prioritas" class="maint-select">
                            <option value="low">Low</option>
                            <option value="normal" selected>Normal</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label class="maint-label">Scan QR Asset (opsional)</label>
                        <button class="maint-btn maint-btn-primary" style="width:100%" id="maint-scan-qr-btn">
                            <i class="fas fa-qrcode"></i> Scan QR
                        </button>
                        <input type="hidden" id="maint-asset-qr-code" value="">
                        <div id="maint-scanned-asset-info" class="text-xs text-slate-400 mt-1"></div>
                    </div>
                    <div>
                        <label class="maint-label">Foto Sebelum (opsional)</label>
                        <input type="file" id="maint-foto-before" accept="image/*" class="maint-input">
                        <img id="maint-preview-before" class="mt-2 max-h-32 rounded hidden" style="display:none;">
                    </div>
                    <div>
                        <label class="maint-label">Foto Sesudah (opsional)</label>
                        <input type="file" id="maint-foto-after" accept="image/*" class="maint-input">
                        <img id="maint-preview-after" class="mt-2 max-h-32 rounded hidden" style="display:none;">
                    </div>
                    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:0.5rem;">
                        <button class="maint-btn" id="maint-cancel-new-task">Batal</button>
                        <button class="maint-btn maint-btn-primary" id="maint-submit-new-task">Simpan</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL SPAREPART -->
        <div id="maint-sparepart-modal" class="maint-modal">
            <div class="maint-modal-content">
                <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem; color:var(--maint-primary);">Ambil Sparepart</h3>
                <input type="hidden" id="maint-sparepart-task-id">
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    <div>
                        <label class="maint-label">Pilih Barang</label>
                        <select id="maint-sparepart-barang" class="maint-select">
                            <option value="">-- Pilih --</option>
                        </select>
                        <div id="maint-sparepart-stok-info" class="text-xs text-slate-400 mt-1"></div>
                    </div>
                    <div>
                        <label class="maint-label">Jumlah</label>
                        <input type="number" id="maint-sparepart-jumlah" min="1" value="1" class="maint-input">
                    </div>
                    <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                        <button class="maint-btn" id="maint-cancel-sparepart">Batal</button>
                        <button class="maint-btn maint-btn-primary" id="maint-ambil-sparepart">Ambil</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL QR SCANNER -->
        <div id="maint-qr-modal" class="maint-modal">
            <div class="maint-modal-content">
                <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem; color:var(--maint-primary);">Scan QR Code</h3>
                <video id="maint-qr-video" autoplay playsinline style="width:100%; border-radius:var(--maint-radius); background:#000;"></video>
                <div style="text-align:right; margin-top:1rem;">
                    <button class="maint-btn" id="maint-close-qr">Tutup</button>
                </div>
            </div>
        </div>

        <!-- MODAL HISTORY -->
        <div id="maint-history-modal" class="maint-modal">
            <div class="maint-modal-content" style="max-width:600px;">
                <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem; color:var(--maint-primary);">Riwayat Tugas Selesai</h3>
                <div id="maint-history-timeline" style="max-height:60vh; overflow-y:auto;"></div>
                <div style="text-align:right; margin-top:1rem;">
                    <button class="maint-btn" id="maint-close-history">Tutup</button>
                </div>
            </div>
        </div>
        `;
    }

    /* ============================================================
       LOAD STATISTIK
    ============================================================ */
    async function loadStats() {
        try {
            const [total, pending, proses, selesai] = await Promise.all([
                _sb.from('maintenance_tasks').select('*', { count: 'exact', head: true }),
                _sb.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                _sb.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'proses'),
                _sb.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'selesai')
            ]);
            setEl('maint-stat-total', total.count || 0);
            setEl('maint-stat-pending', pending.count || 0);
            setEl('maint-stat-proses', proses.count || 0);
            setEl('maint-stat-selesai', selesai.count || 0);
        } catch (err) {
            console.error('[MAINT] loadStats error:', err);
        }
    }

    function setEl(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    /* ============================================================
       LOAD TASKS
    ============================================================ */
    async function loadTasks(filter = 'semua') {
        const container = document.getElementById('maint-tasks-list');
        if (!container) return;

        container.innerHTML = '<div class="maint-loader"><div class="maint-spinner"></div><p style="margin-top:1rem;">Memuat tugas...</p></div>';

        try {
            let query = _sb
                .from('maintenance_tasks')
                .select(`
                    *,
                    assets (nama_asset, lokasi)
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'semua') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center; padding:3rem; opacity:0.7;">Tidak ada tugas</p>';
                return;
            }

            let html = '';
            data.forEach(task => {
                html += renderTaskCard(task);
            });
            container.innerHTML = html;
        } catch (err) {
            console.error('[MAINT] loadTasks error:', err);
            container.innerHTML = '<p style="text-align:center; padding:3rem; color:#ef4444;">Gagal memuat data</p>';
        }
    }

    function renderTaskCard(task) {
        const priorityClass = task.prioritas === 'high' ? 'badge-high' : task.prioritas === 'low' ? 'badge-low' : 'badge-normal';
        const statusClass = {
            'pending': 'badge-pending',
            'proses': 'badge-proses',
            'selesai': 'badge-selesai',
            'butuh_sparepart': 'badge-butuh'
        }[task.status] || 'badge-pending';

        const statusLabel = {
            'pending': 'Pending',
            'proses': 'Proses',
            'selesai': 'Selesai',
            'butuh_sparepart': 'Butuh Sparepart'
        }[task.status] || 'Pending';

        return `
            <div class="task-card">
                <div class="task-header">
                    <span class="badge ${priorityClass}">${task.prioritas || 'normal'}</span>
                    <span class="badge ${statusClass}">${statusLabel}</span>
                    ${task.asset_id ? `<span class="badge badge-low">🏢 ${esc(task.assets?.nama_asset || 'Asset')}</span>` : ''}
                </div>
                <h3 style="font-size:1.2rem; font-weight:700; margin:0.5rem 0;">${esc(task.lokasi || '—')}</h3>
                <p style="opacity:0.8; margin-bottom:0.5rem;">${esc(task.deskripsi || '')}</p>
                <div style="display:flex; gap:1rem; font-size:0.7rem; color:var(--maint-text-muted); margin-bottom:0.75rem; flex-wrap:wrap;">
                    <span>📅 ${fmtDate(task.created_at)}</span>
                    <span>👤 ${esc(task.teknisi_id || 'Unassigned')}</span>
                    ${task.progress_notes ? `<span>📝 ${esc(task.progress_notes)}</span>` : ''}
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    ${task.status === 'pending' ? `
                        <button class="maint-btn maint-btn-sm" data-task-id="${task.id}" data-action="ambil"><i class="fas fa-hammer"></i> Ambil</button>
                    ` : ''}
                    ${task.status === 'proses' ? `
                        <button class="maint-btn maint-btn-sm" data-task-id="${task.id}" data-action="sparepart"><i class="fas fa-cog"></i> Sparepart</button>
                        <button class="maint-btn maint-btn-sm" data-task-id="${task.id}" data-action="update"><i class="fas fa-edit"></i> Update</button>
                        <button class="maint-btn maint-btn-sm" data-task-id="${task.id}" data-action="selesai"><i class="fas fa-check"></i> Selesai</button>
                    ` : ''}
                    ${task.status === 'butuh_sparepart' ? `
                        <button class="maint-btn maint-btn-sm" data-task-id="${task.id}" data-action="sparepart"><i class="fas fa-cog"></i> Sparepart</button>
                    ` : ''}
                    <button class="maint-btn maint-btn-sm" data-task-id="${task.id}" data-action="detail"><i class="fas fa-eye"></i> Detail</button>
                </div>
            </div>
        `;
    }

    /* ============================================================
       FUNGSI TOMBOL (dengan event delegation)
    ============================================================ */
    async function handleTaskAction(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const taskId = btn.dataset.taskId;

        if (action === 'ambil') {
            if (!confirm('Ambil tugas ini?')) return;
            const { error } = await _sb
                .from('maintenance_tasks')
                .update({ 
                    status: 'proses', 
                    teknisi_id: _user?.name || 'System',
                    progress_notes: 'Tugas diambil - Mulai pengerjaan',
                    started_at: new Date().toISOString()
                })
                .eq('id', taskId);
            if (error) { toast('Gagal: ' + error.message, 'error'); return; }
            await writeAuditLog('Maintenance Ambil Tugas', `Task ${taskId} diambil oleh ${_user?.name}`);
            toast('Tugas diambil', 'success');
            loadTasks(_currentFilter);
            loadStats();
        }

        if (action === 'selesai') {
            const catatan = prompt('Catatan penyelesaian (opsional):');
            const { error } = await _sb
                .from('maintenance_tasks')
                .update({ 
                    status: 'selesai', 
                    progress_notes: catatan || 'Selesai',
                    completed_at: new Date().toISOString()
                })
                .eq('id', taskId);
            if (error) { toast('Gagal: ' + error.message, 'error'); return; }
            await writeAuditLog('Maintenance Selesai', `Task ${taskId} selesai`);
            toast('Tugas selesai', 'success');
            loadTasks(_currentFilter);
            loadStats();
        }

        if (action === 'update') {
            const progress = prompt('Update progress:');
            if (!progress) return;
            const { error } = await _sb
                .from('maintenance_tasks')
                .update({ progress_notes: progress })
                .eq('id', taskId);
            if (error) { toast('Gagal: ' + error.message, 'error'); return; }
            await writeAuditLog('Maintenance Update Progress', `Task ${taskId}: ${progress}`);
            toast('Progress updated', 'success');
            loadTasks(_currentFilter);
        }

        if (action === 'sparepart') {
            await openSparepartModal(taskId);
        }

        if (action === 'detail') {
            toast('Detail task ' + taskId, 'info');
        }
    }

    /* ============================================================
       SPAREPART MODAL
    ============================================================ */
    async function openSparepartModal(taskId) {
        document.getElementById('maint-sparepart-task-id').value = taskId;

        const { data, error } = await _sb
            .from('gudang_stok')
            .select('id, nama_barang, stok, satuan')
            .gt('stok', 0);
        if (error) { toast('Gagal memuat stok: ' + error.message, 'error'); return; }

        _stokList = data || [];
        const select = document.getElementById('maint-sparepart-barang');
        select.innerHTML = '<option value="">-- Pilih --</option>' + 
            _stokList.map(item => `<option value="${item.id}" data-stok="${item.stok}">${item.nama_barang} (stok: ${item.stok} ${item.satuan || ''})</option>`).join('');
        
        document.getElementById('maint-sparepart-stok-info').innerText = '';
        document.getElementById('maint-sparepart-modal').classList.add('active');
    }

    function closeSparepartModal() {
        document.getElementById('maint-sparepart-modal').classList.remove('active');
    }

    async function ambilSparepart() {
        const taskId = document.getElementById('maint-sparepart-task-id')?.value;
        const barangId = document.getElementById('maint-sparepart-barang')?.value;
        const jumlah = parseInt(document.getElementById('maint-sparepart-jumlah')?.value || 0);

        if (!taskId || !barangId || jumlah < 1) { toast('Pilih barang dan jumlah valid', 'warning'); return; }

        const barang = _stokList.find(b => b.id === barangId);
        if (!barang) return;
        if (barang.stok < jumlah) { toast(`Stok tidak cukup! Tersedia ${barang.stok}`, 'warning'); return; }

        // Kurangi stok
        const { error: updateError } = await _sb
            .from('gudang_stok')
            .update({ stok: barang.stok - jumlah })
            .eq('id', barangId);
        if (updateError) { toast('Gagal update stok: ' + updateError.message, 'error'); return; }

        // Catat pemakaian
        await _sb.from('inventory_usage').insert([{
            task_id: taskId,
            barang_id: barangId,
            jumlah: jumlah,
            created_at: new Date().toISOString()
        }]).catch(() => {});

        await _sb
            .from('maintenance_tasks')
            .update({ status: 'proses', progress_notes: 'Sparepart diambil' })
            .eq('id', taskId);

        await writeAuditLog('Maintenance Ambil Sparepart', `Task ${taskId} ambil ${jumlah} ${barang.nama_barang}`);

        toast('Sparepart berhasil diambil', 'success');
        closeSparepartModal();
        loadTasks(_currentFilter);
        loadStats();
    }

    /* ============================================================
       QR SCANNER (simulasi sederhana, bisa diganti library nyata)
    ============================================================ */
    function openQrModal() {
        document.getElementById('maint-qr-modal').classList.add('active');
        startQrScanner();
    }

    function closeQrModal() {
        document.getElementById('maint-qr-modal').classList.remove('active');
        stopQrScanner();
    }

    function startQrScanner() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    _qrStream = stream;
                    const video = document.getElementById('maint-qr-video');
                    if (video) video.srcObject = stream;
                    // Simulasi scan setelah 3 detik (ganti dengan library QR nyata)
                    setTimeout(() => {
                        _scannedAssetId = 'ASSET-' + Date.now();
                        document.getElementById('maint-asset-qr-code').value = _scannedAssetId;
                        document.getElementById('maint-scanned-asset-info').innerText = 'Scanned: ' + _scannedAssetId;
                        toast('QR scanned: ' + _scannedAssetId, 'success');
                        closeQrModal();
                    }, 3000);
                })
                .catch(() => {
                    toast('Tidak dapat mengakses kamera', 'error');
                    closeQrModal();
                });
        } else {
            toast('Kamera tidak didukung', 'error');
        }
    }

    function stopQrScanner() {
        if (_qrStream) {
            _qrStream.getTracks().forEach(track => track.stop());
            _qrStream = null;
        }
    }

    /* ============================================================
       PREVIEW IMAGE
    ============================================================ */
    function previewImage(input, previewId) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById(previewId);
                if (preview) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                if (previewId === 'maint-preview-before') _beforeImage = e.target.result;
                else _afterImage = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    /* ============================================================
       NEW TASK MODAL
    ============================================================ */
    function openNewTaskModal() {
        _beforeImage = null;
        _afterImage = null;
        _scannedAssetId = null;
        document.getElementById('maint-asset-qr-code').value = '';
        document.getElementById('maint-scanned-asset-info').innerText = '';
        document.getElementById('maint-preview-before').style.display = 'none';
        document.getElementById('maint-preview-after').style.display = 'none';
        document.getElementById('maint-foto-before').value = '';
        document.getElementById('maint-foto-after').value = '';
        document.getElementById('maint-new-task-modal').classList.add('active');
    }

    function closeNewTaskModal() {
        document.getElementById('maint-new-task-modal').classList.remove('active');
    }

    async function submitNewTask() {
        const lokasi = document.getElementById('maint-new-lokasi')?.value;
        const deskripsi = document.getElementById('maint-new-deskripsi')?.value;
        const prioritas = document.getElementById('maint-new-prioritas')?.value;

        if (!lokasi || !deskripsi) { toast('Lokasi dan deskripsi wajib diisi', 'warning'); return; }

        const { error } = await _sb
            .from('maintenance_tasks')
            .insert([{
                lokasi,
                deskripsi,
                prioritas,
                status: 'pending',
                asset_id: _scannedAssetId,
                foto_before: _beforeImage,
                foto_after: _afterImage,
                created_at: new Date().toISOString()
            }]);

        if (error) { toast('Gagal: ' + error.message, 'error'); return; }

        await writeAuditLog('Maintenance Buat Tugas', `Task baru: ${lokasi} - ${deskripsi.substring(0,50)}`);

        toast('Tugas dibuat', 'success');
        closeNewTaskModal();
        loadTasks(_currentFilter);
        loadStats();
    }

    /* ============================================================
       HISTORY MODAL
    ============================================================ */
    function openHistoryModal() {
        document.getElementById('maint-history-modal').classList.add('active');
        loadHistoryTimeline();
    }

    function closeHistoryModal() {
        document.getElementById('maint-history-modal').classList.remove('active');
    }

    async function loadHistoryTimeline() {
        const container = document.getElementById('maint-history-timeline');
        if (!container) return;
        container.innerHTML = '<div class="maint-loader"><div class="maint-spinner"></div><p>Memuat...</p></div>';

        const { data, error } = await _sb
            .from('maintenance_tasks')
            .select('*')
            .eq('status', 'selesai')
            .order('completed_at', { ascending: false })
            .limit(30);

        if (error) {
            container.innerHTML = '<p style="color:#ef4444;">Gagal memuat riwayat</p>';
            return;
        }
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="opacity:0.7; text-align:center;">Belum ada riwayat</p>';
            return;
        }

        container.innerHTML = data.map(task => `
            <div style="background:rgba(255,255,255,0.03); border-radius:var(--maint-radius-sm); padding:1rem; margin-bottom:0.75rem;">
                <div style="color:var(--maint-primary); font-size:0.8rem;">${fmtDate(task.completed_at)}</div>
                <div style="font-weight:700; margin:0.25rem 0;">${esc(task.lokasi)}</div>
                <div style="opacity:0.7; font-size:0.85rem;">${esc(task.deskripsi?.substring(0,100))}...</div>
                <div style="font-size:0.7rem; color:var(--maint-text-muted); margin-top:0.25rem;">👤 ${esc(task.teknisi_id || '-')}</div>
            </div>
        `).join('');
    }

    /* ============================================================
       SWITCH FILTER
    ============================================================ */
    function switchFilter(filter) {
        _currentFilter = filter;
        document.querySelectorAll('.maint-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.maint-tab[data-filter="${filter}"]`);
        if (activeTab) activeTab.classList.add('active');

        if (filter === 'history') {
            openHistoryModal();
        } else {
            loadTasks(filter);
        }
    }

    /* ============================================================
       ATTACH EVENT LISTENERS
    ============================================================ */
    function attachEvents() {
        // Filter tabs
        document.querySelectorAll('.maint-tab').forEach(btn => {
            btn.addEventListener('click', () => switchFilter(btn.dataset.filter));
        });

        // New task
        document.getElementById('maint-new-task-btn').addEventListener('click', openNewTaskModal);
        document.getElementById('maint-cancel-new-task').addEventListener('click', closeNewTaskModal);
        document.getElementById('maint-submit-new-task').addEventListener('click', submitNewTask);

        // Sparepart modal
        document.getElementById('maint-cancel-sparepart').addEventListener('click', closeSparepartModal);
        document.getElementById('maint-ambil-sparepart').addEventListener('click', ambilSparepart);
        document.getElementById('maint-sparepart-barang')?.addEventListener('change', function() {
            const selected = this.options[this.selectedIndex];
            const stok = selected?.dataset.stok || 0;
            document.getElementById('maint-sparepart-stok-info').innerText = `Stok tersedia: ${stok}`;
        });

        // QR scan
        document.getElementById('maint-scan-qr-btn').addEventListener('click', openQrModal);
        document.getElementById('maint-close-qr').addEventListener('click', closeQrModal);

        // History
        document.getElementById('maint-close-history').addEventListener('click', closeHistoryModal);

        // File preview
        document.getElementById('maint-foto-before').addEventListener('change', function(e) {
            previewImage(e.target, 'maint-preview-before');
        });
        document.getElementById('maint-foto-after').addEventListener('change', function(e) {
            previewImage(e.target, 'maint-preview-after');
        });

        // Delegasi untuk tombol aksi di task cards
        document.getElementById('maint-tasks-list').addEventListener('click', handleTaskAction);
    }

    /* ============================================================
       INTEGRASI K3 (event bus)
    ============================================================ */
    function listenK3Events() {
        if (window.eventBus && window.eventBus.on) {
            window.eventBus.on('k3-report', async (data) => {
                if (data.jenis === 'kerusakan' || data.jenis === 'bahaya') {
                    await _sb.from('maintenance_tasks').insert([{
                        lokasi: data.lokasi,
                        deskripsi: `[Auto dari K3] ${data.deskripsi}`,
                        prioritas: data.prioritas || 'normal',
                        status: 'pending',
                        created_at: new Date().toISOString()
                    }]);
                    toast('Task maintenance dibuat dari laporan K3', 'success');
                    loadTasks(_currentFilter);
                    loadStats();
                }
            });
        }
    }

    /* ============================================================
       CLEANUP FUNCTION (akan dikembalikan untuk dipanggil oleh loader)
    ============================================================ */
    function cleanup() {
        stopQrScanner();
        document.getElementById('maint-styles')?.remove();
        console.log('[MAINT] Cleanup done');
    }

    /* ============================================================
       INIT (dijalankan setelah DOM siap)
    ============================================================ */
    setTimeout(async () => {
        const container = document.getElementById('module-content');
        if (!container) return;

        await ensureSB();
        renderRoot(container);
        attachEvents();

        await loadStats();
        await loadTasks('semua');

        listenK3Events();

        console.log('[MAINT] Ready ✅');
    }, 100);

    // Simpan cleanup ke global agar bisa dipanggil loader
    return cleanup;
}
