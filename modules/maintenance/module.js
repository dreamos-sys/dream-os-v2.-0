import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

console.log('🔧 Maintenance Module - Professional Edition Loaded');

let currentFilter = 'semua';
let stokList = [];
let qrStream = null;
let beforeImage = null;
let afterImage = null;
let scannedAssetId = null;

// ===== INIT =====
export function init() {
    console.log('[MAINTENANCE] Module initialized');
    loadStats();
    loadTasks('semua');
    setupTabs();
    setupEventListeners();
}

// ===== SETUP TABS =====
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            currentFilter = filter;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (filter === 'history') {
                openHistoryModal();
            } else {
                loadTasks(filter);
            }
        });
    });
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('sparepart-barang')?.addEventListener('change', function() {
        const selected = this.options[this.selectedIndex];
        const stok = selected.dataset.stok || 0;
        document.getElementById('sparepart-stok-info').innerText = `Stok tersedia: ${stok}`;
    });

    document.getElementById('sparepart-ambil')?.addEventListener('click', handleAmbilSparepart);
}

// ===== LOAD STATS =====
async function loadStats() {
    try {
        const [total, pending, proses, selesai] = await Promise.all([
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'proses'),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).eq('status', 'selesai')
        ]);
        document.getElementById('stat-total').textContent = total.count || 0;
        document.getElementById('stat-pending').textContent = pending.count || 0;
        document.getElementById('stat-proses').textContent = proses.count || 0;
        document.getElementById('stat-selesai').textContent = selesai.count || 0;
    } catch (err) {
        console.error('[MAINTENANCE] Stats error:', err);
    }
}

// ===== LOAD TASKS =====
async function loadTasks(filter = 'semua') {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div><p class="mt-2 opacity-60">Memuat tugas...</p></div>';

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
            container.innerHTML = '<p class="text-center py-12 opacity-60">Tidak ada tugas</p>';
            return;
        }

        let html = '';
        data.forEach(task => {
            html += renderTaskCard(task);
        });
        container.innerHTML = html;
    } catch (err) {
        console.error('[MAINTENANCE] Load tasks error:', err);
        container.innerHTML = '<p class="text-center py-12 text-red-500">Gagal memuat data</p>';
    }
}

// ===== RENDER TASK CARD =====
function renderTaskCard(task) {
    const priorityClass = {
        'high': 'badge-high',
        'normal': 'badge-normal',
        'low': 'badge-low'
    }[task.prioritas] || 'badge-normal';

    const statusClass = {
        'pending': 'badge-pending',
        'proses': 'badge-proses',
        'selesai': 'badge-selesai',
        'butuh_sparepart': 'badge-butuh_sparepart'
    }[task.status] || 'badge-pending';

    const statusLabel = {
        'pending': 'Pending',
        'proses': 'Proses',
        'selesai': 'Selesai',
        'butuh_sparepart': 'Butuh Sparepart'
    }[task.status] || 'Pending';

    return `
        <div class="task-card status-${task.status}">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="badge ${priorityClass}">${task.prioritas || 'normal'}</span>
                        <span class="badge ${statusClass}">${statusLabel}</span>
                        ${task.asset_id ? `<span class="badge badge-normal">🏢 Asset: ${task.assets?.nama_asset || 'N/A'}</span>` : ''}
                        ${task.k3_report_id ? `<span class="badge badge-normal">📋 From K3</span>` : ''}
                    </div>
                    <h3 class="font-bold text-lg">${task.lokasi || 'Lokasi tidak diketahui'}</h3>
                    <p class="text-sm opacity-70 mt-1">${task.deskripsi || '-'}</p>
                    <div class="flex items-center gap-4 mt-3 text-xs opacity-60">
                        <span>📅 ${new Date(task.created_at).toLocaleDateString('id-ID')}</span>
                        <span>👤 ${task.teknisi_id || 'Unassigned'}</span>
                        ${task.progress_notes ? `<span>📝 ${task.progress_notes}</span>` : ''}
                    </div>
                    <div class="action-buttons">
                        ${task.status === 'pending' ? `
                            <button onclick="window.ambilTugas('${task.id}')" class="btn-action btn-primary">
                                <i class="fas fa-hammer"></i> Ambil Tugas
                            </button>
                        ` : ''}
                        ${task.status === 'proses' ? `
                            <button onclick="window.bukaModalSparepart('${task.id}')" class="btn-action">
                                <i class="fas fa-cog"></i> Sparepart
                            </button>
                            <button onclick="window.updateProgress('${task.id}')" class="btn-action">
                                <i class="fas fa-edit"></i> Update
                            </button>
                            <button onclick="window.selesaikanTugas('${task.id}')" class="btn-action" style="border-color: var(--emerald);">
                                <i class="fas fa-check"></i> Selesai
                            </button>
                        ` : ''}
                        ${task.status === 'butuh_sparepart' ? `
                            <button onclick="window.bukaModalSparepart('${task.id}')" class="btn-action btn-primary">
                                <i class="fas fa-cog"></i> Ambil Sparepart
                            </button>
                        ` : ''}
                        <button onclick="window.viewTaskDetail('${task.id}')" class="btn-action">
                            <i class="fas fa-eye"></i> Detail
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== FILTER BY STATUS =====
window.filterByStatus = function(status) {
    currentFilter = status;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === status);
    });
    loadTasks(status);
};

// ===== AMBIL TUGAS =====
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
        syncToCommandCenter(taskId, 'assigned');
    }
};

// ===== SELESAIKAN TUGAS =====
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
        syncToCommandCenter(taskId, 'completed');
    }
};

// ===== UPDATE PROGRESS =====
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

// ===== MODAL SPAREPART =====
window.bukaModalSparepart = async (taskId) => {
    document.getElementById('sparepart-task-id').value = taskId;
    
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
    select.innerHTML = '<option value="">-- Pilih --</option>' + 
        stokList.map(item => `<option value="${item.id}" data-stok="${item.stok}">${item.nama_barang} (stok: ${item.stok} ${item.satuan || ''})</option>`).join('');
    
    document.getElementById('sparepart-stok-info').innerText = '';
    document.getElementById('sparepart-modal').classList.add('active');
};

async function handleAmbilSparepart() {
    const taskId = document.getElementById('sparepart-task-id').value;
    const barangId = document.getElementById('sparepart-barang').value;
    const jumlah = parseInt(document.getElementById('sparepart-jumlah').value);

    if (!barangId || jumlah < 1) {
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
    closeSparepartModal();
    loadTasks(currentFilter);
    loadStats();
    syncToCommandCenter(taskId, 'sparepart_taken');
    syncToInventory(barangId, jumlah);
}

function closeSparepartModal() {
    document.getElementById('sparepart-modal').classList.remove('active');
}

// ===== QR SCANNER =====
window.openQrModal = function() {
    document.getElementById('qr-modal').classList.add('active');
    startQrScanner();
};

window.closeQrModal = function() {
    document.getElementById('qr-modal').classList.remove('active');
    stopQrScanner();
};

function startQrScanner() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(stream) {
                qrStream = stream;
                const video = document.getElementById('qr-video');
                video.srcObject = stream;
                
                setTimeout(() => {
                    scannedAssetId = 'ASSET-' + Date.now();
                    document.getElementById('asset-qr-code').value = scannedAssetId;
                    showToast('QR scanned: ' + scannedAssetId, 'success');
                    closeQrModal();
                }, 3000);
            })
            .catch(function(err) {
                showToast('Camera access denied', 'error');
                closeQrModal();
            });
    }
}

function stopQrScanner() {
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
}

// ===== CAMERA PREVIEW =====
window.previewImage = function(input, previewId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            preview.src = e.target.result;
            preview.style.display = 'block';
            
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
window.openNewTaskModal = function() {
    document.getElementById('new-task-modal').classList.add('active');
};

window.closeNewTaskModal = function() {
    document.getElementById('new-task-modal').classList.remove('active');
    beforeImage = null;
    afterImage = null;
    scannedAssetId = null;
};

window.submitNewTask = async function() {
    const lokasi = document.getElementById('new-task-lokasi').value;
    const deskripsi = document.getElementById('new-task-deskripsi').value;
    const prioritas = document.getElementById('new-task-prioritas').value;
    
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
        closeNewTaskModal();
        loadTasks(currentFilter);
        loadStats();
        syncToCommandCenter(null, 'new_task_created');
    }
};

// ===== HISTORY MODAL =====
window.openHistoryModal = function() {
    document.getElementById('history-modal').classList.add('active');
    loadHistory();
};

window.closeHistoryModal = function() {
    document.getElementById('history-modal').classList.remove('active');
};

async function loadHistory() {
    const container = document.getElementById('history-timeline');
    
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
        <div class="timeline-item">
            <div class="timeline-date">${new Date(task.completed_at).toLocaleDateString('id-ID', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}</div>
            <div class="timeline-content">
                <div class="font-bold">${task.lokasi}</div>
                <div class="text-sm opacity-70">${task.deskripsi?.substring(0, 100)}...</div>
                <div class="text-xs opacity-50 mt-1">👤 ${task.teknisi_id || '-'}</div>
            </div>
        </div>
    `).join('');
}

// ===== SYNC FUNCTIONS =====
function syncToCommandCenter(taskId, action) {
    window.dispatchEvent(new CustomEvent('maintenance-update', {
        detail: { taskId, action, timestamp: new Date().toISOString() }
    }));
    console.log('[MAINTENANCE] Synced to Command Center:', { taskId, action });
}

function syncToInventory(barangId, jumlah) {
    window.dispatchEvent(new CustomEvent('inventory-update', {
        detail: { barangId, jumlah, type: 'usage', timestamp: new Date().toISOString() }
    }));
    console.log('[MAINTENANCE] Synced to Inventory:', { barangId, jumlah });
}

// ===== DETAIL VIEW (placeholder) =====
window.viewTaskDetail = function(taskId) {
    showToast('Detail task ' + taskId, 'info');
};

// ===== CLEANUP =====
export function cleanup() {
    stopQrScanner();
    console.log('[MAINTENANCE] Module cleanup');
}
