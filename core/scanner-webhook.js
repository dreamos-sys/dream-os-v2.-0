import { showToast } from './components.js';
import { store } from './store.js';

// Fungsi untuk handle POST dari scanner
export async function handleScannerWebhook(request) {
    try {
        const data = await request.json();
        const { barcode, scanner_id, timestamp } = data;
        
        console.log(`[WEBHOOK] Scan: ${barcode}`);
        
        // Simpan ke database
        await supabase.from('scan_logs').insert([{
            barcode,
            scanner_id,
            scanned_at: timestamp || new Date().toISOString()
        }]);
        
        // Trigger event
        window.dispatchEvent(new CustomEvent('barcode-scanned', { 
            detail: { barcode, scannerId: scanner_id } 
        }));
        
        return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
