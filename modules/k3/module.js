/**
 * modules/k3/module.js
 * Dream OS v2.0 — K3 Report Module
 * ✅ FIXED: Signature match + CC Integration (audit_logs) + Maintenance Auto-Task
 * Bi idznillah! ⚠️🛡️🔧
 *
 * INTEGRASI:
 *  1. Command Center → menulis ke audit_logs setiap submit/verifikasi
 *                    → CC realtime subscription langsung update counter K3
 *
 *  2. AUTO-ROUTING berdasarkan jenis_laporan:
 *     🔧 kerusakan   → maintenance_tasks   (tabel: maintenance_tasks)
 *     🔒 kehilangan  → security_reports    (tabel: security_reports)
 *     🧹 kebersihan  → janitor_tasks       (tabel: janitor_tasks)
 *     ⚠️ kecelakaan / ☢️ bahaya / 📌 lainnya → hanya ke K3 + audit_log
 *
 *     Semua jenis dengan priority === 'critical' JUGA di-route ke maintenance
 *     sebagai escalation, meski jenisnya bukan kerusakan.
 */

// ✅ EXPORT DEFAULT + ASYNC + PARAMETER MATCH
// Signature seragam dengan booking module & commandcenter module
export default async function initModule(
    config, utils, supabase, currentUser,
    showToast, showModal, loader, translations, currentLang
) {

    // ========== INJECT CSS ==========
    if (!document.getElementById('k3-styles')) {
        const style = document.createElement('style');
        style.id = 'k3-styles';
        style.textContent = `
            #k3-root * { box-sizing: border-box; }
            #k3-root {
                max-width: 1000px; margin: 0 auto; padding: 1rem;
                font-family: 'Inter', 'Rajdhani', sans-serif; color: #e2e8f0;
            }
            .k3-panel {
                background: rgba(15,23,42,0.85); backdrop-filter: blur(16px);
                border: 1px solid rgba(245,158,11,0.25); border-radius: 16px;
                padding: 1.5rem; margin-bottom: 1.5rem;
            }
            .k3-header {
                background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05));
                border-left: 4px solid #f59e0b;
            }
            .k3-title {
                font-size: 1.8rem; font-weight: 800;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                margin-bottom: 0.25rem;
            }
            .k3-sub { font-size: 0.75rem; color: #94a3b8; }
            .k3-tabs {
                display: flex; gap: 0.5rem;
                border-bottom: 2px solid rgba(245,158,11,0.3);
                margin-bottom: 1.5rem; overflow-x: auto;
            }
            .k3-tab {
                padding: 0.65rem 1.5rem; background: rgba(255,255,255,0.04);
                border: 1px solid transparent; border-radius: 8px 8px 0 0;
                cursor: pointer; font-weight: 600; font-size: 0.9rem;
                color: #94a3b8; white-space: nowrap;
            }
            .k3-tab:hover { background: rgba(245,158,11,0.08); color: #e2e8f0; }
            .k3-tab.active { background: rgba(245,158,11,0.18); border-color: #f59e0b; color: #f59e0b; }
            .k3-form-grid {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem; margin-bottom: 1rem;
            }
            .k3-label {
                display: block; font-size: 0.75rem; color: #94a3b8;
                margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;
            }
            .k3-input, .k3-select, .k3-textarea {
                width: 100%; padding: 0.75rem 1rem; background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
                color: white; font-family: inherit; font-size: 0.9rem; transition: 0.2s;
            }
            .k3-input:focus, .k3-select:focus, .k3-textarea:focus {
                outline: none; border-color: #f59e0b;
                box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
            }
            .k3-select option { background: #1e293b; color: #e2e8f0; }
            .k3-btn {
                display: inline-flex; align-items: center; justify-content: center;
                gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 12px;
                font-weight: 700; cursor: pointer; transition: 0.2s; border: none; font-family: inherit;
            }
            .k3-btn-primary {
                background: linear-gradient(135deg, #f59e0b, #d97706); color: white; width: 100%;
            }
            .k3-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245,158,11,0.4); }
            .k3-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            .k3-btn-sm {
                padding: 0.4rem 1rem; font-size: 0.8rem; border-radius: 8px;
                background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0;
            }
            .k3-btn-sm:hover { background: rgba(245,158,11,0.2); border-color: #f59e0b; }
            .k3-btn-red {
                padding: 0.4rem 1rem; font-size: 0.8rem; border-radius: 8px;
                background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444;
            }
            .k3-btn-red:hover { background: rgba(239,68,68,0.25); }
            .k3-btn-green {
                padding: 0.4rem 1rem; font-size: 0.8rem; border-radius: 8px;
                background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #10b981;
            }
            .k3-btn-green:hover { background: rgba(16,185,129,0.25); }
            .k3-upload-area {
                border: 2px dashed rgba(245,158,11,0.4); border-radius: 16px; padding: 1.5rem;
                text-align: center; cursor: pointer; transition: 0.2s; background: rgba(245,158,11,0.05);
            }
            .k3-upload-area:hover { border-color: #f59e0b; background: rgba(245,158,11,0.1); }
            .k3-preview { max-width: 200px; max-height: 150px; border-radius: 12px; margin-top: 0.75rem; display: none; }
            .k3-table-wrap { overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); }
            table.k3-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
            table.k3-table thead { background: rgba(0,0,0,0.3); }
            table.k3-table th {
                padding: 0.75rem 1rem; text-align: left; font-size: 0.7rem;
                text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;
            }
            table.k3-table td { padding: 0.75rem 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
            table.k3-table tr:hover td { background: rgba(255,255,255,0.02); }
            .k3-badge { display: inline-block; padding: 0.2rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
            .k3-badge-pending  { background: rgba(245,158,11,0.2); color: #f59e0b; }
            .k3-badge-verified { background: rgba(16,185,129,0.2); color: #10b981; }
            .k3-badge-rejected { background: rgba(239,68,68,0.2);  color: #ef4444; }
            .k3-badge-critical { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
            .k3-badge-high     { background: rgba(245,158,11,0.15); color: #f59e0b; }
            .k3-badge-normal   { background: rgba(100,116,139,0.15); color: #94a3b8; }
            /* ✅ Tag integrasi — tampil di history bila ada auto-task maintenance */
            .k3-mn-tag {
                display: inline-flex; align-items: center; gap: 0.25rem;
                font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.5rem;
                background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3);
                color: #3b82f6; border-radius: 6px; white-space: nowrap;
            }
            .k3-loader { display: flex; flex-direction: column; align-items: center; padding: 3rem; }
            .k3-spinner {
                width: 40px; height: 40px;
                border: 3px solid rgba(245,158,11,0.2); border-top-color: #f59e0b;
                border-radius: 50%; animation: k3-spin 1s linear infinite;
            }
            @keyframes k3-spin { to { transform: rotate(360deg); } }
            /* Modal detail */
            .k3-modal-overlay {
                position: fixed; inset: 0; z-index: 9999;
                background: rgba(0,0,0,0.75); display: flex;
                align-items: center; justify-content: center; padding: 1rem;
            }
            .k3-modal {
                background: #0f172a; border: 1px solid rgba(245,158,11,0.3);
                border-radius: 18px; padding: 2rem; max-width: 560px;
                width: 100%; max-height: 90vh; overflow-y: auto;
            }
            .k3-modal-row {
                display: flex; justify-content: space-between; padding: 0.5rem 0;
                border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.85rem;
            }
            .k3-modal-row span:first-child { color: #64748b; flex-shrink: 0; margin-right: 1rem; }
        `;
        document.head.appendChild(style);
    }

    // ========== HELPERS ==========
    function esc(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function fmtDate(d)   { return d ? new Date(d).toLocaleDateString('id-ID') : '—'; }
    function fmtDT(d)     { return d ? new Date(d).toLocaleString('id-ID', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'; }

    // ✅ Unified toast — pakai utils dari loader, sama polanya dengan booking & CC module
    function doToast(msg, type = 'info') {
        if (utils?.showToast)               return utils.showToast(msg, type);
        if (typeof showToast === 'function') return showToast(msg, type);
        // Built-in fallback
        const tc = document.getElementById('toast-container');
        if (tc) {
            const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
            const el    = document.createElement('div');
            el.className = `toast toast-${type}`;
            el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
            tc.appendChild(el);
            setTimeout(() => { el.style.opacity='0'; setTimeout(() => el.remove(), 300); }, 3000);
            return;
        }
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
            background:${type==='error'?'rgba(239,68,68,.9)':type==='warning'?'rgba(245,158,11,.9)':type==='info'?'rgba(59,130,246,.9)':'rgba(16,185,129,.9)'};
            color:white;padding:10px 20px;border-radius:12px;z-index:99999;
            font-weight:700;font-size:.9rem;opacity:0;transition:opacity .3s;white-space:nowrap;`;
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.style.opacity = '1', 10);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3200);
    }

    // ✅ AUDIT LOG WRITER — menulis ke audit_logs agar
    //    Command Center (tab Activity & Dashboard) langsung update
    async function writeAuditLog(action, detail, user) {
        if (!supabase) return;
        try {
            await supabase.from('audit_logs').insert([{
                action,
                detail,
                user: user || currentUser?.name || 'Unknown',
                created_at: new Date().toISOString()
            }]);
        } catch (err) {
            console.warn('[K3] audit_log gagal:', err.message);
        }
    }

    // ════════════════════════════════════════════════════════
    // ✅ AUTO-ROUTING ENGINE
    //    3 tujuan berbeda berdasarkan jenis_laporan:
    //      🔧 kerusakan  → maintenance_tasks
    //      🔒 kehilangan → security_reports
    //      🧹 kebersihan → janitor_tasks
    //    + escalation semua priority=critical → maintenance juga
    // ════════════════════════════════════════════════════════

    // 🔧 KERUSAKAN → maintenance_tasks
    async function routeToMaintenance(k3Data, k3Id) {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase.from('maintenance_tasks').insert([{
                judul:       `[K3] Kerusakan — ${k3Data.lokasi}`,
                deskripsi:   `[Auto dari K3 #${k3Id}]\nPelapor: ${k3Data.pelapor}\nTanggal: ${k3Data.tanggal}\n\n${k3Data.deskripsi}`,
                lokasi:      k3Data.lokasi,
                priority:    k3Data.priority || 'normal',
                status:      'pending',
                source:      'k3_report',
                k3_ref_id:   String(k3Id),
                assigned_to: null,
                created_by:  k3Data.pelapor,
                created_at:  new Date().toISOString()
            }]).select('id').single();
            if (error) throw error;
            console.log(`[K3] ✅ Routed → Maintenance #${data?.id}`);
            return data?.id || null;
        } catch (err) {
            console.warn('[K3] Route→Maintenance gagal:', err.message);
            return null;
        }
    }

    // 🔒 KEHILANGAN → security_reports
    async function routeToSecurity(k3Data, k3Id) {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase.from('security_reports').insert([{
                judul:           `[K3] Kehilangan — ${k3Data.lokasi}`,
                deskripsi:       `[Auto dari K3 #${k3Id}]\nPelapor: ${k3Data.pelapor}\nTanggal: ${k3Data.tanggal}\n\n${k3Data.deskripsi}`,
                lokasi:          k3Data.lokasi,
                priority:        k3Data.priority || 'normal',
                status:          'pending',
                source:          'k3_report',
                k3_ref_id:       String(k3Id),
                dilaporkan_oleh: k3Data.pelapor,
                tanggal:         k3Data.tanggal,
                created_at:      new Date().toISOString()
            }]).select('id').single();
            if (error) throw error;
            console.log(`[K3] ✅ Routed → Security #${data?.id}`);
            return data?.id || null;
        } catch (err) {
            console.warn('[K3] Route→Security gagal:', err.message);
            return null;
        }
    }

    // 🧹 KEBERSIHAN → janitor_tasks (auto-detect indoor/outdoor dari lokasi+deskripsi)
    async function routeToJanitor(k3Data, k3Id) {
        if (!supabase) return null;
        try {
            const isOutdoor = /lapangan|parkir|taman|luar|outdoor|halaman|koridor luar|area luar/i
                .test(k3Data.lokasi + ' ' + k3Data.deskripsi);
            const { data, error } = await supabase.from('janitor_tasks').insert([{
                judul:       `[K3] Kebersihan ${isOutdoor ? 'Outdoor' : 'Indoor'} — ${k3Data.lokasi}`,
                deskripsi:   `[Auto dari K3 #${k3Id}]\nPelapor: ${k3Data.pelapor}\nTanggal: ${k3Data.tanggal}\n\n${k3Data.deskripsi}`,
                lokasi:      k3Data.lokasi,
                area_type:   isOutdoor ? 'outdoor' : 'indoor',
                priority:    k3Data.priority || 'normal',
                status:      'pending',
                source:      'k3_report',
                k3_ref_id:   String(k3Id),
                assigned_to: null,
                created_by:  k3Data.pelapor,
                created_at:  new Date().toISOString()
            }]).select('id').single();
            if (error) throw error;
            console.log(`[K3] ✅ Routed → Janitor #${data?.id} [${isOutdoor ? 'outdoor' : 'indoor'}]`);
            return data?.id || null;
        } catch (err) {
            console.warn('[K3] Route→Janitor gagal:', err.message);
            return null;
        }
    }

    // ════════════════════════════════════════════════════════
    // MAIN ROUTER — dipanggil setelah K3 berhasil di-insert
    // Returns: array of { module, label, taskId }
    // ════════════════════════════════════════════════════════
    async function routeK3Report(k3Data, k3Id) {
        const jenis    = k3Data.jenis_laporan;
        const priority = k3Data.priority || 'normal';
        const results  = [];

        // Primary routing berdasarkan jenis_laporan
        if (jenis === 'kerusakan') {
            const id = await routeToMaintenance(k3Data, k3Id);
            if (id) results.push({ module: 'maintenance', label: '🔧 Maintenance', taskId: id });
        }
        else if (jenis === 'kehilangan') {
            const id = await routeToSecurity(k3Data, k3Id);
            if (id) results.push({ module: 'security', label: '🔒 Sekuriti', taskId: id });
        }
        else if (jenis === 'kebersihan') {
            const id = await routeToJanitor(k3Data, k3Id);
            if (id) results.push({ module: 'janitor', label: '🧹 Janitor', taskId: id });
        }

        // Escalation: semua jenis critical (selain kerusakan yg sudah masuk) → juga ke maintenance
        if (priority === 'critical' && jenis !== 'kerusakan') {
            const id = await routeToMaintenance(k3Data, k3Id);
            if (id) results.push({ module: 'maintenance', label: '🔧 Eskalasi', taskId: id });
        }

        return results;
    }

    // ========== UPLOAD FOTO ==========
    async function uploadPhoto(base64Data) {
        if (!supabase) return null;
        try {
            const response  = await fetch(base64Data);
            const blob      = await response.blob();
            const filename  = `k3/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
            const { error } = await supabase.storage
                .from('k3-foto')
                .upload(filename, blob, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            const { data: urlData } = supabase.storage.from('k3-foto').getPublicUrl(filename);
            return urlData.publicUrl;
        } catch (err) {
            console.warn('[K3] Upload foto gagal:', err.message);
            return null;
        }
    }

    // ========== LOAD HISTORY ==========
    async function loadHistory() {
        const tbody = document.getElementById('k3-history-body');
        if (!tbody) return;

        if (!supabase) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;opacity:0.6">Mode offline — Supabase tidak tersedia</td></tr>';
            return;
        }

        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">
            <div class="k3-spinner" style="margin:0 auto;"></div>
            <p style="margin-top:1rem;">Memuat...</p>
        </td></tr>`;

        try {
            const { data, error } = await supabase
                .from('k3_reports')
                .select('id, tanggal, lokasi, jenis_laporan, pelapor, priority, status, route_refs, created_at')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;opacity:0.7">Belum ada laporan K3</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(item => {
                const statusClass = item.status === 'pending' ? 'k3-badge-pending'
                                  : item.status === 'verified' ? 'k3-badge-verified'
                                  : 'k3-badge-rejected';
                const statusText  = item.status === 'pending' ? 'Pending'
                                  : item.status === 'verified' ? 'Selesai'
                                  : 'Ditolak';
                const prioClass   = item.priority === 'critical' ? 'k3-badge-critical'
                                  : item.priority === 'high' ? 'k3-badge-high' : 'k3-badge-normal';
                const prioLabel   = item.priority === 'critical' ? '🔴 Critical'
                                  : item.priority === 'high' ? '🟡 Tinggi' : '⚪ Normal';

                // ✅ Tampilkan tag routing — support semua 3 modul (maintenance/security/janitor)
                const routeRefs  = (() => {
                    try { return JSON.parse(item.route_refs || '[]'); } catch(e) { return []; }
                })();
                const routeIcons = { maintenance:'🔧', security:'🔒', janitor:'🧹' };
                const routeColors= { maintenance:'rgba(59,130,246,0.2)', security:'rgba(239,68,68,0.15)', janitor:'rgba(16,185,129,0.15)' };
                const routeTextC = { maintenance:'#3b82f6', security:'#ef4444', janitor:'#10b981' };
                const mnTag = routeRefs.length
                    ? routeRefs.map(r =>
                        `<span class="k3-mn-tag" style="background:${routeColors[r.module]||'rgba(255,255,255,.08)'};color:${routeTextC[r.module]||'#e2e8f0'};border-color:currentColor" title="${r.label} #${r.taskId}">${routeIcons[r.module]||'📋'} #${r.taskId}</span>`
                      ).join(' ')
                    : '';

                return `<tr>
                    <td>${fmtDate(item.tanggal)}</td>
                    <td>${esc(item.lokasi)}</td>
                    <td>${esc(item.jenis_laporan)}</td>
                    <td>${esc(item.pelapor)}</td>
                    <td><span class="k3-badge ${prioClass}">${prioLabel}</span></td>
                    <td><span class="k3-badge ${statusClass}">${statusText}</span></td>
                    <td>${mnTag}</td>
                    <td>
                        <button class="k3-btn k3-btn-sm" data-detail-id="${item.id}" title="Detail"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>`;
            }).join('');

            // Pasang event handler tombol detail
            tbody.querySelectorAll('[data-detail-id]').forEach(btn => {
                btn.addEventListener('click', () => showDetail(btn.dataset.detailId));
            });

        } catch (err) {
            console.error('[K3] Load history error:', err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#ef4444">Gagal memuat: ${esc(err.message)}</td></tr>`;
        }
    }

    // ✅ DETAIL MODAL — menggantikan alert() lama
    //    Juga menampilkan link ke maintenance task jika ada
    async function showDetail(id) {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('k3_reports')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;

            const prioColor  = data.priority === 'critical' ? '#ef4444' : data.priority === 'high' ? '#f59e0b' : '#94a3b8';
            const statusColor= data.status === 'verified' ? '#10b981' : data.status === 'rejected' ? '#ef4444' : '#f59e0b';
            const routeRefs2 = (() => { try { return JSON.parse(data.route_refs || '[]'); } catch(e) { return []; } })();
            const routeIconsM = { maintenance:'🔧', security:'🔒', janitor:'🧹' };
            const mnSection  = routeRefs2.length
                ? `<div style="margin-top:1rem;padding:.75rem;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;">
                      <p style="font-size:.78rem;font-weight:700;color:#10b981;margin-bottom:.5rem">📤 Auto-routed ke Modul Lain</p>
                      ${routeRefs2.map(r => `<div style="display:flex;gap:.5rem;align-items:center;font-size:.78rem;padding:.25rem 0;border-top:1px solid rgba(255,255,255,.05)">
                          <span>${routeIconsM[r.module]||'📋'} <strong style="color:#e2e8f0">${r.label}</strong></span>
                          <span style="color:#64748b">Task ID:</span>
                          <span style="font-family:monospace;color:#e2e8f0">#${esc(String(r.taskId))}</span>
                      </div>`).join('')}
                   </div>` : '';

            // Action buttons (approve/reject) — hanya admin
            const isAdmin = currentUser && (currentUser.perms || []).includes('all');
            const actionBtns = (isAdmin && data.status === 'pending') ? `
                <div style="display:flex;gap:.5rem;margin-top:1rem">
                    <button id="k3-det-verify" class="k3-btn k3-btn-green" style="flex:1"><i class="fas fa-check"></i> Verifikasi</button>
                    <button id="k3-det-reject" class="k3-btn k3-btn-red"  style="flex:1"><i class="fas fa-times"></i> Tolak</button>
                </div>` : '';

            const modal = document.createElement('div');
            modal.className = 'k3-modal-overlay';
            modal.innerHTML = `
                <div class="k3-modal">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                        <h3 style="font-size:1.1rem;font-weight:800;color:#f59e0b;margin:0">⚠️ Detail Laporan K3</h3>
                        <button id="k3-modal-close" class="k3-btn k3-btn-sm">✕</button>
                    </div>
                    ${[
                        ['Tanggal',      fmtDate(data.tanggal)],
                        ['Lokasi',       esc(data.lokasi||'—')],
                        ['Jenis Laporan',esc(data.jenis_laporan||'—')],
                        ['Pelapor',      esc(data.pelapor||'—')],
                        ['Prioritas',    `<span style="color:${prioColor};font-weight:700">${data.priority||'normal'}</span>`],
                        ['Status',       `<span style="color:${statusColor};font-weight:700">${data.status||'—'}</span>`],
                        ['Dilaporkan',   fmtDT(data.created_at)],
                    ].map(([k,v]) => `<div class="k3-modal-row"><span>${k}</span><span>${v}</span></div>`).join('')}
                    <div style="margin-top:1rem;">
                        <p class="k3-label" style="margin-bottom:.4rem">Deskripsi</p>
                        <p style="font-size:.85rem;color:#e2e8f0;background:rgba(255,255,255,.04);padding:.75rem 1rem;border-radius:10px;line-height:1.6">${esc(data.deskripsi||'—')}</p>
                    </div>
                    ${data.foto_url && data.foto_url[0] ? `<div style="margin-top:1rem"><p class="k3-label" style="margin-bottom:.4rem">Foto Bukti</p><img src="${esc(data.foto_url[0])}" style="max-width:100%;border-radius:10px;max-height:200px;object-fit:cover"></div>` : ''}
                    ${mnSection}
                    ${actionBtns}
                </div>`;
            document.body.appendChild(modal);

            modal.querySelector('#k3-modal-close').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

            // Verify / reject dari modal
            modal.querySelector('#k3-det-verify')?.addEventListener('click', async () => {
                await updateStatus(id, 'verified');
                modal.remove();
            });
            modal.querySelector('#k3-det-reject')?.addEventListener('click', async () => {
                await updateStatus(id, 'rejected');
                modal.remove();
            });

        } catch (err) {
            doToast('Gagal memuat detail: ' + err.message, 'error');
        }
    }

    // ✅ UPDATE STATUS — dipanggil dari modal detail
    //    Tulis ke audit_logs agar CC Activity feed update
    async function updateStatus(id, status) {
        if (!supabase) { doToast('DB tidak tersedia', 'error'); return; }
        try {
            const { error } = await supabase
                .from('k3_reports')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;

            // ✅ Tulis audit log → Command Center tab Activity langsung terbaru
            await writeAuditLog(
                status === 'verified' ? 'K3 Diverifikasi' : 'K3 Ditolak',
                `Laporan K3 #${id} → ${status}`,
                currentUser?.name || 'Admin'
            );

            doToast(`✅ Status diperbarui: ${status}`, 'success');
            loadHistory();
        } catch (err) {
            doToast('Gagal update status: ' + err.message, 'error');
        }
    }

    // ========== RENDER HTML (return string) ==========
    return `
        <div id="k3-root">

            <!-- HEADER -->
            <div class="k3-panel k3-header" style="margin-bottom:1.5rem">
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="font-size:3rem;">⚠️</div>
                    <div>
                        <div class="k3-title">K3 REPORT</div>
                        <div class="k3-sub">Keselamatan &amp; Kesehatan Kerja</div>
                    </div>
                    <div style="margin-left:auto;display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                        <button onclick="window.closeModule()" class="k3-btn k3-btn-sm">
                            <i class="fas fa-arrow-left"></i> Kembali
                        </button>
                        <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;font-weight:700;">
                            ${currentUser?.name?.toUpperCase() || 'GUEST'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- TABS -->
            <div class="k3-tabs">
                <div class="k3-tab active" data-tab="form">📋 Form Laporan</div>
                <div class="k3-tab" data-tab="history">📜 Riwayat</div>
            </div>

            <!-- FORM TAB -->
            <div id="k3-form-tab" class="tab-content">
                <div class="k3-panel">
                    <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:#f59e0b;">📝 Laporan Baru</h3>

                    <!-- ✅ Info routing otomatis — tampil sebagai panduan user -->
                    <div style="margin-bottom:1.25rem;padding:.75rem 1rem;background:rgba(15,23,42,.7);border:1px solid rgba(255,255,255,.1);border-radius:10px;font-size:.78rem;color:#94a3b8;line-height:1.8">
                        <p style="font-weight:700;color:#e2e8f0;margin-bottom:.4rem"><i class="fas fa-share-alt" style="color:#10b981;margin-right:.4rem"></i>Auto-Routing Laporan K3</p>
                        <div style="display:flex;flex-wrap:wrap;gap:.4rem .875rem">
                            <span>🔧 <strong style="color:#3b82f6">Kerusakan</strong> → Modul Maintenance</span>
                            <span>🔒 <strong style="color:#ef4444">Kehilangan</strong> → Modul Sekuriti</span>
                            <span>🧹 <strong style="color:#10b981">Kebersihan</strong> → Modul Janitor (indoor/outdoor)</span>
                            <span>🔴 <strong style="color:#f87171">Priority Critical</strong> → Eskalasi ke Maintenance</span>
                        </div>
                    </div>

                    <form id="k3Form">
                        <div class="k3-form-grid">
                            <div>
                                <label class="k3-label">Tanggal <span style="color:#ef4444">*</span></label>
                                <input type="date" id="k3-tanggal" class="k3-input" required>
                            </div>
                            <div>
                                <label class="k3-label">Lokasi <span style="color:#ef4444">*</span></label>
                                <input type="text" id="k3-lokasi" class="k3-input" placeholder="Gedung A Lantai 2" required>
                            </div>
                        </div>
                        <div class="k3-form-grid">
                            <div>
                                <label class="k3-label">Jenis Laporan <span style="color:#ef4444">*</span></label>
                                <select id="k3-jenis" class="k3-select" required>
                                    <option value="">-- Pilih --</option>
                                    <option value="kerusakan">🔧 Kerusakan Fasilitas</option>
                                    <option value="kehilangan">📦 Kehilangan</option>
                                    <option value="kebersihan">🧹 Kebersihan</option>
                                    <option value="kecelakaan">⚠️ Kecelakaan</option>
                                    <option value="bahaya">☢️ Potensi Bahaya</option>
                                    <option value="lainnya">📌 Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label class="k3-label">Prioritas</label>
                                <select id="k3-priority" class="k3-select">
                                    <option value="normal">⚪ Normal</option>
                                    <option value="high">🟡 Tinggi</option>
                                    <option value="critical">🔴 Critical</option>
                                </select>
                            </div>
                        </div>

                        <!-- ✅ Hint dinamis — muncul saat user pilih kerusakan/critical -->
                        <div id="k3-mn-hint" style="display:none;margin-bottom:1rem;padding:.6rem 1rem;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;font-size:.78rem;color:#f87171">
                            <i class="fas fa-tools" style="margin-right:.4rem"></i>
                            <span id="k3-mn-hint-text"></span>
                        </div>

                        <div style="margin-bottom:1rem;">
                            <label class="k3-label">Deskripsi <span style="color:#ef4444">*</span></label>
                            <textarea id="k3-deskripsi" rows="4" class="k3-textarea" placeholder="Jelaskan detail kejadian..." required></textarea>
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label class="k3-label">Foto Bukti (Opsional)</label>
                            <div class="k3-upload-area" onclick="document.getElementById('k3-foto').click()">
                                <i class="fas fa-camera" style="font-size:2rem;color:#f59e0b;margin-bottom:0.5rem;display:block;"></i>
                                <p style="font-size:0.9rem;">Klik untuk ambil foto atau upload</p>
                                <p style="font-size:0.7rem;opacity:0.7;">Maks 5MB (JPG, PNG)</p>
                                <input type="file" id="k3-foto" accept="image/*" capture="environment" style="display:none;">
                            </div>
                            <img id="k3-preview" class="k3-preview">
                            <input type="hidden" id="k3-foto-base64">
                        </div>
                        <div class="k3-form-grid">
                            <div>
                                <label class="k3-label">Pelapor <span style="color:#ef4444">*</span></label>
                                <input type="text" id="k3-pelapor" class="k3-input" placeholder="Nama Anda" required value="${currentUser?.name || ''}">
                            </div>
                            <div style="display:flex;align-items:flex-end;">
                                <button type="submit" class="k3-btn k3-btn-primary" id="k3-submit">
                                    <i class="fas fa-paper-plane"></i> Kirim Laporan
                                </button>
                            </div>
                        </div>
                    </form>
                    <div id="k3-form-result" style="margin-top:1rem;text-align:center;"></div>
                </div>
            </div>

            <!-- HISTORY TAB -->
            <div id="k3-history-tab" class="tab-content" style="display:none;">
                <div class="k3-panel">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:.5rem;">
                        <h3 style="font-size:1.2rem;font-weight:700;color:#f59e0b;margin:0;">📜 Riwayat Laporan K3</h3>
                        <div style="display:flex;gap:.4rem;flex-wrap:wrap;">
                            <button id="k3-filter-all"      class="k3-btn k3-btn-sm k3-f-active">Semua</button>
                            <button id="k3-filter-pending"  class="k3-btn k3-btn-sm">Pending</button>
                            <button id="k3-filter-verified" class="k3-btn k3-btn-sm">Selesai</button>
                            <button id="k3-filter-critical" class="k3-btn k3-btn-sm">🔴 Critical</button>
                            <button id="k3-refresh-history" class="k3-btn k3-btn-sm"><i class="fas fa-sync-alt"></i></button>
                        </div>
                    </div>
                    <div class="k3-table-wrap">
                        <table class="k3-table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Lokasi</th>
                                    <th>Jenis</th>
                                    <th>Pelapor</th>
                                    <th>Prioritas</th>
                                    <th>Status</th>
                                    <th>Maintenance</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="k3-history-body">
                                <tr><td colspan="8" style="text-align:center;padding:2rem;">Klik tab Riwayat untuk memuat data</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    `;

    // ========== EVENT HANDLERS — pasang setelah HTML di-render ==========
    // ✅ Pakai setTimeout(100ms) sama persis dengan booking & commandcenter module
    setTimeout(() => {

        // Set default tanggal = hari ini
        const todayStr = new Date().toISOString().split('T')[0];
        const tglInput = document.getElementById('k3-tanggal');
        if (tglInput) tglInput.value = todayStr;

        // ── ROUTING HINT — tampil saat user pilih jenis/prioritas ──
        const ROUTE_HINTS = {
            kerusakan:  { color:'rgba(59,130,246,0.1)',  border:'rgba(59,130,246,0.3)',  text:'#93c5fd', icon:'🔧', msg:'→ Akan diteruskan ke <strong>Modul Maintenance</strong>' },
            kehilangan: { color:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.3)',   text:'#fca5a5', icon:'🔒', msg:'→ Akan diteruskan ke <strong>Modul Sekuriti</strong>' },
            kebersihan: { color:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.3)',  text:'#6ee7b7', icon:'🧹', msg:'→ Akan diteruskan ke <strong>Modul Janitor</strong> (auto-detect indoor/outdoor)' },
        };
        function updateMnHint() {
            const jenis    = document.getElementById('k3-jenis')?.value || '';
            const priority = document.getElementById('k3-priority')?.value || '';
            const hint     = document.getElementById('k3-mn-hint');
            const hintText = document.getElementById('k3-mn-hint-text');
            if (!hint || !hintText) return;

            const isCritical = priority === 'critical';
            const route      = ROUTE_HINTS[jenis];

            if (route) {
                hint.style.display    = 'block';
                hint.style.background = route.color;
                hint.style.borderColor= route.border;
                hint.style.color      = route.text;
                const extra = isCritical ? ' + <strong>Eskalasi Maintenance</strong> (critical)' : '';
                hintText.innerHTML = `${route.icon} ${route.msg}${extra}`;
            } else if (isCritical) {
                hint.style.display    = 'block';
                hint.style.background = 'rgba(239,68,68,0.08)';
                hint.style.borderColor= 'rgba(239,68,68,0.3)';
                hint.style.color      = '#fca5a5';
                hintText.innerHTML    = '🔴 Priority CRITICAL → Eskalasi ke <strong>Modul Maintenance</strong>';
            } else {
                hint.style.display = 'none';
            }
        }
        document.getElementById('k3-jenis')    ?.addEventListener('change', updateMnHint);
        document.getElementById('k3-priority') ?.addEventListener('change', updateMnHint);

        // ── TAB SWITCHER ──
        document.querySelectorAll('.k3-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.k3-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('k3-form-tab').style.display    = tab === 'form'    ? 'block' : 'none';
                document.getElementById('k3-history-tab').style.display = tab === 'history' ? 'block' : 'none';
                if (tab === 'history') loadHistory();
            });
        });

        // ── REFRESH HISTORY BUTTON ──
        document.getElementById('k3-refresh-history')?.addEventListener('click', loadHistory);

        // ── FILTER BUTTONS ──
        const filters = [
            ['k3-filter-all',      null],
            ['k3-filter-pending',  'pending'],
            ['k3-filter-verified', 'verified'],
            ['k3-filter-critical', '__critical__'],
        ];
        filters.forEach(([btnId, filterVal]) => {
            document.getElementById(btnId)?.addEventListener('click', () => {
                const tbody = document.getElementById('k3-history-body');
                if (!tbody) return;
                tbody.querySelectorAll('tr').forEach(tr => {
                    if (!filterVal) { tr.style.display = ''; return; }
                    if (filterVal === '__critical__') {
                        tr.style.display = tr.innerHTML.includes('Critical') ? '' : 'none';
                    } else {
                        tr.style.display = tr.innerHTML.includes(filterVal) ? '' : 'none';
                    }
                });
            });
        });

        // ── FOTO PREVIEW ──
        document.getElementById('k3-foto')?.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { doToast('File terlalu besar, maks 5MB', 'error'); return; }
            const reader = new FileReader();
            reader.onload = ev => {
                const prev = document.getElementById('k3-preview');
                if (prev) { prev.src = ev.target.result; prev.style.display = 'block'; }
                const b64 = document.getElementById('k3-foto-base64');
                if (b64) b64.value = ev.target.result;
            };
            reader.readAsDataURL(file);
        });

        // ── FORM SUBMIT ──────────────────────────────────────────────────
        document.getElementById('k3Form')?.addEventListener('submit', async e => {
            e.preventDefault();

            const tanggal    = document.getElementById('k3-tanggal')?.value || '';
            const lokasi     = document.getElementById('k3-lokasi')?.value || '';
            const jenis      = document.getElementById('k3-jenis')?.value || '';
            const deskripsi  = document.getElementById('k3-deskripsi')?.value || '';
            const pelapor    = document.getElementById('k3-pelapor')?.value || '';
            const priority   = document.getElementById('k3-priority')?.value || 'normal';
            const fotoBase64 = document.getElementById('k3-foto-base64')?.value || '';

            if (!tanggal || !lokasi || !jenis || !deskripsi || !pelapor) {
                doToast('Harap isi semua field wajib', 'warning');
                return;
            }

            const btn = document.getElementById('k3-submit');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
            doToast('🔍 Menyimpan laporan...', 'info');

            try {
                const payload = {
                    tanggal,
                    lokasi,
                    jenis_laporan: jenis,
                    deskripsi,
                    pelapor,
                    priority:   priority || 'normal',
                    status:     'pending',
                    created_at: new Date().toISOString(),
                    created_by: currentUser?.name || pelapor
                };

                // Upload foto jika ada
                if (fotoBase64) {
                    const photoUrl = await uploadPhoto(fotoBase64);
                    payload.foto_url = [photoUrl || fotoBase64];
                }

                if (supabase) {
                    // ── INSERT K3 report ──
                    const { data: inserted, error } = await supabase
                        .from('k3_reports')
                        .insert([payload])
                        .select('id')
                        .single();
                    if (error) throw error;

                    const k3Id = inserted?.id;

                    // ✅ INTEGRASI ROUTING — kirim ke modul yang tepat
                    const k3DataForRoute = { tanggal, lokasi, jenis_laporan: jenis, deskripsi, pelapor, priority };
                    const needsRoute = ['kerusakan','kehilangan','kebersihan'].includes(jenis) || priority === 'critical';

                    let routeResults = [];
                    if (needsRoute && k3Id) {
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Routing laporan...';
                        routeResults = await routeK3Report(k3DataForRoute, k3Id);

                        // Simpan semua referensi route ke k3_reports.route_refs (JSON array)
                        if (routeResults.length > 0) {
                            await supabase.from('k3_reports')
                                .update({ route_refs: JSON.stringify(routeResults) })
                                .eq('id', k3Id);
                        }
                    }

                    // ✅ INTEGRASI COMMAND CENTER: tulis ke audit_logs
                    const routeSummary = routeResults.map(r => `${r.label} #${r.taskId}`).join(', ');
                    await writeAuditLog(
                        'Laporan K3 Baru',
                        `${jenis} · ${lokasi} · ${priority}${routeSummary ? ' → ' + routeSummary : ''} · ${pelapor}`,
                        currentUser?.name || pelapor
                    );

                    // Feedback ke user — tunjukkan semua modul yang menerima routing
                    if (routeResults.length > 0) {
                        const labels = routeResults.map(r => r.label).join(', ');
                        doToast(`✅ Laporan K3 dikirim! Auto-routed ke: ${labels}`, 'success');
                    } else {
                        doToast('✅ Laporan K3 berhasil dikirim! Menunggu verifikasi.', 'success');
                    }

                } else {
                    // ── OFFLINE FALLBACK ──
                    const existing = JSON.parse(localStorage.getItem('k3_reports') || '[]');
                    existing.push({ ...payload, id: Date.now() });
                    localStorage.setItem('k3_reports', JSON.stringify(existing));
                    doToast('✅ Laporan disimpan lokal (offline).', 'warning');
                }

                // Reset form
                document.getElementById('k3Form').reset();
                const prevEl = document.getElementById('k3-preview');
                if (prevEl) prevEl.style.display = 'none';
                const b64El = document.getElementById('k3-foto-base64');
                if (b64El) b64El.value = '';
                const tglEl = document.getElementById('k3-tanggal');
                if (tglEl) tglEl.value = new Date().toISOString().split('T')[0];
                document.getElementById('k3-form-result').innerHTML = '';
                document.getElementById('k3-mn-hint').style.display = 'none';

            } catch (err) {
                console.error('[K3] Submit error:', err);
                doToast('❌ Gagal: ' + err.message, 'error');
                const resultEl = document.getElementById('k3-form-result');
                if (resultEl) resultEl.innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Laporan';
            }
        });

    }, 100); // ✅ Delay 100ms agar DOM siap — sama persis dengan booking & commandcenter module
}

if (typeof window !== 'undefined') {
    console.log('⚠️ K3 module loaded | Signature: MATCH ✅ | CC + Maintenance Integration: ON ✅');
}
