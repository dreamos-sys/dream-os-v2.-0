import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { scannerServer } from '../../core/scanner-server.js';

export function init() {
    console.log('[SCANNER] Module loaded');
    
    // Start scanner server
    scannerServer.start();
    
    loadScanners();
    loadScanHistory();
    
    // Listen for scans
    window.addEventListener('barcode-scanned', (e) => {
        addToHistory(e.detail);
        playBeep();
    });
}

async function loadScanners() {
    const { data } = await supabase
        .from('scanners')
        .select('*')
        .eq('status', 'active');
        
    const list = document.getElementById('scanner-list');
    if (data?.length) {
        list.innerHTML = data.map(s => `
            <div class="bg-slate-700/50 p-2 rounded">
                <div class="font-bold">${s.name}</div>
                <div class="text-xs">IP: ${s.ip_address} | Status: 🟢 Online</div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-slate-400">Tidak ada scanner terhubung</p>';
    }
}

async function loadScanHistory() {
    const { data } = await supabase
        .from('scan_logs')
        .select('*')
        .order('scanned_at', { ascending: false })
        .limit(20);
        
    const history = document.getElementById('scan-history');
    if (data?.length) {
        history.innerHTML = data.map(s => `
            <div class="bg-slate-800/50 p-2 rounded text-xs">
                <span class="font-bold">${s.barcode}</span>
                <span class="text-slate-400"> - ${new Date(s.scanned_at).toLocaleTimeString()}</span>
            </div>
        `).join('');
    } else {
        history.innerHTML = '<p class="text-slate-400">Belum ada scan</p>';
    }
}

function addToHistory(scan) {
    const history = document.getElementById('scan-history');
    const newItem = document.createElement('div');
    newItem.className = 'bg-slate-800/50 p-2 rounded text-xs animate-pulse';
    newItem.innerHTML = `
        <span class="font-bold">${scan.barcode}</span>
        <span class="text-slate-400"> - Baru saja</span>
    `;
    history.prepend(newItem);
    
    // Hapus item paling bawah jika terlalu banyak
    if (history.children.length > 20) {
        history.lastChild.remove();
    }
}

function playBeep() {
    // Bisa tambahkan suara beep
    const audio = new Audio('data:audio/wav;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...');
    audio.play().catch(e => {});
}

window.testScanner = function() {
    // Simulasi scan untuk testing
    const testBarcode = 'ASSET-' + Math.floor(Math.random() * 10000);
    window.dispatchEvent(new CustomEvent('barcode-scanned', { 
        detail: { barcode: testBarcode, scannerId: 'test' } 
    }));
    showToast(`Test scan: ${testBarcode}`, 'success');
};
