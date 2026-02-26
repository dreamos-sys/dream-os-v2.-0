/**
 * K3 Report Module - Crystal Prism Edition
 * Dream OS v2.0 | The Power Soul of Shalawat
 * 
 * Features:
 * - Camera upload (evidence photo)
 * - Bilingual (ID + EN)
 * - Supabase integration
 * - Crystal Prism styling
 */

import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

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
        submitting: '⏳ Mengirim...',        success: '✅ Laporan K3 berhasil dikirim!',
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
    
    // Update text content
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
    
    // Update placeholders
    const placeholders = {
        'lokasi': t.locationPlaceholder,
        'deskripsi': t.descriptionPlaceholder,
        'pelapor': t.reporterPlaceholder
    };
    
    Object.entries(placeholders).forEach(([id, placeholder]) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = placeholder;
    });
    
    // Update select options
    updateSelectOptions('jenis_laporan', t.types);
    updateSelectOptions('priority', t.priorities);
}
// ===== UPDATE SELECT OPTIONS =====
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
            // Prepare data
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
            
            // Add photo if exists
            if (data.foto_base64) {
                // Option 1: Store base64 directly (for small images)                // k3Data.foto_url = data.foto_base64;
                
                // Option 2: Upload to Supabase Storage (recommended)
                const photoUrl = await uploadPhoto(data.foto_base64);
                if (photoUrl) {
                    k3Data.foto_url = photoUrl;
                }
            }
            
            // Insert to Supabase
            const { error } = await supabase
                .from('k3_reports')
                .insert([k3Data]);
            
            if (error) throw error;
            
            // Show success
            showResult('success', TRANSLATIONS[currentLang].success);
            showToast('K3 report submitted!', 'success');
            
            // Reset form
            e.target.reset();
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('fotoBase64').value = '';
            
            // Hide success after 5 seconds
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

// ===== HANDLE FILE SELECT =====
function handleFileSelect(file) {
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        showToast('Invalid file type! Only JPG/PNG allowed', 'error');
        return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File too large! Max 5MB', 'error');
        return;
    }
    
    // Read and preview
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

// ===== UPLOAD PHOTO TO SUPABASE STORAGE =====
async function uploadPhoto(base64Data) {
    try {
        // Convert base64 to blob
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        // Generate unique filename
        const filename = `k3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('k3-photos')
            .upload(filename, blob, {
                cacheControl: '3600',                upsert: false
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('k3-photos')
            .getPublicUrl(filename);
        
        console.log('[K3] Photo uploaded:', urlData.publicUrl);
        return urlData.publicUrl;
        
    } catch (err) {
        console.error('[K3] Upload failed:', err);
        // Fallback: store base64 directly
        return base64Data;
    }
}

// ===== SHOW RESULT =====
function showResult(type, message) {
    const resultDiv = document.getElementById('formResult');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = `<p>${message}</p>`;
    resultDiv.className = type;
    resultDiv.classList.remove('hidden');
}

// ===== CLEANUP =====
export function cleanup() {
    console.log('[K3] Module cleanup');
    // Remove event listeners if needed
}

// Auto-init when module loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
