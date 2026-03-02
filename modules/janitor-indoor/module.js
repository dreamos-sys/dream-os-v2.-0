// modules/janitor-indoor/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-6xl mx-auto p-4">
            <!-- Header -->
            <div class="bg-slate-800/50 backdrop-blur rounded-2xl p-6 mb-6 border border-teal-500/30">
                <h2 class="text-2xl font-bold text-teal-400">🧹 JANITOR INDOOR</h2>
                <p class="text-xs text-slate-400 mt-1">Daily Cleaning Checklist & Report</p>
            </div>

            <!-- Tabs -->
            <div class="flex space-x-2 mb-6 border-b border-slate-700">
                <button id="tab-form" class="tab-btn px-4 py-2 font-semibold text-teal-400 border-b-2 border-teal-500">Form Ceklis</button>
                <button id="tab-history" class="tab-btn px-4 py-2 font-semibold text-slate-400">Riwayat</button>
                <button id="tab-schedule" class="tab-btn px-4 py-2 font-semibold text-slate-400">Jadwal</button>
            </div>

            <!-- Panel Form -->
            <div id="panel-form" class="panel">
                <form id="janitorIndoorForm" class="space-y-4">
                    <!-- Baris 1: Tanggal, Shift, Petugas -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs text-slate-400 mb-1">Tanggal</label>
                            <input type="date" id="tanggal" name="tanggal" required class="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                        </div>
                        <div>
                            <label class="block text-xs text-slate-400 mb-1">Shift</label>
                            <select id="shift" name="shift" required class="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                                <option value="Pagi">Pagi (07:00-15:00)</option>
                                <option value="Siang">Siang (15:00-23:00)</option>
                                <option value="Malam">Malam (23:00-07:00)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-slate-400 mb-1">Petugas</label>
                            <input type="text" id="petugas" name="petugas" placeholder="Nama petugas" required class="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                        </div>
                    </div>

                    <!-- Lokasi -->
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Lokasi / Area</label>
                        <input type="text" id="lokasi" name="lokasi" placeholder="Contoh: Gedung A Lantai 1" required class="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                    </div>

                    <!-- Toilet Section -->
                    <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 class="text-md font-semibold text-teal-400 mb-2">Toilet / Kamar Mandi</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="toilet_washtafel" class="accent-teal-500"> <span>Washtafel</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="toilet_kloset" class="accent-teal-500"> <span>Kloset</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="toilet_lantai" class="accent-teal-500"> <span>Lantai</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="toilet_cermin" class="accent-teal-500"> <span>Cermin</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="toilet_sabun" class="accent-teal-500"> <span>Sabun / Tissue</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="toilet_baun" class="accent-teal-500"> <span>Tidak Bau</span></label>
                        </div>
                    </div>

                    <!-- Ruangan Section -->
                    <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 class="text-md font-semibold text-teal-400 mb-2">Ruangan / Area Kerja</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="ruang_lantai" class="accent-teal-500"> <span>Lantai disapu</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="ruang_meja" class="accent-teal-500"> <span>Meja / kursi rapi</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="ruang_sampah" class="accent-teal-500"> <span>Sampah dibuang</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="ruang_kipas" class="accent-teal-500"> <span>Kipas / AC mati</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="ruang_lampu" class="accent-teal-500"> <span>Lampu mati</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="ruang_ventilasi" class="accent-teal-500"> <span>Ventilasi baik</span></label>
                        </div>
                    </div>

                    <!-- Catatan -->
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Catatan / Temuan</label>
                        <textarea id="catatan" name="catatan" rows="2" class="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white" placeholder="Misal: lampu mati, keran bocor, dll."></textarea>
                    </div>

                    <!-- Tombol Submit -->
                    <button type="submit" class="w-full bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-xl font-bold transition shadow-lg">
                        Simpan Ceklis Indoor
                    </button>
                    <div id="form-result" class="text-center text-sm mt-2"></div>
                </form>
            </div>

            <!-- Panel Riwayat -->
            <div id="panel-history" class="panel hidden">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold">Riwayat Ceklis</h3>
                    <button id="refresh-history" class="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-xs">⟳ Refresh</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-800">
                            <tr>
                                <th class="px-2 py-2">Tanggal</th>
                                <th class="px-2 py-2">Shift</th>
                                <th class="px-2 py-2">Petugas</th>
                                <th class="px-2 py-2">Lokasi</th>
                                <th class="px-2 py-2">Status</th>
                                <th class="px-2 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="history-body"></tbody>
                    </table>
                </div>
            </div>

            <!-- Panel Jadwal (sementara statis) -->
            <div id="panel-schedule" class="panel hidden">
                <h3 class="text-lg font-semibold mb-3">Jadwal Petugas Indoor (Contoh)</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-800">
                            <tr><th>Hari</th><th>Pagi</th><th>Siang</th><th>Malam</th></tr>
                        </thead>
                        <tbody id="schedule-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ========== ELEMEN DOM ==========
let elements = {};

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
            const statusClass = item.status === 'pending' ? 'text-yellow-500' : (item.status === 'verified' ? 'text-green-500' : 'text-blue-500');
            html += `
                <tr class="border-b border-slate-700">
                    <td class="px-2 py-2">${item.tanggal}</td>
                    <td class="px-2 py-2">${item.shift || '-'}</td>
                    <td class="px-2 py-2">${item.petugas}</td>
                    <td class="px-2 py-2">${item.lokasi}</td>
                    <td class="px-2 py-2 ${statusClass}">${item.status}</td>
                    <td class="px-2 py-2">
                        <button onclick="viewJanitorDetail('${item.id}')" class="text-blue-500 text-xs">Detail</button>
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
window.viewJanitorDetail = (id) => {
    alert('Detail Janitor Indoor ID: ' + id);
};

// ========== LOAD JADWAL (sementara statis) ==========
function loadSchedule() {
    if (!elements.scheduleBody) return;
    elements.scheduleBody.innerHTML = `
        <tr class="border-b border-slate-700"><td>Senin</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr class="border-b border-slate-700"><td>Selasa</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr class="border-b border-slate-700"><td>Rabu</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr class="border-b border-slate-700"><td>Kamis</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr class="border-b border-slate-700"><td>Jumat</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr class="border-b border-slate-700"><td>Sabtu</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr class="border-b border-slate-700"><td>Minggu</td><td>Libur</td><td>Libur</td><td>Libur</td></tr>
    `;
}

// ========== SUBMIT FORM ==========
async function handleSubmit(e) {
    e.preventDefault();

    const tanggal = elements.tanggal?.value;
    const shift = elements.shift?.value;
    const petugas = elements.petugas?.value;
    const lokasi = elements.lokasi?.value;
    const catatan = elements.catatan?.value;

    if (!tanggal || !petugas || !lokasi) {
        if (elements.formResult) elements.formResult.innerHTML = '<span class="text-red-500">Tanggal, Petugas, Lokasi harus diisi!</span>';
        return;
    }

    // Kumpulkan item toilet
    const toiletItems = {};
    document.querySelectorAll('[id^="toilet_"]').forEach(cb => {
        const id = cb.id.replace('toilet_', '');
        toiletItems[id] = cb.checked;
    });

    // Kumpulkan item ruangan
    const ruangItems = {};
    document.querySelectorAll('[id^="ruang_"]').forEach(cb => {
        const id = cb.id.replace('ruang_', '');
        ruangItems[id] = cb.checked;
    });

    const items = { toilet: toiletItems, ruangan: ruangItems };

    const formData = {
        tanggal,
        shift,
        petugas,
        lokasi,
        items,
        catatan: catatan || null,
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

// ========== ACTIVATE TAB ==========
function activateTab(tab) {
    const tabs = [elements.tabForm, elements.tabHistory, elements.tabSchedule];
    tabs.forEach(t => {
        t?.classList.remove('border-teal-500', 'text-teal-400');
        t?.classList.add('text-slate-400');
    });
    const panels = [elements.panelForm, elements.panelHistory, elements.panelSchedule];
    panels.forEach(p => p?.classList.add('hidden'));

    if (tab === 'form') {
        elements.tabForm?.classList.add('border-b-2', 'border-teal-500', 'text-teal-400');
        elements.tabForm?.classList.remove('text-slate-400');
        elements.panelForm?.classList.remove('hidden');
    } else if (tab === 'history') {
        elements.tabHistory?.classList.add('border-b-2', 'border-teal-500', 'text-teal-400');
        elements.tabHistory?.classList.remove('text-slate-400');
        elements.panelHistory?.classList.remove('hidden');
        loadHistory();
    } else if (tab === 'schedule') {
        elements.tabSchedule?.classList.add('border-b-2', 'border-teal-500', 'text-teal-400');
        elements.tabSchedule?.classList.remove('text-slate-400');
        elements.panelSchedule?.classList.remove('hidden');
        loadSchedule();
    }
}

// ========== ATTACH EVENT LISTENERS ==========
function attachEventListeners() {
    elements.tabForm?.addEventListener('click', () => activateTab('form'));
    elements.tabHistory?.addEventListener('click', () => activateTab('history'));
    elements.tabSchedule?.addEventListener('click', () => activateTab('schedule'));

    elements.form?.addEventListener('submit', handleSubmit);

    elements.refreshBtn?.addEventListener('click', () => loadHistory());
}

// ========== INIT ==========
export async function init() {
    console.log('🧹 Modul Janitor Indoor dimuat');

    renderHTML();

    // Inisialisasi elemen setelah HTML dirender
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
    };

    // Set tanggal default hari ini
    if (elements.tanggal) {
        const today = new Date().toISOString().split('T')[0];
        elements.tanggal.value = today;
    }

    attachEventListeners();

    // Aktifkan tab form default
    activateTab('form');
}

export function cleanup() {
    // Hapus fungsi global
    delete window.viewJanitorDetail;
    console.log('🧹 Modul Janitor Indoor dibersihkan');
}
