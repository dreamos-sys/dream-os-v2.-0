// ── 🔗 ASSET STATUS CHANGE WITH INTEGRATION ──────────────
window.updateAssetStatus = async function(assetId, newStatus, reason = '') {
    const user = store.get('user');
    if (!AUTHORIZED_ROLES.includes(user.role)) {
        showToast('⛔ Akses ditolak', 'error');
        return;
    }
    
    const statusFlow = {
        'baik': { icon: '✅', color: 'emerald', k3: false, maintenance: false },
        'rusak_ringan': { icon: '⚠️', color: 'orange', k3: false, maintenance: true },
        'rusak_berat': { icon: '❌', color: 'red', k3: true, maintenance: true },
        'hilang': { icon: '🚨', color: 'red', k3: true, maintenance: false },
        'ganti_baru': { icon: '🔄', color: 'blue', k3: false, maintenance: false }
    };
    
    if (!confirm(`Ubah status asset menjadi ${newStatus}?\n\n${reason ? 'Alasan: ' + reason : ''}`)) return;
    
    try {
        // 1. Update Asset Status
        const { error: assetError } = await supabase
            .from('assets')
            .update({ 
                kondisi: newStatus,
                status: newStatus === 'hilang' ? 'inactive' : 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', assetId);
        
        if (assetError) throw assetError;
        
        // 2. Auto-create K3 Report if needed
        if (statusFlow[newStatus].k3) {
            await createK3Report(assetId, newStatus, reason);
        }
        
        // 3. Auto-create Maintenance Order if needed
        if (statusFlow[newStatus].maintenance) {
            await createMaintenanceOrder(assetId, newStatus, reason);
        }
        
        // 4. Log to Audit Trail
        await logAssetChange(assetId, newStatus, reason, user);
        
        // 5. Sync to Command Center
        syncToCommandCenter('asset_status_change', { assetId, newStatus, reason });
        
        showToast(`✅ Asset status updated to ${newStatus}`, 'success');
        await loadAssets();
        updateStats();        
    } catch (err) {
        console.error('[ASSET] Status change error:', err);
        showToast('❌ Gagal: ' + err.message, 'error');
    }
};

// ── 🚨 CREATE K3 REPORT (AUTO) ───────────────────────────
async function createK3Report(assetId, status, reason) {
    const user = store.get('user');
    const asset = assets.find(a => a.id === assetId);
    
    const k3Data = {
        jenis_laporan: status === 'hilang' ? 'Kehilangan Asset' : 'Kerusakan Asset',
        lokasi: asset?.lokasi || 'Unknown',
        detail: `Asset ${asset?.nama_asset || 'Unknown'} mengalami ${status}. ${reason}`,
        level: status === 'hilang' ? 'high' : 'medium',
        reporter: user?.key || user?.email || 'System',
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('k3_reports').insert([k3Data]);
    if (error) console.error('[K3] Auto-create failed:', error);
    else showToast('🚨 K3 Report auto-created', 'info');
}

// ── 🔧 CREATE MAINTENANCE ORDER (AUTO) ───────────────────
async function createMaintenanceOrder(assetId, status, reason) {
    const user = store.get('user');
    const asset = assets.find(a => a.id === assetId);
    
    const maintenanceData = {
        asset_id: assetId,
        asset_name: asset?.nama_asset || 'Unknown',
        lokasi: asset?.lokasi || 'Unknown',
        kerusakan: reason || `${status} - Requires maintenance`,
        prioritas: status === 'rusak_berat' ? 'tinggi' : 'sedang',
        status: 'pending',
        teknisi_id: null,
        created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('maintenance_tasks').insert([maintenanceData]);
    if (error) console.error('[MAINTENANCE] Auto-create failed:', error);
    else showToast('🔧 Maintenance Order auto-created', 'info');
}

// ── 📝 AUDIT TRAIL LOG ────────────────────────────────────
async function logAssetChange(assetId, newStatus, reason, user) {    const auditData = {
        action: 'ASSET_STATUS_CHANGE',
        detail: `Asset ${assetId} → ${newStatus}. Reason: ${reason}`,
        user_id: user?.key || user?.email || 'System',
        created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('audit_logs').insert([auditData]);
    if (error) console.error('[AUDIT] Log failed:', error);
}

// ── 📡 SYNC TO COMMAND CENTER ─────────────────────────────
function syncToCommandCenter(eventType, data) {
    // Emit custom event for Command Center to listen
    window.dispatchEvent(new CustomEvent('asset-update', {
        detail: { type: eventType, data, timestamp: new Date().toISOString() }
    }));
    console.log('[ASSET] Synced to Command Center:', eventType);
}

// ── 🎲 ENHANCED DUMMY DATA WITH RELATIONSHIPS ────────────
window.seedDummyData = async function() {
    const user = store.get('user');
    if (!AUTHORIZED_ROLES.includes(user.role)) {
        showToast('⛔ Admin/Architect only', 'error');
        return;
    }
    
    if (!confirm('Generate professional dummy data with K3 & Maintenance integration?')) return;
    
    showToast('⏳ Generating integrated dummy data...', 'info');
    
    // Assets with various status for testing integration
    const dummyAssets = [
        { nama_asset: 'MacBook Pro 16" M3', kategori: 'Elektronik', lokasi: 'R. IT - Rack A1', serial_number: 'MBP-2026-001', harga: 45000000, tanggal_beli: '2026-01-15', kondisi: 'baik', status: 'active' },
        { nama_asset: 'Dell XPS 15', kategori: 'Elektronik', lokasi: 'R. IT - Rack A2', serial_number: 'DXP-2026-002', harga: 35000000, tanggal_beli: '2026-01-20', kondisi: 'rusak_ringan', status: 'active' },
        { nama_asset: 'Toyota Innova Zenix', kategori: 'Kendaraan', lokasi: 'Parkir Basement', serial_number: 'B 1234 XYZ', harga: 550000000, tanggal_beli: '2025-06-15', kondisi: 'rusak_berat', status: 'maintenance' },
        { nama_asset: 'AC Daikin 2 PK', kategori: 'Elektronik', lokasi: 'R. Server', serial_number: 'AC-2026-007', harga: 12000000, tanggal_beli: '2025-08-01', kondisi: 'hilang', status: 'inactive' },
        { nama_asset: 'Meeting Table Oval', kategori: 'Furnitur', lokasi: 'R. Rapat Lt.2', serial_number: 'MT-2026-003', harga: 15000000, tanggal_beli: '2025-12-10', kondisi: 'baik', status: 'active' }
    ];
    
    // K3 Reports linked to assets
    const dummyK3 = [
        { jenis_laporan: 'Kerusakan Asset', lokasi: 'R. IT - Rack A2', detail: 'Dell XPS 15 - Screen flickering, requires repair', level: 'medium', status: 'pending', created_at: new Date().toISOString() },
        { jenis_laporan: 'Kerusakan Asset', lokasi: 'Parkir Basement', detail: 'Toyota Innova - Engine malfunction, major repair needed', level: 'high', status: 'pending', created_at: new Date().toISOString() },
        { jenis_laporan: 'Kehilangan Asset', lokasi: 'R. Server', detail: 'AC Daikin 2 PK - Missing, possible theft', level: 'high', status: 'investigation', created_at: new Date().toISOString() }
    ];
    
    // Maintenance Tasks linked to assets
    const dummyMaintenance = [        { asset_name: 'Dell XPS 15', lokasi: 'R. IT - Rack A2', kerusakan: 'Screen flickering', prioritas: 'sedang', status: 'pending', created_at: new Date().toISOString() },
        { asset_name: 'Toyota Innova Zenix', lokasi: 'Parkir Basement', kerusakan: 'Engine malfunction', prioritas: 'tinggi', status: 'proses', teknisi_id: 'TECH-001', created_at: new Date().toISOString() }
    ];
    
    try {
        const { error: assetError } = await supabase.from('assets').insert(dummyAssets);
        if (assetError) throw assetError;
        
        const { error: k3Error } = await supabase.from('k3_reports').insert(dummyK3);
        if (k3Error) throw k3Error;
        
        const { error: maintError } = await supabase.from('maintenance_tasks').insert(dummyMaintenance);
        if (maintError) throw maintError;
        
        showToast('✅ Integrated dummy data created! (Assets + K3 + Maintenance)', 'success');
        await loadData();
        
    } catch (err) {
        console.error('[SEED] Error:', err);
        showToast('❌ Gagal: ' + err.message, 'error');
    }
};
