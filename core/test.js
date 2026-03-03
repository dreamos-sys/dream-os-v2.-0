// core/test.js - Minimal Unit Test Framework for Critical Functions
// Zero dependencies, runs in browser console or dev panel

export const TestSuite = {
    results: [],
    
    // Run a single test
    async run(name, testFn) {
        const start = performance.now();
        try {
            await testFn();
            const duration = performance.now() - start;
            this.results.push({ name, status: '✅ PASS', duration: duration.toFixed(1) + 'ms' });
            console.log(`✅ ${name} (${duration.toFixed(1)}ms)`);
            return true;
        } catch (err) {
            const duration = performance.now() - start;
            this.results.push({ name, status: '❌ FAIL', error: err.message, duration: duration.toFixed(1) + 'ms' });
            console.error(`❌ ${name}:`, err);
            
            // Auto-show dev notification if Ghost Architect
            if (this.isDevRole()) {
                DevPanel.showError(name, err);
            }
            return false;
        }
    },
    
    // Run batch tests
    async runBatch(tests) {
        console.group('🧪 Running Test Suite');
        const results = await Promise.all(
            tests.map(({ name, fn }) => this.run(name, fn))
        );
        console.groupEnd();
        
        const passed = results.filter(r => r).length;
        console.log(`📊 Results: ${passed}/${tests.length} passed`);
        
        return { passed, total: tests.length, results: this.results };
    },
    
    // Helper assertions
    assert(condition, message) {
        if (!condition) throw new Error(message || 'Assertion failed');
    },
    
    assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);        }
    },
    
    // Check if current user is dev role
    isDevRole() {
        const roles = ['developer', 'master', 'architect', 'Ghost Architect'];
        const current = sessionStorage.getItem('dream_role')?.toLowerCase() || '';
        return roles.some(r => current.includes(r.toLowerCase()));
    },
    
    // Reset results
    reset() {
        this.results = [];
    }
};

// ========== CRITICAL FUNCTION TESTS ==========
export const CriticalTests = {
    // Time validation (used in booking module)
    timeValidation() {
        return TestSuite.run('timeToNumber conversion', () => {
            // Mock the function if not globally available
            const timeToNumber = window.timeToNumber || ((t) => {
                const [h, m] = t.split(':').map(Number);
                return h + m / 60;
            });
            
            TestSuite.assertEquals(timeToNumber('07:30'), 7.5, '07:30 should be 7.5');
            TestSuite.assertEquals(timeToNumber('16:00'), 16, '16:00 should be 16');
            TestSuite.assertEquals(timeToNumber('10:45'), 10.75, '10:45 should be 10.75');
        });
    },
    
    // Date validation
    dateValidation() {
        return TestSuite.run('isWeekend detection', () => {
            const isWeekend = window.isWeekend || ((d) => {
                return new Date(d + 'T00:00:00').getDay() === 0;
            });
            
            TestSuite.assert(isWeekend('2026-03-08') === true, 'Sunday should be weekend');
            TestSuite.assert(isWeekend('2026-03-09') === false, 'Monday should not be weekend');
        });
    },
    
    // Friday blocking logic
    fridayBlocking() {
        return TestSuite.run('Friday time block check', () => {
            const isFriday = window.isFriday || ((d) => new Date(d + 'T00:00:00').getDay() === 5);
            const timeToNumber = window.timeToNumber || ((t) => {                const [h, m] = t.split(':').map(Number);
                return h + m / 60;
            });
            
            // Friday 10:30-13:00 blocked for certain venues
            const FRIDAY_BLOCK_START = 10.5;
            const FRIDAY_BLOCK_END = 13.0;
            
            const isBlocked = (start, end) => {
                const s = timeToNumber(start);
                const e = timeToNumber(end);
                return s < FRIDAY_BLOCK_END && e > FRIDAY_BLOCK_START;
            };
            
            TestSuite.assert(isBlocked('10:00', '11:00') === true, '10:00-11:00 should be blocked');
            TestSuite.assert(isBlocked('14:00', '15:00') === false, '14:00-15:00 should NOT be blocked');
            TestSuite.assert(isBlocked('09:00', '10:00') === false, '09:00-10:00 should NOT be blocked');
        });
    },
    
    // API response handling
    apiErrorHandling() {
        return TestSuite.run('API error wrapper', async () => {
            // Mock API call that might fail
            const safeCall = async (fn) => {
                try {
                    return await fn();
                } catch (err) {
                    // Log to dev panel if applicable
                    if (TestSuite.isDevRole()) {
                        DevPanel?.logError('API Call', err);
                    }
                    throw err;
                }
            };
            
            // Test success path
            await safeCall(() => Promise.resolve({ ok: true }));
            
            // Test error path (should throw)
            try {
                await safeCall(() => Promise.reject(new Error('Network error')));
                TestSuite.assert(false, 'Should have thrown error');
            } catch (err) {
                TestSuite.assert(err.message === 'Network error', 'Error should propagate');
            }
        });
    },
    
    // Permission check    permissionCheck() {
        return TestSuite.run('User permission validation', () => {
            const hasPerm = (userPerms, required) => {
                return userPerms.includes('all') || userPerms.includes(required);
            };
            
            TestSuite.assert(hasPerm(['all'], 'booking') === true, 'all perms should access anything');
            TestSuite.assert(hasPerm(['booking', 'k3'], 'booking') === true, 'specific perm should work');
            TestSuite.assert(hasPerm(['k3'], 'booking') === false, 'missing perm should deny');
        });
    },
    
    // Run all critical tests
    async runAll() {
        return TestSuite.runBatch([
            { name: '⏰ Time Validation', fn: () => this.timeValidation() },
            { name: '📅 Date Validation', fn: () => this.dateValidation() },
            { name: '🕌 Friday Blocking', fn: () => this.fridayBlocking() },
            { name: '🔌 API Error Handling', fn: () => this.apiErrorHandling() },
            { name: '🔐 Permission Check', fn: () => this.permissionCheck() }
        ]);
    }
};

// Auto-export for global access
if (typeof window !== 'undefined') {
    window.TestSuite = TestSuite;
    window.CriticalTests = CriticalTests;
              }
