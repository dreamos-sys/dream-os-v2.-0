import { showToast } from '../../core/components.js';

let receiptPrinter = null;
let lastUsedDevice = null;

// Inisialisasi printer
export function init() {
    if ('usb' in navigator) {
        receiptPrinter = new WebUSBReceiptPrinter();
        setupPrinterEvents();
        // Coba konek ulang ke printer yang pernah dipakai
        const savedDevice = localStorage.getItem('lastPrinter');
        if (savedDevice) {
            try {
                receiptPrinter.reconnect(JSON.parse(savedDevice));
            } catch (e) {}
        }
    } else {
        console.warn('WebUSB tidak didukung di browser ini');
    }
}

function setupPrinterEvents() {
    receiptPrinter.addEventListener('connected', device => {
        showToast(`Terhubung ke ${device.productName}`, 'success');
        lastUsedDevice = device;
        localStorage.setItem('lastPrinter', JSON.stringify(device));
    });
    
    receiptPrinter.addEventListener('disconnected', () => {
        showToast('Printer terputus', 'warning');
    });
}

// Tombol koneksi printer
window.connectPrinter = function() {
    if (!receiptPrinter) {
        showToast('WebUSB tidak didukung', 'error');
        return;
    }
    receiptPrinter.connect();
};

// Cetak struk booking
window.printBookingReceipt = async function(bookingData) {
    if (!receiptPrinter || !receiptPrinter.isConnected) {
        showToast('Printer tidak terhubung', 'warning');
        return;
    }
    
    try {
        const encoder = new ThermalPrinterEncoder({ 
            language: lastUsedDevice?.language || 'esc-pos',
            width: 42 // 80mm paper
        });
        
        const data = encoder
            .initialize()
            .align('center')
            .text('DREAM OS')
            .text('Booking Confirmation')
            .newline()
            .align('left')
            .text(`Nama: ${bookingData.nama_peminjam}`)
            .text(`Ruang: ${bookingData.ruang}`)
            .text(`Tanggal: ${bookingData.tanggal}`)
            .text(`Jam: ${bookingData.jam_mulai} - ${bookingData.jam_selesai}`)
            .newline()
            .qrcode(`https://dreamos-sys.github.io/booking/${bookingData.id}`)
            .newline()
            .cut()
            .encode();
        
        await receiptPrinter.print(data);
        showToast('Struk berhasil dicetak', 'success');
    } catch (err) {
        showToast('Gagal cetak: ' + err.message, 'error');
    }
};
