import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

let currentFilter = 'semua'; // semua, pending, proses, selesai
let stokList = [];

export async function init() {
    console.log('🔧 Modul Maintenance dimuat');

    // Pasang event listener
    attachEventListeners();

    // Load data awal
    loadStats();
    loadTasks('semua');

    // Set active tab
    setActiveTab('tab-semua');
}

function attachEventListeners() {
    document.getElementById('tab-semua')?.addEventListener('click', () => {
        currentFilter = 'semua';
        setActiveTab('tab-semua');
        loadTasks('semua');
    });
    document.getElementById('tab-pending')?.addEventListener('click', () => {
        currentFilter = 'pending';
        setActiveTab('tab-pending');
        loadTasks('pending');
    });
    document.getElementById('tab-proses')?.addEventListener('click', () => {
        currentFilter = 'proses';
        setActiveTab('tab-proses');
        loadTasks('proses');
    });
    document.getElementById('tab-selesai')?.addEventListener('click', () => {
        currentFilter = 'selesai';
        setActiveTab('tab-selesai');
        loadTasks('selesai');
    });

    // Modal sparepart
    document.getElementById('sparepart-barang')?.addEventListener('change', function() {
        const selected = this.options[this.selectedIndex];
        const stok = selected.dataset.stok || 0;
        document.getElementById('sparepart-stok-info').innerText = `Stok tersedia: ${stok}`;
    });

    document.getElementById('sparepart-ambil')?.addEventListener('click', handleAmbilSparepart);
    document.getElementById('sparepart-batal')?.addEventListener('click', () => {
        document.getElementById('sparepart-modal').classList.add('hidden');
    });
}

function setActiveTab(tabId) {
    ['tab-semua', 'tab-pending', 'tab-proses', 'tab-selesai'].forEach(id => {
        const btn = document.getElementById(id);
        btn?.classList.remove('border-yellow-500', 'font-semibold');
        btn?.classList.add('text-gray-500');
    });
    const active = document.getElementById(tabId);
    active?.classList.add('border-yellow-500', 'font-semibold');
    active?.classList.remove('text-gray-500');
}

// ========== LOAD STATISTIK ==========
async function loadStats() {
    try {
        const { count: pending } = await supabase
            .from('maintenance_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        const { count: proses } = await supabase
            .from('maintenance_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'proses');
        const { count: selesai } = await supabase
            .from('maintenance_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'selesai');

        document.getElementById('stat-pending').textContent = pending || 0;
        document.getElementById('stat-proses').textContent = proses || 0;
        document.getElementById('stat-selesai').textContent = selesai || 0;
    } catch (err) {
        console.warn('Gagal load stats', err);
    }
}

// ========== LOAD TUGAS ==========
async function loadTasks(filter = 'semua') {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-yellow-500 border-t-transparent"></div><p class="mt-2 opacity-60">Memuat tugas...</p></div>';

    try {
        let query = supabase
            .from('maintenance_tasks')
            .select(`
                id,
                k3_report_id,
                teknisi_id,
                status,
                progress_notes,
                prioritas,
                deskripsi,
                lokasi,
                pelapor,
                created_at,
                k3_reports!inner (jenis_laporan, foto_url)
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
            const priorityColor = 
                task.prioritas === 'tinggi' ? 'bg-red-100 text-red-800' :
                task.prioritas === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800';

            const statusBadge = {
                'pending': 'bg-yellow-200 text-yellow-800',
                'proses': 'bg-blue-200 text-blue-800',
                'selesai': 'bg-green-200 text-green-800',
                'butuh_sparepart': 'bg-purple-200 text-purple-800'
            }[task.status] || 'bg-gray-200';

            const sumberIcon = task.k3_report_id ? '🔧 (K3)' : '📝 (Manual)';
            const jenisIcon = task.k3_reports?.jenis_laporan === 'kerusakan' ? '🔧' : '';

            html += `
                <div class="task-card bg-white dark:bg-gray-800 p-4 rounded-xl shadow border-l-4 ${task.status === 'pending' ? 'border-yellow-500' : task.status === 'proses' ? 'border-blue-500' : 'border-green-500'}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs px-2 py-0.5 rounded-full ${priorityColor}">${task.prioritas || 'normal'}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full ${statusBadge}">${task.status}</span>
                                <span class="text-xs opacity-60">${sumberIcon}</span>
                            </div>
                            <h3 class="font-semibold">${task.lokasi || 'Lokasi tidak diketahui'}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${task.deskripsi?.substring(0, 100)}...</p>
                            <div class="flex items-center gap-3 mt-2 text-xs">
                                <span>📅 ${new Date(task.created_at).toLocaleDateString('id-ID')}</span>
                                <span>👤 ${task.pelapor || '-'}</span>
                            </div>
                            ${task.progress_notes ? `<p class="text-xs italic mt-2">📝 ${task.progress_notes}</p>` : ''}
                        </div>
                        <div class="flex flex-col gap-2 ml-4">
                            ${task.status === 'pending' ? `
                                <button onclick="window.ambilTugas('${task.id}')" class="bg-yellow-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap">🔨 Ambil</button>
                            ` : ''}
                            ${task.status === 'proses' ? `
                                <button onclick="window.bukaModalSparepart('${task.id}')" class="bg-purple-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap">🔩 Ambil Sparepart</button>
                                <button onclick="window.selesaikanTugas('${task.id}')" class="bg-green-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap">✅ Selesai</button>
                            ` : ''}
                            ${task.status === 'butuh_sparepart' ? `
                                <button onclick="window.bukaModalSparepart('${task.id}')" class="bg-purple-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap">🔩 Ambil Sparepart</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        console.error('Gagal load tugas:', err);
        container.innerHTML = '<p class="text-center py-12 text-red-500">Gagal memuat data</p>';
    }
}

// ========== AMBIL TUGAS ==========
window.ambilTugas = async (taskId) => {
    if (!confirm('Ambil tugas ini?')) return;
    const user = store.get('user');
    const { error } = await supabase
        .from('maintenance_tasks')
        .update({ 
            status: 'proses', 
            teknisi_id: user?.key || null,
            progress_notes: 'Sedang dikerjakan'
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

// ========== SELESAIKAN TUGAS ==========
window.selesaikanTugas = async (taskId) => {
    const catatan = prompt('Tambahkan catatan penyelesaian (opsional):');
    const { error } = await supabase
        .from('maintenance_tasks')
        .update({ 
            status: 'selesai', 
            progress_notes: catatan || 'Selesai',
            waktu_selesai: new Date().toISOString()
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

// ========== MODAL SPAREPART ==========
window.bukaModalSparepart = async (taskId) => {
    document.getElementById('sparepart-task-id').value = taskId;
    // Load daftar stok dari tabel gudang_stok (atau inventaris)
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
    document.getElementById('sparepart-modal').classList.remove('hidden');
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

    // Kurangi stok
    const { error: updateError } = await supabase
        .from('gudang_stok')
        .update({ stok: barang.stok - jumlah })
        .eq('id', barangId);

    if (updateError) {
        showToast('Gagal update stok: ' + updateError.message, 'error');
        return;
    }

    // Catat pemakaian
    const { error: usageError } = await supabase
        .from('inventory_usage')
        .insert([{
            task_id: taskId,
            barang_id: barangId,
            jumlah: jumlah
        }]);

    if (usageError) {
        showToast('Gagal mencatat pemakaian: ' + usageError.message, 'warning');
        // tidak rollback, sederhana
    }

    // Update status tugas menjadi proses
    await supabase
        .from('maintenance_tasks')
        .update({ status: 'proses', progress_notes: 'Sparepart diambil' })
        .eq('id', taskId);

    showToast('Sparepart berhasil diambil', 'success');
    document.getElementById('sparepart-modal').classList.add('hidden');
    loadTasks(currentFilter);
    loadStats();
}
