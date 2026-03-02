/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  DREAM OS - COMMAND HUB v2.0                             ║
 * ║  "The Central Nervous System"                            ║
 * ║                                                          ║
 * ║  FILOSOFI:                                               ║
 * ║  • Seperti air: mengalir ke semua modul                 ║
 * ║  • Seperti napas: IN (input) ↔ OUT (output)             ║
 * ║  • Seperti tubuh: otak yang koordinasi semua organ      ║
 * ║                                                          ║
 * ║  🤲 Bi idznillah - Dengan izin Allah                     ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import { supabase } from './supabase.js';
import { eventBus } from './eventBus.js';
import { errorCollector } from './error-collector.js';
import { store } from './store.js';
import { showToast, showLoading, hideLoading } from './components.js';

// Import AI functions dari core
import { predictStock, getPurchaseRecommendations, chatbotResponse } from './ai.js';

class CommandHub {
    constructor() {
        this.modules = new Map();
        this.activeModule = null;
        this.aiWorkerUrl = '/dream-os-v2.-0/workers/ai-proxy'; // Cloudflare Worker
        this.systemHealth = {
            db: 'checking',
            ai: 'checking',
            modules: 0,
            lastSync: null
        };
        
        this.init();
    }

    /**
     *  INITIALIZATION - Seperti denyut jantung pertama
     */
    init() {
        console.log('🧠 [CommandHub] Initializing Dream OS Core...');
        
        // 1. Setup global error handler
        this.setupGlobalErrorHandler();
        
        // 2. Register event listeners
        this.setupEventListeners();
                // 3. Check system health
        this.checkSystemHealth();
        
        // 4. Auto-sync setiap 30 detik
        setInterval(() => this.syncSystemState(), 30000);
        
        // 5. Broadcast heartbeat setiap 10 detik
        setInterval(() => this.broadcastHeartbeat(), 10000);
        
        console.log('✅ [CommandHub] Core initialized successfully');
        console.log('🕌 اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ');
    }

    /**
     * 🛡️ GLOBAL ERROR HANDLER - Tangkap semua error
     */
    setupGlobalErrorHandler() {
        // Browser errors
        window.onerror = (message, source, lineno, colno, error) => {
            errorCollector.capture(error || message, 'global', {
                source, line: lineno, column: colno,
                url: window.location.href
            });
            return true; // Prevent default error
        };

        // Unhandled promise rejections
        window.onunhandledrejection = (event) => {
            errorCollector.capture(event.reason, 'unhandled_promise', {
                type: event.reason?.constructor?.name
            });
        };

        // Network errors
        window.addEventListener('offline', () => {
            eventBus.emit('system:offline', { timestamp: new Date().toISOString() });
            showToast('📴 Offline mode activated', 'warning');
        });

        window.addEventListener('online', () => {
            eventBus.emit('system:online', { timestamp: new Date().toISOString() });
            showToast('📶 Back online!', 'success');
            this.syncSystemState(); // Auto-sync saat online kembali
        });
    }

    /**
     * 📡 EVENT LISTENERS - Saraf komunikasi
     */
    setupEventListeners() {        // Listen AI requests dari modul
        eventBus.on('ai:request', async ({ type, payload, callback }) => {
            try {
                const result = await this.processAIRequest(type, payload);
                if (callback) callback(result);
                eventBus.emit('ai:response', { type, result });
            } catch (err) {
                errorCollector.capture(err, 'ai:request', { type, payload });
                if (callback) callback(null, err);
            }
        });

        // Listen module load requests
        eventBus.on('module:load', async ({ moduleId, callback }) => {
            try {
                await this.loadModule(moduleId);
                if (callback) callback(true);
            } catch (err) {
                if (callback) callback(false, err);
            }
        });

        // Listen notification requests
        eventBus.on('notification:show', ({ title, message, type = 'info' }) => {
            showToast(message, type);
        });

        // Listen system commands
        eventBus.on('system:command', async ({ command, params, callback }) => {
            try {
                const result = await this.execute(command, params);
                if (callback) callback(result);
            } catch (err) {
                errorCollector.capture(err, 'system:command', { command, params });
                if (callback) callback(null, err);
            }
        });
    }

    /**
     * 🧠 AI PROCESSING - Otak cerdas
     */
    async processAIRequest(type, payload) {
        switch(type) {
            case 'predict_stock':
                return predictStock(payload.history);
            
            case 'recommend_purchase':
                return getPurchaseRecommendations(
                    payload.currentStock,                    payload.minStock,
                    payload.avgUsage
                );
            
            case 'chat':
                // Gunakan Cloudflare Worker untuk AI chat
                return await this.queryAIWorker(payload.message, payload.model);
            
            case 'analyze_error':
                return await this.analyzeError(payload.errorLogs);
            
            case 'predict_trend':
                return await this.predictTrend(payload.data, payload.type);
            
            default:
                throw new Error(`Unknown AI request type: ${type}`);
        }
    }

    /**
     * 🤖 CLOUDFLARE WORKER AI QUERY
     */
    async queryAIWorker(message, model = 'cerebras') {
        try {
            const response = await fetch(this.aiWorkerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, model })
            });

            if (!response.ok) {
                throw new Error(`AI Worker error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'Maaf, saya tidak mengerti.';
            
        } catch (err) {
            // Fallback ke rule-based chatbot jika worker error
            console.warn('[CommandHub] AI Worker failed, using fallback:', err);
            return chatbotResponse(message);
        }
    }

    /**
     * 📊 SYSTEM HEALTH CHECK
     */
    async checkSystemHealth() {
        try {
            // Check database connection            const { data, error } = await supabase
                .from('audit_logs')
                .select('id')
                .limit(1);
            
            this.systemHealth.db = error ? 'error' : 'connected';
            
            // Check AI worker
            try {
                await fetch(this.aiWorkerUrl, { 
                    method: 'OPTIONS',
                    mode: 'no-cors'
                });
                this.systemHealth.ai = 'ready';
            } catch {
                this.systemHealth.ai = 'offline';
            }
            
            // Count active modules
            this.systemHealth.modules = this.modules.size;
            this.systemHealth.lastSync = new Date().toISOString();
            
            // Broadcast health status
            eventBus.emit('system:health', { ...this.systemHealth });
            
        } catch (err) {
            errorCollector.capture(err, 'health_check');
            this.systemHealth.db = 'error';
        }
    }

    /**
     * 🔄 SYNC SYSTEM STATE - Seperti napas
     */
    async syncSystemState() {
        console.log('🔄 [CommandHub] Syncing system state...');
        
        try {
            // Sync pending items count
            const [bookings, k3, dana] = await Promise.all([
                supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('k3_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('pengajuan_dana').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ]);

            const totals = {
                bookings: bookings.count || 0,
                k3: k3.count || 0,
                dana: dana.count || 0,
                total: (bookings.count || 0) + (k3.count || 0) + (dana.count || 0)            };

            // Update store
            store.set('pending_totals', totals);
            
            // Broadcast to all modules
            eventBus.emit('system:sync', { 
                timestamp: new Date().toISOString(),
                totals 
            });
            
            console.log('✅ [CommandHub] Sync complete:', totals);
            
        } catch (err) {
            errorCollector.capture(err, 'sync_state');
        }
    }

    /**
     * 💓 BROADCAST HEARTBEAT - Detak jantung sistem
     */
    broadcastHeartbeat() {
        eventBus.emit('system:heartbeat', {
            timestamp: new Date().toISOString(),
            activeModule: this.activeModule,
            health: this.systemHealth,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        });
    }

    /**
     * 🎮 EXECUTE COMMAND - Interface utama
     */
    async execute(command, params = {}) {
        console.log(`🎮 [CommandHub] Executing: ${command}`, params);
        
        try {
            switch(command) {
                case 'load_module':
                    return await this.loadModule(params.moduleId);
                
                case 'close_module':
                    return this.closeModule();
                
                case 'ai_query':
                    return await this.processAIRequest(params.type, params.payload);
                                case 'get_errors':
                    return await errorCollector.getErrors(params.limit || 50);
                
                case 'flush_errors':
                    await errorCollector.flush();
                    return { success: true };
                
                case 'get_insights':
                    return await this.getSystemInsights(params.timeframe || '24h');
                
                case 'backup_data':
                    return await this.createBackup(params.tables);
                
                case 'export_csv':
                    return await this.exportToCSV(params.table, params.filters);
                
                case 'run_diagnostic':
                    return await this.runSystemDiagnostic();
                
                default:
                    throw new Error(`Unknown command: ${command}`);
            }
        } catch (err) {
            errorCollector.capture(err, 'command:execute', { command, params });
            throw err;
        }
    }

    /**
     * 📦 MODULE LOADER - Dynamic import
     */
    async loadModule(moduleId) {
        console.log(`📦 [CommandHub] Loading module: ${moduleId}`);
        
        // Check access permission
        const userModules = store.get('modules') || [];
        if (!userModules.includes(moduleId) && !userModules.includes('all')) {
            showToast('❌ Akses ditolak untuk modul ini', 'error');
            throw new Error('Access denied');
        }

        // Close current module if exists
        if (this.activeModule) {
            await this.closeModule();
        }

        showLoading(`Memuat ${moduleId}...`);

        try {
            // Dynamic import module            const modulePath = `/dream-os-v2.-0/modules/${moduleId}/module.js`;
            const mod = await import(modulePath);
            
            // Initialize module
            if (mod.init && typeof mod.init === 'function') {
                await mod.init();
            } else if (mod.default && typeof mod.default === 'function') {
                await mod.default();
            } else {
                throw new Error('Module tidak memiliki fungsi init');
            }

            // Register module
            this.modules.set(moduleId, {
                loaded: true,
                timestamp: new Date().toISOString(),
                instance: mod
            });

            this.activeModule = moduleId;
            
            // Log audit
            await supabase.from('audit_logs').insert({
                action: 'module_load',
                detail: `Loaded module: ${moduleId}`,
                module: moduleId
            });

            console.log(`✅ [CommandHub] Module loaded: ${moduleId}`);
            
        } catch (err) {
            console.error(`❌ [CommandHub] Module load failed: ${moduleId}`, err);
            
            // Try HTML fallback
            try {
                const htmlPath = `/dream-os-v2.-0/modules/${moduleId}/index.html`;
                const response = await fetch(htmlPath);
                if (response.ok) {
                    const html = await response.text();
                    document.getElementById('module-content').innerHTML = html;
                    this.activeModule = moduleId;
                    console.log(`✅ [CommandHub] Module loaded (HTML fallback): ${moduleId}`);
                } else {
                    throw err;
                }
            } catch (fallbackErr) {
                errorCollector.capture(fallbackErr, 'module_load', { moduleId });
                showToast(`❌ Gagal memuat modul: ${moduleId}`, 'error');
                throw fallbackErr;
            }        } finally {
            hideLoading();
        }
    }

    /**
     * 🚪 CLOSE MODULE - Cleanup
     */
    async closeModule() {
        console.log('🚪 [CommandHub] Closing module:', this.activeModule);
        
        // Call module cleanup if exists
        if (window.__module_cleanup && typeof window.__module_cleanup === 'function') {
            await window.__module_cleanup();
        }

        // Clear module content
        const content = document.getElementById('module-content');
        if (content) content.innerHTML = '';

        // Unregister module
        if (this.activeModule) {
            this.modules.delete(this.activeModule);
            this.activeModule = null;
        }

        // Clear cleanup function
        window.__module_cleanup = null;

        console.log('✅ [CommandHub] Module closed');
    }

    /**
     * 📈 SYSTEM INSIGHTS - Analytics
     */
    async getSystemInsights(timeframe = '24h') {
        try {
            const [errors, stockData, bookings, maintenance] = await Promise.all([
                errorCollector.getErrors(100),
                supabase.from('inventory').select('jumlah, minimal_stok, nama_barang'),
                supabase.from('bookings').select('status, created_at').eq('status', 'pending'),
                supabase.from('maintenance_tasks').select('status').in('status', ['pending', 'proses'])
            ]);

            const lowStockItems = stockData?.filter(i => i.jumlah < i.minimal_stok) || [];
            
            // Generate AI recommendations
            const recommendations = lowStockItems.map(item => ({
                type: 'restock',
                item: item.nama_barang,                current: item.jumlah,
                recommended: item.minimal_stok * 2,
                priority: item.jumlah === 0 ? 'critical' : 'warning'
            }));

            return {
                health: {
                    errorCount: errors?.length || 0,
                    pendingBookings: bookings?.length || 0,
                    lowStockItems: lowStockItems.length,
                    maintenanceTasks: maintenance?.length || 0
                },
                recommendations,
                timestamp: new Date().toISOString()
            };

        } catch (err) {
            errorCollector.capture(err, 'get_insights');
            throw err;
        }
    }

    /**
     * 💾 CREATE BACKUP - Data preservation
     */
    async createBackup(tables = ['bookings', 'k3_reports', 'pengajuan_dana', 'inventory', 'audit_logs']) {
        showLoading('Membuat backup...');
        
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '2.0',
                database: supabase.supabaseUrl
            };

            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*');
                if (error) {
                    console.warn(`Backup warning - ${table}:`, error);
                }
                backup[table] = data || [];
            }

            // Download as JSON
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dream-os-backup-${Date.now()}.json`;
            a.click();            URL.revokeObjectURL(url);

            // Log audit
            await supabase.from('audit_logs').insert({
                action: 'backup_created',
                detail: `Backup created with ${tables.length} tables`,
                metadata: { tables, timestamp: backup.timestamp }
            });

            showToast('✅ Backup berhasil!', 'success');
            return backup;

        } catch (err) {
            errorCollector.capture(err, 'create_backup');
            showToast('❌ Backup gagal', 'error');
            throw err;
        } finally {
            hideLoading();
        }
    }

    /**
     * 📄 EXPORT TO CSV
     */
    async exportToCSV(table, filters = {}) {
        showLoading('Exporting to CSV...');
        
        try {
            let query = supabase.from(table).select('*');
            
            // Apply filters
            for (const [key, value] of Object.entries(filters)) {
                query = query.eq(key, value);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Convert to CSV
            const headers = Object.keys(data[0] || {});
            const csv = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;            a.download = `${table}-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            showToast(`✅ Exported ${data.length} rows`, 'success');
            return data;

        } catch (err) {
            errorCollector.capture(err, 'export_csv', { table });
            showToast('❌ Export failed', 'error');
            throw err;
        } finally {
            hideLoading();
        }
    }

    /**
     * 🔧 SYSTEM DIAGNOSTIC
     */
    async runSystemDiagnostic() {
        console.log('🔧 [CommandHub] Running system diagnostic...');
        
        const results = {
            timestamp: new Date().toISOString(),
            checks: {}
        };

        // 1. Database connection
        try {
            const { error } = await supabase.from('audit_logs').select('id').limit(1);
            results.checks.database = error ? 'FAIL' : 'PASS';
        } catch {
            results.checks.database = 'FAIL';
        }

        // 2. AI Worker
        try {
            await fetch(this.aiWorkerUrl, { method: 'OPTIONS', mode: 'no-cors' });
            results.checks.aiWorker = 'PASS';
        } catch {
            results.checks.aiWorker = 'FAIL';
        }

        // 3. LocalStorage
        try {
            localStorage.setItem('_test', '1');
            localStorage.removeItem('_test');
            results.checks.localStorage = 'PASS';
        } catch {
            results.checks.localStorage = 'FAIL';        }

        // 4. Memory usage
        if (performance.memory) {
            const mem = performance.memory;
            results.memory = {
                used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
                total: Math.round(mem.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
            };
        }

        // 5. Modules status
        results.modules = {
            loaded: Array.from(this.modules.keys()),
            active: this.activeModule,
            count: this.modules.size
        };

        console.log('🔧 [CommandHub] Diagnostic complete:', results);
        return results;
    }

    /**
     * 🧠 ANALYZE ERROR PATTERNS
     */
    async analyzeError(errorLogs) {
        if (!errorLogs || errorLogs.length === 0) {
            return { summary: 'No errors to analyze' };
        }

        const patterns = {};
        const contexts = {};

        errorLogs.forEach(log => {
            // Count by context
            contexts[log.context] = (contexts[log.context] || 0) + 1;
            
            // Count by error type
            const type = log.message.split(':')[0] || 'Unknown';
            patterns[type] = (patterns[type] || 0) + 1;
        });

        return {
            total: errorLogs.length,
            topPatterns: Object.entries(patterns)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
            topContexts: Object.entries(contexts)
                .sort((a, b) => b[1] - a[1])                .slice(0, 5),
            recommendation: this.generateErrorRecommendation(patterns, contexts)
        };
    }

    /**
     * 💡 Generate recommendations based on error patterns
     */
    generateErrorRecommendation(patterns, contexts) {
        const recommendations = [];

        if (patterns['NetworkError'] > 5) {
            recommendations.push('⚠️ Periksa koneksi internet atau API endpoint');
        }

        if (contexts['module_load'] > 10) {
            recommendations.push('📦 Beberapa modul gagal load - periksa path import');
        }

        if (contexts['ai:request'] > 5) {
            recommendations.push('🤖 AI Worker sering error - periksa API key');
        }

        return recommendations.length > 0 
            ? recommendations 
            : ['✅ Sistem berjalan normal'];
    }

    /**
     * 📊 GET STATUS - Public getter
     */
    getStatus() {
        return {
            activeModule: this.activeModule,
            modulesLoaded: Array.from(this.modules.keys()),
            health: this.systemHealth,
            timestamp: new Date().toISOString()
        };
    }
}

// 🚀 Export singleton instance
export const commandHub = new CommandHub();

// 🌍 Global access for modules & debugging
window.commandHub = commandHub;

console.log('🧠 [CommandHub] Singleton exported to window.commandHub');
console.log('💚 Dream OS Core Ready - Bi idznillah');
