// modules/booking/module.js
import { api } from '../../core/api.js';
import { showToast } from '../../core/components.js';

export function init() {
    console.log('📅 Modul Booking dimuat');

    const area = document.getElementById('module-content');
    if (!area) {
        console.error('❌ #module-content tidak ditemukan');
        return;
    }

    // Render HTML
    area.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <button onclick="window.loadModule('commandcenter')" class="btn-crystal" style="background: rgba(255,255,255,0.1); border: none; padding: 0.5rem 1rem; border-radius: 12px; cursor: pointer;">
                ⬅️ Kembali
            </button>
            <h3 class="crystal-text" style="margin:0;">📅 Form Booking Sarana</h3>
        </div>

        <div class="max-w-4xl mx-auto p-4">
            <form id="bookingForm" class="space-y-4">
                <!-- Nama -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Nama Pemohon</label>
                    <input type="text" name="nama" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                </div>

                <!-- Divisi -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Divisi</label>
                    <input type="text" name="divisi" class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                </div>

                <!-- No HP -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">No HP</label>
                    <input type="tel" name="no_hp" class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                </div>

                <!-- Sarana -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Pilih Sarana</label>
                    <select name="sarana" id="sarana" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                        <option value="">-- Pilih Sarana --</option>
                    </select>
                </div>

                <!-- Tanggal -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Tanggal</label>
                    <input type="date" name="tgl" id="tgl" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                </div>

                <!-- Jam Mulai & Selesai -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Jam Mulai</label>
                        <input type="time" name="jam_mulai" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Jam Selesai</label>
                        <input type="time" name="jam_selesai" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                    </div>
                </div>

                <!-- Peralatan -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Peralatan Tambahan</label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-800/50 p-4 rounded-2xl">
                        <label><input type="checkbox" name="alat" value="Kursi Futura"> Kursi Futura</label>
                        <label><input type="checkbox" name="alat" value="Kursi Chitose"> Kursi Chitose</label>
                        <label><input type="checkbox" name="alat" value="Meja Siswa"> Meja Siswa</label>
                        <label><input type="checkbox" name="alat" value="Meja Panjang"> Meja Panjang</label>
                        <label><input type="checkbox" name="alat" value="Meja Oshin"> Meja Oshin</label>
                        <label><input type="checkbox" name="alat" value="Taplak Meja"> Taplak Meja</label>
                        <label><input type="checkbox" name="alat" value="Projektor"> Projektor</label>
                        <label><input type="checkbox" name="alat" value="Screen Projektor"> Screen Projektor</label>
                        <label><input type="checkbox" name="alat" value="TV"> TV</label>
                    </div>
                </div>

                <!-- Keperluan -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Keperluan (opsional)</label>
                    <textarea name="keperluan" rows="2" class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition"></textarea>
                </div>

                <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white p-4 rounded-xl font-bold transition">
                    <i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING
                </button>
            </form>

            <div id="form-result" class="mt-4 text-center text-sm"></div>
        </div>
    `;

    // ========== DATA SARANA ==========
    const saranaList = [ ... ]; // (isi dari kode sebelumnya)
    const saranaSelect = document.getElementById('sarana');
    if (saranaSelect) {
        saranaSelect.innerHTML = saranaList.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // ========== ATURAN ==========
    const WORK_HOURS = { start: 7.5, end: 16.0 };
    const FRIDAY_BLOCKED = ["Aula SMP", "Serbaguna"];
    const FRIDAY_BLOCK_START = 10.5;
    const FRIDAY_BLOCK_END = 13.0;
    const MASJID = "Masjid (Maintenance)";

    function timeToNumber(t) { ... }
    function isWeekend(dateStr) { ... }
    function isFriday(dateStr) { ... }
    function getMinDate() { ... }

    const tglInput = document.getElementById('tgl');
    if (tglInput) {
        tglInput.setAttribute('min', getMinDate());
        tglInput.value = getMinDate();
    }

    const form = document.getElementById('bookingForm');
    const resultDiv = document.getElementById('form-result');

    function setResultMessage(html, isError) { ... }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... (logika validasi dan penyimpanan)
    });
}
