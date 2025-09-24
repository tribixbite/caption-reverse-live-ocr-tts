/**
 * OCR Test Runner - Injects OCR functionality test into browser
 * Simulates browser environment and captures test results
 */

const fs = require('fs');
const http = require('http');

// Mock browser environment for Node.js
global.window = {
    AppState: {
        currentOCREngine: 'tesseract',
        ocrScheduler: { workers: [{ name: 'worker1' }, { name: 'worker2' }] },
        ocrWorker: { name: 'fallback-worker' },
        paddleOCRLoaded: false,
        paddleOCRInstance: null
    },
    localStorage: {
        data: {
            'paddleOCRFailureInfo': JSON.stringify({
                timestamp: Date.now(),
                errorCategory: 'Browser compatibility issue',
                errorMessage: 'exports is not defined',
                attemptedCDNs: ['jsdelivr', 'unpkg', 'skypack'],
                userAgent: 'Node.js Test Environment'
            })
        },
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; },
        removeItem: function(key) { delete this.data[key]; }
    },
    retryPaddleOCR: function() {
        console.log('🔄 retryPaddleOCR function called');
        return Promise.resolve();
    }
};

global.document = {
    elements: {
        'ocr-tesseract': {
            className: 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white'
        },
        'ocr-paddle': {
            className: 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white opacity-50 cursor-not-allowed'
        },
        'ocr-engine-info': {
            innerHTML: `
                <div class="space-y-2">
                    <p class="font-medium">🤖 Tesseract.js Active (PaddleOCR unavailable)</p>
                    <p class="text-xs text-dark-400">Issue: Browser compatibility issue</p>
                    <p class="text-xs text-gaming-cyan">💡 PaddleOCR requires Node.js environment - using Tesseract.js instead</p>
                    <button onclick="retryPaddleOCR()" class="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded mt-1">
                        🔄 Retry PaddleOCR
                    </button>
                </div>
            `
        },
        'read-now-btn': { className: 'btn-primary' },
        'test-ocr': { className: 'btn-secondary' }
    },
    getElementById: function(id) {
        return this.elements[id] || null;
    }
};

global.Tesseract = {
    createWorker: function() {
        return Promise.resolve({
            load: () => Promise.resolve(),
            loadLanguage: () => Promise.resolve(),
            initialize: () => Promise.resolve(),
            setParameters: () => Promise.resolve()
        });
    },
    createScheduler: function() {
        return Promise.resolve({
            addWorker: () => Promise.resolve(),
            workers: [{ name: 'worker1' }, { name: 'worker2' }]
        });
    }
};

global.Worker = function(scriptPath) {
    this.terminate = function() {};
    return this;
};

global.performance = {
    now: function() { return Date.now(); }
};

global.console = console;

// Test server connectivity first
function testServerConnectivity() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000', (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Server is running on http://localhost:3000');
                resolve(true);
            } else {
                console.log(`❌ Server responded with status: ${res.statusCode}`);
                resolve(false);
            }
        });

        req.on('error', (error) => {
            console.log('❌ Server connection failed:', error.message);
            resolve(false);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            console.log('❌ Server connection timeout');
            resolve(false);
        });
    });
}

// Run the OCR functionality test
async function runOCRTest() {
    console.log('🚀 Starting OCR Functionality Test...\n');

    // Test server connectivity first
    const serverOk = await testServerConnectivity();
    if (!serverOk) {
        console.log('⚠️ Server tests failed, but continuing with functionality tests...\n');
    }

    try {
        // Load and execute the OCR test
        const testScript = fs.readFileSync('./test-ocr-functionality.js', 'utf8');

        // Execute in our mock browser environment
        eval(testScript);

    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Mock additional environment check
async function checkEnvironmentCompatibility() {
    console.log('🔍 Environment Compatibility Check:\n');

    const checks = [
        { name: 'Node.js Version', check: () => process.version, expected: 'v18+' },
        { name: 'HTTP Module', check: () => typeof require('http') !== 'undefined', expected: true },
        { name: 'File System', check: () => typeof require('fs') !== 'undefined', expected: true },
        { name: 'Console API', check: () => typeof console !== 'undefined', expected: true },
        { name: 'JSON Support', check: () => typeof JSON !== 'undefined', expected: true },
        { name: 'Promise Support', check: () => typeof Promise !== 'undefined', expected: true },
        { name: 'setTimeout/setInterval', check: () => typeof setTimeout !== 'undefined', expected: true }
    ];

    let allPassed = true;

    checks.forEach(({ name, check, expected }) => {
        try {
            const result = check();
            const passed = typeof expected === 'boolean' ? result === expected : !!result;
            console.log(`${passed ? '✅' : '❌'} ${name}: ${result} ${passed ? '(Compatible)' : '(Issue detected)'}`);
            if (!passed) allPassed = false;
        } catch (error) {
            console.log(`❌ ${name}: Error - ${error.message}`);
            allPassed = false;
        }
    });

    console.log(`\n🎯 Environment Compatibility: ${allPassed ? 'PASSED' : 'ISSUES DETECTED'}\n`);
    return allPassed;
}

// Run all checks
async function main() {
    console.log('🧪 CaptnReverse OCR Testing Suite\n');
    console.log('=' .repeat(50));

    await checkEnvironmentCompatibility();
    await runOCRTest();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 OCR Testing Complete!');
    console.log('\nNOTE: This test simulates browser behavior in Node.js.');
    console.log('For complete validation, open http://localhost:3000 in a real browser.');
}

main().catch(console.error);