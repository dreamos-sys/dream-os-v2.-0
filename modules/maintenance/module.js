// modules/maintenance/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/eventBus.js';

console.log('🔧 Maintenance Module - Professional Edition Loaded');

// ===== STATE =====
let currentFilter = 'semua';
let stokList = [];
let qrStream = null;
let beforeImage = null;
let afterImage = null;
let scannedAssetId = null;
let elements = {};

// ===== RENDER HTML =====
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-6xl mx-auto p-4">
            <!-- Header -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl mb-6 border border-orange-500/30">
                <h2 class="text-2xl font-bold text-orange-400">🔧 MAINTENANCE</h2>
                <p class="text-xs text-slate-400">Professional Task Management System</p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <p class="text-xs text-slate-400">TOTAL</p>
                    <p class="text-2xl font-bold" id="stat-total">0</p>
                </div>
                <div class="bg-slate-800/50 p-4 rounded-xl border border-yellow-600/30">
                    <p class="text-xs text-slate-400">PENDING</p>
                    <p class="text-2xl font-bold text-yellow-500" id="stat-pending">0</p>
                </div>
                <div class="bg-slate-800/50 p-4 rounded-xl border border-blue-600/30">
                    <p class="text-xs text-slate-400">PROSES</p>
                    <p class="text-2xl font-bold text-blue-500" id="stat-proses">0</p>
                </div>
                <div class="bg-slate-800/50 p-4 rounded-xl border border-emerald-600/30">
                    <p class="text-xs text-slate-400">SELESAI</p>
                    <p class="text-2xl font-bold text-emerald-500" id="stat-selesai">0</p>
                </div>
            </div>

            <!-- Filter Tabs -->
            <div class="flex space-x-2 mb-6 overflow-x-auto">
                <button class="tab-btn active" data-filter="semua">📋 Semua</button>
                <button class="tab-btn" data-filter="pending">⏳ Pending</button>
                <button class="tab-btn" data-filter="proses">🔨 Proses</button>
                <button class="tab-btn" data-filter="selesai">✅ Selesai</button>
                <button class="tab-btn" data-filter="history">📜 Riwayat</button>
            </div>

            <!-- New Task Button -->
            <div class="flex justify-end mb-4">
                <button onclick="window.openNewTaskModal()" class="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg font-bold text-sm">
                    + Buat Tugas Baru
                </button>
            </div>

            <!-- Tasks List -->
            <div id="tasks-list" class="space-y-4">
                <div class="text-center py-12 opacity-60">Memuat tugas...</div>
            </div>
        </div>

        <!-- Modal New Task -->
        <div id="new-task-modal" class="modal hidden fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div class="bg-slate-800 p-6 rounded-2xl max-w-lg w-full">
                <h3 class="text-xl font-bold mb-4">Buat Tugas Maintenance</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm mb-1">Lokasi</label>
                        <input type="text" id="new-task-lokasi" class="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white">
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Deskripsi</label>
                        <textarea id="new-task-deskripsi" rows="3" class="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Prioritas</label>
                        <select id="new-task-prioritas" class="w-full p-2 rounded-lg bg-slate-700 border border-slate-600">
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Scan QR Asset (opsional)</label>
                        <button onclick="window.openQrModal()" class="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded-lg">📷 Scan QR</button>
                        <input type="hidden" id="asset-qr-code" value="">
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Foto Sebelum (opsional)</label>
                        <input type="file" accept="image/*" onchange="window.previewImage(this, 'preview-before')" class="w-full p-2">
                        <img id="preview-before" class="mt-2 max-h-32 rounded hidden">
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Foto Sesudah (opsional)</label>
                        <input type="file" accept="image/*" onchange="window.previewImage(this, 'preview-after')" class="w-full p-2">
                        <img id="preview-after" class="mt-2 max-h-32 rounded hidden">
                    </div>
                    <div class="flex gap-2 justify-end">
                        <button onclick="window.closeNewTaskModal()" class="px-4 py-2 bg-slate-700 rounded-lg">Batal</button>
                        <button onclick="window.submitNewTask()" class="px-4 py-2 bg-orange-600 rounded-lg">Simpan</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Sparepart -->
        <div id="sparepart-modal" class="modal hidden fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div class="bg-slate-800 p-6 rounded-2xl max-w-lg w-full">
                <h3 class="text-xl font-bold mb-4">Ambil Sparepart</h3>
                <input type="hidden" id="sparepart-task-id">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm mb-1">Pilih Barang</label>
                        <select id="sparepart-barang" class="w-full p-2 rounded-lg bg-slate-700 border border-slate-600"></select>
                        <p id="sparepart-stok-info" class="text-xs mt-1 text-slate-400"></p>
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Jumlah</label>
                        <input type="number" id="sparepart-jumlah" min="1" value="1" class="w-full p-2 rounded-lg bg-slate-700 border border-slate-600">
                    </div>
                    <div class="flex gap-2 justify-end">
                        <button onclick="window.closeSparepartModal()" class="px-4 py-2 bg-slate-700 rounded-lg">Batal</button>
                        <button onclick="window.handleAmbilSparepart()" class="px-4 py-2 bg-orange-600 rounded-lg">Ambil</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal QR Scanner -->
        <div id="qr-modal" class="modal hidden fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div class="bg-slate-800 p-6 rounded-2xl max-w-lg w-full">
                <h3 class="text-xl font-bold mb-4">Scan QR Code</h3>
                <video id="qr-video" autoplay playsinline class="w-full rounded-lg"></video>
                <div class="flex justify-end mt-4">
                    <button onclick="window.closeQrModal()" class="px-4 py-2 bg-red-600 rounded-lg">Tutup</button>
                </div>
            </div>
        </div>

        <!-- Modal History -->
        <div id="history-modal" class="modal hidden fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div class="bg-slate-800 p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <h3 class="text-xl font-bold mb-4">Riwayat Tugas</h3>
                <div id="history-timeline" class="space-y-4"></div>
                <div class="flex justify-end mt-4">
                    <button onclick="window.closeHistoryModal()" class="px-4 py-2 bg-slate-700 rounded-lg">Tutup</button>
                </div>
            </div>
        </div>
    `;
}

// ===== FUNGSI STATISTIK =====
async function loadStats() {
    if (!elements.statTotal) return;
    try {
        const [total, pending, proses, selesai] = await Promise.all([
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'proses'),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'selesai')
        ]);
        if (elements.statTotal) elements.statTotal.textContent = total.count || 0;
        if (elements.statPending) elements.statPending.textContent = pending.count || 0;
        if (elements.statProses) elements.statProses.textContent = proses.count || 0;
        if (elements.statSelesai) elements.statSelesai.textContent = selesai.count || 0;
    } catch (err) {
        console.error('[MAINTENANCE] Stats error:', err);
    }
}

// ===== LOAD TASKS =====
async function loadTasks(filter = 'semua') {
    if (!elements.tasksList) return;
    elements.tasksList.innerHTML = '<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div><p class="mt-2 opacity-60">Memuat tugas...</p></div>';

    try {
        let query = supabase
            .from('maintenance_tasks')
            .select(`
                *,
                k3_reports (jenis_laporan, foto_url),
                assets (nama_asset, lokasi)
            `)
            .order('created_at', { ascending: false });

        if (filter !== 'semua') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
            elements.tasksList.innerHTML = '<p class="text-center py-12 opacity-60">Tidak ada tugas</p>';
            return;
        }

        let html = '';
        data.forEach(task => {
            html += renderTaskCard(task);
        });
        elements.tasksList.innerHTML = html;
    } catch (err) {
        console.error('[MAINTENANCE] Load tasks error:', err);
        elements.tasksList.innerHTML = '<p class="text-center py-12 text-red-500">Gagal memuat data</p>';
    }
}

// ===== RENDER TASK CARD =====
function renderTaskCard(task) {
    const priorityClass = {
        'high': 'bg-red-600',
        'normal': 'bg-blue-600',
        'low': 'bg-green-600'
    }[task.prioritas] || 'bg-blue-600';

    const statusClass = {
        'pending': 'bg-yellow-600',
        'proses': 'bg-blue-600',
        'selesai': 'bg-green-600',
        'butuh_sparepart': 'bg-orange-600'
    }[task.status] || 'bg-yellow-600';

    const statusLabel = {
        'pending': 'Pending',
        'proses': 'Proses',
        'selesai': 'Selesai',
        'butuh_sparepart': 'Butuh Sparepart'
    }[task.status] || 'Pending';

    return `
        <div class="task-card bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="px-2 py-1 rounded text-xs ${priorityClass}">${task.prioritas || 'normal'}</span>
                        <span class="px-2 py-1 rounded text-xs ${statusClass}">${statusLabel}</span>
                        ${task.asset_id ? `<span class="px-2 py-1 rounded text-xs bg-slate-700">🏢 Asset: ${task.assets?.nama_asset || 'N/A'}</span>` : ''}
                        ${task.k3_report_id ? `<span class="px-2 py-1 rounded text-xs bg-slate-700">📋 From K3</span>` : ''}
                    </div>
                    <h3 class="font-bold text-lg">${task.lokasi || 'Lokasi tidak diketahui'}</h3>
                    <p class="text-sm opacity-70 mt-1">${task.deskripsi || '-'}</p>
                    <div class="flex items-center gap-4 mt-3 text-xs opacity-60">
                        <span>📅 ${new Date(task.created_at).toLocaleDateString('id-ID')}</span>
                        <span>👤 ${task.teknisi_id || 'Unassigned'}</span>
                        ${task.progress_notes ? `<span>📝 ${task.progress_notes}</span>` : ''}
                    </div>
                    <div class="flex gap-2 mt-3">
                        ${task.status === 'pending' ? `
                            <button onclick="window.ambilTugas('${task.id}')" class="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs">
                                <i class="fas fa-hammer"></i> Ambil Tugas
                            </button>
                        ` : ''}
                        ${task.status === 'proses' ? `
                            <button onclick="window.bukaModalSparepart('${task.id}')" class="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs">
                                <i class="fas fa-cog"></i> Sparepart
                            </button>
                            <button onclick="window.updateProgress('${task.id}')" class="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs">
                                <i class="fas fa-edit"></i> Update
                            </button>
                            <button onclick="window.selesaikanTugas('${task.id}')" class="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-xs">
                                <i class="fas fa-check"></i> Selesai
                            </button>
                        ` : ''}
                        ${task.status === 'butuh_sparepart' ? `
                            <button onclick="window.bukaModalSparepart('${task.id}')" class="px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-xs">
                                <i class="fas fa-cog"></i> Ambil Sparepart
                            </button>
                        ` : ''}
                        <button onclick="window.viewTaskDetail('${task.id}')" class="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs">
                            <i class="fas fa-eye"></i> Detail
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== SETUP TABS =====
function setupTabs() {
    if (!elements.tabs) return;
    elements.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            currentFilter = filter;
            
            elements.tabs.forEach(b => b.classList.remove('active', 'bg-orange-600', 'text-white'));
            btn.classList.add('active', 'bg-orange-600', 'text-white');
            
            if (filter === 'history') {
                openHistoryModal();
            } else {
                loadTasks(filter);
            }
        });
    });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    const sparepartSelect = document.getElementById('sparepart-barang');
    if (sparepartSelect) {
        sparepartSelect.addEventListener('change', function() {
            const selected = this.options[this.selectedIndex];
            const stok = selected?.dataset.stok || 0;
            const stokInfo = document.getElementById('sparepart-stok-info');
            if (stokInfo) stokInfo.innerText = `Stok tersedia: ${stok}`;
        });
    }

    const ambilBtn = document.getElementById('sparepart-ambil');
    if (ambilBtn) {
        ambilBtn.addEventListener('click', handleAmbilSparepart);
    }
}

// ===== FUNGSI-FUNGSI TOMBOL =====
window.ambilTugas = async (taskId) => {
    if (!confirm('Ambil tugas ini?')) return;
    const user = store.get('user');
    
    const { error } = await supabase
        .from('maintenance_tasks')
        .update({ 
            status: 'proses', 
            teknisi_id: user?.key || null,
            progress_notes: 'Tugas diambil - Mulai pengerjaan',
            started_at: new Date().toISOString()
        })
        .eq('id', taskId);
    
    if (error) {
        showToast('Gagal: ' + error.message, 'error');
    } else {
        showToast('Tugas diambil', 'success');
        loadTasks(currentFilter);
        loadStats();
    }
};

window.selesaikanTugas = async (taskId) => {
    const catatan = prompt('Catatan penyelesaian (opsional):');
    
    const { error } = await supabase
        .from('maintenance_tasks')
        .update({ 
            status: 'selesai', 
            progress_notes: catatan || 'Selesai',
            completed_at: new Date().toISOString()
        })
        .eq('id', taskId);
    
    if (error) {
        showToast('Gagal: ' + error.message, 'error');
    } else {
        showToast('Tugas selesai', 'success');
        loadTasks(currentFilter);
        loadStats();
    }
};

window.updateProgress = async (taskId) => {
    const progress = prompt('Update progress:');
    if (!progress) return;
    
    const { error } = await supabase
        .from('maintenance_tasks')
        .update({ progress_notes: progress })
        .eq('id', taskId);
    
    if (error) {
        showToast('Gagal: ' + error.message, 'error');
    } else {
        showToast('Progress updated', 'success');
        loadTasks(currentFilter);
    }
};

window.bukaModalSparepart = async (taskId) => {
    const taskInput = document.getElementById('sparepart-task-id');
    if (taskInput) taskInput.value = taskId;
    
    const { data, error } = await supabase
        .from('gudang_stok')
        .select('id, nama_barang, stok, satuan')
        .gt('stok', 0);
    
    if (error) {
        showToast('Gagal memuat stok: ' + error.message, 'error');
        return;
    }
    
    stokList = data || [];
    const select = document.getElementById('sparepart-barang');
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih --</option>' + 
        stokList.map(item => `<option value="${item.id}" data-stok="${item.stok}">${item.nama_barang} (stok: ${item.stok} ${item.satuan || ''})</option>`).join('');
    
    const stokInfo = document.getElementById('sparepart-stok-info');
    if (stokInfo) stokInfo.innerText = '';
    
    const modal = document.getElementById('sparepart-modal');
    if (modal) modal.classList.add('active');
};

window.closeSparepartModal = () => {
    const modal = document.getElementById('sparepart-modal');
    if (modal) modal.classList.remove('active');
};

window.handleAmbilSparepart = async () => {
    const taskId = document.getElementById('sparepart-task-id')?.value;
    const barangId = document.getElementById('sparepart-barang')?.value;
    const jumlah = parseInt(document.getElementById('sparepart-jumlah')?.value || 0);

    if (!taskId || !barangId || jumlah < 1) {
        showToast('Pilih barang dan jumlah valid', 'warning');
        return;
    }

    const barang = stokList.find(b => b.id === barangId);
    if (!barang) return;

    if (barang.stok < jumlah) {
        showToast(`Stok tidak cukup! Tersedia ${barang.stok}`, 'warning');
        return;
    }

    const { error: updateError } = await supabase
        .from('gudang_stok')
        .update({ stok: barang.stok - jumlah })
        .eq('id', barangId);

    if (updateError) {
        showToast('Gagal update stok: ' + updateError.message, 'error');
        return;
    }

    const { error: usageError } = await supabase
        .from('inventory_usage')
        .insert([{
            task_id: taskId,
            barang_id: barangId,
            jumlah: jumlah,
            created_at: new Date().toISOString()
        }]);

    if (usageError) {
        showToast('Gagal mencatat pemakaian: ' + usageError.message, 'warning');
    }

    await supabase
        .from('maintenance_tasks')
        .update({ status: 'proses', progress_notes: 'Sparepart diambil' })
        .eq('id', taskId);

    showToast('Sparepart berhasil diambil', 'success');
    window.closeSparepartModal();
    loadTasks(currentFilter);
    loadStats();
};

// ===== QR SCANNER =====
window.openQrModal = () => {
    const modal = document.getElementById('qr-modal');
    if (modal) modal.classList.add('active');
    startQrScanner();
};

window.closeQrModal = () => {
    const modal = document.getElementById('qr-modal');
    if (modal) modal.classList.remove('active');
    stopQrScanner();
};

function startQrScanner() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(stream) {
                qrStream = stream;
                const video = document.getElementById('qr-video');
                if (video) video.srcObject = stream;
                
                // Simulasi scan setelah 3 detik (ganti dengan library QR scanner sesungguhnya)
                setTimeout(() => {
                    scannedAssetId = 'ASSET-' + Date.now();
                    const assetInput = document.getElementById('asset-qr-code');
                    if (assetInput) assetInput.value = scannedAssetId;
                    showToast('QR scanned: ' + scannedAssetId, 'success');
                    window.closeQrModal();
                }, 3000);
            })
            .catch(function(err) {
                showToast('Camera access denied', 'error');
                window.closeQrModal();
            });
    }
}

function stopQrScanner() {
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
}

// ===== PREVIEW IMAGE =====
window.previewImage = (input, previewId) => {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            
            if (previewId === 'preview-before') {
                beforeImage = e.target.result;
            } else {
                afterImage = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
};

// ===== NEW TASK MODAL =====
window.openNewTaskModal = () => {
    const modal = document.getElementById('new-task-modal');
    if (modal) modal.classList.add('active');
};

window.closeNewTaskModal = () => {
    const modal = document.getElementById('new-task-modal');
    if (modal) modal.classList.remove('active');
    beforeImage = null;
    afterImage = null;
    scannedAssetId = null;
};

window.submitNewTask = async () => {
    const lokasi = document.getElementById('new-task-lokasi')?.value;
    const deskripsi = document.getElementById('new-task-deskripsi')?.value;
    const prioritas = document.getElementById('new-task-prioritas')?.value;
    
    if (!lokasi || !deskripsi) {
        showToast('Lokasi dan deskripsi wajib diisi', 'warning');
        return;
    }
    
    const { error } = await supabase
        .from('maintenance_tasks')
        .insert([{
            lokasi,
            deskripsi,
            prioritas,
            status: 'pending',
            asset_id: scannedAssetId,
            foto_before: beforeImage,
            foto_after: afterImage,
            created_at: new Date().toISOString()
        }]);
    
    if (error) {
        showToast('Gagal: ' + error.message, 'error');
    } else {
        showToast('Tugas dibuat', 'success');
        window.closeNewTaskModal();
        loadTasks(currentFilter);
        loadStats();
    }
};

// ===== HISTORY MODAL =====
window.openHistoryModal = () => {
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('active');
    loadHistory();
};

window.closeHistoryModal = () => {
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.remove('active');
};

async function loadHistory() {
    const container = document.getElementById('history-timeline');
    if (!container) return;
    
    const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('status', 'selesai')
        .order('completed_at', { ascending: false })
        .limit(20);
    
    if (error) {
        container.innerHTML = '<p class="text-center text-red-500">Gagal memuat riwayat</p>';
        return;
    }
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-center opacity-60">Belum ada riwayat</p>';
        return;
    }
    
    container.innerHTML = data.map(task => `
        <div class="timeline-item bg-slate-800/30 p-3 rounded-lg">
            <div class="text-sm text-orange-400">${new Date(task.completed_at).toLocaleDateString('id-ID', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}</div>
            <div class="font-bold mt-1">${task.lokasi}</div>
            <div class="text-xs opacity-70">${task.deskripsi?.substring(0, 100)}...</div>
            <div class="text-xs opacity-50 mt-1">👤 ${task.teknisi_id || '-'}</div>
        </div>
    `).join('');
}

// ===== DETAIL VIEW (placeholder) =====
window.viewTaskDetail = (taskId) => {
    showToast('Detail task ' + taskId, 'info');
};

// ===== INIT =====
export async function init() {
    console.log('[MAINTENANCE] Module initialized');
    renderHTML();

    // Ambil elemen DOM setelah dirender
    elements = {
        statTotal: document.getElementById('stat-total'),
        statPending: document.getElementById('stat-pending'),
        statProses: document.getElementById('stat-proses'),
        statSelesai: document.getElementById('stat-selesai'),
        tasksList: document.getElementById('tasks-list'),
        tabs: document.querySelectorAll('.tab-btn'),
    };

    // Load data awal
    await loadStats();
    await loadTasks(currentFilter);
    setupTabs();
    setupEventListeners();

    // Listener dari K3 Report
    eventBus.on('k3-report', async (data) => {
        if (data.jenis === 'kerusakan' || data.jenis === 'bahaya') {
            await supabase.from('maintenance_tasks').insert([{
                lokasi: data.lokasi,
                deskripsi: `[Auto dari K3] ${data.deskripsi}`,
                prioritas: data.prioritas || 'normal',
                status: 'pending',
                created_at: new Date().toISOString()
            }]);
            showToast('Task maintenance dibuat dari laporan K3', 'success');
            loadTasks(currentFilter);
            loadStats();
        }
    });
}

export function cleanup() {
    stopQrScanner();
    // Hapus event listener dari eventBus jika perlu
    console.log('[MAINTENANCE] Module cleanup');
}
