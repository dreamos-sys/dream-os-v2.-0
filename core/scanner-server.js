import { showToast } from './components.js';
import { store } from './store.js';

class ScannerServer {
    constructor() {
        this.socket = null;
        this.isRunning = false;
        this.scanners = new Map(); // Simpan info scanner yang terhubung
        this.buffer = '';
    }

    start(port = 9101) {
        if (this.isRunning) return;
        
        // Di browser, kita tidak bisa bikin socket server langsung
        // Tapi kita bisa pakai WebSocket relay atau minta scanner kirim ke endpoint
        console.log(`[SCANNER] Server siap di port ${port}`);
        this.isRunning = true;
        
        // Alternatif: setup listener untuk WebSocket dari scanner
        this.setupWebSocketRelay();
    }

    setupWebSocketRelay() {
        // Jika scanner bisa konek via WebSocket
        const ws = new WebSocket('ws://localhost:8080/scanner');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleScanData(data);
        };
        
        ws.onclose = () => {
            console.log('[SCANNER] WebSocket disconnected');
            this.isRunning = false;
        };
    }

    handleScanData(data) {
        // Data dari scanner biasanya berisi barcode
        const { barcode, scannerId, timestamp } = data;
        
        console.log(`[SCANNER] Barcode diterima: ${barcode} dari ${scannerId}`);
        
        // Simpan ke store untuk diakses modul lain
        store.set('lastScan', { barcode, scannerId, timestamp });
        
        // Trigger event untuk modul yang listen
        window.dispatchEvent(new CustomEvent('barcode-scanned', { 
            detail: { barcode, scannerId } 
        }));
        
        // Bisa langsung auto-fill ke form yang aktif
        this.autoFillActiveForm(barcode);
        
        showToast(`Scan: ${barcode}`, 'success');
    }

    autoFillActiveForm(barcode) {
        // Cek apakah ada input yang sedang fokus
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
            activeElement.value = barcode;
            // Trigger event input agar reactif
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // Simpan ke session untuk diambil nanti
            sessionStorage.setItem('lastScan', barcode);
        }
    }
}

export const scannerServer = new ScannerServer();
