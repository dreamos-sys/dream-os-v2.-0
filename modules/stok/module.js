/**
 * modules/stok/module.js
 * Dream OS v2.0 — Modul Stok Alat Janitor (Indoor & Outdoor)
 * ✅ Signature: (config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang)
 * ✅ Fitur: Daftar stok janitor, tambah/edit, permintaan alat, riwayat, kondisi alat
 * ✅ Hanya menampilkan kategori: Janitor Indoor, Janitor Outdoor
 * ✅ Terintegrasi dengan audit_logs
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
    if (document.getElementById('stok-styles')) return;
    const s = document.createElement('style');
    s.id = 'stok-styles';
    s.textContent = `
        :root {
            --stok-primary: #06b6d4;
            --stok-primary-light: rgba(6,182,212,0.1);
            --stok-primary-border: rgba(6,182,212,0.25);
            --stok-bg-panel: rgba(15,23,42,0.88);
            --stok-text: #e2e8f0;
            --stok-text-muted: #94a3b8;
            --stok-text-dim: #64748b;
            --stok-border: rgba(255,255,255,0.08);
            --stok-border-strong: rgba(255,255,255,0.15);
            --stok-radius: 16px;
            --stok-radius-sm: 12px;
            --stok-radius-xs: 8px;
            --stok-transition: 0.2s ease;
            --stok-shadow: 0 4px 18px rgba(6,182,212,0.15);
            --stok-font-mono: 'JetBrains Mono', monospace;
            --stok-font-sans: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        #stok-root * { box-sizing: border-box; }
        #stok-root {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--stok-font-sans);
            color: var(--stok-text);
        }
        .stok-panel {
            background: var(--stok-bg-panel);
            backdrop-filter: blur(18px);
            border: 1px solid var(--stok-primary-border);
            border-radius: var(--stok-radius);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: background var(--stok-transition), border-color var(--stok-transition);
        }
        .stok-panel:hover {
            background: rgba(15,23,42,0.92);
            border-color: var(--stok-primary);
        }
        .stok-header {
            background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05));
            border-left: 4px solid var(--stok-primary);
        }
        .stok-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--stok-primary), #0891b2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .stok-tabs {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            border-bottom: 2px solid var(--stok-primary-border);
            margin-bottom: 1.5rem;
        }
        .stok-tab {
            padding: 0.65rem 1.5rem;
            background: rgba(255,255,255,0.04);
            border: 1px solid transparent;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--stok-text-dim);
            white-space: nowrap;
            transition: background var(--stok-transition), color var(--stok-transition);
        }
        .stok-tab:hover { background: var(--stok-primary-light); color: var(--stok-text); }
        .stok-tab.active { background: rgba(6,182,212,0.18); border-color: var(--stok-primary); color: var(--stok-primary); }
        .stok-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .stok-label {
            display: block;
            font-size: 0.75rem;
            color: var(--stok-text-muted);
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stok-input, .stok-select, .stok-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1.5px solid var(--stok-primary-border);
            border-radius: var(--stok-radius-xs);
            color: var(--stok-text);
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            transition: border-color var(--stok-transition), box-shadow var(--stok-transition);
        }
        .stok-input:focus, .stok-select:focus, .stok-textarea:focus {
            border-color: var(--stok-primary);
            box-shadow: 0 0 0 3px var(--stok-primary-light);
        }
        .stok-select option { background: #1e293b; color: var(--stok-text); }
        .stok-textarea { resize: vertical; min-height: 80px; }
        .stok-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.6rem 1.2rem;
            border-radius: var(--stok-radius-xs);
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: transform var(--stok-transition), background var(--stok-transition), border-color var(--stok-transition);
            border: none;
            background: rgba(255,255,255,0.08);
            color: var(--stok-text);
        }
        .stok-btn:hover:not(:disabled) { transform: translateY(-1px); background: rgba(255,255,255,0.15); }
        .stok-btn-primary {
            background: linear-gradient(135deg, var(--stok-primary), #0891b2);
            color: #020617;
            width: 100%;
        }
        .stok-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--stok-shadow); }
        .stok-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .stok-btn-sm {
            padding: 0.3rem 1rem;
            font-size: 0.75rem;
            border-radius: 20px;
        }
        .stok-stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .stok-stat-card {
            background: rgba(0,0,0,0.2);
            border-radius: var(--stok-radius-sm);
            padding: 1rem;
            border-left: 3px solid var(--stok-primary);
        }
        .stok-stat-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: var(--stok-text-muted);
            letter-spacing: 0.5px;
        }
        .stok-stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 0.25rem;
            color: var(--stok-text);
        }
        .stok-card {
            background: rgba(0,0,0,0.2);
            border-radius: var(--stok-radius);
            padding: 1rem;
            margin-bottom: 0.75rem;
            border: 1px solid var(--stok-border);
        }
        .stok-badge {
            display: inline-block;
            padding: 0.2rem 0.75rem;
            border-radius: 30px;
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .stok-badge-baik { background: rgba(16,185,129,0.2); color: #10b981; }
        .stok-badge-ringan { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .stok-badge-berat { background: rgba(239,68,68,0.2); color: #ef4444; }
        .stok-badge-perbaikan { background: rgba(249,115,22,0.2); color: #f97316; }
        .stok-badge-pending { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .stok-badge-approved { background: rgba(16,185,129,0.2); color: #10b981; }
        .stok-badge-rejected { background: rgba(239,68,68,0.2); color: #ef4444; }
        .stok-badge-indoor { background: rgba(6,182,212,0.2); color: #06b6d4; }
        .stok-badge-outdoor { background: rgba(20,184,166,0.2); color: #14b8a6; }
        .stok-low { border-left: 4px solid #ef4444 !important; }
        .stok-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }
        .stok-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--stok-primary-light);
            border-top-color: var(--stok-primary);
            border-radius: 50%;
            animation: stok-spin 1s linear infinite;
        }
        @keyframes stok-spin { to { transform: rotate(360deg); } }
        table.stok-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        table.stok-table thead { background: rgba(0,0,0,0.3); }
        table.stok-table th { padding: 0.75rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: var(--stok-text-muted); }
        table.stok-table td { padding: 0.75rem; border-top: 1px solid var(--stok-border); }
        table.stok-table tr:hover td { background: rgba(255,255,255,0.02); }

        /* Print styles */
        @media print {
            #stok-root {
                background: white;
                color: #1e293b;
                padding: 0.5in;
            }
            .stok-panel {
                background: white;
                backdrop-filter: none;
                border: 1px solid #ccc;
                box-shadow: none;
            }
            .stok-tabs, .stok-btn, .stok-header::before {
                display: none;
            }
        }

        /* Device tier low */
        .tier-low .stok-panel {
            backdrop-filter: none;
            background: rgba(15,23,42,0.95);
        }
        .tier-low .stok-spinner {
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

    // State lokal
    let _sb = supabase || null;
    let _user = currentUser || null;
    let _lang = currentLang || 'id';
    let _currentStok = [];
    let _currentRequests = [];

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
        } catch (e) { console.warn('[STOK] audit_log error:', e.message); }
    }

    /* ============================================================
       RENDER HTML (dengan kategori janitor indoor/outdoor)
    ============================================================ */
    function renderRoot(container) {
        const userName = _user?.name?.toUpperCase() || 'GUEST';
        container.innerHTML = `
        <div id="stok-root">
            <!-- HEADER -->
            <div class="stok-panel stok-header" style="margin-bottom:1.5rem">
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="font-size:3rem;">🧹</div>
                    <div>
                        <div class="stok-title">STOK ALAT JANITOR</div>
                        <div style="font-size:0.75rem;color:var(--stok-text-muted);">Indoor & Outdoor · Manajemen Peralatan Kebersihan</div>
                    </div>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">${esc(userName)}</span>
                    </div>
                </div>
            </div>

            <!-- TABS -->
            <div class="stok-tabs">
                <button class="stok-tab active" data-tab="stok">📋 Stok Barang</button>
                <button class="stok-tab" data-tab="permintaan">📝 Permintaan Alat</button>
                <button class="stok-tab" data-tab="riwayat">📜 Riwayat</button>
                <button class="stok-tab" data-tab="kondisi">🔧 Kondisi Alat</button>
            </div>

            <!-- TAB STOK -->
            <div id="stok-tab-stok" class="tab-content">
                <div class="stok-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-size:1.2rem; font-weight:700; color:var(--stok-primary);">Daftar Stok Janitor</h3>
                        <input type="text" id="stok-search" placeholder="Cari barang..." class="stok-input" style="max-width:200px;">
                    </div>
                    <div id="stok-list"></div>

                    <div style="margin-top:2rem;">
                        <h3 style="font-size:1rem; font-weight:700; margin-bottom:1rem; color:var(--stok-primary);">Tambah / Edit Stok</h3>
                        <form id="stokForm">
                            <input type="hidden" id="stok-id">
                            <div class="stok-form-grid">
                                <div>
                                    <label class="stok-label">Nama Barang *</label>
                                    <input type="text" id="stok-nama" class="stok-input" required>
                                </div>
                                <div>
                                    <label class="stok-label">Kategori *</label>
                                    <select id="stok-kategori" class="stok-select" required>
                                        <option value="">Pilih</option>
                                        <option value="janitor-indoor">🧹 Janitor Indoor</option>
                                        <option value="janitor-outdoor">🌿 Janitor Outdoor</option>
                                    </select>
                                </div>
                            </div>
                            <div class="stok-form-grid">
                                <div>
                                    <label class="stok-label">Jumlah *</label>
                                    <input type="number" id="stok-jumlah" min="0" class="stok-input" required>
                                </div>
                                <div>
                                    <label class="stok-label">Satuan</label>
                                    <input type="text" id="stok-satuan" placeholder="pcs/unit/liter" class="stok-input">
                                </div>
                                <div>
                                    <label class="stok-label">Minimal Stok</label>
                                    <input type="number" id="stok-minimal" min="0" class="stok-input">
                                </div>
                            </div>
                            <div class="stok-form-grid">
                                <div>
                                    <label class="stok-label">Lokasi</label>
                                    <input type="text" id="stok-lokasi" placeholder="Rak / Gudang" class="stok-input">
                                </div>
                                <div>
                                    <label class="stok-label">Kondisi</label>
                                    <select id="stok-kondisi" class="stok-select">
                                        <option value="baik">Baik</option>
                                        <option value="rusak_ringan">Rusak Ringan</option>
                                        <option value="rusak_berat">Rusak Berat</option>
                                        <option value="perbaikan">Perbaikan</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="stok-btn stok-btn-primary" id="stok-submit">Simpan</button>
                            <div id="stok-form-result" style="margin-top:1rem; text-align:center;"></div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- TAB PERMINTAAN -->
            <div id="stok-tab-permintaan" class="tab-content" style="display:none;">
                <div class="stok-panel">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
                        <!-- Form Permintaan -->
                        <div>
                            <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem; color:var(--stok-primary);">Form Permintaan Alat</h3>
                            <form id="stokRequestForm">
                                <div style="margin-bottom:1rem;">
                                    <label class="stok-label">Nama Petugas *</label>
                                    <input type="text" id="stok-req-petugas" class="stok-input" required>
                                </div>
                                <div style="margin-bottom:1rem;">
                                    <label class="stok-label">Area / Lokasi *</label>
                                    <input type="text" id="stok-req-area" class="stok-input" required>
                                </div>
                                <div style="margin-bottom:1rem;">
                                    <label class="stok-label">Tanggal (opsional)</label>
                                    <input type="date" id="stok-req-tanggal" class="stok-input">
                                </div>
                                <div style="margin-bottom:1rem;">
                                    <label class="stok-label">Catatan (opsional)</label>
                                    <textarea id="stok-req-catatan" rows="2" class="stok-textarea"></textarea>
                                </div>
                                <div style="margin-bottom:1rem;">
                                    <label class="stok-label">Alat yang diminta</label>
                                    <div id="stok-items-container">
                                        <div class="item-row" style="display:flex; gap:0.5rem; margin-bottom:0.5rem;">
                                            <select class="stok-item-select stok-input" style="flex:1;">
                                                <option value="">Pilih Alat</option>
                                            </select>
                                            <input type="number" class="stok-item-qty stok-input" style="width:80px;" placeholder="Jml">
                                            <button type="button" class="stok-remove-item" style="color:#ef4444; background:transparent; border:none; cursor:pointer;">✖</button>
                                        </div>
                                    </div>
                                    <button type="button" id="stok-add-item" class="stok-btn stok-btn-sm" style="margin-top:0.5rem;">+ Tambah Alat</button>
                                </div>
                                <button type="submit" class="stok-btn stok-btn-primary" id="stok-request-submit">
                                    <i class="fas fa-paper-plane"></i> Ajukan
                                </button>
                                <div id="stok-request-result" style="margin-top:1rem; text-align:center;"></div>
                            </form>
                        </div>

                        <!-- Daftar Permintaan Pending -->
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                                <h3 style="font-size:1.2rem; font-weight:700; color:var(--stok-primary);">Permintaan Pending</h3>
                                <button id="stok-refresh-requests" class="stok-btn stok-btn-sm"><i class="fas fa-sync-alt"></i> Refresh</button>
                            </div>
                            <div id="stok-requests-list"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB RIWAYAT -->
            <div id="stok-tab-riwayat" class="tab-content" style="display:none;">
                <div class="stok-panel">
                    <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1.5rem; color:var(--stok-primary);">Riwayat Permintaan</h3>
                    <div style="overflow-x:auto;">
                        <table class="stok-table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Petugas</th>
                                    <th>Area</th>
                                    <th>Alat</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="stok-history-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB KONDISI -->
            <div id="stok-tab-kondisi" class="tab-content" style="display:none;">
                <div class="stok-panel">
                    <div class="stok-stat-grid">
                        <div class="stok-stat-card"><div class="stok-stat-label">Rusak Ringan</div><div class="stok-stat-value" id="stok-stat-ringan">0</div></div>
                        <div class="stok-stat-card"><div class="stok-stat-label">Rusak Berat</div><div class="stok-stat-value" id="stok-stat-berat">0</div></div>
                        <div class="stok-stat-card"><div class="stok-stat-label">Perbaikan</div><div class="stok-stat-value" id="stok-stat-perbaikan">0</div></div>
                    </div>
                    <h3 style="font-size:1rem; font-weight:700; margin:1rem 0 0.5rem; color:var(--stok-primary);">Alat Bermasalah</h3>
                    <div id="stok-rusak-list"></div>
                </div>
            </div>
        </div>
        `;
    }

    /* ============================================================
       STOK
    ============================================================ */
    async function loadStok() {
        const list = document.getElementById('stok-list');
        if (!list) return;
        list.innerHTML = '<div class="stok-loader"><div class="stok-spinner"></div><p style="margin-top:1rem;">Memuat...</p></div>';

        try {
            // Hanya ambil data dengan kategori janitor-indoor atau janitor-outdoor
            const { data, error } = await _sb
                .from('inventory')
                .select('*')
                .in('kategori', ['janitor-indoor', 'janitor-outdoor'])
                .order('nama_barang', { ascending: true });

            if (error) throw error;
            _currentStok = data || [];
            renderStokList(_currentStok);
        } catch (err) {
            console.error('[STOK] load error:', err);
            list.innerHTML = `<p style="text-align:center; padding:2rem; color:#ef4444;">Gagal memuat: ${esc(err.message)}</p>`;
        }
    }

    function renderStokList(items) {
        const list = document.getElementById('stok-list');
        if (!list) return;
        if (items.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:2rem; opacity:0.7;">Belum ada stok janitor</p>';
            return;
        }

        let html = '';
        items.forEach(item => {
            const isLow = item.jumlah <= (item.minimal_stok || 0);
            const lowClass = isLow ? 'stok-low' : '';
            const kondisiClass = {
                'baik': 'stok-badge-baik',
                'rusak_ringan': 'stok-badge-ringan',
                'rusak_berat': 'stok-badge-berat',
                'perbaikan': 'stok-badge-perbaikan'
            }[item.kondisi] || 'stok-badge-baik';
            const kategoriClass = item.kategori === 'janitor-indoor' ? 'stok-badge-indoor' : 'stok-badge-outdoor';
            const kategoriLabel = item.kategori === 'janitor-indoor' ? 'Indoor' : 'Outdoor';

            html += `
                <div class="stok-card ${lowClass}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <span style="font-weight:700; font-size:1rem;">${esc(item.nama_barang)}</span>
                                <span class="stok-badge ${kategoriClass}">${kategoriLabel}</span>
                            </div>
                            <div style="font-size:0.7rem; color:var(--stok-text-muted); margin-top:2px;">${esc(item.kategori || '—')} | ${esc(item.lokasi || '—')}</div>
                            <div style="display:flex; gap:0.75rem; font-size:0.75rem; margin-top:0.25rem;">
                                <span class="${isLow ? 'text-red-400 font-bold' : ''}">📦 ${item.jumlah} ${esc(item.satuan || '')}</span>
                                <span class="${kondisiClass}" style="padding:0.1rem 0.5rem; border-radius:12px;">${item.kondisi || 'baik'}</span>
                            </div>
                        </div>
                        <div style="display:flex; gap:0.25rem;">
                            <button class="stok-btn stok-btn-sm" data-id="${item.id}" data-action="edit"><i class="fas fa-edit"></i></button>
                            <button class="stok-btn stok-btn-sm" data-id="${item.id}" data-action="hapus"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    }

    async function handleEdit(id) {
        const item = _currentStok.find(i => i.id === id);
        if (!item) return;

        document.getElementById('stok-id').value = item.id;
        document.getElementById('stok-nama').value = item.nama_barang;
        document.getElementById('stok-kategori').value = item.kategori || '';
        document.getElementById('stok-jumlah').value = item.jumlah;
        document.getElementById('stok-satuan').value = item.satuan || '';
        document.getElementById('stok-lokasi').value = item.lokasi || '';
        document.getElementById('stok-minimal').value = item.minimal_stok || 0;
        document.getElementById('stok-kondisi').value = item.kondisi || 'baik';
    }

    async function handleHapus(id) {
        if (!confirm('Yakin hapus stok ini?')) return;
        const { error } = await _sb.from('inventory').delete().eq('id', id);
        if (error) {
            toast('Gagal hapus: ' + error.message, 'error');
        } else {
            await writeAuditLog('Stok Janitor Hapus', `ID: ${id}`);
            toast('Stok dihapus', 'success');
            loadStok();
        }
    }

    async function handleStokSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('stok-id')?.value;
        const nama = document.getElementById('stok-nama')?.value;
        const kategori = document.getElementById('stok-kategori')?.value;
        if (!nama || !kategori) {
            toast('Nama barang dan kategori harus diisi', 'warning');
            return;
        }

        const data = {
            nama_barang: nama,
            kategori: kategori,
            jumlah: parseInt(document.getElementById('stok-jumlah')?.value) || 0,
            satuan: document.getElementById('stok-satuan')?.value || null,
            lokasi: document.getElementById('stok-lokasi')?.value || null,
            minimal_stok: parseInt(document.getElementById('stok-minimal')?.value) || 0,
            kondisi: document.getElementById('stok-kondisi')?.value || 'baik'
        };

        const btn = document.getElementById('stok-submit');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:stok-spin 1s linear infinite"></i> Menyimpan...';

        try {
            let error;
            if (id) {
                ({ error } = await _sb.from('inventory').update(data).eq('id', id));
            } else {
                ({ error } = await _sb.from('inventory').insert([data]));
            }
            if (error) throw error;

            await writeAuditLog('Stok Janitor ' + (id ? 'Update' : 'Tambah'), nama);
            toast('Stok berhasil disimpan', 'success');
            document.getElementById('stokForm').reset();
            document.getElementById('stok-id').value = '';
            loadStok();
        } catch (err) {
            console.error('[STOK] submit error:', err);
            toast('Gagal: ' + err.message, 'error');
            document.getElementById('stok-form-result').innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /* ============================================================
       PERMINTAAN
    ============================================================ */
    async function loadInventoryDropdown() {
        const { data } = await _sb
            .from('inventory')
            .select('id, nama_barang')
            .in('kategori', ['janitor-indoor', 'janitor-outdoor'])
            .eq('kondisi', 'baik')
            .gt('jumlah', 0);
        const selects = document.querySelectorAll('.stok-item-select');
        selects.forEach(sel => {
            sel.innerHTML = '<option value="">Pilih Alat</option>' +
                (data || []).map(i => `<option value="${i.id}">${i.nama_barang}</option>`).join('');
        });
    }

    function addItemRow() {
        const container = document.getElementById('stok-items-container');
        if (!container) return;
        const newRow = document.createElement('div');
        newRow.className = 'item-row';
        newRow.style.display = 'flex';
        newRow.style.gap = '0.5rem';
        newRow.style.marginBottom = '0.5rem';
        newRow.innerHTML = `
            <select class="stok-item-select stok-input" style="flex:1;">
                <option value="">Pilih Alat</option>
            </select>
            <input type="number" class="stok-item-qty stok-input" style="width:80px;" placeholder="Jml">
            <button type="button" class="stok-remove-item" style="color:#ef4444; background:transparent; border:none; cursor:pointer;">✖</button>
        `;
        container.appendChild(newRow);
        loadInventoryDropdown(); // refresh semua dropdown
    }

    async function handleRequestSubmit(e) {
        e.preventDefault();
        const rows = document.querySelectorAll('.item-row');
        const items = [];
        for (let row of rows) {
            const select = row.querySelector('.stok-item-select');
            const qty = row.querySelector('.stok-item-qty')?.value;
            if (select && select.value && qty && parseInt(qty) > 0) {
                const nama = select.options[select.selectedIndex]?.text;
                items.push({ id: select.value, nama, jumlah: parseInt(qty) });
            }
        }
        if (items.length === 0) {
            document.getElementById('stok-request-result').innerHTML = '<span style="color:#ef4444;">Pilih minimal satu alat dengan jumlah valid!</span>';
            return;
        }

        const petugas = document.getElementById('stok-req-petugas')?.value;
        const area = document.getElementById('stok-req-area')?.value;
        const tanggal = document.getElementById('stok-req-tanggal')?.value || new Date().toISOString().split('T')[0];
        const catatan = document.getElementById('stok-req-catatan')?.value;

        if (!petugas) {
            document.getElementById('stok-request-result').innerHTML = '<span style="color:#ef4444;">Nama petugas harus diisi!</span>';
            return;
        }

        const btn = document.getElementById('stok-request-submit');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:stok-spin 1s linear infinite"></i> Mengirim...';

        try {
            const { error } = await _sb.from('tool_requests').insert([{
                petugas,
                area,
                tanggal,
                items: JSON.stringify(items),
                catatan,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

            await writeAuditLog('Permintaan Alat Janitor', `${petugas} - ${items.length} item`);
            toast('Permintaan berhasil diajukan', 'success');
            document.getElementById('stokRequestForm').reset();
            // reset items container
            document.getElementById('stok-items-container').innerHTML = `
                <div class="item-row" style="display:flex; gap:0.5rem; margin-bottom:0.5rem;">
                    <select class="stok-item-select stok-input" style="flex:1;">
                        <option value="">Pilih Alat</option>
                    </select>
                    <input type="number" class="stok-item-qty stok-input" style="width:80px;" placeholder="Jml">
                    <button type="button" class="stok-remove-item" style="color:#ef4444; background:transparent; border:none; cursor:pointer;">✖</button>
                </div>
            `;
            loadInventoryDropdown();
            loadRequests();
        } catch (err) {
            console.error('[STOK] request error:', err);
            toast('Gagal: ' + err.message, 'error');
            document.getElementById('stok-request-result').innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    async function loadRequests() {
        const list = document.getElementById('stok-requests-list');
        if (!list) return;
        list.innerHTML = '<div class="stok-loader"><div class="stok-spinner"></div><p style="margin-top:1rem;">Memuat...</p></div>';

        try {
            const { data, error } = await _sb
                .from('tool_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (!data || data.length === 0) {
                list.innerHTML = '<p style="text-align:center; padding:2rem; opacity:0.7;">Tidak ada permintaan pending</p>';
                return;
            }

            let html = '';
            data.forEach(req => {
                const items = JSON.parse(req.items || '[]');
                const itemText = items.map(i => `${i.nama} (${i.jumlah})`).join(', ');
                html += `
                    <div class="stok-card" style="border-left:4px solid #f59e0b;">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
                            <span style="font-weight:700;">${esc(req.petugas)}</span>
                            <span class="stok-badge stok-badge-pending">${req.status}</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--stok-text-muted);">${esc(req.area)} | ${req.tanggal}</div>
                        <div style="font-size:0.75rem; margin-top:0.25rem;">${esc(itemText)}</div>
                        ${req.catatan ? `<div style="font-size:0.7rem; font-style:italic; opacity:0.7;">📝 ${esc(req.catatan)}</div>` : ''}
                    </div>
                `;
            });
            list.innerHTML = html;
        } catch (err) {
            console.error('[STOK] loadRequests error:', err);
            list.innerHTML = `<p style="text-align:center; padding:2rem; color:#ef4444;">Gagal memuat</p>`;
        }
    }

    async function loadAllRequestsHistory() {
        const tbody = document.getElementById('stok-history-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;"><div class="stok-spinner" style="margin:0 auto;"></div></td></tr>';

        try {
            const { data, error } = await _sb
                .from('tool_requests')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; opacity:0.7;">Belum ada riwayat</td></tr>';
                return;
            }

            let html = '';
            data.forEach(req => {
                const items = JSON.parse(req.items || '[]');
                const itemText = items.map(i => `${i.nama} (${i.jumlah})`).join(', ');
                const statusClass = req.status === 'pending' ? 'stok-badge-pending' : req.status === 'approved' ? 'stok-badge-approved' : 'stok-badge-rejected';
                html += `
                    <tr>
                        <td style="padding:0.5rem;">${req.tanggal}</td>
                        <td style="padding:0.5rem;">${esc(req.petugas)}</td>
                        <td style="padding:0.5rem;">${esc(req.area)}</td>
                        <td style="padding:0.5rem;">${esc(itemText)}</td>
                        <td style="padding:0.5rem;"><span class="stok-badge ${statusClass}">${req.status}</span></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } catch (err) {
            console.error('[STOK] loadHistory error:', err);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#ef4444;">Gagal memuat</td></tr>';
        }
    }

    /* ============================================================
       KONDISI
    ============================================================ */
    async function loadKondisi() {
        try {
            const { data, error } = await _sb
                .from('inventory')
                .select('kondisi')
                .in('kategori', ['janitor-indoor', 'janitor-outdoor']);
            if (error) throw error;

            const ringan = data.filter(i => i.kondisi === 'rusak_ringan').length;
            const berat = data.filter(i => i.kondisi === 'rusak_berat').length;
            const perbaikan = data.filter(i => i.kondisi === 'perbaikan').length;

            setEl('stok-stat-ringan', ringan);
            setEl('stok-stat-berat', berat);
            setEl('stok-stat-perbaikan', perbaikan);

            const rusakList = document.getElementById('stok-rusak-list');
            if (!rusakList) return;
            if (ringan + berat + perbaikan === 0) {
                rusakList.innerHTML = '<p style="opacity:0.7;">Semua alat dalam kondisi baik</p>';
                return;
            }

            const { data: items } = await _sb
                .from('inventory')
                .select('nama_barang, kondisi, jumlah, satuan, kategori')
                .in('kondisi', ['rusak_ringan', 'rusak_berat', 'perbaikan'])
                .in('kategori', ['janitor-indoor', 'janitor-outdoor'])
                .order('kondisi');

            let html = '';
            items.forEach(item => {
                const color = {
                    'rusak_ringan': '#f59e0b',
                    'rusak_berat': '#ef4444',
                    'perbaikan': '#f97316'
                }[item.kondisi];
                html += `
                    <div style="background:rgba(0,0,0,0.2); border-radius:8px; padding:0.75rem; margin-bottom:0.5rem;">
                        <div style="display:flex; justify-content:space-between;">
                            <span style="font-weight:600;">${esc(item.nama_barang)}</span>
                            <span style="color:${color};">${item.kondisi}</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--stok-text-muted);">Stok: ${item.jumlah} ${item.satuan || ''} · ${item.kategori === 'janitor-indoor' ? 'Indoor' : 'Outdoor'}</div>
                    </div>
                `;
            });
            rusakList.innerHTML = html;
        } catch (err) {
            console.error('[STOK] loadKondisi error:', err);
        }
    }

    function setEl(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    /* ============================================================
       SWITCH TAB
    ============================================================ */
    function switchTab(tabId) {
        document.querySelectorAll('.stok-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.stok-tab[data-tab="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        document.getElementById('stok-tab-stok').style.display = tabId === 'stok' ? 'block' : 'none';
        document.getElementById('stok-tab-permintaan').style.display = tabId === 'permintaan' ? 'block' : 'none';
        document.getElementById('stok-tab-riwayat').style.display = tabId === 'riwayat' ? 'block' : 'none';
        document.getElementById('stok-tab-kondisi').style.display = tabId === 'kondisi' ? 'block' : 'none';

        if (tabId === 'stok') loadStok();
        else if (tabId === 'permintaan') {
            loadInventoryDropdown();
            loadRequests();
        } else if (tabId === 'riwayat') loadAllRequestsHistory();
        else if (tabId === 'kondisi') loadKondisi();
    }

    /* ============================================================
       SEARCH
    ============================================================ */
    function setupSearch() {
        const searchInput = document.getElementById('stok-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase();
                const filtered = _currentStok.filter(item =>
                    item.nama_barang.toLowerCase().includes(keyword) ||
                    (item.kategori && item.kategori.toLowerCase().includes(keyword))
                );
                renderStokList(filtered);
            });
        }
    }

    /* ============================================================
       ATTACH EVENT LISTENERS
    ============================================================ */
    function attachEvents() {
        document.querySelectorAll('.stok-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        document.getElementById('stokForm').addEventListener('submit', handleStokSubmit);
        document.getElementById('stokRequestForm').addEventListener('submit', handleRequestSubmit);
        document.getElementById('stok-add-item')?.addEventListener('click', addItemRow);
        document.getElementById('stok-refresh-requests')?.addEventListener('click', loadRequests);

        // Delegasi untuk edit/hapus di stok list
        document.getElementById('stok-list').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'edit') handleEdit(id);
            else if (action === 'hapus') handleHapus(id);
        });

        // Delegasi untuk remove item di form permintaan
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('stok-remove-item')) {
                e.target.closest('.item-row').remove();
            }
        });

        setupSearch();

        // Set tanggal default
        const today = new Date().toISOString().split('T')[0];
        const tglInput = document.getElementById('stok-req-tanggal');
        if (tglInput) tglInput.value = today;
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

        await loadStok();
        await loadRequests();
        await loadKondisi();

        console.log('[STOK] Ready ✅');
    }, 100);

    // Return cleanup function
    return function cleanup() {
        document.getElementById('stok-styles')?.remove();
        console.log('[STOK] Cleanup done');
    };
}
