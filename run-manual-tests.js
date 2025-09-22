/**
 * Manual Test Execution Script
 * Runs tests directly on the application to identify specific issues
 */

console.log('🧪 Manual Test Execution Starting...');

// Test 1: Check if required elements exist
function testElementsExist() {
    console.log('\n🔍 Testing Required Elements...');

    const requiredElements = [
        'setup-screen',
        'main-app',
        'request-camera',
        'setup-wizard-btn',
        'web-test-suite-btn',
        'camera-feed',
        'crop-overlay'
    ];

    const results = {};
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        results[id] = {
            exists: element !== null,
            visible: element ? !element.classList.contains('hidden') : false,
            display: element ? window.getComputedStyle(element).display : 'none'
        };

        const status = element ? '✅' : '❌';
        console.log(`${status} ${id}: ${element ? 'EXISTS' : 'MISSING'}`);
    });

    return results;
}

// Test 2: Check Web APIs availability
function testWebAPIs() {
    console.log('\n🔧 Testing Web APIs...');

    const apis = [
        { name: 'MediaDevices', test: () => 'mediaDevices' in navigator },
        { name: 'getUserMedia', test: () => 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices },
        { name: 'SpeechSynthesis', test: () => 'speechSynthesis' in window },
        { name: 'Canvas 2D', test: () => {
            const canvas = document.createElement('canvas');
            return canvas.getContext && canvas.getContext('2d');
        }},
        { name: 'WebAssembly', test: () => typeof WebAssembly !== 'undefined' },
        { name: 'LocalStorage', test: () => typeof Storage !== 'undefined' },
        { name: 'Tesseract.js', test: () => typeof Tesseract !== 'undefined' },
        { name: 'ES6 Modules', test: () => 'import' in window || typeof document.querySelector === 'function' }
    ];

    const results = {};
    apis.forEach(api => {
        try {
            const available = api.test();
            results[api.name] = available;
            const status = available ? '✅' : '❌';
            console.log(`${status} ${api.name}: ${available ? 'AVAILABLE' : 'MISSING'}`);
        } catch (error) {
            results[api.name] = false;
            console.log(`❌ ${api.name}: ERROR - ${error.message}`);
        }
    });

    return results;
}

// Test 3: Check button event handlers
function testButtonHandlers() {
    console.log('\n🎯 Testing Button Event Handlers...');

    const buttons = [
        'setup-wizard-btn',
        'web-test-suite-btn',
        'request-camera'
    ];

    const results = {};

    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (!btn) {
            results[btnId] = { exists: false, hasHandler: false };
            console.log(`❌ ${btnId}: BUTTON NOT FOUND`);
            return;
        }

        // Check if button has event listeners
        const events = getEventListeners ? getEventListeners(btn) : null;
        const hasClickHandler = events && events.click && events.click.length > 0;

        results[btnId] = {
            exists: true,
            hasHandler: hasClickHandler,
            onclick: btn.onclick !== null,
            disabled: btn.disabled
        };

        const status = hasClickHandler || btn.onclick ? '✅' : '⚠️';
        console.log(`${status} ${btnId}: ${hasClickHandler || btn.onclick ? 'HAS HANDLER' : 'NO HANDLER'}`);
    });

    return results;
}

// Test 4: Check CSS styling and themes
function testStyling() {
    console.log('\n🎨 Testing CSS Styling and Themes...');

    const results = {};

    // Check if dark theme is applied
    const html = document.documentElement;
    results.darkTheme = html.classList.contains('dark');
    console.log(`${results.darkTheme ? '✅' : '❌'} Dark Theme: ${results.darkTheme ? 'ACTIVE' : 'INACTIVE'}`);

    // Check glass morphism effects
    const glassElements = document.querySelectorAll('.glass');
    results.glassElements = glassElements.length;
    console.log(`${glassElements.length > 0 ? '✅' : '❌'} Glass Elements: ${glassElements.length} found`);

    if (glassElements.length > 0) {
        const firstGlass = glassElements[0];
        const style = window.getComputedStyle(firstGlass);
        const hasBackdropFilter = style.backdropFilter && style.backdropFilter !== 'none';
        results.backdropFilter = hasBackdropFilter;
        console.log(`${hasBackdropFilter ? '✅' : '❌'} Backdrop Filter: ${hasBackdropFilter ? 'APPLIED' : 'MISSING'}`);
    }

    // Check Tailwind classes
    const body = document.body;
    const bodyStyle = window.getComputedStyle(body);
    const hasBgColor = bodyStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
    results.tailwindActive = hasBgColor;
    console.log(`${hasBgColor ? '✅' : '❌'} Tailwind CSS: ${hasBgColor ? 'ACTIVE' : 'INACTIVE'}`);

    return results;
}

// Test 5: Test app state and modules
function testAppModules() {
    console.log('\n📦 Testing App Modules...');

    const results = {};

    // Check if modules are loaded
    const moduleChecks = [
        { name: 'App State', check: () => window.AppState || document.querySelector('[data-app-state]') },
        { name: 'Setup Wizard', check: () => window.startSetupWizard || document.querySelector('[data-setup-wizard]') },
        { name: 'Web Test Suite', check: () => window.startWebTestSuite || document.querySelector('[data-web-test-suite]') }
    ];

    moduleChecks.forEach(module => {
        try {
            const available = module.check();
            results[module.name] = !!available;
            const status = available ? '✅' : '⚠️';
            console.log(`${status} ${module.name}: ${available ? 'LOADED' : 'NOT DETECTED'}`);
        } catch (error) {
            results[module.name] = false;
            console.log(`❌ ${module.name}: ERROR - ${error.message}`);
        }
    });

    return results;
}

// Test 6: Check for JavaScript errors
function testJavaScriptErrors() {
    console.log('\n🐛 Testing for JavaScript Errors...');

    const results = {
        errors: [],
        warnings: []
    };

    // Override console methods to capture errors
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = function(...args) {
        results.errors.push(args.join(' '));
        originalError.apply(console, args);
    };

    console.warn = function(...args) {
        results.warnings.push(args.join(' '));
        originalWarn.apply(console, args);
    };

    // Restore after a delay
    setTimeout(() => {
        console.error = originalError;
        console.warn = originalWarn;

        console.log(`${results.errors.length === 0 ? '✅' : '❌'} JavaScript Errors: ${results.errors.length} found`);
        console.log(`${results.warnings.length === 0 ? '✅' : '⚠️'} JavaScript Warnings: ${results.warnings.length} found`);

        results.errors.forEach(error => console.log(`  🔴 ERROR: ${error}`));
        results.warnings.forEach(warning => console.log(`  🟡 WARNING: ${warning}`));
    }, 2000);

    return results;
}

// Test 7: Simulate button clicks
function testButtonClicks() {
    console.log('\n🖱️ Testing Button Click Simulation...');

    const results = {};

    // Test Setup Wizard button
    const setupBtn = document.getElementById('setup-wizard-btn');
    if (setupBtn) {
        try {
            setupBtn.click();
            setTimeout(() => {
                const modal = document.getElementById('setup-wizard-modal');
                results.setupWizard = modal !== null;
                console.log(`${results.setupWizard ? '✅' : '❌'} Setup Wizard Click: ${results.setupWizard ? 'MODAL APPEARED' : 'NO MODAL'}`);

                // Close modal if it appeared
                if (modal && window.closeSetupWizard) {
                    window.closeSetupWizard();
                }
            }, 500);
        } catch (error) {
            results.setupWizard = false;
            console.log(`❌ Setup Wizard Click: ERROR - ${error.message}`);
        }
    }

    // Test Web Test Suite button
    const testBtn = document.getElementById('web-test-suite-btn');
    if (testBtn) {
        try {
            setTimeout(() => {
                testBtn.click();
                setTimeout(() => {
                    const testSuite = document.getElementById('web-test-suite');
                    results.webTestSuite = testSuite !== null;
                    console.log(`${results.webTestSuite ? '✅' : '❌'} Web Test Suite Click: ${results.webTestSuite ? 'SUITE APPEARED' : 'NO SUITE'}`);

                    // Close test suite if it appeared
                    if (testSuite && window.closeTestSuite) {
                        window.closeTestSuite();
                    }
                }, 500);
            }, 1000);
        } catch (error) {
            results.webTestSuite = false;
            console.log(`❌ Web Test Suite Click: ERROR - ${error.message}`);
        }
    }

    return results;
}

// Run all tests
async function runAllManualTests() {
    console.log('🚀 Starting Manual Test Suite for CaptnReverse...\n');

    const allResults = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        tests: {}
    };

    try {
        allResults.tests.elements = testElementsExist();
        allResults.tests.webAPIs = testWebAPIs();
        allResults.tests.buttonHandlers = testButtonHandlers();
        allResults.tests.styling = testStyling();
        allResults.tests.modules = testAppModules();
        allResults.tests.jsErrors = testJavaScriptErrors();
        allResults.tests.buttonClicks = testButtonClicks();

        // Summary
        console.log('\n📊 Test Summary:');
        console.log('================');
        console.log(`✅ Elements Test: ${Object.values(allResults.tests.elements).filter(e => e.exists).length}/${Object.keys(allResults.tests.elements).length} elements found`);
        console.log(`✅ Web APIs Test: ${Object.values(allResults.tests.webAPIs).filter(a => a).length}/${Object.keys(allResults.tests.webAPIs).length} APIs available`);
        console.log(`✅ Styling Test: Dark theme ${allResults.tests.styling.darkTheme ? 'active' : 'inactive'}, ${allResults.tests.styling.glassElements} glass elements`);

        // Store results globally for inspection
        window.manualTestResults = allResults;

        console.log('\n📄 Full results stored in window.manualTestResults');
        console.log('🎉 Manual test suite completed!');

        return allResults;

    } catch (error) {
        console.error('❌ Test suite execution error:', error);
        throw error;
    }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllManualTests);
    } else {
        // Run after a small delay to let the app initialize
        setTimeout(runAllManualTests, 1000);
    }
}

// Export for manual execution
if (typeof module !== 'undefined') {
    module.exports = { runAllManualTests };
}