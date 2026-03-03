// core/devPanel.js - Debug Panel for Ghost Architect / Developer Roles Only
// Shows detailed errors, logs, and system diagnostics

export const DevPanel = {
    enabled: false,
    container: null,
    
    // Initialize panel (call after auth)
    init() {
        if (!TestSuite.isDevRole()) return;
        
        this.enabled = true;
        this.createPanel();
        this.bindShortcuts();
        
        console.log('👨‍💻 Dev Panel activated for', sessionStorage.getItem('dream_role'));
    },
    
    // Create floating debug panel
    createPanel() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'dev-panel';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 320px;
            max-height: 400px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid #ef4444;
            border-radius: 16px;
            padding: 1rem;
            z-index: 99999;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #e2e8f0;
            display: none;
            flex-direction: column;
            box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);
        `;
        
        this.container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                <strong style="color:#ef4444;">🔧 Dev Panel</strong>
                <div style="display:flex;gap:0.5rem;">
                    <button id="dev-toggle" style="background:none;border:none;color:#94a3b8;cursor:pointer;">📋</button>
                    <button id="dev-close" style="background:none;border:none;color:#ef4444;cursor:pointer;">✕</button>                </div>
            </div>
            <div id="dev-content" style="flex:1;overflow-y:auto;max-height:300px;">
                <div style="color:#94a3b8;">Ready for diagnostics...</div>
            </div>
            <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
                <button id="dev-run-tests" style="flex:1;padding:0.25rem 0.5rem;background:#10b981;border:none;border-radius:4px;color:white;cursor:pointer;font-size:10px;">🧪 Run Tests</button>
                <button id="dev-clear" style="padding:0.25rem 0.5rem;background:#64748b;border:none;border-radius:4px;color:white;cursor:pointer;font-size:10px;">🗑️ Clear</button>
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.bindEvents();
    },
    
    bindEvents() {
        const content = this.container.querySelector('#dev-content');
        const toggle = this.container.querySelector('#dev-toggle');
        const close = this.container.querySelector('#dev-close');
        const runTests = this.container.querySelector('#dev-run-tests');
        const clear = this.container.querySelector('#dev-clear');
        
        let expanded = false;
        
        toggle.onclick = () => {
            expanded = !expanded;
            this.container.style.width = expanded ? '600px' : '320px';
            this.container.style.maxHeight = expanded ? '600px' : '400px';
            toggle.textContent = expanded ? '📐' : '📋';
        };
        
        close.onclick = () => {
            this.container.style.display = 'none';
        };
        
        runTests.onclick = async () => {
            this.log('🧪 Starting critical tests...');
            const results = await CriticalTests.runAll();
            this.log(`✅ ${results.passed}/${results.total} tests passed`);
            if (results.passed < results.total) {
                this.showError('Some tests failed - check console for details');
            }
        };
        
        clear.onclick = () => {
            content.innerHTML = '<div style="color:#94a3b8;">Cleared.</div>';
        };
    },
    
    bindShortcuts() {        // Ctrl+Shift+D to toggle panel
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.container.style.display = 
                    this.container.style.display === 'none' ? 'flex' : 'none';
            }
        });
    },
    
    // Log message to panel
    log(message, type = 'info') {
        if (!this.enabled || !this.container) return;
        
        const content = this.container.querySelector('#dev-content');
        const colors = {
            info: '#94a3b8',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        
        const entry = document.createElement('div');
        entry.style.cssText = `
            padding: 0.25rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            color: ${colors[type]};
        `;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        content.insertBefore(entry, content.firstChild);
        
        // Also console log
        console[type === 'error' ? 'error' : 'log'](`[DevPanel] ${message}`);
    },
    
    // Show detailed error for debugging
    showError(context, error) {
        if (!this.enabled) return;
        
        const err = error instanceof Error ? error : new Error(String(error));
        
        this.log(`❌ ${context}: ${err.message}`, 'error');
        
        // Show stack trace in expanded mode
        if (err.stack) {
            const stack = err.stack.split('\n').slice(1, 5).join('\n');
            this.log(`📍 ${stack}`, 'warning');
        }
                // Show user-facing toast (different from dev panel)
        if (typeof showToast === 'function') {
            showToast('⚠️ System error logged for review', 'warning');
        }
    },
    
    // Log API call for debugging
    logApiCall(endpoint, method, payload, response) {
        if (!this.enabled) return;
        
        this.log(`🔌 ${method} ${endpoint}`, 'info');
        if (payload) this.log(`📤 ${JSON.stringify(payload).slice(0, 100)}...`, 'info');
        if (response) this.log(`📥 OK`, 'success');
    },
    
    // Show system diagnostics
    showDiagnostics() {
        if (!this.enabled) return;
        
        const diag = {
            role: sessionStorage.getItem('dream_role'),
            userAgent: navigator.userAgent.slice(0, 50) + '...',
            memory: navigator.deviceMemory || 'N/A',
            cores: navigator.hardwareConcurrency || 'N/A',
            online: navigator.onLine,
            localStorage: localStorage.length + ' items',
            sessionStorage: sessionStorage.length + ' items'
        };
        
        this.log('🔍 System Diagnostics:', 'info');
        Object.entries(diag).forEach(([k, v]) => {
            this.log(`  ${k}: ${v}`, 'info');
        });
    }
};

// Auto-init if dev role
if (typeof window !== 'undefined') {
    // Wait for auth to be ready
    setTimeout(() => DevPanel.init(), 1000);
    window.DevPanel = DevPanel;
}
