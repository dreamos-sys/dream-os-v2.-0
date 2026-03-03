// modules/janitor-indoor/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

let currentLang = localStorage.getItem('lang') || 'id';

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-6xl mx-auto p-4">
            <!-- Header -->
            <div class="text-center mb-6">
                <h2 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                    🧹 Ceklis Harian Janitor Indoor
                </h2>
                <p class="text-sm opacity-70">Gedung SD, SMP, SMA – Toilet & Ruangan</p>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-gray-300 dark:border-gray-700 mb-4">
                <button id="tab-form" class="tab-btn active px-4 py-2 font-semibold border-b-2 border-teal-500">📝 Form Ceklis</button>
                <button id="tab-history" class="tab-btn px-4 py-2 text-gray-500">📋 Riwayat</button>
                <button id="tab-schedule" class="tab-btn px-4 py-2 text-gray-500">📅 Jadwal Mingguan</button>
            </div>

            <!-- Panel Form -->
            <div id="panel-form" class="tab-panel">
                <form id="janitorIndoorForm" class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block mb-1 text-sm font-medium">Tanggal *</label>
                            <input type="date" id="tanggal" required class="w-full p-2 border rounded dark:bg-gray-700">
                        </div>
                        <div>
                            <label class="block mb-1 text-sm font-medium">Shift *</label>
                            <select id="shift" required class="w-full p-2 border rounded dark:bg-gray-700">
                                <option value="pagi">Pagi</option>
                                <option value="siang">Siang</option>
                                <option value="sore">Sore</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block mb-1 text-sm font-medium">Petugas *</label>
                            <input type="text" id="petugas" required placeholder="Nama petugas" class="w-full p-2 border rounded dark:bg-gray-700">
                        </div>
                        <div>
                            <label class="block mb-1 text-sm font-medium">Lokasi Gedung *</label>
                            <select id="lokasi" required class="w-full p-2 border rounded dark:bg-gray-700">
                                <option value="">Pilih Gedung</option>
                                <option value="SD">Gedung SD</option>
                                <option value="SMP">Gedung SMP</option>
                                <option value="SMA">Gedung SMA</option>
                            </select>
                        </div>
                    </div>

                    <!-- Bagian TOILET (11 item) -->
                    <div class="border-t pt-4">
                        <h3 class="text-lg font-semibold text-teal-600 dark:text-teal-400">🚽 Toilet</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                            <label><input type="checkbox" id="toilet_pintu_utama" class="mr-2"> Pintu Utama</label>
                            <label><input type="checkbox" id="toilet_pintu_kubikal" class="mr-2"> Pintu Kubikal</label>
                            <label><input type="checkbox" id="toilet_kaca" class="mr-2"> Kaca / Cermin</label>
                            <label><input type="checkbox" id="toilet_exhaust" class="mr-2"> Exhaust</label>
                            <label><input type="checkbox" id="toilet_dinding" class="mr-2"> Dinding</label>
                            <label><input type="checkbox" id="toilet_tempat_wudhu" class="mr-2"> Tempat Wudhu</label>
                            <label><input type="checkbox" id="toilet_lantai" class="mr-2"> Lantai</label>
                            <label><input type="checkbox" id="toilet_floor_drain" class="mr-2"> Floor Drain</label>
                            <label><input type="checkbox" id="toilet_kloset" class="mr-2"> Kloset</label>
                            <label><input type="checkbox" id="toilet_plafon" class="mr-2"> Plafon / Flapond</label>
                            <label><input type="checkbox" id="toilet_tempat_sampah" class="mr-2"> Tempat Sampah</label>
                        </div>
                    </div>

                    <!-- Bagian RUANGAN (daftar 31 area) -->
                    <div class="border-t pt-4">
                        <h3 class="text-lg font-semibold text-teal-600 dark:text-teal-400">🏢 Ruangan & Area Umum</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                            <label><input type="checkbox" id="ruang_loby_utama" class="mr-2"> Loby Utama</label>
                            <label><input type="checkbox" id="ruang_teras" class="mr-2"> Teras</label>
                            <label><input type="checkbox" id="ruang_lorong_utama" class="mr-2"> Lorong Utama Gedung</label>
                            <label><input type="checkbox" id="ruang_balkon" class="mr-2"> Balkon</label>
                            <label><input type="checkbox" id="ruang_pintu_utama" class="mr-2"> Pintu Utama</label>
                            <label><input type="checkbox" id="ruang_pintu_kelas" class="mr-2"> Pintu Kelas & R Lain</label>
                            <label><input type="checkbox" id="ruang_jendela" class="mr-2"> Jendela</label>
                            <label><input type="checkbox" id="ruang_kelas" class="mr-2"> Kelas</label>
                            <label><input type="checkbox" id="ruang_aula" class="mr-2"> Aula</label>
                            <label><input type="checkbox" id="ruang_sentra_musik" class="mr-2"> Sentra Musik</label>
                            <label><input type="checkbox" id="ruang_sentra_kreasi" class="mr-2"> Sentra Kreasi</label>
                            <label><input type="checkbox" id="ruang_uks" class="mr-2"> UKS</label>
                            <label><input type="checkbox" id="ruang_psikolog" class="mr-2"> Psikolog</label>
                            <label><input type="checkbox" id="ruang_lab_kom" class="mr-2"> Lab Kom</label>
                            <label><input type="checkbox" id="ruang_lab_ipa" class="mr-2"> Lab IPA</label>
                            <label><input type="checkbox" id="ruang_perpus" class="mr-2"> Perpustakaan</label>
                            <label><input type="checkbox" id="ruang_kepsek" class="mr-2"> Kepala Sekolah</label>
                            <label><input type="checkbox" id="ruang_guru_laki" class="mr-2"> R. Guru (Laki)</label>
                            <label><input type="checkbox" id="ruang_guru_perempuan" class="mr-2"> R. Guru (Perempuan)</label>
                            <label><input type="checkbox" id="ruang_pemasaran" class="mr-2"> R. Pemasaran</label>
                            <label><input type="checkbox" id="ruang_admin_tu" class="mr-2"> R. Admin TU</label>
                            <label><input type="checkbox" id="ruang_rapat" class="mr-2"> R. Rapat</label>
                            <label><input type="checkbox" id="ruang_ceo" class="mr-2"> R. CEO, Direktur & Yayasan</label>
                            <label><input type="checkbox" id="ruang_kabid" class="mr-2"> R. Kepala Bidang (Kabid)</label>
                            <label><input type="checkbox" id="ruang_osis" class="mr-2"> R. Osis</label>
                            <label><input type="checkbox" id="ruang_mushalla" class="mr-2"> R. Mushalla</label>
                            <label><input type="checkbox" id="ruang_inklusi" class="mr-2"> R. Inklusi</label>
                            <label><input type="checkbox" id="ruang_gudang_olahraga" class="mr-2"> R. Gudang Olah Raga</label>
                            <label><input type="checkbox" id="ruang_serbaguna" class="mr-2"> R. Serbaguna</label>
                            <label><input type="checkbox" id="ruang_masjid" class="mr-2"> R. Masjid</label>
                            <label><input type="checkbox" id="ruang_kantin" class="mr-2"> Kantin</label>
                            <label><input type="checkbox" id="ruang_saung_besar" class="mr-2"> Saung Besar</label>
                            <label><input type="checkbox" id="ruang_saung_kecil" class="mr-2"> Saung Kecil</label>
                            <label><input type="checkbox" id="ruang_pos" class="mr-2"> Pos</label>
                            <label><input type="checkbox" id="ruang_gudang_umum" class="mr-2"> Gudang Umum</label>
                            <label><input type="checkbox" id="ruang_tangga" class="mr-2"> Tangga</label>
                            <label><input type="checkbox" id="ruang_lift" class="mr-2"> Lift</label>
                            <label><input type="checkbox" id="ruang_lainnya" class="mr-2"> Keterangan Dll</label>
                        </div>
                    </div>

                    <!-- Catatan -->
                    <div>
                        <label class="block mb-1 text-sm font-medium">Catatan</label>
                        <textarea id="catatan" rows="2" placeholder="Catatan tambahan..." class="w-full p-2 border rounded dark:bg-gray-700"></textarea>
                    </div>

                    <!-- Foto Sebelum & Sesudah (opsional) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block mb-1 text-sm font-medium">Foto Sebelum</label>
                            <input type="file" id="foto_sebelum" accept="image/*" class="w-full p-2 border rounded dark:bg-gray-700">
                        </div>
                        <div>
                            <label class="block mb-1 text-sm font-medium">Foto Sesudah</label>
                            <input type="file" id="foto_sesudah" accept="image/*" class="w-full p-2 border rounded dark:bg-gray-700">
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-xl font-semibold">
                        Simpan Ceklis Indoor
                    </button>
                    <div id="form-result" class="text-center text-sm"></div>
                </form>
            </div>

            <!-- Panel Riwayat -->
            <div id="panel-history" class="tab-panel hidden">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 class="text-lg font-semibold mb-4 border-b pb-2 flex justify-between items-center">
                        <span>Riwayat Ceklis Indoor</span>
                        <button id="refresh-history" class="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">
                            🔄 Refresh
                        </button>
                    </h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full table-auto text-sm">
                            <thead class="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th class="px-2 py-2">Tanggal</th>
                                    <th class="px-2 py-2">Shift</th>
                                    <th class="px-2 py-2">Petugas</th>
                                    <th class="px-2 py-2">Lokasi</th>
                                    <th class="px-2 py-2">Status</th>
                                    <th class="px-2 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="history-body">
                                <tr><td colspan="6" class="text-center py-4">Memuat...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Panel Jadwal Mingguan -->
            <div id="panel-schedule" class="tab-panel hidden">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 class="text-lg font-semibold mb-4 border-b pb-2">📅 Jadwal Piket Mingguan</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full table-auto text-sm">
                            <thead class="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th class="px-2 py-2">Hari</th>
                                    <th class="px-2 py-2">Shift Pagi</th>
                                    <th class="px-2 py-2">Shift Siang</th>
                                    <th class="px-2 py-2">Shift Sore</th>
                                </tr>
                            </thead>
                            <tbody id="schedule-body">
                                <tr><td colspan="4" class="text-center py-4">Jadwal belum tersedia</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <p class="text-xs text-center mt-4 opacity-60">*Jadwal dapat diatur oleh supervisor</p>
                </div>
            </div>
        </div>
    `;
}

// ========== ELEMEN DOM ==========
let elements = {};

// ========== TAB HANDLING ==========
function activateTab(tab) {
    const tabs = [elements.tabForm, elements.tabHistory, elements.tabSchedule];
    tabs.forEach(t => {
        t?.classList.remove('active', 'border-teal-500', 'text-teal-500');
        t?.classList.add('text-gray-500');
    });
    const panels = [elements.panelForm, elements.panelHistory, elements.panelSchedule];
    panels.forEach(p => p?.classList.add('hidden'));

    if (tab === 'form') {
        elements.tabForm?.classList.add('active', 'border-teal-500', 'text-teal-500');
        elements.tabForm?.classList.remove('text-gray-500');
        elements.panelForm?.classList.remove('hidden');
    } else if (tab === 'history') {
        elements.tabHistory?.classList.add('active', 'border-teal-500', 'text-teal-500');
        elements.tabHistory?.classList.remove('text-gray-500');
        elements.panelHistory?.classList.remove('hidden');
        loadHistory();
    } else if (tab === 'schedule') {
        elements.tabSchedule?.classList.add('active', 'border-teal-500', 'text-teal-500');
        elements.tabSchedule?.classList.remove('text-gray-500');
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
            const statusClass = item.status === 'pending' ? 'text-yellow-500' : (item.status === 'verified' ? 'text-green-500' : 'text-blue-500');
            html += `
                <tr class="border-b border-gray-300 dark:border-gray-700">
                    <td class="px-2 py-2">${item.tanggal}</td>
                    <td class="px-2 py-2">${item.shift || '-'}</td>
                    <td class="px-2 py-2">${item.petugas}</td>
                    <td class="px-2 py-2">${item.lokasi}</td>
                    <td class="px-2 py-2 ${statusClass}">${item.status}</td>
                    <td class="px-2 py-2">
                        <button class="detail-btn text-blue-500 text-xs" data-id="${item.id}">Detail</button>
                    </td>
                </tr>
            `;
        });
        elements.historyBody.innerHTML = html;

        // Pasang event listener untuk tombol detail
        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                showDetail(id);
            });
        });
    } catch (err) {
        console.error('Gagal load history:', err);
        elements.historyBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500">Gagal memuat</td></tr>';
    }
}

// ========== SHOW DETAIL (sederhana, bisa ditingkatkan) ==========
async function showDetail(id) {
    try {
        const { data, error } = await supabase
            .from('janitor_indoor')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!data) {
            showToast('Data tidak ditemukan', 'error');
            return;
        }
        alert(JSON.stringify(data, null, 2)); // Ganti dengan modal jika perlu
    } catch (err) {
        showToast('Gagal mengambil detail', 'error');
    }
}

// ========== LOAD JADWAL (sementara statis) ==========
function loadSchedule() {
    if (!elements.scheduleBody) return;
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

// ========== HANDLE SUBMIT FORM ==========
async function handleSubmit(e) {
    e.preventDefault();

    const tanggal = elements.tanggal?.value;
    const shift = elements.shift?.value;
    const petugas = elements.petugas?.value;
    const lokasi = elements.lokasi?.value;
    const catatan = elements.catatan?.value;

    if (!tanggal || !petugas || !lokasi) {
        if (elements.formResult) elements.formResult.innerHTML = '<span class="text-red-500">Tanggal, Petugas, Lokasi harus diisi!</span>';
        showToast('Harap isi semua field wajib', 'error');
        return;
    }

    // Kumpulkan semua item toilet (id diawali 'toilet_')
    const toiletItems = {};
    document.querySelectorAll('input[id^="toilet_"]').forEach(cb => {
        const id = cb.id.replace('toilet_', '');
        toiletItems[id] = cb.checked;
    });

    // Kumpulkan semua item ruangan (id diawali 'ruang_')
    const ruangItems = {};
    document.querySelectorAll('input[id^="ruang_"]').forEach(cb => {
        const id = cb.id.replace('ruang_', '');
        ruangItems[id] = cb.checked;
    });

    const items = { toilet: toiletItems, ruangan: ruangItems };

    // Upload foto (opsional) - kita sederhanakan dulu: simpan base64 atau skip
    let fotoSebelumUrl = null;
    let fotoSesudahUrl = null;
    const fotoSebelum = elements.fotoSebelum?.files[0];
    const fotoSesudah = elements.fotoSesudah?.files[0];

    // Untuk sementara, kita tidak upload ke storage dulu, simpan nama file saja atau skip
    // Jika ingin upload, implementasi serupa dengan modul K3

    const formData = {
        tanggal,
        shift,
        petugas,
        lokasi,
        items,
        catatan: catatan || null,
        foto_sebelum: fotoSebelum ? fotoSebelum.name : null,
        foto_sesudah: fotoSesudah ? fotoSesudah.name : null,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const { error } = await supabase.from('janitor_indoor').insert([formData]);

        if (error) throw error;

        if (elements.formResult) {
            elements.formResult.innerHTML = '<span class="text-green-500">✅ Ceklis indoor berhasil disimpan!</span>';
        }
        showToast('Ceklis indoor berhasil', 'success');
        e.target.reset();
        // Reset tanggal ke hari ini
        if (elements.tanggal) {
            elements.tanggal.value = new Date().toISOString().split('T')[0];
        }
        // Reset semua checkbox (sebenarnya reset sudah, tapi kita pastikan)
        document.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
    } catch (err) {
        console.error(err);
        if (elements.formResult) {
            elements.formResult.innerHTML = `<span class="text-red-500">❌ Gagal: ${err.message}</span>`;
        }
        showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
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

// ========== INIT MODULE ==========
export async function init(params) {
    console.log('🧹 Modul Janitor Indoor dimuat', params);

    // Set bahasa jika perlu (tidak digunakan di modul ini)
    if (params?.lang) currentLang = params.lang;

    renderHTML();

    // Ambil elemen setelah dirender
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
    console.log('🧹 Modul Janitor Indoor dibersihkan');
    // Hapus event listener jika perlu (tidak wajib karena elemen akan dihapus)
}
