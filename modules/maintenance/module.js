/**
 * modules/maintenance/module.js
 * Dream OS v2.0 — Modul Maintenance (Self-Contained)
 * Fitur: Manajemen tugas perbaikan, sparepart, QR asset, integrasi K3
 */

// ========== SUPABASE CONFIG ==========
const SB_URL = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

// ========== STATE ==========
let _sb = null;
let _currentUser = null;
let _currentLang = localStorage.getItem('lang') || 'id';
let _currentFilter = 'semua';
let _stokList = [];
let _qrStream = null;
let _beforeImage = null;
let _afterImage = null;
let _scannedAssetId = null;

// ========== INIT SUPABASE ==========
async function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        _sb = window.supabase.createClient(SB_URL, SB_KEY);
        return true;
    }

    console.warn('[MAINT] Supabase tidak ditemukan, auto-inject CDN...');
    try {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        if (window.supabase && typeof window.supabase.createClient === 'function') {
            _sb = window.supabase.createClient(SB_URL, SB_KEY);
            return true;
        }
        throw new Error('Supabase masih undefined setelah load');
    } catch (err) {
        console.error('[MAINT] Gagal auto-inject supabase:', err);
        return false;
    }
}

// ========== BUILT-IN TOAST ==========
function toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (container) {
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':type==='warning'?'⚠️':'ℹ️'}</span><span>${msg}</span>`;
        container.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
        return;
    }
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        background:${type==='error'?'rgba(239,68,68,.9)':type==='warning'?'rgba(245,158,11,.9)':type==='info'?'rgba(59,130,246,.9)':'rgba(16,185,129,.9)'};
        color:white;padding:10px 20px;border-radius:12px;z-index:99999;
        font-family:'Rajdhani','Inter',sans-serif;font-weight:700;font-size:.9rem;
        opacity:0;transition:opacity .3s;white-space:nowrap;
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.style.opacity = '1', 10);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ========== HELPERS ==========
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('id-ID') : ''; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : ''; }

// ========== INJECT CSS ==========
function injectCSS() {
    if (document.getElementById('maint-styles')) return;
    const style = document.createElement('style');
    style.id = 'maint-styles';
    style.textContent = `
        #maint-root * { box-sizing: border-box; }
        #maint-root {
            max-width: 1100px;
            margin: 0 auto;
            padding: 1rem;
            font-family: 'Inter', 'Rajdhani', sans-serif;
            color: #e2e8f0;
        }
        .maint-panel {
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(249,115,22,0.25);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .maint-header {
            background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05));
            border-left: 4px solid #f97316;
        }
        .maint-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #f97316, #ea580c);
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
            border-radius: 12px;
            padding: 1rem;
            border-left: 3px solid #f97316;
        }
        .maint-stat-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.5px;
        }
        .maint-stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 0.25rem;
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
            color: #94a3b8;
            cursor: pointer;
            transition: 0.2s;
            border: 1px solid transparent;
        }
        .maint-tab:hover { background: rgba(249,115,22,0.1); color: #f97316; }
        .maint-tab.active { background: #f97316; color: white; border-color: #f97316; }
        .maint-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.6rem 1.2rem;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: 0.2s;
            border: none;
            background: rgba(255,255,255,0.08);
            color: #e2e8f0;
        }
        .maint-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.15); }
        .maint-btn-primary {
            background: #f97316;
            color: white;
        }
        .maint-btn-primary:hover { background: #ea580c; }
        .maint-btn-sm {
            padding: 0.3rem 1rem;
            font-size: 0.75rem;
            border-radius: 20px;
        }
        .task-card {
            background: rgba(0,0,0,0.2);
            border-radius: 16px;
            padding: 1rem;
            margin-bottom: 1rem;
            border: 1px solid rgba(255,255,255,0.05);
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
        .badge-butuh { background: rgba(249,115,22,0.2); color: #f97316; }
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
            border-radius: 24px;
            padding: 1.5rem;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid rgba(249,115,22,0.3);
        }
        .maint-input, .maint-select, .maint-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            color: white;
            font-family: inherit;
            font-size: 0.9rem;
            transition: 0.2s;
        }
        .maint-input:focus, .maint-select:focus, .maint-textarea:focus {
            outline: none;
            border-color: #f97316;
            box-shadow: 0 0 0 3px rgba(249,115,22,0.2);
        }
        .maint-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }
        .maint-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(249,115,22,0.2);
            border-top-color: #f97316;
            border-radius: 50%;
            animation: maint-spin 1s linear infinite;
        }
        @keyframes maint-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}

// ========== RENDER HTML ==========
function renderRoot(container) {
    container.innerHTML = `
    <div id="maint-root">
        <!-- HEADER -->
        <div class="maint-panel maint-header" style="margin-bottom:1.5rem">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="font-size:3rem;">🔧</div>
                <div>
                    <div class="maint-title">MAINTENANCE</div>
                    <div class="maint-sub" style="font-size:0.75rem;color:#94a3b8;">Professional Task Management System</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:0.5rem;">
                    <span id="maint-user-badge" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">GUEST</span>
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
            <button class="maint-btn maint-btn-primary" onclick="window.maint_openNewTaskModal()">
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
            <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem; color:#f97316;">Buat Tugas Maintenance</h3>
            <div class="space-y-3">
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Lokasi</label>
                    <input type="text" id="maint-new-lokasi" class="maint-input" placeholder="Gedung A Lantai 2">
                </div>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Deskripsi</label>
                    <textarea id="maint-new-deskripsi" rows="3" class="maint-textarea" placeholder="Jelaskan perbaikan..."></textarea>
                </div>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Prioritas</label>
                    <select id="maint-new-prioritas" class="maint-select">
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Scan QR Asset (opsional)</label>
                    <button class="maint-btn maint-btn-primary" style="width:100%" onclick="window.maint_openQrModal()">
                        <i class="fas fa-qrcode"></i> Scan QR
                    </button>
                    <input type="hidden" id="maint-asset-qr-code" value="">
                </div>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Foto Sebelum (opsional)</label>
                    <input type="file" id="maint-foto-before" accept="image/*" class="maint-input" onchange="window.maint_previewImage(this, 'maint-preview-before')">
                    <img id="maint-preview-before" class="mt-2 max-h-32 rounded hidden">
                </div>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Foto Sesudah (opsional)</label>
                    <input type="file" id="maint-foto-after" accept="image/*" class="maint-input" onchange="window.maint_previewImage(this, 'maint-preview-after')">
                    <img id="maint-preview-after" class="mt-2 max-h-32 rounded hidden">
                </div>
                <div class="flex gap-2 justify-end mt-4">
                    <button class="maint-btn" onclick="window.maint_closeNewTaskModal()">Batal</button>
                    <button class="maint-btn maint-btn-primary" onclick="window.maint_submitNewTask()">Simpan</button>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL SPAREPART -->
    <div id="maint-sparepart-modal" class="maint-modal">
        <div class="maint-modal-content">
            <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem; color:#f97316;">Ambil Sparepart</h3>
            <input type="hidden" id="maint-sparepart-task-id">
            <div class="space-y-3">
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Pilih Barang</label>
                    <select id="maint-sparepart-barang" class="maint-select">
                        <option value="">-- Pilih --</option>
                    </select>
                    <p id="maint-sparepart-stok-info" class="text-xs text-slate-400 mt-1"></p>
                </div>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Jumlah</label>
                    <input type="number" id="maint-sparepart-jumlah" min="1" value="1" class="maint-input">
                </div>
                <div class="flex gap-2 justify-end mt-4">
                    <button class="maint-btn" onclick="window.maint_closeSparepartModal()">Batal</button>
                    <button class="maint-btn maint-btn-primary" onclick="window.maint_ambilSparepart()">Ambil</button>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL QR SCANNER -->
    <div id="maint-qr-modal" class="maint-modal">
        <div class="maint-modal-content">
            <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem; color:#f97316;">Scan QR Code</h3>
            <video id="maint-qr-video" autoplay playsinline style="width:100%; border-radius:12px; background:#000;"></video>
            <div style="text-align:right; margin-top:1rem;">
                <button class="maint-btn" onclick="window.maint_closeQrModal()">Tutup</button>
            </div>
        </div>
    </div>

    <!-- MODAL HISTORY -->
    <div id="maint-history-modal" class="maint-modal">
        <div class="maint-modal-content" style="max-width:600px;">
            <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem; color:#f97316;">Riwayat Tugas Selesai</h3>
            <div id="maint-history-timeline" style="max-height:60vh; overflow-y:auto;"></div>
            <div style="text-align:right; margin-top:1rem;">
                <button class="maint-btn" onclick="window.maint_closeHistoryModal()">Tutup</button>
            </div>
        </div>
    </div>
    `;
}

// ========== LOAD STATISTIK ==========
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

// ========== LOAD TASKS ==========
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
            <div style="display:flex; gap:1rem; font-size:0.7rem; color:#94a3b8; margin-bottom:0.75rem;">
                <span>📅 ${fmtDate(task.created_at)}</span>
                <span>👤 ${esc(task.teknisi_id || 'Unassigned')}</span>
                ${task.progress_notes ? `<span>📝 ${esc(task.progress_notes)}</span>` : ''}
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                ${task.status === 'pending' ? `
                    <button class="maint-btn maint-btn-sm" onclick="window.maint_ambilTugas('${task.id}')"><i class="fas fa-hammer"></i> Ambil</button>
                ` : ''}
                ${task.status === 'proses' ? `
                    <button class="maint-btn maint-btn-sm" onclick="window.maint_bukaSparepartModal('${task.id}')"><i class="fas fa-cog"></i> Sparepart</button>
                    <button class="maint-btn maint-btn-sm" onclick="window.maint_updateProgress('${task.id}')"><i class="fas fa-edit"></i> Update</button>
                    <button class="maint-btn maint-btn-sm" onclick="window.maint_selesaikanTugas('${task.id}')"><i class="fas fa-check"></i> Selesai</button>
                ` : ''}
                ${task.status === 'butuh_sparepart' ? `
                    <button class="maint-btn maint-btn-sm" onclick="window.maint_bukaSparepartModal('${task.id}')"><i class="fas fa-cog"></i> Sparepart</button>
                ` : ''}
                <button class="maint-btn maint-btn-sm" onclick="window.maint_detailTugas('${task.id}')"><i class="fas fa-eye"></i> Detail</button>
            </div>
        </div>
    `;
}

// ========== FUNGSI TOMBOL ==========
window.maint_ambilTugas = async (taskId) => {
    if (!confirm('Ambil tugas ini?')) return;
    const user = _currentUser || { key: null };
    const { error } = await _sb
        .from('maintenance_tasks')
        .update({ 
            status: 'proses', 
            teknisi_id: user.key || 'System',
            progress_notes: 'Tugas diambil - Mulai pengerjaan',
            started_at: new Date().toISOString()
        })
        .eq('id', taskId);
    if (error) { toast('Gagal: ' + error.message, 'error'); return; }
    toast('Tugas diambil', 'success');
    loadTasks(_currentFilter);
    loadStats();
};

window.maint_selesaikanTugas = async (taskId) => {
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
    toast('Tugas selesai', 'success');
    loadTasks(_currentFilter);
    loadStats();
};

window.maint_updateProgress = async (taskId) => {
    const progress = prompt('Update progress:');
    if (!progress) return;
    const { error } = await _sb
        .from('maintenance_tasks')
        .update({ progress_notes: progress })
        .eq('id', taskId);
    if (error) { toast('Gagal: ' + error.message, 'error'); return; }
    toast('Progress updated', 'success');
    loadTasks(_currentFilter);
};

window.maint_bukaSparepartModal = async (taskId) => {
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
};

window.maint_closeSparepartModal = () => {
    document.getElementById('maint-sparepart-modal').classList.remove('active');
};

window.maint_ambilSparepart = async () => {
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

    toast('Sparepart berhasil diambil', 'success');
    window.maint_closeSparepartModal();
    loadTasks(_currentFilter);
    loadStats();
};

// ========== QR SCANNER ==========
window.maint_openQrModal = () => {
    document.getElementById('maint-qr-modal').classList.add('active');
    startQrScanner();
};

window.maint_closeQrModal = () => {
    document.getElementById('maint-qr-modal').classList.remove('active');
    stopQrScanner();
};

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
                    toast('QR scanned: ' + _scannedAssetId, 'success');
                    window.maint_closeQrModal();
                }, 3000);
            })
            .catch(() => {
                toast('Tidak dapat mengakses kamera', 'error');
                window.maint_closeQrModal();
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

// ========== PREVIEW IMAGE ==========
window.maint_previewImage = (input, previewId) => {
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
};

// ========== NEW TASK MODAL ==========
window.maint_openNewTaskModal = () => {
    document.getElementById('maint-new-task-modal').classList.add('active');
    _beforeImage = null;
    _afterImage = null;
    _scannedAssetId = null;
    document.getElementById('maint-asset-qr-code').value = '';
    document.getElementById('maint-preview-before').style.display = 'none';
    document.getElementById('maint-preview-after').style.display = 'none';
    document.getElementById('maint-foto-before').value = '';
    document.getElementById('maint-foto-after').value = '';
};

window.maint_closeNewTaskModal = () => {
    document.getElementById('maint-new-task-modal').classList.remove('active');
};

window.maint_submitNewTask = async () => {
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
    toast('Tugas dibuat', 'success');
    window.maint_closeNewTaskModal();
    loadTasks(_currentFilter);
    loadStats();
};

// ========== HISTORY MODAL ==========
window.maint_openHistoryModal = () => {
    document.getElementById('maint-history-modal').classList.add('active');
    loadHistoryTimeline();
};

window.maint_closeHistoryModal = () => {
    document.getElementById('maint-history-modal').classList.remove('active');
};

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
        <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1rem; margin-bottom:0.75rem;">
            <div style="color:#f97316; font-size:0.8rem;">${fmtDate(task.completed_at)}</div>
            <div style="font-weight:700; margin:0.25rem 0;">${esc(task.lokasi)}</div>
            <div style="opacity:0.7; font-size:0.85rem;">${esc(task.deskripsi?.substring(0,100))}...</div>
            <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.25rem;">👤 ${esc(task.teknisi_id || '-')}</div>
        </div>
    `).join('');
}

// ========== DETAIL (placeholder) ==========
window.maint_detailTugas = (taskId) => {
    toast('Detail task ' + taskId, 'info');
};

// ========== SWITCH FILTER ==========
function switchFilter(filter) {
    _currentFilter = filter;
    document.querySelectorAll('.maint-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.maint-tab[data-filter="${filter}"]`).classList.add('active');

    if (filter === 'history') {
        window.maint_openHistoryModal();
    } else {
        loadTasks(filter);
    }
}

// ========== ATTACH EVENT LISTENERS ==========
function attachEvents() {
    document.querySelectorAll('.maint-tab').forEach(btn => {
        btn.addEventListener('click', () => switchFilter(btn.dataset.filter));
    });

    // sparepart select change
    const sparepartSelect = document.getElementById('maint-sparepart-barang');
    if (sparepartSelect) {
        sparepartSelect.addEventListener('change', function() {
            const selected = this.options[this.selectedIndex];
            const stok = selected?.dataset.stok || 0;
            document.getElementById('maint-sparepart-stok-info').innerText = `Stok tersedia: ${stok}`;
        });
    }
}

// ========== EXPORTED INIT ==========
export async function init(params = {}) {
    console.log('[MAINT] init()', params);

    injectCSS();

    const container = document.getElementById('module-content');
    if (!container) { console.error('[MAINT] #module-content tidak ditemukan'); return; }

    const sbOk = await initSupabase();
    if (!sbOk) {
        container.innerHTML = `<div style="text-align:center;padding:3rem;color:#ef4444">
            <i class="fas fa-exclamation-circle" style="font-size:2rem;margin-bottom:1rem"></i>
            <p style="font-weight:700">Gagal load Supabase</p>
            <p style="font-size:.82rem;opacity:.7;margin-top:.5rem">Cek koneksi internet — CDN supabase-js gagal dimuat</p>
        </div>`;
        return;
    }

    renderRoot(container);

    if (params.user) {
        _currentUser = params.user;
        document.getElementById('maint-user-badge').textContent = params.user.name?.toUpperCase() || 'USER';
    }
    if (params.lang) _currentLang = params.lang;

    await loadStats();
    await loadTasks('semua');
    attachEvents();

    // Listen event dari K3 (jika ada)
    if (window.eventBus) {
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

    console.log('[MAINT] Ready ✅');
}

// ========== EXPORTED CLEANUP ==========
export function cleanup() {
    stopQrScanner();
    document.getElementById('maint-styles')?.remove();
    // Hapus semua event listener yang ditambahkan ke window (opsional)
    delete window.maint_ambilTugas;
    delete window.maint_selesaikanTugas;
    delete window.maint_updateProgress;
    delete window.maint_bukaSparepartModal;
    delete window.maint_closeSparepartModal;
    delete window.maint_ambilSparepart;
    delete window.maint_openQrModal;
    delete window.maint_closeQrModal;
    delete window.maint_previewImage;
    delete window.maint_openNewTaskModal;
    delete window.maint_closeNewTaskModal;
    delete window.maint_submitNewTask;
    delete window.maint_openHistoryModal;
    delete window.maint_closeHistoryModal;
    delete window.maint_detailTugas;
    console.log('[MAINT] Cleanup done');
}
