import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export async function init() {
    console.log('💰 Modul Dana dimuat');

    // Load data awal
    await loadDanaHistory();

    // Pasang event listeners
    attachEventListeners();
}

function attachEventListeners() {
    const form = document.getElementById('danaForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    const refreshBtn = document.getElementById('refresh-dana');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDanaHistory);
    }
}

// ========== HANDLE SUBMIT ==========
async function handleSubmit(e) {
    e.preventDefault();
    const resultDiv = document.getElementById('form-result');
    resultDiv.innerHTML = '<span class="text-yellow-500">⏳ Mengirim...</span>';

    const formData = {
        kategori: document.getElementById('dana_kategori').value,
        judul: document.getElementById('dana_judul').value,
        deskripsi: document.getElementById('dana_deskripsi').value || null,
        nominal: parseFloat(document.getElementById('dana_nominal').value),
        periode: document.getElementById('dana_periode').value || null,
        pengaju: document.getElementById('dana_pengaju').value,
        departemen: document.getElementById('dana_departemen').value || null,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    // Validasi
    if (!formData.judul || !formData.nominal || !formData.pengaju) {
        resultDiv.innerHTML = '<span class="text-red-500">Judul, nominal, dan pengaju wajib diisi!</span>';
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    try {
        const { error } = await supabase.from('pengajuan_dana').insert([formData]);
        if (error) throw error;

        resultDiv.innerHTML = '<span class="text-green-500 animate-pulse">✅ Pengajuan dana berhasil!</span>';
        showToast('Pengajuan dana berhasil', 'success');
        e.target.reset();
        await loadDanaHistory();
        setTimeout(() => resultDiv.innerHTML = '', 3000);
    } catch (err) {
        console.error(err);
        resultDiv.innerHTML = `<span class="text-red-500">❌ Gagal: ${err.message}</span>`;
        showToast('Gagal mengajukan dana', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN DANA';
    }
}

// ========== LOAD HISTORY ==========
async function loadDanaHistory() {
    const tbody = document.getElementById('dana-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><span class="spinner"></span> Memuat...</td></tr>';

    try {
        const { data, error } = await supabase
            .from('pengajuan_dana')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 opacity-60">Belum ada pengajuan</td></tr>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const statusColor = item.status === 'disetujui' ? 'text-green-500' : 
                              (item.status === 'ditolak' ? 'text-red-500' : 'text-yellow-500');
            const statusText = item.status === 'disetujui' ? '✅ Disetujui' :
                              (item.status === 'ditolak' ? '❌ Ditolak' : '⏳ Pending');
            html += `<tr class="border-b border-slate-700">
                <td class="p-2">${new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                <td class="p-2">${item.judul}</td>
                <td class="p-2 font-mono">Rp ${Number(item.nominal).toLocaleString()}</td>
                <td class="p-2 ${statusColor}">${statusText}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Gagal memuat</td></tr>';
    }
}
