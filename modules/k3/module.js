// modules/k3/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { eventBus } from '../../core/eventBus.js';

let currentLang = 'id';

const TRANSLATIONS = {
    id: {
        title: 'Laporan K3',
        date: 'Tanggal',
        location: 'Lokasi',
        locationPlaceholder: 'Contoh: Gedung A, Lantai 2',
        reportType: 'Jenis Laporan',
        selectType: '-- Pilih Jenis --',
        types: {
            kerusakan: '🔧 Kerusakan Fasilitas',
            kehilangan: '📦 Kehilangan',
            kebersihan: '🧹 Kebersihan',
            kecelakaan: '⚠️ Kecelakaan',
            bahaya: '☢️ Potensi Bahaya',
            lainnya: '📌 Lainnya'
        },
        description: 'Deskripsi',
        descriptionPlaceholder: 'Jelaskan detail kejadian...',
        photo: 'Foto Bukti (Opsional)',
        photoInstruction: 'Klik untuk ambil foto atau upload',
        photoMax: 'Maksimal 5MB (JPG, PNG)',
        reporter: 'Pelapor',
        reporterPlaceholder: 'Nama Anda',
        priority: 'Prioritas',
        priorities: {
            normal: '⚪ Normal',
            high: '🟡 Tinggi',
            critical: '🔴 Critical'
        },
        submit: 'Laporkan',
        submitting: '⏳ Mengirim...',
        success: '✅ Laporan K3 berhasil dikirim!',
        error: '❌ Error: '
    },
    en: {
        title: 'K3 Report',
        date: 'Date',
        location: 'Location',
        locationPlaceholder: 'Example: Building A, Floor 2',
        reportType: 'Report Type',
        selectType: '-- Select Type --',
        types: {
            kerusakan: '🔧 Facility Damage',
            kehilangan: '📦 Loss',
            kebersihan: '🧹 Cleanliness',
            kecelakaan: '⚠️ Accident',
            bahaya: '☢️ Potential Hazard',
            lainnya: '📌 Other'
        },
        description: 'Description',
        descriptionPlaceholder: 'Describe the incident in detail...',
        photo: 'Evidence Photo (Optional)',
        photoInstruction: 'Click to take photo or upload',
        photoMax: 'Max 5MB (JPG, PNG)',
        reporter: 'Reporter',
        reporterPlaceholder: 'Your Name',
        priority: 'Priority',
        priorities: {
            normal: '⚪ Normal',
            high: '🟡 High',
            critical: '🔴 Critical'
        },
        submit: 'Submit Report',
        submitting: '⏳ Submitting...',
        success: '✅ K3 report submitted successfully!',
        error: '❌ Error: '
    }
};

function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-4xl mx-auto p-4">
            <!-- Header -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl mb-6 border border-orange-500/30">
                <h2 class="text-2xl font-bold text-orange-400">⚠️ ${TRANSLATIONS[currentLang].title}</h2>
                <p class="text-xs text-slate-400">Laporan Keselamatan & Kesehatan Kerja</p>
            </div>

            <!-- Form -->
            <form id="k3Form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm mb-1">${TRANSLATIONS[currentLang].date}</label>
                        <input type="date" id="tanggal" name="tanggal" required class="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white">
                    </div>
                    <div>
                        <label class="block text-sm mb-1">${TRANSLATIONS[currentLang].location}</label>
                        <input type="text" id="lokasi" name="lokasi" placeholder="${TRANSLATIONS[currentLang].locationPlaceholder}" required class="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white">
                    </div>
                </div>

                <div>
                    <label class="block text-sm mb-1">${TRANSLATIONS[currentLang].reportType}</label>
                    <select id="jenis_laporan" name="jenis_laporan" required class="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white">
                        <option value="">${TRANSLATIONS[currentLang].selectType}</option>
                        ${Object.entries(TRANSLATIONS[currentLang].types).map(([key, val]) => `<option value="${key}">${val}</option>`).join('')}
                    </select>
                </div>

                <div>
                    <label class="block text-sm mb-1">${TRANSLATIONS[currentLang].description}</label>
                    <textarea id="deskripsi" name="deskripsi" rows="3" placeholder="${TRANSLATIONS[currentLang].descriptionPlaceholder}" required class="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white"></textarea>
                </div>

                <div>
                    <label class="block text-sm mb-1">${TRANSLATIONS[currentLang].photo}</label>
                    <div class="border-2 border-dashed border-orange-500/50 rounded-lg p-4 text-center cursor-pointer hover:bg-orange-500/10 transition" onclick="document.getElementById('cameraInput').click()">
                        <i class="fas fa-camera text-2xl text-orange-400 mb-2"></i>
                        <p class="text-sm">${TRANSLATIONS[currentLang].photoInstruction}</p>
                        <p class="text-xs opacity-60">${TRANSLATIONS[currentLang].photoMax}</p>
                        <input type="file" id="cameraInput" accept="image/*" capture="camera" class="hidden">
                    </div>
                    <img id="imagePreview" class="mt-2 max-h-40 rounded hidden">
                    <input type="hidden" id="fotoBase64">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm mb-1">${TRANSLATIONS[currentLang].reporter}</label>
                        <input type="text" id="pelapor" name="pelapor" placeholder="${TRANSLATIONS[currentLang].reporterPlaceholder}" required class="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white">
                    </div>
                    <div>
                        <label class="block text-sm mb-1">${TRANSLATIONS[currentLang].priority}</label>
                        <select id="priority" name="priority" class="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white">
                            ${Object.entries(TRANSLATIONS[currentLang].priorities).map(([key, val]) => `<option value="${key}">${val}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <button type="submit" class="w-full bg-orange-600 hover:bg-orange-500 p-3 rounded-lg font-bold">
                    <span id="btn-submit">${TRANSLATIONS[currentLang].submit}</span>
                </button>
                <div id="form-result" class="text-center text-sm"></div>
            </form>
        </div>
    `;
}

async function uploadPhoto(base64Data) {
    try {
        const response = await fetch(base64Data);
        const blob = await response.blob();
        const filename = `k3/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
        const { error } = await supabase.storage
            .from('k3-foto')
            .upload(filename, blob, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('k3-foto').getPublicUrl(filename);
        return urlData.publicUrl;
    } catch (err) {
        console.error('[K3] Upload failed:', err);
        showToast('Upload foto gagal, menggunakan base64', 'warning');
        return null;
    }
}

export async function init(params) {
    console.log('[K3] Initializing...', params);
    
    // Ambil bahasa dari params atau localStorage
    if (params?.lang) currentLang = params.lang;
    else currentLang = localStorage.getItem('lang') || 'id';

    renderHTML();

    const tanggal = document.getElementById('tanggal');
    const lokasi = document.getElementById('lokasi');
    const jenisLaporan = document.getElementById('jenis_laporan');
    const deskripsi = document.getElementById('deskripsi');
    const pelapor = document.getElementById('pelapor');
    const priority = document.getElementById('priority');
    const cameraInput = document.getElementById('cameraInput');
    const imagePreview = document.getElementById('imagePreview');
    const fotoBase64 = document.getElementById('fotoBase64');
    const form = document.getElementById('k3Form');
    const formResult = document.getElementById('form-result');
    const btnSubmit = document.getElementById('btn-submit');

    // Set tanggal default hari ini
    const today = new Date().toISOString().split('T')[0];
    if (tanggal) tanggal.value = today;

    // Handle file input
    cameraInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('File terlalu besar! Maksimal 5MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
                fotoBase64.value = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle submit
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            tanggal: tanggal.value,
            lokasi: lokasi.value,
            jenis_laporan: jenisLaporan.value,
            deskripsi: deskripsi.value,
            pelapor: pelapor.value,
            priority: priority.value || 'normal',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> ' + TRANSLATIONS[currentLang].submitting;

        try {
            // Upload foto jika ada
            if (fotoBase64.value) {
                const photoUrl = await uploadPhoto(fotoBase64.value);
                if (photoUrl) {
                    data.foto_url = [photoUrl];
                } else {
                    data.foto_url = [fotoBase64.value];
                }
            } else {
                data.foto_url = [];
            }

            const { error } = await supabase.from('k3_reports').insert([data]);

            if (error) throw error;

            formResult.innerHTML = '<span class="text-green-500">✅ ' + TRANSLATIONS[currentLang].success + '</span>';
            showToast('K3 report submitted!', 'success');
            e.target.reset();
            if (tanggal) tanggal.value = today;
            imagePreview.style.display = 'none';
            fotoBase64.value = '';

            // Emit event
            eventBus.emit('k3-report', { jenis: data.jenis_laporan, lokasi: data.lokasi, deskripsi: data.deskripsi, prioritas: data.priority });
            if (data.priority === 'critical') {
                eventBus.emit('k3-critical', { id: data.id, jenis: data.jenis_laporan, lokasi: data.lokasi, pesan: `⚠️ Laporan ${data.jenis_laporan} prioritas ${data.priority} di ${data.lokasi}` });
            }
        } catch (err) {
            console.error(err);
            formResult.innerHTML = `<span class="text-red-500">❌ ${TRANSLATIONS[currentLang].error} ${err.message}</span>`;
            showToast('Failed: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    console.log('[K3] Ready');
}

export function cleanup() {
    console.log('[K3] Cleanup');
}
