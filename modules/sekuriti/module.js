// modules/sekuriti/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

// ========== KONSTANTA ==========
const DEPOK_CORE = { lat: -6.4000, lng: 106.8200 };
const SAFE_RADIUS_KM = 5.0;
const listPetugas = ['SUDARSONO', 'MARHUSIN', 'HERIYATNO', 'SUNARKO', 'HARIYANSAHC', 'AGUS SUTISNA', 'DONIH'];

// ========== ELEMEN DOM ==========
let tanggalInput, shiftInput, shiftStatus, petugasSelect, geoStatus, personelCount, anomalyStatus, form, fotoInput, formResult, refreshBtn, historyContainer;

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-6xl mx-auto p-4 fade-in">
            <!-- Header -->
            <div class="glass-deep rounded-[2rem] p-6 mb-6 relative overflow-hidden border border-emerald-500/30">
                <div class="absolute top-0 right-0 p-4 opacity-20">
                    <i class="fas fa-fingerprint text-6xl text-emerald-500"></i>
                </div>
                <div class="flex justify-between items-center relative z-10">
                    <div>
                        <h2 class="text-3xl font-black text-emerald-400 tracking-tighter uppercase drop-shadow-lg">
                            S.M.A.R.T Security <span class="text-white">AI</span>
                        </h2>
                        <p class="text-sm text-emerald-200/70 font-mono mt-1">
                            <span class="animate-pulse inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            LIVE MONITORING • ISO 27001 COMPLIANT
                        </p>
                    </div>
                    <div class="text-right hidden sm:block">
                        <p class="text-[10px] uppercase tracking-widest text-emerald-500/50">Device Authorized</p>
                        <p class="text-sm font-bold text-white">Redmi Note 9 Pro</p>
                    </div>
                </div>
            </div>

            <!-- Status Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 font-mono text-xs">
                <div class="glass-deep p-3 rounded-xl flex items-center justify-between border-l-2 border-blue-500">
                    <span class="text-slate-400">STATUS SHIFT</span>
                    <span id="ai-shift-status" class="font-bold text-blue-400">MENDETEKSI...</span>
                </div>
                <div class="glass-deep p-3 rounded-xl flex items-center justify-between border-l-2 border-emerald-500">
                    <span class="text-slate-400">SAFE CORE (5KM)</span>
                    <span id="ai-geo-status" class="font-bold text-emerald-400">CHECKING GPS</span>
                </div>
                <div class="glass-deep p-3 rounded-xl flex items-center justify-between border-l-2 border-purple-500">
                    <span class="text-slate-400">PERSONEL AKTIF</span>
                    <span id="ai-personnel-count" class="font-bold text-purple-400">3 ORANG</span>
                </div>
                <div class="glass-deep p-3 rounded-xl flex items-center justify-between border-l-2 border-yellow-500">
                    <span class="text-slate-400">ANOMALI JADWAL</span>
                    <span id="ai-anomaly-status" class="font-bold text-yellow-400">CLEAR</span>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="flex space-x-2 mb-6 bg-slate-800/50 p-1 rounded-full backdrop-blur-sm w-fit mx-auto border border-slate-700">
                <button class="tab-btn active px-6 py-2 rounded-full font-bold text-sm transition-all bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]" data-tab="laporan">
                    <i class="fas fa-camera-retro mr-2"></i> Laporan 24 Jam
                </button>
                <button class="tab-btn px-6 py-2 rounded-full font-bold text-sm text-slate-400 hover:text-white transition-all" data-tab="jadwal">
                    <i class="fas fa-calendar-alt mr-2"></i> AI Jadwal Sync
                </button>
            </div>

            <!-- TAB LAPORAN -->
            <div id="tab-laporan" class="tab-content">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Form Laporan -->
                    <div class="glass-deep p-6 rounded-3xl relative border border-slate-700/50">
                        <h3 class="text-lg font-bold mb-4 text-emerald-400 flex items-center">
                            <i class="fas fa-satellite-dish animate-pulse mr-2"></i> Transmisi Data
                        </h3>

                        <form id="sekuritiForm" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block mb-1 text-xs font-mono text-slate-400">TANGGAL (AUTO)</label>
                                    <input type="text" id="tanggal" readonly class="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors">
                                </div>
                                <div>
                                    <label class="block mb-1 text-xs font-mono text-slate-400">SHIFT AKTIF (AI)</label>
                                    <input type="text" id="shift" readonly class="w-full p-3 rounded-xl bg-slate-900/50 border border-emerald-500/50 text-emerald-400 font-bold font-mono text-sm shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">
                                </div>
                            </div>

                            <div>
                                <label class="block mb-1 text-xs font-mono text-slate-400">PETUGAS JAGA (Pilih sesuai jadwal)</label>
                                <select id="petugas" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500">
                                    <option value="">-- Pindai Petugas --</option>
                                </select>
                            </div>

                            <div class="relative group mt-2">
                                <label class="block mb-1 text-xs font-mono text-emerald-400">GEO-SCANNER KAMERA</label>
                                <div class="border-2 border-dashed border-emerald-500/50 rounded-xl p-4 text-center bg-emerald-900/10 hover:bg-emerald-900/20 transition-all cursor-pointer relative overflow-hidden">
                                    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent translate-y-[-100%] group-hover:animate-[scan_2s_ease-in-out_infinite]"></div>
                                    <i class="fas fa-camera text-3xl text-emerald-500/70 mb-2"></i>
                                    <p class="text-xs text-slate-300">Tap untuk Ambil Foto & Kunci GPS</p>
                                    <input type="file" id="foto_sekuriti" accept="image/*" capture="camera" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
                                </div>
                            </div>

                            <div>
                                <label class="block mb-1 text-xs font-mono text-slate-400">SITUASI / DESKRIPSI</label>
                                <textarea id="deskripsi" required rows="3" class="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 placeholder-slate-600" placeholder="Ketik laporan atau gunakan voice command..."></textarea>
                            </div>

                            <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white p-4 rounded-xl font-black tracking-widest uppercase shadow-[0_10px_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center">
                                <i class="fas fa-lock mr-2"></i> Enkripsi & Kirim
                            </button>
                            <div id="form-result" class="text-center text-sm font-mono mt-2"></div>
                        </form>
                    </div>

                    <!-- Riwayat Laporan -->
                    <div class="glass-deep p-6 rounded-3xl border border-slate-700/50 flex flex-col">
                        <h3 class="text-lg font-bold mb-4 text-emerald-400 flex justify-between items-center">
                            <span><i class="fas fa-database mr-2"></i> Log Keamanan</span>
                            <button id="refresh-history" class="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-full transition-colors border border-slate-600">
                                <i class="fas fa-sync-alt"></i> Sync
                            </button>
                        </h3>
                        <div class="flex-grow overflow-y-auto pr-2 custom-scrollbar" id="history-container">
                            <div class="text-center py-10 opacity-50">
                                <div class="spinner border-emerald-500 mb-2"></div>
                                <p class="text-xs font-mono">Mengakses Database Supabase...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB JADWAL -->
            <div id="tab-jadwal" class="tab-content hidden">
                <!-- Matriks Jadwal (Hari Ini, Besok, Lusa) -->
                <div class="glass-deep p-6 rounded-3xl border border-slate-700/50 overflow-hidden relative mb-6">
                    <h3 class="text-xl font-bold mb-4 text-white flex items-center">
                        <i class="fas fa-calendar-check text-emerald-500 mr-2"></i> Matriks Jadwal Dream Team
                    </h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full text-sm text-left border-collapse">
                            <thead>
                                <tr class="text-xs font-mono text-emerald-500 uppercase bg-slate-900/50">
                                    <th class="px-4 py-3 rounded-tl-xl">Personel</th>
                                    <th class="px-4 py-3 border-l border-slate-700 text-center bg-emerald-900/20">Hari Ini (AI)</th>
                                    <th class="px-4 py-3 border-l border-slate-700 text-center">Besok</th>
                                    <th class="px-4 py-3 border-l border-slate-700 text-center rounded-tr-xl">Lusa</th>
                                </tr>
                            </thead>
                            <tbody id="jadwal-view-body" class="text-slate-300"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Editor Jadwal Master -->
                <div class="glass-deep p-6 rounded-3xl border border-emerald-500/30 overflow-hidden relative">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-bold text-emerald-400 flex items-center">
                            <i class="fas fa-edit mr-2"></i> Master Schedule Editor
                        </h4>
                        <select id="select-bulan" class="bg-slate-800 text-white p-2 rounded-xl border border-slate-700 text-xs">
                            <option value="2">Februari 2026</option>
                            <option value="3">Maret 2026</option>
                            <option value="4">April 2026</option>
                            <option value="5">Mei 2026</option>
                            <option value="6">Juni 2026</option>
                            <option value="7">Juli 2026</option>
                            <option value="8">Agustus 2026</option>
                            <option value="9">September 2026</option>
                            <option value="10">Oktober 2026</option>
                            <option value="11">November 2026</option>
                            <option value="12">Desember 2026</option>
                        </select>
                    </div>
                    <div class="overflow-x-auto max-h-96 scroll-custom">
                        <table class="min-w-full text-[10px] font-mono border-collapse">
                            <thead class="bg-slate-900 text-emerald-400 sticky top-0 z-10">
                                <tr id="header-tanggal">
                                    <th class="p-2 border border-slate-700 bg-slate-900">PETUGAS</th>
                                    <!-- header tanggal diisi JS -->
                                </tr>
                            </thead>
                            <tbody id="body-input-jadwal"></tbody>
                        </table>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button id="generate-otomatis" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold mr-2">
                            <i class="fas fa-magic mr-2"></i> Generate Otomatis
                        </button>
                        <button id="save-master-jadwal" class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold">
                            <i class="fas fa-save mr-2"></i> SIMPAN JADWAL MASTER
                        </button>
                    </div>
                    <p class="text-[9px] text-slate-500 mt-2 italic">
                        * Kode: P (Pagi), M (Malam), L (Libur), CT (Cuti), S (Sore). Kosongkan = L.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// ========== FUNGSI-FUNGSI LOGIKA ==========
function detectShift() {
    const now = new Date();
    const jam = now.getHours();
    const shiftCode = (jam >= 7 && jam < 19) ? 'P' : 'M';
    const shiftLabel = shiftCode === 'P' ? 'PAGI (07:00-19:00)' : 'MALAM (19:00-07:00)';
    if (tanggalInput) tanggalInput.value = now.toISOString().split('T')[0];
    if (shiftInput) shiftInput.value = shiftLabel;
    if (shiftStatus) shiftStatus.innerText = shiftCode === 'P' ? '☀️ PAGI' : '🌙 MALAM';
    return shiftCode;
}

async function loadMasterSchedule(bulan = null, tahun = 2026) {
    if (!bulan) {
        const now = new Date();
        bulan = now.getMonth() + 1;
    }
    const { data, error } = await supabase
        .from('sekuriti_jadwal_master')
        .select('*')
        .eq('bulan', bulan)
        .eq('tahun', tahun);
    if (error) {
        console.error('Gagal load master schedule', error);
        return [];
    }
    return data || [];
}

async function renderPetugasDropdown() {
    if (!petugasSelect) return;
    const now = new Date();
    const tgl = now.getDate();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const shiftCode = detectShift();

    const jadwal = await loadMasterSchedule(bulan, tahun);
    if (!jadwal.length) {
        petugasSelect.innerHTML = '<option value="">-- MASTER JADWAL BELUM ADA --</option>';
        return;
    }

    let onDuty = [];
    let options = '<option value="">-- PILIH PETUGAS --</option>';
    jadwal.forEach(item => {
        const statusHariIni = item.jadwal_array[tgl - 1] || 'L';
        const nama = item.petugas_name;
        let label = `${nama} [${statusHariIni}]`;
        let isOnDuty = (statusHariIni === shiftCode);
        if (isOnDuty) {
            label += ' ⭐ BERTUGAS';
            onDuty.push(nama);
        }
        options += `<option value="${nama}" data-status="${statusHariIni}">${label}</option>`;
    });
    petugasSelect.innerHTML = options;
    if (personelCount) personelCount.innerText = `${onDuty.length} PERSONEL JAGA (${shiftCode})`;
}

function checkSafeCore(lat, lng) {
    const R = 6371;
    const dLat = (lat - DEPOK_CORE.lat) * Math.PI / 180;
    const dLng = (lng - DEPOK_CORE.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(DEPOK_CORE.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance <= SAFE_RADIUS_KM) {
        if (geoStatus) geoStatus.innerHTML = `<span class="text-emerald-400"><i class="fas fa-shield-alt"></i> AMAN (${distance.toFixed(1)}km)</span>`;
        return true;
    } else {
        if (geoStatus) geoStatus.innerHTML = `<span class="text-red-500 animate-pulse">⚠️ OUT OF CORE (${distance.toFixed(1)}km)</span>`;
        return false;
    }
}

function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject('GPS tidak didukung');
        navigator.geolocation.getCurrentPosition(
            pos => resolve(pos.coords),
            err => reject('Izin GPS ditolak'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

async function loadHistory() {
    if (!historyContainer) return;
    historyContainer.innerHTML = '<div class="text-center py-10 opacity-50"><div class="spinner border-emerald-500 mb-2"></div><p class="text-xs font-mono">Memuat riwayat...</p></div>';

    try {
        const { data, error } = await supabase
            .from('sekuriti_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (error) throw error;
        if (!data?.length) {
            historyContainer.innerHTML = '<p class="text-center py-10 text-slate-500 font-mono text-sm">Belum ada laporan.</p>';
            return;
        }

        let html = '';
        data.forEach(r => {
            html += `
                <div class="bg-slate-800/50 p-4 rounded-xl mb-3 border-l-4 border-emerald-500 font-mono text-xs">
                    <div class="flex justify-between">
                        <span class="text-emerald-400">${r.tanggal} ${r.shift}</span>
                        <span class="text-slate-500">${new Date(r.created_at).toLocaleTimeString('id-ID')}</span>
                    </div>
                    <div class="mt-1 text-white">👤 ${r.petugas.join(', ')}</div>
                    <div class="text-slate-300">${r.deskripsi || '-'}</div>
                    ${r.koordinat ? `<div class="text-[9px] text-slate-500 mt-1"><i class="fas fa-map-marker-alt mr-1"></i>${r.koordinat}</div>` : ''}
                </div>
            `;
        });
        historyContainer.innerHTML = html;
    } catch (err) {
        historyContainer.innerHTML = `<p class="text-center py-10 text-red-500 font-mono text-sm">Error: ${err.message}</p>`;
    }
}

function initJadwalEditor() {
    const header = document.getElementById('header-tanggal');
    const body = document.getElementById('body-input-jadwal');
    if (!header || !body) return;

    const bulanSelect = document.getElementById('select-bulan');
    const bulan = parseInt(bulanSelect?.value) || new Date().getMonth() + 1;
    const tahun = 2026;
    const jmlHari = new Date(tahun, bulan, 0).getDate();

    header.innerHTML = '<th class="p-2 border border-slate-700 bg-slate-900">PETUGAS</th>';
    for (let i = 1; i <= jmlHari; i++) {
        header.innerHTML += `<th class="p-1 border border-slate-700 text-center w-8">${i}</th>`;
    }

    body.innerHTML = '';
    listPetugas.forEach(nama => {
        let row = `<tr class="border-b border-slate-800"><td class="p-2 bg-slate-900/50 font-bold text-white sticky left-0">${nama}</td>`;
        for (let i = 1; i <= jmlHari; i++) {
            row += `<td class="p-0 border border-slate-800">
                <input type="text" data-nama="${nama}" data-tgl="${i}" 
                class="w-8 h-8 bg-transparent text-center text-white focus:bg-emerald-500/20 outline-none uppercase" 
                placeholder="L" maxlength="2">
            </td>`;
        }
        row += `</tr>`;
        body.innerHTML += row;
    });

    loadMasterSchedule(bulan, tahun).then(jadwal => {
        jadwal.forEach(item => {
            const nama = item.petugas_name;
            item.jadwal_array.forEach((status, idx) => {
                const tgl = idx + 1;
                const input = document.querySelector(`input[data-nama="${nama}"][data-tgl="${tgl}"]`);
                if (input) input.value = status;
            });
        });
    });
}

function koreksiJadwalDonih() {
    const petugas = listPetugas;
    const donihIndex = petugas.indexOf('DONIH');
    if (donihIndex === -1) return;

    const inputs = document.querySelectorAll('input[data-nama]');
    const jmlHari = inputs.length / petugas.length;

    for (let tgl = 1; tgl <= jmlHari; tgl++) {
        const donihInput = document.querySelector(`input[data-nama="DONIH"][data-tgl="${tgl}"]`);
        if (!donihInput) continue;
        const shiftDonih = donihInput.value.toUpperCase();

        if (shiftDonih === 'M') {
            let found = false;
            for (let i = 0; i < petugas.length; i++) {
                if (i === donihIndex) continue;
                const otherInput = document.querySelector(`input[data-nama="${petugas[i]}"][data-tgl="${tgl}"]`);
                if (otherInput && otherInput.value.toUpperCase() === 'L') {
                    donihInput.value = 'L';
                    otherInput.value = 'M';
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.warn(`Tanggal ${tgl}: Tidak ada petugas libur untuk menggantikan Donih yang mendapat M. Periksa manual.`);
            }
        }
    }
}

function generateJadwalOtomatis() {
    const bulanSelect = document.getElementById('select-bulan');
    const bulan = parseInt(bulanSelect?.value) || new Date().getMonth() + 1;
    const tahun = 2026;
    const jmlHari = new Date(tahun, bulan, 0).getDate();
    const petugas = listPetugas;

    const pola = {
        0: { pagi: [0,1,2], malam: [3,4], libur: [5,6] }, // Senin
        1: { pagi: [5,6,0], malam: [1,2], libur: [3,4] }, // Selasa
        2: { pagi: [3,4,5], malam: [6,0], libur: [1,2] }, // Rabu
        3: { pagi: [1,2,3], malam: [4,5], libur: [6,0] }, // Kamis
        4: { pagi: [6,0,1], malam: [2,3], libur: [4,5] }, // Jumat
        5: { pagi: [2,4], malam: [6,1], libur: [0,3,5] }, // Sabtu
        6: { pagi: [0,3], malam: [5,2], libur: [1,4,6] }  // Minggu
    };

    for (let tgl = 1; tgl <= jmlHari; tgl++) {
        const date = new Date(tahun, bulan-1, tgl);
        const dayOfWeek = date.getDay();
        const localDay = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        const offsetMinggu = Math.floor((tgl - 1) / 7) % 7;
        const polaHari = pola[localDay];
        const shiftHari = Array(petugas.length).fill('L');

        polaHari.pagi.forEach(idxAsli => {
            const idxPetugas = (idxAsli + offsetMinggu) % petugas.length;
            shiftHari[idxPetugas] = 'P';
        });
        polaHari.malam.forEach(idxAsli => {
            const idxPetugas = (idxAsli + offsetMinggu) % petugas.length;
            shiftHari[idxPetugas] = 'M';
        });

        petugas.forEach((nama, idxPetugas) => {
            const input = document.querySelector(`input[data-nama="${nama}"][data-tgl="${tgl}"]`);
            if (input) input.value = shiftHari[idxPetugas];
        });
    }

    koreksiJadwalDonih();
    alert(`✅ Jadwal untuk bulan ${bulan} telah digenerate otomatis. Koreksi Donih sudah diterapkan. Silakan cek manual.`);
}

async function renderJadwalMatriks() {
    const tbody = document.getElementById('jadwal-view-body');
    if (!tbody) return;
    const now = new Date();
    const tgl = now.getDate();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const jadwal = await loadMasterSchedule(bulan, tahun);
    if (!jadwal.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Master jadwal belum ada</td></tr>';
        return;
    }

    let html = '';
    jadwal.forEach(item => {
        const sTgl = item.jadwal_array[tgl - 1] || '-';
        const sBesok = item.jadwal_array[tgl] || '-';
        const sLusa = item.jadwal_array[tgl + 1] || '-';
        html += `<tr class="border-b border-slate-700/50">
            <td class="px-4 py-3 font-semibold">${item.petugas_name}</td>
            <td class="px-4 py-3 text-center border-l border-slate-700 ${sTgl === 'P' ? 'text-orange-400' : sTgl === 'M' ? 'text-blue-400' : ''}">${sTgl}</td>
            <td class="px-4 py-3 text-center border-l border-slate-700">${sBesok}</td>
            <td class="px-4 py-3 text-center border-l border-slate-700">${sLusa}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ========== SETUP EVENT LISTENERS ==========
function attachEventListeners() {
    petugasSelect?.addEventListener('change', function() {
        const selected = this.options[this.selectedIndex];
        const status = selected?.dataset?.status;
        if (anomalyStatus) {
            if (status === 'CT' || status === 'L') {
                anomalyStatus.innerHTML = `<span class="text-red-500 animate-pulse">⚠️ ${status === 'CT' ? 'CUTI' : 'LIBUR'} MELAPOR!</span>`;
            } else {
                anomalyStatus.innerHTML = `<span class="text-emerald-400">CLEAR</span>`;
            }
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Memproses...';

        try {
            if (!fotoInput || fotoInput.files.length === 0) {
                throw new Error('Foto geotagging wajib diambil!');
            }

            if (formResult) formResult.innerHTML = '<span class="text-yellow-400">Mengunci GPS...</span>';

            const coords = await getGeolocation();
            const isSafe = checkSafeCore(coords.latitude, coords.longitude);
            if (!isSafe) {
                if (!confirm('Anda berada di luar safe core. Tetap kirim laporan?')) {
                    throw new Error('Laporan dibatalkan');
                }
            }

            const namaPetugas = petugasSelect.value;
            if (!namaPetugas) throw new Error('Pilih petugas jaga!');

            const file = fotoInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `sekuriti/${Date.now()}_${coords.latitude}_${coords.longitude}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('sekuriti-foto')
                .upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage
                .from('sekuriti-foto')
                .getPublicUrl(fileName);
            const fotoUrl = urlData.publicUrl;

            const report = {
                tanggal: tanggalInput.value,
                shift: shiftInput.value,
                petugas: [namaPetugas],
                deskripsi: document.getElementById('deskripsi').value,
                koordinat: `${coords.latitude}, ${coords.longitude}`,
                foto_url: [fotoUrl],
                status: 'verified'
            };

            const { error } = await supabase.from('sekuriti_reports').insert([report]);
            if (error) throw error;

            if (formResult) formResult.innerHTML = '<span class="text-emerald-400 font-bold"><i class="fas fa-check-circle"></i> Laporan tersimpan!</span>';
            e.target.reset();
            detectShift();
            loadHistory();
        } catch (err) {
            if (formResult) formResult.innerHTML = `<span class="text-red-500"><i class="fas fa-times-circle"></i> ${err.message}</span>`;
            showToast('Error: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    refreshBtn?.addEventListener('click', loadHistory);

    document.getElementById('generate-otomatis')?.addEventListener('click', generateJadwalOtomatis);

    document.getElementById('save-master-jadwal')?.addEventListener('click', async () => {
        const btn = document.getElementById('save-master-jadwal');
        if (!btn) return;
        btn.innerHTML = 'MENYIMPAN...';
        const bulan = parseInt(document.getElementById('select-bulan').value);
        const tahun = 2026;

        try {
            for (let nama of listPetugas) {
                const inputs = document.querySelectorAll(`input[data-nama="${nama}"]`);
                const arrayJadwal = Array.from(inputs).map(inp => inp.value.toUpperCase() || 'L');
                const { error } = await supabase
                    .from('sekuriti_jadwal_master')
                    .upsert({
                        petugas_name: nama,
                        bulan: bulan,
                        tahun: tahun,
                        jadwal_array: arrayJadwal
                    }, { onConflict: 'petugas_name, bulan, tahun' });
                if (error) throw error;
            }
            alert('✅ Jadwal master berhasil disimpan!');
        } catch (err) {
            alert('❌ Gagal: ' + err.message);
        } finally {
            btn.innerHTML = '<i class="fas fa-save mr-2"></i> SIMPAN JADWAL MASTER';
        }
    });

    document.getElementById('select-bulan')?.addEventListener('change', initJadwalEditor);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('bg-emerald-500', 'text-white', 'shadow-[0_0_15px_rgba(16,185,129,0.5)]');
                b.classList.add('text-slate-400');
            });
            this.classList.remove('text-slate-400');
            this.classList.add('bg-emerald-500', 'text-white', 'shadow-[0_0_15px_rgba(16,185,129,0.5)]');

            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
            const target = document.getElementById(`tab-${this.dataset.tab}`);
            if (target) target.classList.remove('hidden');

            if (this.dataset.tab === 'laporan') {
                renderPetugasDropdown();
                loadHistory();
            } else if (this.dataset.tab === 'jadwal') {
                renderJadwalMatriks();
            }
        });
    });
}

// ========== INIT MODULE ==========
export async function init(params) {
    console.log('🔒 Modul Sekuriti dimuat', params);
    renderHTML();

    tanggalInput = document.getElementById('tanggal');
    shiftInput = document.getElementById('shift');
    shiftStatus = document.getElementById('ai-shift-status');
    petugasSelect = document.getElementById('petugas');
    geoStatus = document.getElementById('ai-geo-status');
    personelCount = document.getElementById('ai-personnel-count');
    anomalyStatus = document.getElementById('ai-anomaly-status');
    form = document.getElementById('sekuritiForm');
    fotoInput = document.getElementById('foto_sekuriti');
    formResult = document.getElementById('form-result');
    refreshBtn = document.getElementById('refresh-history');
    historyContainer = document.getElementById('history-container');

    detectShift();
    await renderPetugasDropdown();
    loadHistory();
    renderJadwalMatriks();
    initJadwalEditor();
    attachEventListeners();

    try {
        const coords = await getGeolocation();
        checkSafeCore(coords.latitude, coords.longitude);
    } catch (err) {
        if (geoStatus) geoStatus.innerHTML = `<span class="text-red-500">GPS tidak aktif</span>`;
    }
}

export function cleanup() {
    console.log('🔒 Modul Sekuriti dibersihkan');
}
