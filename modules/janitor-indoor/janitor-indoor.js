import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

// ========== ELEMEN DOM (akan diinisialisasi di init) ==========
let elements = {};

export async function init() {
    console.log('🧹 Modul Janitor Indoor dimuat');

    // Inisialisasi elemen DOM
    elements = {
        tabForm: document.getElementById('tab-form'),
        tabHistory: document.getElementById('tab-history'),
        tabSchedule: document.getElementById('tab-schedule'),
        panelForm: document.getElementById('panel-form'),
        panelHistory: document.getElementById('panel-history'),
        panelSchedule: document.getElementById('panel-schedule'),
        form: document.getElementById('janitorIndoorForm'),
        formResult: document.getElementById('form-result'),
        refreshBtn: document.getElementById('refresh-history'),
        historyBody: document.getElementById('history-body'),
        scheduleBody: document.getElementById('schedule-body'),
        tanggal: document.getElementById('tanggal'),
        shift: document.getElementById('shift'),
        petugas: document.getElementById('petugas'),
        lokasi: document.getElementById('lokasi'),
        catatan: document.getElementById('catatan'),
        fotoSebelum: document.getElementById('foto_sebelum'),
        fotoSesudah: document.getElementById('foto_sesudah'),
    };

    // Set tanggal default ke hari ini
    if (elements.tanggal) {
        const today = new Date().toISOString().split('T')[0];
        elements.tanggal.value = today;
    }

    // Pasang event listener
    attachEventListeners();

    // Aktifkan tab form default
    activateTab('form');
}

function attachEventListeners() {
    // Tab clicks
    elements.tabForm?.addEventListener('click', () => activateTab('form'));
    elements.tabHistory?.addEventListener('click', () => activateTab('history'));
    elements.tabSchedule?.addEventListener('click', () => activateTab('schedule'));

    // Form submit
    elements.form?.addEventListener('submit', handleSubmit);

    // Refresh history
    elements.refreshBtn?.addEventListener('click', () => loadHistory());
}

function activateTab(tab) {
    // Reset class semua tab
    [elements.tabForm, elements.tabHistory, elements.tabSchedule].forEach(t => {
        t?.classList.remove('active', 'border-teal-500', 'text-teal-600');
        t?.classList.add('text-gray-500');
    });
    // Sembunyikan semua panel
    [elements.panelForm, elements.panelHistory, elements.panelSchedule].forEach(p => p?.classList.add('hidden'));

    // Aktifkan tab dan panel yang dipilih
    if (tab === 'form') {
        elements.tabForm?.classList.add('active', 'border-teal-500', 'text-teal-600');
        elements.panelForm?.classList.remove('hidden');
    } else if (tab === 'history') {
        elements.tabHistory?.classList.add('active', 'border-teal-500', 'text-teal-600');
        elements.panelHistory?.classList.remove('hidden');
        loadHistory();
    } else if (tab === 'schedule') {
        elements.tabSchedule?.classList.add('active', 'border-teal-500', 'text-teal-600');
        elements.panelSchedule?.classList.remove('hidden');
        loadSchedule();
    }
}

// ========== LOAD RIWAYAT ==========
async function loadHistory() {
    if (!elements.historyBody) return;
    elements.historyBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">⏳ Memuat...</td></tr>';

    try {
        const { data, error } = await supabase
            .from('janitor_indoor')
            .select('id, tanggal, shift, petugas, lokasi, status, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            elements.historyBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 opacity-60">Belum ada data</td></tr>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const statusClass = item.status === 'pending' ? 'text-yellow-600' : (item.status === 'verified' ? 'text-green-600' : 'text-blue-600');
            html += `
                <tr class="border-b dark:border-gray-700">
                    <td class="px-2 py-2">${item.tanggal}</td>
                    <td class="px-2 py-2">${item.shift || '-'}</td>
                    <td class="px-2 py-2">${item.petugas}</td>
                    <td class="px-2 py-2">${item.lokasi}</td>
                    <td class="px-2 py-2 ${statusClass}">${item.status}</td>
                    <td class="px-2 py-2">
                        <button onclick="viewDetail('${item.id}')" class="text-blue-500 text-xs">Detail</button>
                    </td>
                </tr>
            `;
        });
        elements.historyBody.innerHTML = html;
    } catch (err) {
        console.error('Gagal load history:', err);
        elements.historyBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500">Gagal memuat</td></tr>';
    }
}

// Detail (sementara pake alert)
window.viewDetail = (id) => {
    alert('Fitur detail menyusul. ID: ' + id);
};

// ========== LOAD JADWAL (sementara statis) ==========
function loadSchedule() {
    if (!elements.scheduleBody) return;
    // Contoh jadwal statis (bisa diambil dari tabel jadwal nanti)
    elements.scheduleBody.innerHTML = `
        <tr><td>Senin</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Selasa</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Rabu</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Kamis</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Jumat</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Sabtu</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Minggu</td><td>Libur</td><td>Libur</td><td>Libur</td></tr>
    `;
}

// ========== SUBMIT FORM ==========
async function handleSubmit(e) {
    e.preventDefault();

    // Ambil data dasar
    const tanggal = elements.tanggal?.value;
    const shift = elements.shift?.value;
    const petugas = elements.petugas?.value;
    const lokasi = elements.lokasi?.value;
    const catatan = elements.catatan?.value;

    if (!tanggal || !petugas || !lokasi) {
        if (elements.formResult) elements.formResult.innerHTML = '<span class="text-red-500">Tanggal, Petugas, Lokasi harus diisi!</span>';
        return;
    }

    // Kumpulkan item toilet (semua checkbox dengan id mulai 'toilet_')
    const toiletCheckboxes = document.querySelectorAll('[id^="toilet_"]');
    const toiletItems = {};
    toiletCheckboxes.forEach(cb => {
        const id = cb.id.replace('toilet_', '');
        toiletItems[id] = cb.checked;
    });

    // Kumpulkan item ruangan (semua checkbox dengan id mulai 'ruang_')
    const ruangCheckboxes = document.querySelectorAll('[id^="ruang_"]');
    const ruangItems = {};
    ruangCheckboxes.forEach(cb => {
        const id = cb.id.replace('ruang_', '');
        ruangItems[id] = cb.checked;
    });

    const items = {
        toilet: toiletItems,
        ruangan: ruangItems
    };

    // Upload foto (sederhana, belum implementasi storage)
    // Untuk sementara kita kosongkan dulu
    const fotoSebelum = null;
    const fotoSesudah = null;

    const formData = {
        tanggal,
        shift,
        petugas,
        lokasi,
        items,
        catatan: catatan || null,
        foto_sebelum: fotoSebelum,
        foto_sesudah: fotoSesudah,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const { error } = await supabase.from('janitor_indoor').insert([formData]);

        if (error) throw error;

        if (elements.formResult) {
            elements.formResult.innerHTML = '<span class="text-green-500">✅ Ceklis indoor berhasil disimpan!</span>';
            showToast('Ceklis indoor berhasil', 'success');
        }
        e.target.reset();
        // Reset tanggal ke hari ini
        if (elements.tanggal) {
            elements.tanggal.value = new Date().toISOString().split('T')[0];
        }
    } catch (err) {
        console.error(err);
        if (elements.formResult) {
            elements.formResult.innerHTML = `<span class="text-red-500">❌ Gagal: ${err.message}</span>`;
        }
        showToast('Gagal menyimpan', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Ceklis Indoor';
    }
}
