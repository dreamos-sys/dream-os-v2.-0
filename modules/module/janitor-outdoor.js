// modules/janitor-outdoor/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-6xl mx-auto p-4">
            <!-- Header -->
            <div class="bg-slate-800/50 backdrop-blur rounded-2xl p-6 mb-6 border border-cyan-500/30">
                <h2 class="text-2xl font-bold text-cyan-400">🌿 JANITOR OUTDOOR</h2>
                <p class="text-xs text-slate-400 mt-1">Daily Outdoor Cleaning Checklist & Report</p>
            </div>

            <!-- Tabs -->
            <div class="flex space-x-2 mb-6 border-b border-slate-700">
                <button id="tab-form" class="tab-btn px-4 py-2 font-semibold text-cyan-400 border-b-2 border-cyan-500">Form Ceklis</button>
                <button id="tab-history" class="tab-btn px-4 py-2 font-semibold text-slate-400">Riwayat</button>
                <button id="tab-schedule" class="tab-btn px-4 py-2 font-semibold text-slate-400">Jadwal</button>
            </div>

            <!-- Panel Form -->
            <div id="panel-form" class="panel">
                <form id="janitorOutdoorForm" class="space-y-4">
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

                    <!-- Area / Lokasi -->
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Area / Lokasi</label>
                        <input type="text" id="area" name="area" placeholder="Contoh: Taman Depan, Lapangan, Selokan" required class="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                    </div>

                    <!-- Daftar Pengecekan Outdoor -->
                    <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 class="text-md font-semibold text-cyan-400 mb-2">Poin Pengecekan</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="check_sampah" class="accent-cyan-500"> <span>Sampah bersih</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="check_rumput" class="accent-cyan-500"> <span>Rumput dipotong</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="check_selokan" class="accent-cyan-500"> <span>Selokan lancar</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="check_taman" class="accent-cyan-500"> <span>Taman rapi</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="check_paving" class="accent-cyan-500"> <span>Paving / jalan bersih</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="check_lampu" class="accent-cyan-500"> <span>Lampu taman berfungsi</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="check_air" class="accent-cyan-500"> <span>Drainase air baik</span></label>
                            <label class="flex items-center space-x-2 text-sm"><input type="checkbox" id="check_fasilitas" class="accent-cyan-500"> <span>Fasilitas umum utuh</span></label>
                        </div>
                    </div>

                    <!-- Catatan -->
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Catatan / Temuan</label>
                        <textarea id="catatan" name="catatan" rows="2" class="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white" placeholder="Misal: lampu mati, selokan mampet, dll."></textarea>
                    </div>

                    <!-- Tombol Submit -->
                    <button type="submit" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl font-bold transition shadow-lg">
                        Simpan Ceklis Outdoor
                    </button>
                    <div id="form-result" class="text-center text-sm mt-2"></div>
                </form>
            </div>

            <!-- Panel Riwayat -->
            <div id="panel-history" class="panel hidden">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold">Riwayat Ceklis Outdoor</h3>
                    <button id="refresh-history" class="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-xs">⟳ Refresh</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-800">
                            <tr>
                                <th class="px-2 py-2">Tanggal</th>
                                <th class="px-2 py-2">Shift</th>
                                <th class="px-2 py-2">Petugas</th>
                                <th class="px-2 py-2">Area</th>
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
                <h3 class="text-lg font-semibold mb-3">Jadwal Petugas Outdoor (Contoh)</h3>
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
            .from('janitor_outdoor')
            .select('id, tanggal, shift, petugas, area, status, created_at')
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
                    <td class="px-2 py-2">${item.area}</td>
                    <td class="px-2 py-2 ${statusClass}">${item.status}</td>
                    <td class="px-2 py-2">
                        <button onclick="viewOutdoorDetail('${item.id}')" class="text-blue-500 text-xs">Detail</button>
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
window.viewOutdoorDetail = (id) => {
    alert('Detail Janitor Outdoor ID: ' + id);
};

// ========== LOAD JADWAL (sementara statis) ==========
function loadSchedule() {
    if (!elements.scheduleBody) return;
    elements.scheduleBody.innerHTML = `
        <tr class="border-b border-slate-700"><td>Senin</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr class="border-b border-slate-700"><td>Selasa</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr class="border-b border-slate-700"><td>Rabu</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr class="border-b border-slate-700"><td>Kamis</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr class="border-b border-slate-700"><td>Jumat</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr class="border-b border-slate-700"><td>Sabtu</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr class="border-b border-slate-700"><td>Minggu</td><td>Libur</td><td>Libur</td><td>Libur</td></tr>
    `;
}

// ========== SUBMIT FORM ==========
async function handleSubmit(e) {
    e.preventDefault();

    const tanggal = elements.tanggal?.value;
    const shift = elements.shift?.value;
    const petugas = elements.petugas?.value;
    const area = elements.area?.value;
    const catatan = elements.catatan?.value;

    if (!tanggal || !petugas || !area) {
        if (elements.formResult) elements.formResult.innerHTML = '<span class="text-red-500">Tanggal, Petugas, Area harus diisi!</span>';
        return;
    }

    // Kumpulkan item outdoor (semua checkbox dengan id mulai 'check_')
    const items = {};
    document.querySelectorAll('[id^="check_"]').forEach(cb => {
        const id = cb.id.replace('check_', '');
        items[id] = cb.checked;
    });

    const formData = {
        tanggal,
        shift,
        petugas,
        area,
        items,
        catatan: catatan || null,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const { error } = await supabase.from('janitor_outdoor').insert([formData]);

        if (error) throw error;

        if (elements.formResult) {
            elements.formResult.innerHTML = '<span class="text-green-500">✅ Ceklis outdoor berhasil disimpan!</span>';
            showToast('Ceklis outdoor berhasil', 'success');
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
        btn.innerHTML = 'Simpan Ceklis Outdoor';
    }
}

// ========== ACTIVATE TAB ==========
function activateTab(tab) {
    const tabs = [elements.tabForm, elements.tabHistory, elements.tabSchedule];
    tabs.forEach(t => {
        t?.classList.remove('border-cyan-500', 'text-cyan-400');
        t?.classList.add('text-slate-400');
    });
    const panels = [elements.panelForm, elements.panelHistory, elements.panelSchedule];
    panels.forEach(p => p?.classList.add('hidden'));

    if (tab === 'form') {
        elements.tabForm?.classList.add('border-b-2', 'border-cyan-500', 'text-cyan-400');
        elements.tabForm?.classList.remove('text-slate-400');
        elements.panelForm?.classList.remove('hidden');
    } else if (tab === 'history') {
        elements.tabHistory?.classList.add('border-b-2', 'border-cyan-500', 'text-cyan-400');
        elements.tabHistory?.classList.remove('text-slate-400');
        elements.panelHistory?.classList.remove('hidden');
        loadHistory();
    } else if (tab === 'schedule') {
        elements.tabSchedule?.classList.add('border-b-2', 'border-cyan-500', 'text-cyan-400');
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
    console.log('🌿 Modul Janitor Outdoor dimuat');

    renderHTML();

    // Inisialisasi elemen setelah HTML dirender
    elements = {
        tabForm: document.getElementById('tab-form'),
        tabHistory: document.getElementById('tab-history'),
        tabSchedule: document.getElementById('tab-schedule'),
        panelForm: document.getElementById('panel-form'),
        panelHistory: document.getElementById('panel-history'),
        panelSchedule: document.getElementById('panel-schedule'),
        form: document.getElementById('janitorOutdoorForm'),
        formResult: document.getElementById('form-result'),
        refreshBtn: document.getElementById('refresh-history'),
        historyBody: document.getElementById('history-body'),
        scheduleBody: document.getElementById('schedule-body'),
        tanggal: document.getElementById('tanggal'),
        shift: document.getElementById('shift'),
        petugas: document.getElementById('petugas'),
        area: document.getElementById('area'),
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
    delete window.viewOutdoorDetail;
    console.log('🌿 Modul Janitor Outdoor dibersihkan');
}
