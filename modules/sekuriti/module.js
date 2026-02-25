import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

// ========== KONSTANTA ==========
const DEPOK_CORE = { lat: -6.4000, lng: 106.8200 };
const SAFE_RADIUS_KM = 5.0;
const listPetugas = ['SUDARSONO', 'MARHUSIN', 'HERIYATNO', 'SUNARKO', 'HARIYANSAHC', 'AGUS SUTISNA', 'DONIH'];

// ========== ELEMEN DOM (akan diinisialisasi saat init) ==========
let tanggalInput, shiftInput, shiftStatus, petugasSelect, geoStatus, personelCount, anomalyStatus, form, fotoInput, formResult, refreshBtn, historyContainer;

export async function init() {
    console.log('🔒 Modul Sekuriti dimuat');

    // Inisialisasi elemen DOM
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

    // Deteksi shift awal
    detectShift();

    // Render dropdown petugas berdasarkan jadwal master
    await renderPetugasDropdown();

    // Load riwayat laporan
    loadHistory();

    // Render matriks jadwal (hari ini, besok, lusa)
    renderJadwalMatriks();

    // Inisialisasi editor jadwal master
    initJadwalEditor();

    // Cek GPS
    try {
        const coords = await getGeolocation();
        checkSafeCore(coords.latitude, coords.longitude);
    } catch (err) {
        if (geoStatus) geoStatus.innerHTML = `<span class="text-red-500">GPS tidak aktif</span>`;
    }

    // Pasang event listener
    attachEventListeners();
}

function attachEventListeners() {
    // Anomali saat pilih petugas
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

    // Submit form laporan
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

            formResult.innerHTML = '<span class="text-yellow-400">Mengunci GPS...</span>';

            const coords = await getGeolocation();
            const isSafe = checkSafeCore(coords.latitude, coords.longitude);
            if (!isSafe) {
                if (!confirm('Anda berada di luar safe core. Tetap kirim laporan?')) {
                    throw new Error('Laporan dibatalkan');
                }
            }

            const namaPetugas = petugasSelect.value;
            if (!namaPetugas) throw new Error('Pilih petugas jaga!');

            // Upload foto ke storage
            const file = fotoInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `sekuriti/${Date.now()}_${coords.latitude}_${coords.longitude}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('k3-foto')
                .upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage
                .from('k3-foto')
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

            formResult.innerHTML = '<span class="text-emerald-400 font-bold"><i class="fas fa-check-circle"></i> Laporan tersimpan!</span>';
            e.target.reset();
            loadHistory();
        } catch (err) {
            if (formResult) formResult.innerHTML = `<span class="text-red-500"><i class="fas fa-times-circle"></i> ${err.message}</span>`;
            showToast('Error: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    // Refresh history
    refreshBtn?.addEventListener('click', loadHistory);

    // Tombol generate otomatis jadwal
    document.getElementById('generate-otomatis')?.addEventListener('click', generateJadwalOtomatis);

    // Tombol simpan jadwal master
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

    // Ganti bulan di editor
    document.getElementById('select-bulan')?.addEventListener('change', initJadwalEditor);

    // Tab navigasi
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

// ========== 1. DETEKSI SHIFT OTOMATIS ==========
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

// ========== 2. LOAD JADWAL MASTER DARI DATABASE ==========
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

// ========== 3. RENDER DROPDOWN PETUGAS BERDASARKAN JADWAL ==========
async function renderPetugasDropdown() {
    const now = new Date();
    const tgl = now.getDate();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const shiftCode = detectShift(); // P atau M

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

// ========== 5. CEK GPS DAN RADIUS ==========
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
        geoStatus.innerHTML = `<span class="text-emerald-400"><i class="fas fa-shield-alt"></i> AMAN (${distance.toFixed(1)}km)</span>`;
        return true;
    } else {
        geoStatus.innerHTML = `<span class="text-red-500 animate-pulse">⚠️ OUT OF CORE (${distance.toFixed(1)}km)</span>`;
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

// ========== 7. LOAD HISTORY LAPORAN ==========
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

// ========== 8. EDITOR JADWAL MASTER ==========
function initJadwalEditor() {
    const header = document.getElementById('header-tanggal');
    const body = document.getElementById('body-input-jadwal');
    if (!header || !body) return;

    const bulan = parseInt(document.getElementById('select-bulan')?.value) || new Date().getMonth() + 1;
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

    // Muat data dari database jika sudah ada
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

// ========== 9. AUTO GENERATE JADWAL ==========
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
    const bulan = parseInt(document.getElementById('select-bulan').value);
    const tahun = 2026;
    const jmlHari = new Date(tahun, bulan, 0).getDate();
    const petugas = listPetugas;

    // Pola: 0 Senin, 1 Selasa, 2 Rabu, 3 Kamis, 4 Jumat, 5 Sabtu, 6 Minggu
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

// ========== 11. RENDER MATRIKS JADWAL (HARI INI, BESOK, LUSA) ==========
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
