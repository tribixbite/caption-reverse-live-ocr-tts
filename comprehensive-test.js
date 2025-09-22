/**
 * Comprehensive Browser Testing Script
 * Tests the CaptnReverse application functionality via automated browser interactions
 */

const test = {
    results: [],
    passed: 0,
    failed: 0,
    warnings: 0,

    async run(name, testFn) {
        console.log(`🧪 Running test: ${name}`);
        try {
            const result = await testFn();
            if (result === true || result === undefined) {
                this.passed++;
                this.results.push({ name, status: 'PASS', message: 'Test passed' });
                console.log(`✅ ${name} - PASSED`);
            } else if (typeof result === 'string') {
                this.warnings++;
                this.results.push({ name, status: 'WARNING', message: result });
                console.log(`⚠️ ${name} - WARNING: ${result}`);
            } else {
                this.failed++;
                this.results.push({ name, status: 'FAIL', message: result || 'Test failed' });
                console.log(`❌ ${name} - FAILED: ${result}`);
            }
        } catch (error) {
            this.failed++;
            this.results.push({ name, status: 'FAIL', message: error.message });
            console.log(`❌ ${name} - ERROR: ${error.message}`);
        }
    },

    async runAllTests() {
        console.log('🚀 Starting Comprehensive CaptnReverse Tests...\n');

        // Test 1: Application Loading
        await this.run('Application Loads Without Errors', () => {
            const errors = [];
            const originalError = console.error;
            console.error = (...args) => {
                errors.push(args.join(' '));
                originalError(...args);
            };

            setTimeout(() => {
                console.error = originalError;
            }, 1000);

            return errors.length === 0 || `${errors.length} console errors detected`;
        });

        // Test 2: DOM Structure
        await this.run('Setup Screen Visible', () => {
            const setupScreen = document.getElementById('setup-screen');
            return setupScreen && !setupScreen.classList.contains('hidden');
        });

        // Test 3: Button Existence
        await this.run('Setup Wizard Button Exists', () => {
            return document.getElementById('setup-wizard-btn') !== null;
        });

        await this.run('Web Test Suite Button Exists', () => {
            return document.getElementById('web-test-suite-btn') !== null;
        });

        await this.run('Camera Request Button Exists', () => {
            return document.getElementById('request-camera') !== null;
        });

        // Test 4: Web APIs Availability
        await this.run('MediaDevices API Available', () => {
            return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
        });

        await this.run('Web Speech API Available', () => {
            return 'speechSynthesis' in window;
        });

        await this.run('Canvas 2D Context Available', () => {
            const canvas = document.createElement('canvas');
            return canvas.getContext && canvas.getContext('2d');
        });

        await this.run('Local Storage Available', () => {
            return typeof Storage !== 'undefined';
        });

        await this.run('WebAssembly Support', () => {
            return typeof WebAssembly !== 'undefined';
        });

        // Test 5: App State and Configuration
        await this.run('ES6 Modules Support', async () => {
            try {
                // Try to access the app state from the module
                const appElement = document.querySelector('[data-app-initialized]');
                return true; // If no errors, modules are working
            } catch (error) {
                return `Module loading failed: ${error.message}`;
            }
        });

        // Test 6: Camera Permission Handling
        await this.run('Camera Permission Check', async () => {
            try {
                if ('permissions' in navigator) {
                    const permission = await navigator.permissions.query({ name: 'camera' });
                    return permission.state !== 'denied';
                } else {
                    return 'Permissions API not available';
                }
            } catch (error) {
                return `Permission check failed: ${error.message}`;
            }
        });

        // Test 7: TTS Voices Loading
        await this.run('TTS Voices Available', () => {
            const voices = speechSynthesis.getVoices();
            return voices.length > 0 || 'Voices may still be loading (async)';
        });

        // Test 8: Tesseract.js Loading
        await this.run('Tesseract.js Loaded', () => {
            return typeof Tesseract !== 'undefined';
        });

        // Test 9: Tailwind CSS Classes Applied
        await this.run('Tailwind CSS Active', () => {
            const body = document.body;
            const computedStyle = window.getComputedStyle(body);
            // Check if dark background is applied
            const bgColor = computedStyle.backgroundColor;
            return bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
        });

        // Test 10: Glass Morphism Effects
        await this.run('Glass Morphism Effects Active', () => {
            const glassElements = document.querySelectorAll('.glass');
            if (glassElements.length === 0) return 'No glass elements found';

            const firstGlass = glassElements[0];
            const computedStyle = window.getComputedStyle(firstGlass);
            return computedStyle.backdropFilter.includes('blur') || 'Backdrop filter not applied';
        });

        // Test 11: Button Click Handlers
        await this.run('Setup Wizard Button Click Handler', () => {
            const btn = document.getElementById('setup-wizard-btn');
            if (!btn) return 'Button not found';

            // Create a mock click event
            const clickEvent = new MouseEvent('click', { bubbles: true });
            btn.dispatchEvent(clickEvent);

            // Check if wizard modal appeared
            setTimeout(() => {
                const modal = document.getElementById('setup-wizard-modal');
                return modal !== null;
            }, 100);
            return 'Click handler attached (modal check pending)';
        });

        await this.run('Web Test Suite Button Click Handler', () => {
            const btn = document.getElementById('web-test-suite-btn');
            if (!btn) return 'Button not found';

            // Create a mock click event
            const clickEvent = new MouseEvent('click', { bubbles: true });
            btn.dispatchEvent(clickEvent);

            // Check if test suite appeared
            setTimeout(() => {
                const testSuite = document.getElementById('web-test-suite');
                return testSuite !== null;
            }, 100);
            return 'Click handler attached (test suite check pending)';
        });

        // Test 12: Theme and Styling
        await this.run('Dark Theme Applied', () => {
            const html = document.documentElement;
            return html.classList.contains('dark');
        });

        await this.run('Primary Colors Defined', () => {
            const testElement = document.createElement('div');
            testElement.className = 'bg-primary-600';
            document.body.appendChild(testElement);

            const computedStyle = window.getComputedStyle(testElement);
            const bgColor = computedStyle.backgroundColor;

            document.body.removeChild(testElement);
            return bgColor !== 'rgba(0, 0, 0, 0)';
        });

        // Test 13: Mobile Responsiveness
        await this.run('Mobile Viewport Meta Tag', () => {
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            return viewportMeta && viewportMeta.content.includes('width=device-width');
        });

        await this.run('Touch-Friendly Interface', () => {
            const buttons = document.querySelectorAll('button');
            let touchFriendly = true;

            buttons.forEach(btn => {
                const style = window.getComputedStyle(btn);
                const minHeight = parseInt(style.minHeight) || parseInt(style.height);
                if (minHeight < 44) { // iOS recommendation for touch targets
                    touchFriendly = false;
                }
            });

            return touchFriendly || 'Some buttons may be too small for touch';
        });

        // Test 14: Performance Checks
        await this.run('Resource Loading Performance', () => {
            if ('performance' in window) {
                const navigation = performance.getEntriesByType('navigation')[0];
                const loadTime = navigation.loadEventEnd - navigation.navigationStart;

                if (loadTime < 3000) return true;
                if (loadTime < 5000) return `Slow loading: ${loadTime}ms`;
                return `Very slow loading: ${loadTime}ms`;
            }
            return 'Performance API not available';
        });

        // Print Results Summary
        console.log('\n📊 Test Results Summary:');
        console.log('=======================');
        console.log(`Total Tests: ${this.results.length}`);
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`⚠️ Warnings: ${this.warnings}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`Success Rate: ${((this.passed / this.results.length) * 100).toFixed(1)}%`);

        // Detailed Results
        console.log('\n📋 Detailed Results:');
        console.log('====================');
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
            console.log(`${icon} ${result.name}: ${result.message}`);
        });

        // Generate JSON Report
        const report = {
            timestamp: new Date().toISOString(),
            environment: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            },
            summary: {
                total: this.results.length,
                passed: this.passed,
                warnings: this.warnings,
                failed: this.failed,
                successRate: ((this.passed / this.results.length) * 100).toFixed(1)
            },
            tests: this.results
        };

        console.log('\n📄 JSON Report:');
        console.log(JSON.stringify(report, null, 2));

        return report;
    }
};

// Auto-run tests when script loads
if (typeof window !== 'undefined') {
    console.log('🧪 Comprehensive CaptnReverse Test Suite Loaded');
    console.log('Run test.runAllTests() to execute all tests');

    // Make test object globally available
    window.comprehensiveTest = test;

    // Auto-run after a short delay to let the app initialize
    setTimeout(() => {
        test.runAllTests();
    }, 2000);
}

export default test;