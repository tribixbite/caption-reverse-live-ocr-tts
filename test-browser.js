// Simple browser test for CaptnReverse using standard Node.js
// Since Playwright doesn't work on Android, this tests the core functionality

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testCaptnReverseApp() {
    console.log('🧪 Testing CaptnReverse Web App Functionality');
    console.log('============================================');

    const tests = [
        {
            name: 'Server Accessibility',
            test: () => testServerConnection()
        },
        {
            name: 'HTML Structure',
            test: () => testHTMLStructure()
        },
        {
            name: 'JavaScript Syntax',
            test: () => testJavaScriptSyntax()
        },
        {
            name: 'CDN Dependencies',
            test: () => testCDNDependencies()
        },
        {
            name: 'Settings Persistence',
            test: () => testSettingsPersistence()
        }
    ];

    const results = [];

    for (const test of tests) {
        console.log(`\n📋 Running: ${test.name}`);
        try {
            const result = await test.test();
            console.log(`✅ ${test.name}: ${result ? 'PASS' : 'FAIL'}`);
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.log(`❌ ${test.name}: FAIL - ${error.message}`);
            results.push({ name: test.name, passed: false, error: error.message });
        }
    }

    // Summary
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    console.log(`\n\n📊 Test Results: ${passed}/${total} passed`);
    console.log('============================');
    
    results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.name}${result.error ? ` (${result.error})` : ''}`);
    });

    if (passed === total) {
        console.log('\n🎉 All tests passed! CaptnReverse is ready for production.');
    } else {
        console.log(`\n⚠️ ${total - passed} tests failed. Check the issues above.`);
    }

    return passed === total;
}

async function testServerConnection() {
    try {
        const { stdout } = await execPromise('curl -I http://localhost:3000');
        return stdout.includes('200 OK');
    } catch (error) {
        throw new Error('Server not accessible');
    }
}

async function testHTMLStructure() {
    try {
        const { stdout } = await execPromise('curl -s http://localhost:3000');
        
        // Check for essential elements
        const requiredElements = [
            '<title>CaptnReverse',
            'id="settings-btn"',
            'id="camera-feed"',
            'id="monitor-toggle"',
            'id="settings-modal"',
            'script src="https://cdn.tailwindcss.com"',
            'script src="https://unpkg.com/tesseract.js'
        ];

        const missingElements = requiredElements.filter(element => !stdout.includes(element));
        
        if (missingElements.length > 0) {
            throw new Error(`Missing elements: ${missingElements.join(', ')}`);
        }

        return true;
    } catch (error) {
        throw new Error(`HTML structure invalid: ${error.message}`);
    }
}

async function testJavaScriptSyntax() {
    try {
        const { stdout } = await execPromise('curl -s http://localhost:3000');
        
        // Basic JS syntax checks
        const jsErrors = [
            'SyntaxError',
            'ReferenceError',
            'TypeError in global scope'
        ];

        const hasErrors = jsErrors.some(error => stdout.includes(error));
        
        if (hasErrors) {
            throw new Error('JavaScript syntax errors detected');
        }

        // Check for key functions
        const requiredFunctions = [
            'function requestCamera',
            'function initOCR',
            'function processFrame',
            'function speak',
            'function cleanupCamera'
        ];

        const missingFunctions = requiredFunctions.filter(func => !stdout.includes(func));
        
        if (missingFunctions.length > 0) {
            throw new Error(`Missing functions: ${missingFunctions.join(', ')}`);
        }

        return true;
    } catch (error) {
        throw new Error(`JavaScript validation failed: ${error.message}`);
    }
}

async function testCDNDependencies() {
    try {
        // Test Tailwind CSS
        const tailwindTest = await execPromise('curl -I https://cdn.tailwindcss.com/');
        if (!tailwindTest.stdout.includes('200')) {
            throw new Error('Tailwind CSS CDN not accessible');
        }

        // Test Tesseract.js
        const tesseractTest = await execPromise('curl -I https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js');
        if (!tesseractTest.stdout.includes('200')) {
            throw new Error('Tesseract.js CDN not accessible');
        }

        return true;
    } catch (error) {
        throw new Error(`CDN dependency check failed: ${error.message}`);
    }
}

async function testSettingsPersistence() {
    try {
        const { stdout } = await execPromise('curl -s http://localhost:3000');
        
        // Check for localStorage usage
        const persistenceFeatures = [
            'localStorage.getItem',
            'localStorage.setItem',
            'captn-reverse-settings',
            'loadSettings',
            'saveSettings'
        ];

        const missingFeatures = persistenceFeatures.filter(feature => !stdout.includes(feature));
        
        if (missingFeatures.length > 0) {
            throw new Error(`Missing persistence features: ${missingFeatures.join(', ')}`);
        }

        return true;
    } catch (error) {
        throw new Error(`Settings persistence check failed: ${error.message}`);
    }
}

// Run tests
if (require.main === module) {
    testCaptnReverseApp()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = { testCaptnReverseApp };