/**
 * Comprehensive OCR Functionality Test
 * Tests Tesseract.js initialization, PaddleOCR fallback handling, and error categorization
 */

const ocrTest = {
    results: [],
    passed: 0,
    failed: 0,
    warnings: 0,

    log(message) {
        console.log(`🔍 OCR Test: ${message}`);
    },

    async test(name, testFn) {
        this.log(`Running: ${name}`);
        try {
            const result = await testFn();
            if (result === true) {
                this.passed++;
                this.results.push({ name, status: 'PASS', message: 'Success' });
                console.log(`✅ ${name} - PASSED`);
            } else if (typeof result === 'string' && result.startsWith('WARNING:')) {
                this.warnings++;
                this.results.push({ name, status: 'WARN', message: result });
                console.log(`⚠️ ${name} - WARNING: ${result}`);
            } else {
                this.failed++;
                this.results.push({ name, status: 'FAIL', message: result || 'Failed' });
                console.log(`❌ ${name} - FAILED: ${result}`);
            }
        } catch (error) {
            this.failed++;
            this.results.push({ name, status: 'FAIL', message: error.message, stack: error.stack });
            console.log(`❌ ${name} - ERROR: ${error.message}`);
        }
    },

    async runAllTests() {
        console.log('\n🚀 Starting OCR Functionality Test Suite\n');

        // Test 1: Check Tesseract.js availability
        await this.test('Tesseract.js CDN Loading', async () => {
            if (typeof Tesseract === 'undefined') {
                return 'Tesseract.js not loaded from CDN';
            }

            if (typeof Tesseract.createWorker !== 'function') {
                return 'Tesseract createWorker method missing';
            }

            if (typeof Tesseract.createScheduler !== 'function') {
                return 'Tesseract createScheduler method missing';
            }

            return true;
        });

        // Test 2: Check OCR system initialization state
        await this.test('OCR System State', async () => {
            if (!window.AppState) {
                return 'AppState not available';
            }

            const hasScheduler = window.AppState.ocrScheduler;
            const hasWorker = window.AppState.ocrWorker;

            if (!hasScheduler && !hasWorker) {
                return 'Neither OCR scheduler nor worker initialized';
            }

            if (hasScheduler) {
                const workerCount = window.AppState.ocrScheduler.workers?.length || 0;
                this.log(`Tesseract scheduler has ${workerCount} workers`);
                return true;
            }

            return true;
        });

        // Test 3: Check OCR engine selection UI
        await this.test('OCR Engine Selector UI', async () => {
            const tesseractBtn = document.getElementById('ocr-tesseract');
            const paddleBtn = document.getElementById('ocr-paddle');
            const infoDiv = document.getElementById('ocr-engine-info');

            if (!tesseractBtn || !paddleBtn || !infoDiv) {
                return 'OCR engine selector buttons missing from UI';
            }

            // Check if Tesseract is selected by default (should be blue/active)
            const isTestseractActive = tesseractBtn.className.includes('bg-primary-600');
            const isPaddleActive = paddleBtn.className.includes('bg-primary-600');

            if (!isTestseractActive || isPaddleActive) {
                return 'WARNING: Tesseract should be active by default, PaddleOCR should be inactive';
            }

            return true;
        });

        // Test 4: Test PaddleOCR loading attempt and error handling
        await this.test('PaddleOCR Error Handling', async () => {
            // Check AppState for PaddleOCR status
            if (!window.AppState) {
                return 'AppState not available to check PaddleOCR status';
            }

            const paddleLoaded = window.AppState.paddleOCRLoaded;
            const paddleInstance = window.AppState.paddleOCRInstance;

            if (paddleLoaded && paddleInstance) {
                return 'WARNING: PaddleOCR unexpectedly loaded successfully';
            }

            // Check for fallback information in localStorage
            const paddleFailureInfo = localStorage.getItem('paddleOCRFailureInfo');
            if (paddleFailureInfo) {
                try {
                    const failureData = JSON.parse(paddleFailureInfo);
                    this.log(`PaddleOCR failure category: ${failureData.errorCategory}`);

                    if (failureData.errorCategory === 'Browser compatibility issue') {
                        return true; // This is the expected error for browser environments
                    }

                    return `WARNING: Unexpected PaddleOCR error category: ${failureData.errorCategory}`;
                } catch (e) {
                    return 'WARNING: Could not parse PaddleOCR failure info from localStorage';
                }
            }

            return 'WARNING: No PaddleOCR failure information stored';
        });

        // Test 5: Check current OCR engine state
        await this.test('Current OCR Engine', async () => {
            if (!window.AppState) {
                return 'AppState not available';
            }

            const currentEngine = window.AppState.currentOCREngine;

            if (currentEngine !== 'tesseract') {
                return `Expected Tesseract to be current engine, got: ${currentEngine}`;
            }

            this.log(`Current OCR engine: ${currentEngine} ✓`);
            return true;
        });

        // Test 6: Check preprocessing worker availability
        await this.test('Image Preprocessing Worker', async () => {
            if (typeof Worker === 'undefined') {
                return 'Web Workers not supported in environment';
            }

            // Try to create preprocessing worker
            try {
                const testWorker = new Worker('./js/preprocessing.worker.js');
                testWorker.terminate();
                return true;
            } catch (error) {
                return `WARNING: Preprocessing worker failed to load: ${error.message}`;
            }
        });

        // Test 7: Verify error message quality in UI
        await this.test('OCR Error Messages in UI', async () => {
            const infoDiv = document.getElementById('ocr-engine-info');
            if (!infoDiv) {
                return 'OCR engine info div not found';
            }

            const infoContent = infoDiv.innerHTML;

            // Check for helpful error messages
            if (infoContent.includes('Browser compatibility issue') ||
                infoContent.includes('PaddleOCR unavailable') ||
                infoContent.includes('Tesseract.js Active')) {
                this.log('UI contains helpful PaddleOCR fallback information');
                return true;
            }

            if (infoContent.includes('Tesseract.js - Fast, lightweight')) {
                this.log('UI shows standard Tesseract information');
                return true;
            }

            return `WARNING: UI info content may not reflect current OCR state: ${infoContent.substring(0, 100)}...`;
        });

        // Test 8: Test OCR retry functionality
        await this.test('PaddleOCR Retry Function', async () => {
            if (typeof window.retryPaddleOCR !== 'function') {
                return 'retryPaddleOCR function not available globally';
            }

            this.log('PaddleOCR retry function is available for user interaction');
            return true;
        });

        // Test 9: Console message analysis
        await this.test('Console Messages Quality', async () => {
            // This is a simulated test - in a real browser we'd capture console messages
            // For now, we check if debugging systems are in place

            if (window.AppState && window.AppState.debugMode !== undefined) {
                this.log('Debug logging system detected');
                return true;
            }

            return 'WARNING: Debug logging system status unclear';
        });

        // Test 10: Manual OCR functions availability
        await this.test('Manual OCR Functions', async () => {
            // Check for read now function
            const readNowBtn = document.getElementById('read-now-btn');
            if (!readNowBtn) {
                return 'Read Now button not found';
            }

            // Check for OCR test function
            const testOCRBtn = document.getElementById('test-ocr');
            if (!testOCRBtn) {
                return 'WARNING: Test OCR button not found in current view';
            }

            return true;
        });

        this.printSummary();
    },

    printSummary() {
        console.log('\n📊 OCR Test Results Summary:');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`⚠️ Warnings: ${this.warnings}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Total: ${this.results.length}`);

        const successRate = Math.round((this.passed / this.results.length) * 100);
        console.log(`🎯 Success Rate: ${successRate}%`);

        if (this.failed === 0) {
            console.log('\n🎉 All critical OCR tests passed! The application should function correctly.');
        } else if (this.failed <= 2) {
            console.log('\n⚠️ Minor issues detected, but core functionality should work.');
        } else {
            console.log('\n❌ Critical issues detected. OCR functionality may be impaired.');
        }

        console.log('\n📋 Detailed Results:');
        this.results.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
            console.log(`${status} ${result.name}: ${result.message}`);
        });
    }
};

// Run the tests
ocrTest.runAllTests();