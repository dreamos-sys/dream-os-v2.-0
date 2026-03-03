// modules/k3/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

let currentLang = localStorage.getItem('lang') || 'id';

// ========== TRANSLATIONS ==========
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

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-4xl mx-auto p-4">
            <div class="crystal-card">
                <!-- HEADER -->
                <h1 class="text-2xl font-bold mb-6 text-orange-400 flex items-center gap-3">
                    <i class="fas fa-exclamation-triangle text-3xl"></i>
                    <span data-id="${TRANSLATIONS.id.title}" data-en="${TRANSLATIONS.en.title}">${TRANSLATIONS[currentLang].title}</span>
                </h1>
                
                <!-- FORM -->
                <form id="k3Form" class="space-y-4">
                    <!-- Tanggal -->
                    <div>
                        <label class="text-xs text-white/60 mb-2 block" data-id="${TRANSLATIONS.id.date}" data-en="${TRANSLATIONS.en.date}">${TRANSLATIONS[currentLang].date}</label>
                        <input type="date" id="tanggal" name="tanggal" class="input-field" required>
                    </div>
                    
                    <!-- Lokasi -->
                    <div>
                        <label class="text-xs text-white/60 mb-2 block" data-id="${TRANSLATIONS.id.location}" data-en="${TRANSLATIONS.en.location}">${TRANSLATIONS[currentLang].location}</label>
                        <input type="text" id="lokasi" name="lokasi" class="input-field" 
                            placeholder="${TRANSLATIONS[currentLang].locationPlaceholder}" 
                            data-placeholder-id="${TRANSLATIONS.id.locationPlaceholder}"
                            data-placeholder-en="${TRANSLATIONS.en.locationPlaceholder}"
                            required>
                    </div>
                    
                    <!-- Jenis Laporan -->
                    <div>
                        <label class="text-xs text-white/60 mb-2 block" data-id="${TRANSLATIONS.id.reportType}" data-en="${TRANSLATIONS.en.reportType}">${TRANSLATIONS[currentLang].reportType}</label>
                        <select id="jenis_laporan" name="jenis_laporan" class="input-field" required>
                            <option value="">${TRANSLATIONS[currentLang].selectType}</option>
                            ${Object.entries(TRANSLATIONS[currentLang].types).map(([key, val]) => `<option value="${key}">${val}</option>`).join('')}
                        </select>
                    </div>
                    
                    <!-- Deskripsi -->
                    <div>
                        <label class="text-xs text-white/60 mb-2 block" data-id="${TRANSLATIONS.id.description}" data-en="${TRANSLATIONS.en.description}">${TRANSLATIONS[currentLang].description}</label>
                        <textarea id="deskripsi" name="deskripsi" rows="4" class="input-field" 
                            placeholder="${TRANSLATIONS[currentLang].descriptionPlaceholder}" 
                            data-placeholder-id="${TRANSLATIONS.id.descriptionPlaceholder}"
                            data-placeholder-en="${TRANSLATIONS.en.descriptionPlaceholder}"
                            required></textarea>
                    </div>
                    
                    <!-- Camera Upload -->
                    <div>
                        <label class="text-xs text-white/60 mb-2 block" data-id="${TRANSLATIONS.id.photo}" data-en="${TRANSLATIONS.en.photo}">${TRANSLATIONS[currentLang].photo}</label>
                        <div class="camera-upload" onclick="document.getElementById('cameraInput').click()">
                            <i class="fas fa-camera"></i>
                            <p class="text-sm" data-id="${TRANSLATIONS.id.photoInstruction}" data-en="${TRANSLATIONS.en.photoInstruction}">${TRANSLATIONS[currentLang].photoInstruction}</p>
                            <p class="text-xs text-white/40 mt-2" data-id="${TRANSLATIONS.id.photoMax}" data-en="${TRANSLATIONS.en.photoMax}">${TRANSLATIONS[currentLang].photoMax}</p>
                        </div>
                        <input type="file" id="cameraInput" accept="image/*" capture="environment" class="hidden">
                        <img id="imagePreview" class="camera-preview" alt="Preview">
                        <input type="hidden" id="fotoBase64">
                    </div>
                    
                    <!-- Pelapor -->
                    <div>
                        <label class="text-xs text-white/60 mb-2 block" data-id="${TRANSLATIONS.id.reporter}" data-en="${TRANSLATIONS.en.reporter}">${TRANSLATIONS[currentLang].reporter}</label>
                        <input type="text" id="pelapor" name="pelapor" class="input-field" 
                            placeholder="${TRANSLATIONS[currentLang].reporterPlaceholder}" 
                            data-placeholder-id="${TRANSLATIONS.id.reporterPlaceholder}"
                            data-placeholder-en="${TRANSLATIONS.en.reporterPlaceholder}"
                            required>
                    </div>
                    
                    <!-- Prioritas -->
                    <div>
                        <label class="text-xs text-white/60 mb-2 block" data-id="${TRANSLATIONS.id.priority}" data-en="${TRANSLATIONS.en.priority}">${TRANSLATIONS[currentLang].priority}</label>
                        <select id="priority" name="priority" class="input-field">
                            ${Object.entries(TRANSLATIONS[currentLang].priorities).map(([key, val]) => `<option value="${key}">${val}</option>`).join('')}
                        </select>
                    </div>
                    
                    <!-- Submit Button -->
                    <button type="submit" class="btn-submit">
                        <i class="fas fa-paper-plane mr-2"></i> 
                        <span id="submit-text" data-id="${TRANSLATIONS.id.submit}" data-en="${TRANSLATIONS.en.submit}">${TRANSLATIONS[currentLang].submit}</span>
                    </button>
                </form>
                
                <!-- Form Result -->
                <div id="formResult" class="hidden"></div>
            </div>
        </div>
    `;
}

// ========== UPLOAD FOTO (optional, bisa langsung simpan base64) ==========
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

// ========== INIT ==========
export async function init(params) {
    console.log('[K3] Initializing...', params);

    // Ambil bahasa dari params atau localStorage
    if (params?.lang) currentLang = params.lang;
    else currentLang = localStorage.getItem('lang') || 'id';

    renderHTML();

    // Ambil elemen
    const form = document.getElementById('k3Form');
    const formResult = document.getElementById('formResult');
    const tanggal = document.getElementById('tanggal');
    const lokasi = document.getElementById('lokasi');
    const jenisLaporan = document.getElementById('jenis_laporan');
    const deskripsi = document.getElementById('deskripsi');
    const pelapor = document.getElementById('pelapor');
    const priority = document.getElementById('priority');
    const cameraInput = document.getElementById('cameraInput');
    const imagePreview = document.getElementById('imagePreview');
    const fotoBase64 = document.getElementById('fotoBase64');

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

            formResult.innerHTML = '<p class="success">✅ ' + TRANSLATIONS[currentLang].success + '</p>';
            formResult.className = 'success';
            formResult.classList.remove('hidden');
            showToast('K3 report submitted!', 'success');
            e.target.reset();
            if (tanggal) tanggal.value = today;
            imagePreview.style.display = 'none';
            fotoBase64.value = '';

            setTimeout(() => {
                formResult.classList.add('hidden');
            }, 5000);
        } catch (err) {
            console.error(err);
            formResult.innerHTML = `<p class="error">❌ ${TRANSLATIONS[currentLang].error} ${err.message}</p>`;
            formResult.className = 'error';
            formResult.classList.remove('hidden');
            showToast('Failed: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    // Bilingual support
    function applyLanguage(lang) {
        document.querySelectorAll('[data-id]').forEach(el => {
            if (lang === 'en') {
                el.textContent = el.getAttribute('data-en');
            } else {
                el.textContent = el.getAttribute('data-id');
            }
        });
        document.querySelectorAll('[data-placeholder-id]').forEach(el => {
            if (lang === 'en') {
                el.placeholder = el.getAttribute('data-placeholder-en');
            } else {
                el.placeholder = el.getAttribute('data-placeholder-id');
            }
        });
    }
    applyLanguage(currentLang);

    console.log('[K3] Ready');
}

export function cleanup() {
    console.log('[K3] Cleanup');
}

// Tambahkan CSS (bisa diletakkan di dalam style global atau inline di HTML)
const style = document.createElement('style');
style.textContent = `
    .crystal-card {
        background: rgba(255,255,255,0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 24px;
        padding: 1.5rem;
        max-width: 4xl;
        margin: 0 auto;
    }
    .input-field {
        background: rgba(255,255,255,0.07);
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 16px;
        padding: 14px;
        width: 100%;
        color: white;
        outline: none;
        font-family: inherit;
        transition: 0.3s;
    }
    .input-field:focus {
        border-color: #10b981;
        box-shadow: 0 0 20px rgba(16,185,129,0.3);
    }
    .btn-submit {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: none;
        border-radius: 18px;
        padding: 14px;
        width: 100%;
        color: white;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .btn-submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 40px rgba(245,158,11,0.4);
    }
    .btn-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .camera-upload {
        border: 2px dashed rgba(255,255,255,0.3);
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: 0.3s;
        background: rgba(255,255,255,0.03);
    }
    .camera-upload:hover {
        border-color: #f59e0b;
        background: rgba(245,158,11,0.1);
    }
    .camera-upload i {
        font-size: 3rem;
        color: #f59e0b;
        margin-bottom: 1rem;
    }
    .camera-preview {
        margin-top: 1rem;
        border-radius: 12px;
        max-width: 100%;
        max-height: 200px;
        display: none;
    }
    #formResult.success {
        background: rgba(16,185,129,0.2);
        color: #10b981;
        border: 1px solid #10b981;
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 12px;
        text-align: center;
        font-weight: 700;
    }
    #formResult.error {
        background: rgba(239,68,68,0.2);
        color: #ef4444;
        border: 1px solid #ef4444;
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 12px;
        text-align: center;
        font-weight: 700;
    }
    .hidden { display: none; }
`;
document.head.appendChild(style);
