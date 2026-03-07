/**
 * modules/sekuriti/core/observability.js
 * Dream OS v2.0 — Enterprise Observability
 * ✅ Structured Logging • Performance Metrics • Distributed Tracing
 * 
 * Bi idznillah 💚
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   OBSERVABILITY CONFIG
══════════════════════════════════════════════════════════ */
export const ObsConfig = {
    // Logging levels
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        CRITICAL: 4
    },
    
    // Current log level (adjust per environment)
    currentLevel: 1, // INFO in production, 0 (DEBUG) in dev
    
    // Metrics collection interval (ms)
    metricsInterval: 60000, // 1 minute
    
    // Trace sampling rate (0-1)
    traceSampleRate: 0.1, // 10% of traces
    
    // External endpoints (optional)
    endpoints: {
        logs: '/api/logs',
        metrics: '/api/metrics',
        traces: '/api/traces'
    },
    
    // Performance thresholds
    thresholds: {
        slowRender: 100,    // ms
        slowNetwork: 1000,  // ms
        slowQuery: 500,     // ms
        errorRate: 0.01     // 1% error rate threshold
    }
};

/* ══════════════════════════════════════════════════════════
   STRUCTURED LOGGING══════════════════════════════════════════════════════════ */
export class Logger {
    constructor(module = 'sekuriti') {
        this.module = module;
        this.sessionId = this._generateSessionId();
        this._buffer = [];
        this._flushInterval = null;
        this._startAutoFlush();
    }
    
    /**
     * Generate unique session ID
     * @returns {string}
     * @private
     */
    _generateSessionId() {
        return `sek_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    /**
     * Start auto-flush buffer to server
     * @private
     */
    _startAutoFlush() {
        this._flushInterval = setInterval(() => this._flush(), 30000); // 30 seconds
    }
    
    /**
     * Create structured log entry
     * @param {string} level
     * @param {string} message
     * @param {object} context
     * @returns {object}
     * @private
     */
    _createEntry(level, message, context = {}) {
        return {
            timestamp: new Date().toISOString(),
            level,
            module: this.module,
            session: this.sessionId,
            message,
            context: {
                user: context.user?.name,
                role: context.user?.role,
                url: window.location.href,
                userAgent: navigator.userAgent,
                ...context
            },
            stack: context.error?.stack        };
    }
    
    /**
     * Log at specific level
     * @param {number} levelNum
     * @param {string} message
     * @param {object} context
     */
    _log(levelNum, levelName, message, context = {}) {
        if (levelNum < ObsConfig.currentLevel) return;
        
        const entry = this._createEntry(levelName, message, context);
        
        // Console output (always)
        const consoleMethod = levelNum >= 3 ? 'error' : levelNum === 2 ? 'warn' : 'log';
        console[consoleMethod](`[${this.module}] ${message}`, entry.context);
        
        // Buffer for server send
        this._buffer.push(entry);
        
        // Immediate send for errors
        if (levelNum >= 3) {
            this._sendToServer([entry]);
        }
        
        // Track metric
        Metrics.increment(`log.${levelName.toLowerCase()}`);
    }
    
    /**
     * Debug level log
     * @param {string} message
     * @param {object} context
     */
    debug(message, context = {}) {
        this._log(ObsConfig.levels.DEBUG, 'DEBUG', message, context);
    }
    
    /**
     * Info level log
     * @param {string} message
     * @param {object} context
     */
    info(message, context = {}) {
        this._log(ObsConfig.levels.INFO, 'INFO', message, context);
    }
    
    /**
     * Warning level log     * @param {string} message
     * @param {object} context
     */
    warn(message, context = {}) {
        this._log(ObsConfig.levels.WARN, 'WARN', message, context);
    }
    
    /**
     * Error level log
     * @param {string} message
     * @param {object} context
     */
    error(message, context = {}) {
        this._log(ObsConfig.levels.ERROR, 'ERROR', message, context);
    }
    
    /**
     * Critical level log
     * @param {string} message
     * @param {object} context
     */
    critical(message, context = {}) {
        this._log(ObsConfig.levels.CRITICAL, 'CRITICAL', message, context);
    }
    
    /**
     * Log user action
     * @param {string} action
     * @param {object} user
     * @param {object} data
     */
    action(action, user = null, data = {}) {
        this.info(`ACTION: ${action}`, { user, action, ...data });
    }
    
    /**
     * Log performance measurement
     * @param {string} name
     * @param {number} durationMs
     * @param {object} context
     */
    performance(name, durationMs, context = {}) {
        const level = durationMs > ObsConfig.thresholds.slowRender ? 'WARN' : 'INFO';
        this._log(ObsConfig.levels[level], `PERF: ${name}`, {
            duration_ms: Math.round(durationMs),
            ...context
        });
    }
    
    /**     * Flush buffer to server
     * @private
     */
    async _flush() {
        if (this._buffer.length === 0) return;
        
        const logs = [...this._buffer];
        this._buffer = [];
        
        await this._sendToServer(logs);
    }
    
    /**
     * Send logs to server (non-blocking)
     * @param {array} logs
     * @private
     */
    async _sendToServer(logs) {
        if (!navigator.sendBeacon) return; // Fallback to console only
        
        try {
            const payload = JSON.stringify({ logs, module: this.module });
            navigator.sendBeacon(ObsConfig.endpoints.logs, payload);
        } catch (e) {
            console.warn('[Logger] Send failed:', e.message);
        }
    }
    
    /**
     * Get log statistics
     * @returns {object}
     */
    stats() {
        return {
            session: this.sessionId,
            buffered: this._buffer.length,
            level: Object.keys(ObsConfig.levels).find(k => ObsConfig.levels[k] === ObsConfig.currentLevel)
        };
    }
}

/* ══════════════════════════════════════════════════════════
   PERFORMANCE METRICS
══════════════════════════════════════════════════════════ */
export class Metrics {
    constructor() {
        this._counters = new Map();
        this._gauges = new Map();
        this._histograms = new Map();
        this._startTime = performance.now();        
        // Auto-collect browser metrics
        this._collectBrowserMetrics();
    }
    
    /**
     * Increment counter
     * @param {string} name
     * @param {number} value
     */
    static increment(name, value = 1) {
        const current = this._counters.get(name) || 0;
        this._counters.set(name, current + value);
    }
    
    /**
     * Set gauge value
     * @param {string} name
     * @param {number} value
     */
    static gauge(name, value) {
        this._gauges.set(name, value);
    }
    
    /**
     * Record histogram value
     * @param {string} name
     * @param {number} value
     */
    static histogram(name, value) {
        if (!this._histograms.has(name)) {
            this._histograms.set(name, []);
        }
        this._histograms.get(name).push(value);
    }
    
    /**
     * Start timing
     * @param {string} name
     * @returns {function} stop function
     */
    static startTimer(name) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.histogram(name, duration);
            LoggerSingleton.info(`TIMER: ${name}`, { duration_ms: Math.round(duration) });
        };
    }
        /**
     * Collect browser performance metrics
     * @private
     */
    _collectBrowserMetrics() {
        if (typeof performance === 'undefined') return;
        
        // Navigation timing
        if (performance.navigation) {
            Metrics.gauge('browser.navigation.type', performance.navigation.type);
            Metrics.gauge('browser.navigation.redirectCount', performance.navigation.redirectCount);
        }
        
        // Resource timing (sampled)
        if (performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource');
            Metrics.gauge('browser.resources.count', resources.length);
            
            const loadTimes = resources
                .filter(r => r.initiatorType === 'script' || r.initiatorType === 'stylesheet')
                .map(r => r.duration);
            
            if (loadTimes.length) {
                Metrics.histogram('browser.resource.load_time', 
                    loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length);
            }
        }
        
        // Memory (Chrome only)
        if (performance.memory) {
            Metrics.gauge('browser.memory.usedJSHeapSize', performance.memory.usedJSHeapSize);
            Metrics.gauge('browser.memory.totalJSHeapSize', performance.memory.totalJSHeapSize);
        }
    }
    
    /**
     * Get all metrics snapshot
     * @returns {object}
     */
    static snapshot() {
        return {
            uptime_ms: Math.round(performance.now() - this._startTime),
            counters: Object.fromEntries(this._counters),
            gauges: Object.fromEntries(this._gauges),
            histograms: Object.fromEntries(
                [...this._histograms.entries()].map(([name, values]) => [
                    name,
                    {
                        count: values.length,
                        avg: values.reduce((a, b) => a + b, 0) / values.length,                        min: Math.min(...values),
                        max: Math.max(...values)
                    }
                ])
            )
        };
    }
    
    /**
     * Export metrics for server
     * @returns {object}
     */
    static export() {
        const snapshot = this.snapshot();
        return {
            timestamp: new Date().toISOString(),
            session: LoggerSingleton.sessionId,
            module: 'sekuriti',
            ...snapshot
        };
    }
}

// Static reference for Metrics
const MetricsStatic = Metrics;
Metrics = MetricsStatic;

/* ══════════════════════════════════════════════════════════
   DISTRIBUTED TRACING
══════════════════════════════════════════════════════════ */
export class Tracer {
    constructor(module = 'sekuriti') {
        this.module = module;
        this._activeTraces = new Map();
        this._completedTraces = [];
        this._sampleRate = ObsConfig.traceSampleRate;
    }
    
    /**
     * Start a new trace
     * @param {string} operation
     * @param {object} context
     * @returns {string} trace ID
     */
    start(operation, context = {}) {
        // Sample traces (not all)
        if (Math.random() > this._sampleRate && context.force !== true) {
            return null;
        }
                const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const spanId = `span_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const trace = {
            traceId,
            spanId,
            operation,
            module: this.module,
            startTime: performance.now(),
            startTimeIso: new Date().toISOString(),
            context: {
                user: context.user?.name,
                session: LoggerSingleton.sessionId,
                ...context
            },
            spans: [],
            tags: {},
            logs: []
        };
        
        this._activeTraces.set(traceId, trace);
        
        LoggerSingleton.debug(`TRACE_START: ${operation}`, { traceId, spanId });
        
        return traceId;
    }
    
    /**
     * Add span to trace
     * @param {string} traceId
     * @param {string} operation
     * @param {number} durationMs
     * @param {object} context
     */
    addSpan(traceId, operation, durationMs, context = {}) {
        const trace = this._activeTraces.get(traceId);
        if (!trace) return;
        
        trace.spans.push({
            operation,
            duration_ms: Math.round(durationMs),
            timestamp: Date.now(),
            ...context
        });
    }
    
    /**
     * Add log to trace
     * @param {string} traceId
     * @param {string} message     * @param {object} context
     */
    log(traceId, message, context = {}) {
        const trace = this._activeTraces.get(traceId);
        if (!trace) return;
        
        trace.logs.push({
            timestamp: Date.now(),
            message,
            ...context
        });
    }
    
    /**
     * Add tag to trace
     * @param {string} traceId
     * @param {string} key
     * @param {string} value
     */
    tag(traceId, key, value) {
        const trace = this._activeTraces.get(traceId);
        if (!trace) return;
        
        trace.tags[key] = value;
    }
    
    /**
     * End trace
     * @param {string} traceId
     * @param {object} result
     */
    end(traceId, result = {}) {
        const trace = this._activeTraces.get(traceId);
        if (!trace) return;
        
        const duration = performance.now() - trace.startTime;
        
        trace.endTime = performance.now();
        trace.duration_ms = Math.round(duration);
        trace.success = !result.error;
        trace.error = result.error?.message || null;
        
        this._activeTraces.delete(traceId);
        this._completedTraces.push(trace);
        
        // Keep only last 100 traces in memory
        if (this._completedTraces.length > 100) {
            this._completedTraces.shift();
        }
                LoggerSingleton.info(`TRACE_END: ${trace.operation}`, {
            traceId,
            duration_ms: trace.duration_ms,
            success: trace.success,
            error: trace.error
        });
        
        // Send to server
        this._sendTrace(trace);
        
        // Track metric
        MetricsStatic.histogram(`trace.${trace.operation}.duration`, duration);
        MetricsStatic.increment(`trace.${trace.operation}.${trace.success ? 'success' : 'error'}`);
    }
    
    /**
     * Send trace to server
     * @param {object} trace
     * @private
     */
    async _sendTrace(trace) {
        if (!navigator.sendBeacon) return;
        
        try {
            const payload = JSON.stringify({ trace, module: this.module });
            navigator.sendBeacon(ObsConfig.endpoints.traces, payload);
        } catch (e) {
            console.warn('[Tracer] Send failed:', e.message);
        }
    }
    
    /**
     * Get active traces count
     * @returns {number}
     */
    activeCount() {
        return this._activeTraces.size;
    }
    
    /**
     * Get completed traces
     * @returns {array}
     */
    getCompleted() {
        return this._completedTraces;
    }
}

/* ══════════════════════════════════════════════════════════
   ERROR TRACKING══════════════════════════════════════════════════════════ */
export class ErrorTracker {
    constructor(module = 'sekuriti') {
        this.module = module;
        this._errorCount = 0;
        this._lastError = null;
        this._installGlobalHandler();
    }
    
    /**
     * Install global error handler
     * @private
     */
    _installGlobalHandler() {
        // Window error
        window.addEventListener('error', (e) => {
            this.capture(e.error || e.message, {
                type: 'window_error',
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        });
        
        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (e) => {
            this.capture(e.reason || 'Unhandled promise rejection', {
                type: 'unhandledrejection'
            });
            e.preventDefault(); // Prevent console spam
        });
    }
    
    /**
     * Capture error
     * @param {Error|string} error
     * @param {object} context
     */
    capture(error, context = {}) {
        const err = error instanceof Error ? error : new Error(error);
        
        this._errorCount++;
        this._lastError = {
            error: err.message,
            stack: err.stack,
            timestamp: Date.now(),
            ...context
        };
        
        LoggerSingleton.error('ERROR_CAPTURED', {            error: err.message,
            stack: err.stack,
            ...context
        });
        
        MetricsStatic.increment('errors.total');
        MetricsStatic.increment(`errors.${this._categorizeError(err.message)}`);
    }
    
    /**
     * Categorize error for metrics
     * @param {string} message
     * @returns {string}
     * @private
     */
    _categorizeError(message) {
        if (message.includes('network')) return 'network';
        if (message.includes('permission')) return 'permission';
        if (message.includes('quota')) return 'quota';
        if (message.includes('timeout')) return 'timeout';
        return 'unknown';
    }
    
    /**
     * Get error statistics
     * @returns {object}
     */
    stats() {
        return {
            count: this._errorCount,
            last: this._lastError,
            rate: this._errorCount / (performance.now() / 60000) // per minute
        };
    }
}

/* ══════════════════════════════════════════════════════════
   SINGLETON INSTANCES
══════════════════════════════════════════════════════════ */
export const LoggerSingleton = new Logger('sekuriti');
export const TracerSingleton = new Tracer('sekuriti');
export const ErrorTrackerSingleton = new ErrorTracker('sekuriti');

/* ══════════════════════════════════════════════════════════
   CONVENIENCE EXPORTS
══════════════════════════════════════════════════════════ */
export const Observability = {
    config: ObsConfig,
    Logger: LoggerSingleton,
    Tracer: TracerSingleton,    Errors: ErrorTrackerSingleton,
    Metrics: Metrics,
    
    /**
     * Initialize observability
     * @param {object} options
     */
    init(options = {}) {
        if (options.level) {
            ObsConfig.currentLevel = options.level;
        }
        if (options.sampleRate) {
            TracerSingleton._sampleRate = options.sampleRate;
        }
        
        LoggerSingleton.info('OBSERVABILITY_INIT', options);
        
        // Auto-export metrics periodically
        setInterval(() => {
            const metrics = Metrics.export();
            console.log('[Metrics]', metrics);
            // Could send to server here
        }, ObsConfig.metricsInterval);
        
        return this;
    },
    
    /**
     * Get health status
     * @returns {object}
     */
    health() {
        return {
            status: ErrorTrackerSingleton.stats().errorRate < ObsConfig.thresholds.errorRate ? 'healthy' : 'degraded',
            errors: ErrorTrackerSingleton.stats(),
            traces_active: TracerSingleton.activeCount(),
            cache: window.SekuritiCache?.stats() || null,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        };
    }
};

// Auto-init for convenience
if (typeof window !== 'undefined') {
    window.SekuritiObs = Observability.init({
        level: 1, // INFO
        sampleRate: 0.1    });
    console.log('📊 Sekuriti Observability initialized — Bi idznillah 💚');
}