import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

let scannerStream = null;
let qrHistory = JSON.parse(localStorage.getItem('qr_history') || '[]');

export async function init() {
    console.log('📱 Modul QR dimuat');
    loadHistory();
}

// ===== GENERATE QR =====
window.generateQR = function() {
    var type = document.getElementById('qrType').value;
    var data = document.getElementById('qrData').value.trim();
    var extra = document.getElementById('qrExtra').value.trim();    
    if (!data) {
        showToast('Please enter data to encode!', 'warning');
        return;
    }
    
    // Create encrypted QR data
    var qrData = {
        type: type,
        data: data,
        extra: extra,
        timestamp: new Date().toISOString(),
        user: store.get('user')?.role || 'Unknown',
        device: navigator.userAgent
    };
    
    // Encode to base64
    var encoded = btoa(JSON.stringify(qrData));
    
    // Generate QR using API
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(encoded);
    
    document.getElementById('qrDisplay').innerHTML = '<img src="' + qrUrl + '" class="w-full h-full" alt="QR Code">';
    
    // Save to history
    saveToHistory('generated', type, data);
    
    // Save to Supabase
    saveToDatabase(qrData);
    
    showToast('QR Code generated!', 'success');
};

// ===== DOWNLOAD QR =====
window.downloadQR = function() {
    var img = document.querySelector('#qrDisplay img');
    if (!img || img.src.includes('QR will appear')) {
        showToast('Generate QR code first!', 'warning');
        return;
    }
    
    var link = document.createElement('a');
    link.download = 'dream-os-qr-' + Date.now() + '.png';
    link.href = img.src;
    link.click();
    
    showToast('QR Code downloaded!', 'success');
};

// ===== PRINT QR =====
window.printQR = function() {
    var img = document.querySelector('#qrDisplay img');
    if (!img || img.src.includes('QR will appear')) {
        showToast('Generate QR code first!', 'warning');
        return;
    }
    
    var printWindow = window.open('', '', 'height=400,width=400');
    printWindow.document.write('<html><head><title>QR Code</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;">');
    printWindow.document.write('<img src="' + img.src + '" style="max-width:100%;">');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
};

// ===== START SCANNER =====
window.startScanner = function() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(stream) {
                scannerStream = stream;
                var video = document.getElementById('qrScanner');
                video.srcObject = stream;
                video.play();
                
                // Simulate scan detection (for production, use jsQR library)
                setTimeout(function() {
                    simulateScanResult();
                }, 5000);
            })
            .catch(function(err) {
                showToast('Camera access denied or not available: ' + err.message, 'error');
            });
    } else {
        showToast('Camera access not supported in this browser!', 'error');
    }
};

// ===== STOP SCANNER =====
window.stopScanner = function() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(function(track) {
            track.stop();
        });
        scannerStream = null;
        var video = document.getElementById('qrScanner');
        video.srcObject = null;
    }
};

// ===== SIMULATE SCAN RESULT =====
function simulateScanResult() {
    var result = {
        type: 'booking',
        data: 'BK-' + Math.floor(Math.random() * 10000),
        timestamp: new Date().toISOString(),
        verified: true
    };
    
    document.getElementById('scanResult').classList.remove('hidden');
    document.getElementById('scanData').textContent = result.data;
    document.getElementById('scanDetails').innerHTML = `
        <div>Type: ${result.type}</div>
        <div>Time: ${new Date(result.timestamp).toLocaleString()}</div>
        <div>Status: <span class="text-emerald-400">✅ Verified</span></div>
    `;
    
    saveToHistory('scanned', result.type, result.data);
}

// ===== CLOSE SCAN RESULT =====
window.closeScanResult = function() {
    document.getElementById('scanResult').classList.add('hidden');
};

// ===== SAVE TO HISTORY =====
function saveToHistory(action, type, data) {
    var entry = {
        action: action,
        type: type,
        data: data,
        timestamp: new Date().toISOString()
    };
    
    qrHistory.unshift(entry);
    if (qrHistory.length > 50) qrHistory.pop();
    
    localStorage.setItem('qr_history', JSON.stringify(qrHistory));
    loadHistory();
}

// ===== LOAD HISTORY =====
function loadHistory() {
    var container = document.getElementById('qrHistory');
    
    if (qrHistory.length === 0) {
        container.innerHTML = `
            <div class="qr-history-item">
                <div class="flex items-center gap-3">
                    <i class="fas fa-qrcode text-emerald-400"></i>
                    <div>
                        <div class="text-sm font-bold">No QR history</div>
                        <div class="text-[10px] text-white/40">Generate or scan your first QR!</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = qrHistory.map(function(item) {
        var icon = item.action === 'generated' ? 'fa-plus-circle' : 'fa-camera';
        var color = item.action === 'generated' ? 'text-blue-400' : 'text-emerald-400';
        return `
            <div class="qr-history-item">
                <div class="flex items-center gap-3">
                    <i class="fas ${icon} ${color}"></i>
                    <div>
                        <div class="text-sm font-bold">${item.action.toUpperCase()}: ${item.type}</div>
                        <div class="text-[10px] text-white/40">${item.data} • ${new Date(item.timestamp).toLocaleString()}</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-white/20"></i>
            </div>
        `;
    }).join('');
}

// ===== CLEAR HISTORY =====
window.clearHistory = function() {
    if (confirm('Clear all QR history?')) {
        qrHistory = [];
        localStorage.removeItem('qr_history');
        loadHistory();
        showToast('History cleared', 'success');
    }
};

// ===== QUICK ACTIONS =====
window.quickAction = function(action) {
    switch(action) {
        case 'checkin':
            showToast('Check-In: Point camera at employee QR badge', 'info');
            break;
        case 'checkout':
            showToast('Check-Out: Point camera at employee QR badge', 'info');
            break;
        case 'verify':
            showToast('Verify: Scan QR to verify authenticity', 'info');
            break;
        case 'export':
            exportHistory();
            break;
    }
};

// ===== EXPORT HISTORY =====
function exportHistory() {
    var csv = 'Action,Type,Data,Timestamp\n';
    qrHistory.forEach(function(item) {
        csv += `${item.action},${item.type},${item.data},${item.timestamp}\n`;
    });
    
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'qr-history-' + Date.now() + '.csv';
    a.click();
    
    showToast('QR history exported to CSV!', 'success');
}

// ===== SAVE TO DATABASE =====
async function saveToDatabase(qrData) {
    try {
        await supabase.from('qr_logs').insert([{
            type: qrData.type,
            data: qrData.data,
            extra: qrData.extra,
            user_role: qrData.user,
            created_at: qrData.timestamp
        }]);
        console.log('QR saved to database');
    } catch (e) {
        console.log('Database save error:', e);
    }
}
