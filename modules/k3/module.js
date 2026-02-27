/**
 * K3 Report Module - Crystal Prism Edition
 * Dream OS v2.0 | The Power Soul of Shalawat
 * 
 * Features:
 * - Camera upload (evidence photo)
 * - Bilingual (ID + EN)
 * - Supabase integration
 * - Crystal Prism styling
 * - Event-driven integration (emits events for Maintenance & Command Center)
 */

import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/eventBus.js'; // <-- TAMBAHKAN

// ===== STATE =====
let currentLang = localStorage.getItem('lang') || 'id';

// ===== TRANSLATIONS =====
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

// ===== INIT MODULE =====
export function init() {
    console.log('[K3] Module initialized - Crystal Prism Edition');
    
    // Apply language
    applyLanguage(currentLang);
    
    // Setup form
    setupForm();
    
    // Setup camera
    setupCamera();
    
    // Listen for language changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'lang') {
            currentLang = e.newValue;
            applyLanguage(currentLang);
        }
    });
}

// ===== APPLY LANGUAGE =====
function applyLanguage(lang) {
    const t = TRANSLATIONS[lang];
    
    const elements = {
        'k3-title': t.title,
        'label-date': t.date,
        'label-location': t.location,
        'label-type': t.reportType,
        'label-description': t.description,
        'label-photo': t.photo,
        'photo-instruction': t.photoInstruction,
        'photo-max': t.photoMax,
        'label-reporter': t.reporter,
        'label-priority': t.priority,
        'btn-submit': t.submit
    };
    
    Object.entries(elements).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });
    
    const placeholders = {
        'lokasi': t.locationPlaceholder,
        'deskripsi': t.descriptionPlaceholder,
        'pelapor': t.reporterPlaceholder
    };
    
    Object.entries(placeholders).forEach(([id, placeholder]) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = placeholder;
    });
    
    updateSelectOptions('jenis_laporan', t.types);
    updateSelectOptions('priority', t.priorities);
}

function updateSelectOptions(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const firstOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(firstOption);
    
    Object.entries(options).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    });
}

// ===== SETUP FORM =====
function setupForm() {
    const form = document.getElementById('k3Form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> ' + TRANSLATIONS[currentLang].submitting;
        
        try {
            const k3Data = {
                tanggal: data.tanggal,
                lokasi: data.lokasi,
                jenis_laporan: data.jenis_laporan,
                deskripsi: data.deskripsi,
                pelapor: data.pelapor,
                priority: data.priority || 'normal',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            if (data.foto_base64) {
                const photoUrl = await uploadPhoto(data.foto_base64);
                if (photoUrl) {
                    k3Data.foto_url = photoUrl;
                }
            }
            
            const { data: inserted, error } = await supabase
                .from('k3_reports')
                .insert([k3Data])
                .select();
            
            if (error) throw error;
            
            // 🚀 INTEGRASI: Emit event
            if (inserted && inserted.length > 0) {
                const report = inserted[0];
                if (report.jenis_laporan === 'kerusakan' || report.jenis_laporan === 'bahaya') {
                    eventBus.emit('k3-report', {
                        id: report.id,
                        jenis: report.jenis_laporan,
                        lokasi: report.lokasi,
                        deskripsi: report.deskripsi,
                        prioritas: report.priority,
                        pelapor: report.pelapor,
                        tanggal: report.tanggal
                    });
                }
                if (report.priority === 'critical' || report.priority === 'high') {
                    eventBus.emit('k3-critical', {
                        id: report.id,
                        jenis: report.jenis_laporan,
                        lokasi: report.lokasi,
                        pesan: `⚠️ Laporan ${report.jenis_laporan} prioritas ${report.priority} di ${report.lokasi}`
                    });
                }
            }
            
            showResult('success', TRANSLATIONS[currentLang].success);
            showToast('K3 report submitted!', 'success');
            
            e.target.reset();
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('fotoBase64').value = '';
            
            setTimeout(() => {
                document.getElementById('formResult').classList.add('hidden');
            }, 5000);
            
        } catch (err) {
            showResult('error', TRANSLATIONS[currentLang].error + err.message);
            showToast('Failed: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// ===== SETUP CAMERA =====
function setupCamera() {
    const cameraUpload = document.querySelector('.camera-upload');
    const cameraInput = document.getElementById('cameraInput');
    
    if (!cameraUpload || !cameraInput) return;
    
    cameraUpload.addEventListener('click', () => {
        cameraInput.click();
    });
    
    cameraInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });
}

function handleFileSelect(file) {
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        showToast('Invalid file type! Only JPG/PNG allowed', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('File too large! Max 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
        document.getElementById('fotoBase64').value = e.target.result;
        showToast('Photo loaded!', 'success');
    };
    reader.readAsDataURL(file);
}

async function uploadPhoto(base64Data) {
    try {
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        const filename = `k3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        
        const { error } = await supabase.storage
            .from('k3-photos')
            .upload(filename, blob, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
            .from('k3-photos')
            .getPublicUrl(filename);
        
        return urlData.publicUrl;
    } catch (err) {
        console.error('[K3] Upload failed:', err);
        return base64Data; // fallback
    }
}

function showResult(type, message) {
    const resultDiv = document.getElementById('formResult');
    if (!resultDiv) return;
    resultDiv.innerHTML = `<p>${message}</p>`;
    resultDiv.className = type;
    resultDiv.classList.remove('hidden');
}

export function cleanup() {
    console.log('[K3] Module cleanup');
}
