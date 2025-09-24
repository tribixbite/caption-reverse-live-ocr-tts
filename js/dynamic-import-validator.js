/**
 * Dynamic Import Validator for OCR Libraries
 * Tests actual CDN imports and library functionality
 */

export class DynamicImportValidator {
    constructor() {
        this.results = [];
        this.timeouts = new Map();
        this.loadedLibraries = new Map();
    }

    log(message) {
        console.log(`🔍 Import Validator: ${message}`);
    }

    error(message) {
        console.error(`❌ Import Validator: ${message}`);
    }

    success(message) {
        console.log(`✅ Import Validator: ${message}`);
    }

    /**
     * Test dynamic import with timeout and error handling
     */
    async testDynamicImport(name, importFn, timeoutMs = 10000) {
        this.log(`Testing dynamic import: ${name}`);

        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                this.error(`${name} - Import timeout after ${timeoutMs}ms`);
                resolve({
                    name,
                    success: false,
                    error: `Import timeout after ${timeoutMs}ms`,
                    duration: timeoutMs
                });
            }, timeoutMs);

            try {
                const startTime = performance.now();
                const result = await importFn();
                const duration = performance.now() - startTime;

                clearTimeout(timeoutId);

                if (result) {
                    this.success(`${name} - Imported successfully (${Math.round(duration)}ms)`);
                    this.loadedLibraries.set(name, result);
                    resolve({
                        name,
                        success: true,
                        result,
                        duration,
                        error: null
                    });
                } else {
                    this.error(`${name} - Import returned null/undefined`);
                    resolve({
                        name,
                        success: false,
                        error: 'Import returned null/undefined',
                        duration
                    });
                }
            } catch (error) {
                clearTimeout(timeoutId);
                const duration = performance.now() - (performance.now() - timeoutMs);
                this.error(`${name} - Import failed: ${error.message}`);
                resolve({
                    name,
                    success: false,
                    error: error.message,
                    duration
                });
            }
        });
    }

    /**
     * Test script tag loading
     */
    async testScriptLoad(name, url, globalVar, timeoutMs = 10000) {
        this.log(`Testing script load: ${name} from ${url}`);

        return new Promise((resolve) => {
            const startTime = performance.now();

            // Check if already loaded
            if (window[globalVar]) {
                this.success(`${name} - Already loaded`);
                resolve({
                    name,
                    success: true,
                    result: window[globalVar],
                    duration: 0,
                    error: null,
                    cached: true
                });
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;

            const timeoutId = setTimeout(() => {
                script.remove();
                this.error(`${name} - Script load timeout after ${timeoutMs}ms`);
                resolve({
                    name,
                    success: false,
                    error: `Script load timeout after ${timeoutMs}ms`,
                    duration: timeoutMs
                });
            }, timeoutMs);

            script.onload = () => {
                clearTimeout(timeoutId);
                const duration = performance.now() - startTime;

                if (window[globalVar]) {
                    this.success(`${name} - Script loaded successfully (${Math.round(duration)}ms)`);
                    this.loadedLibraries.set(name, window[globalVar]);
                    resolve({
                        name,
                        success: true,
                        result: window[globalVar],
                        duration,
                        error: null
                    });
                } else {
                    this.error(`${name} - Script loaded but ${globalVar} not found in window`);
                    resolve({
                        name,
                        success: false,
                        error: `Global variable ${globalVar} not found`,
                        duration
                    });
                }
                script.remove();
            };

            script.onerror = (error) => {
                clearTimeout(timeoutId);
                const duration = performance.now() - startTime;
                this.error(`${name} - Script load failed: ${error}`);
                resolve({
                    name,
                    success: false,
                    error: `Script load failed: ${error}`,
                    duration
                });
                script.remove();
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Test Tesseract.js imports
     */
    async testTesseractImports() {
        const tests = [];

        // Test 1: CDN Script Tag
        tests.push(await this.testScriptLoad(
            'Tesseract.js CDN Script',
            'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js',
            'Tesseract'
        ));

        // Test 2: ES Module Import
        tests.push(await this.testDynamicImport(
            'Tesseract.js ES Module',
            async () => {
                const module = await import('https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js');
                return module.default || module;
            }
        ));

        // Test 3: Worker Creation Test
        if (this.loadedLibraries.has('Tesseract.js CDN Script')) {
            const tesseract = this.loadedLibraries.get('Tesseract.js CDN Script');
            tests.push(await this.testDynamicImport(
                'Tesseract Worker Creation',
                async () => {
                    if (tesseract && tesseract.createWorker) {
                        const worker = await tesseract.createWorker();
                        return worker;
                    }
                    throw new Error('Tesseract.createWorker not available');
                }
            ));
        }

        return tests;
    }

    /**
     * Test PaddleOCR browser imports
     */
    async testPaddleOCRImports() {
        const tests = [];

        // Test 1: ONNX Runtime (required dependency)
        tests.push(await this.testScriptLoad(
            'ONNX Runtime Web',
            'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js',
            'ort'
        ));

        // Test 2: OpenCV.js (required dependency)
        tests.push(await this.testScriptLoad(
            'OpenCV.js',
            'https://docs.opencv.org/4.8.0/opencv.js',
            'cv',
            15000 // OpenCV takes longer to load
        ));

        // Test 3: eSearch-OCR (PaddleOCR browser wrapper)
        tests.push(await this.testDynamicImport(
            'eSearch-OCR Module',
            async () => {
                const module = await import('https://cdn.jsdelivr.net/npm/esearch-ocr@5.1.5/dist/esearch-ocr.js');
                return module;
            }
        ));

        // Test 4: PaddleOCR Browser Package
        tests.push(await this.testDynamicImport(
            'PaddleOCR Browser',
            async () => {
                // Try different import methods
                try {
                    const module = await import('https://cdn.jsdelivr.net/npm/paddleocr-browser@1.0.3/dist/paddleocr-browser.js');
                    return module;
                } catch (e1) {
                    try {
                        const module = await import('https://cdn.jsdelivr.net/npm/paddleocr-browser@1.0.3/index.js');
                        return module;
                    } catch (e2) {
                        throw new Error(`Multiple import attempts failed: ${e1.message}, ${e2.message}`);
                    }
                }
            }
        ));

        // Test 5: paddleocr-js package
        tests.push(await this.testDynamicImport(
            'PaddleOCR-JS Package',
            async () => {
                const module = await import('https://cdn.jsdelivr.net/npm/paddleocr-js/dist/index.js');
                return module;
            }
        ));

        return tests;
    }

    /**
     * Test functional OCR capabilities
     */
    async testOCRFunctionality() {
        const tests = [];

        // Test Tesseract functionality
        if (this.loadedLibraries.has('Tesseract Worker Creation')) {
            tests.push(await this.testDynamicImport(
                'Tesseract OCR Function Test',
                async () => {
                    const worker = this.loadedLibraries.get('Tesseract Worker Creation');

                    // Test with a simple base64 image
                    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

                    await worker.loadLanguage('eng');
                    await worker.initialize('eng');

                    const { data: { text } } = await worker.recognize(testImage);
                    await worker.terminate();

                    return { text, success: true };
                }
            ));
        }

        // Test PaddleOCR functionality (if dependencies loaded)
        const hasOnnx = this.loadedLibraries.has('ONNX Runtime Web');
        const hasOpenCV = this.loadedLibraries.has('OpenCV.js');
        const hasPaddle = this.loadedLibraries.has('eSearch-OCR Module');

        if (hasOnnx && hasOpenCV && hasPaddle) {
            tests.push(await this.testDynamicImport(
                'PaddleOCR Initialization Test',
                async () => {
                    const paddle = this.loadedLibraries.get('eSearch-OCR Module');
                    const ort = this.loadedLibraries.get('ONNX Runtime Web');
                    const cv = this.loadedLibraries.get('OpenCV.js');

                    // Test initialization
                    const assetsPath = "https://cdn.jsdelivr.net/npm/paddleocr-browser/dist/";
                    const res = await fetch(assetsPath + "ppocr_keys_v1.txt");
                    const dic = await res.text();

                    await paddle.init({
                        detPath: assetsPath + "ppocr_det.onnx",
                        recPath: assetsPath + "ppocr_rec.onnx",
                        dic: dic,
                        ort,
                        node: false,
                        cv: cv
                    });

                    return { initialized: true, success: true };
                }
            ));
        }

        return tests;
    }

    /**
     * Run all import validation tests
     */
    async runAllTests() {
        this.log('Starting comprehensive dynamic import validation');
        console.log('\n🚀 Dynamic Import Validation Suite\n');

        const allTests = [];

        // Test Tesseract.js imports
        console.log('📖 Testing Tesseract.js Imports...');
        const tesseractTests = await this.testTesseractImports();
        allTests.push(...tesseractTests);

        console.log('\n🚀 Testing PaddleOCR Imports...');
        const paddleTests = await this.testPaddleOCRImports();
        allTests.push(...paddleTests);

        console.log('\n⚡ Testing OCR Functionality...');
        const functionalityTests = await this.testOCRFunctionality();
        allTests.push(...functionalityTests);

        // Store results
        this.results = allTests;

        // Print summary
        this.printResults();

        return this.results;
    }

    /**
     * Print comprehensive test results
     */
    printResults() {
        console.log('\n📊 Dynamic Import Validation Results:');
        console.log('=' .repeat(60));

        let passed = 0;
        let failed = 0;
        let totalDuration = 0;

        const categories = {
            tesseract: [],
            paddle: [],
            functionality: []
        };

        // Categorize results
        this.results.forEach(result => {
            totalDuration += result.duration;

            if (result.success) {
                passed++;
            } else {
                failed++;
            }

            if (result.name.toLowerCase().includes('tesseract')) {
                categories.tesseract.push(result);
            } else if (result.name.toLowerCase().includes('paddle') ||
                      result.name.toLowerCase().includes('onnx') ||
                      result.name.toLowerCase().includes('opencv') ||
                      result.name.toLowerCase().includes('esearch')) {
                categories.paddle.push(result);
            } else {
                categories.functionality.push(result);
            }
        });

        // Print by category
        Object.entries(categories).forEach(([category, tests]) => {
            if (tests.length > 0) {
                console.log(`\n${category.toUpperCase()} TESTS:`);
                tests.forEach(result => {
                    const status = result.success ? '✅' : '❌';
                    const duration = `${Math.round(result.duration)}ms`;
                    const cached = result.cached ? ' (cached)' : '';

                    console.log(`${status} ${result.name}: ${duration}${cached}`);
                    if (!result.success && result.error) {
                        console.log(`   Error: ${result.error}`);
                    }
                });
            }
        });

        // Overall summary
        console.log('\n📈 SUMMARY:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️ Total Duration: ${Math.round(totalDuration)}ms`);
        console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        const workingLibraries = this.results.filter(r => r.success).map(r => r.name);
        const failedLibraries = this.results.filter(r => !r.success).map(r => r.name);

        if (workingLibraries.length > 0) {
            console.log('✅ Working imports:');
            workingLibraries.forEach(name => console.log(`  - ${name}`));
        }

        if (failedLibraries.length > 0) {
            console.log('❌ Failed imports:');
            failedLibraries.forEach(name => console.log(`  - ${name}`));
        }

        // Return summary for programmatic use
        return {
            passed,
            failed,
            totalDuration,
            successRate: Math.round((passed / (passed + failed)) * 100),
            workingLibraries,
            failedLibraries,
            results: this.results
        };
    }

    /**
     * Get loaded library for use
     */
    getLoadedLibrary(name) {
        return this.loadedLibraries.get(name);
    }

    /**
     * Clean up loaded resources
     */
    cleanup() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts.clear();
        this.loadedLibraries.clear();
        this.results = [];
    }
}

// Global function for easy testing
window.testDynamicImports = async function() {
    const validator = new DynamicImportValidator();
    const results = await validator.runAllTests();
    window.importValidator = validator; // Store for further use
    return results;
};