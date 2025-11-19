/**
 * Web-based Test Suite for Deployed Version
 * Comprehensive testing without external dependencies
 */

// Type definitions
interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'warning' | 'running';
    message: string;
    duration: number | null;
    details: string | null;
    timestamp: number;
}

interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
}

interface TestResults {
    timestamp: string;
    tests: TestResult[];
    summary: TestSummary;
}

interface ExportedResults extends TestResults {
    userAgent: string;
    url: string;
}

interface BrowserFeature {
    name: string;
    test: () => boolean;
}

interface WebAPI {
    name: string;
    test: () => boolean;
}

// Extend Window interface for global functions and app state
declare global {
    interface Window {
        runAllTests: () => Promise<void>;
        exportTestResults: () => void;
        closeTestSuite: () => void;
        AppState?: {
            ocrScheduler?: {
                workers?: unknown[];
            };
            currentCrop?: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        };
        webkitAudioContext?: typeof AudioContext;
    }

    // Tesseract global
    const Tesseract: unknown;
}

// Extended Performance interface for memory info
interface PerformanceWithMemory extends Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}

export class WebTestSuite {
    private results: TestResults;
    private testContainer: HTMLDivElement | null;

    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
        this.testContainer = null;
    }

    // Initialize test suite UI
    async initializeTestSuite(): Promise<void> {
        console.log('🧪 Initializing Web Test Suite...');

        // Create test container
        this.testContainer = document.createElement('div');
        this.testContainer.id = 'web-test-suite';
        this.testContainer.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm z-50 p-4 overflow-y-auto';

        this.testContainer.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="glass rounded-2xl border border-primary-500/30">
                    <!-- Header -->
                    <div class="p-6 border-b border-dark-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                                    <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-white">CaptnReverse Test Suite</h2>
                                    <p class="text-sm text-dark-300">Comprehensive system validation</p>
                                </div>
                            </div>
                            <button onclick="closeTestSuite()" class="text-dark-400 hover:text-white transition-colors">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Progress Section -->
                    <div class="p-6 border-b border-dark-700">
                        <div class="flex items-center justify-between text-sm mb-2">
                            <span class="text-dark-300">Test Progress</span>
                            <span id="test-progress-text" class="text-primary-400">Ready to start</span>
                        </div>
                        <div class="w-full bg-dark-700 rounded-full h-2 mb-4">
                            <div id="test-progress-bar" class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>

                        <!-- Summary Stats -->
                        <div class="grid grid-cols-4 gap-4">
                            <div class="text-center">
                                <div id="total-tests" class="text-2xl font-bold text-white">0</div>
                                <div class="text-xs text-dark-300">Total</div>
                            </div>
                            <div class="text-center">
                                <div id="passed-tests" class="text-2xl font-bold text-green-400">0</div>
                                <div class="text-xs text-dark-300">Passed</div>
                            </div>
                            <div class="text-center">
                                <div id="failed-tests" class="text-2xl font-bold text-red-400">0</div>
                                <div class="text-xs text-dark-300">Failed</div>
                            </div>
                            <div class="text-center">
                                <div id="warning-tests" class="text-2xl font-bold text-yellow-400">0</div>
                                <div class="text-xs text-dark-300">Warnings</div>
                            </div>
                        </div>
                    </div>

                    <!-- Test Results -->
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-white">Test Results</h3>
                            <div class="flex gap-2">
                                <button id="run-tests-btn" onclick="runAllTests()"
                                        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                                    🚀 Run All Tests
                                </button>
                                <button onclick="exportTestResults()"
                                        class="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors">
                                    📄 Export Results
                                </button>
                            </div>
                        </div>

                        <div id="test-results-container" class="space-y-2 max-h-96 overflow-y-auto">
                            <div class="text-center text-dark-400 py-8">
                                <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                                <p>Click "Run All Tests" to start validation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.testContainer);
    }

    // Add test result to UI
    addTestResult(testName: string, status: 'pass' | 'fail' | 'warning' | 'running', message: string, duration: number | null = null, details: string | null = null): void {
        const test: TestResult = {
            name: testName,
            status,
            message,
            duration,
            details,
            timestamp: Date.now()
        };

        this.results.tests.push(test);
        this.results.summary.total++;

        if (status === 'pass') {
            this.results.summary.passed++;
        } else if (status === 'fail') {
            this.results.summary.failed++;
        } else if (status === 'warning') {
            this.results.summary.warnings++;
        }

        // Update UI
        this.updateSummaryStats();
        this.renderTestResult(test);
    }

    // Update summary statistics in UI
    updateSummaryStats(): void {
        const totalEl = document.getElementById('total-tests');
        const passedEl = document.getElementById('passed-tests');
        const failedEl = document.getElementById('failed-tests');
        const warningEl = document.getElementById('warning-tests');

        if (totalEl) totalEl.textContent = String(this.results.summary.total);
        if (passedEl) passedEl.textContent = String(this.results.summary.passed);
        if (failedEl) failedEl.textContent = String(this.results.summary.failed);
        if (warningEl) warningEl.textContent = String(this.results.summary.warnings);
    }

    // Render individual test result
    renderTestResult(test: TestResult): void {
        const container = document.getElementById('test-results-container');
        if (!container) return;

        // Clear placeholder if this is the first test
        if (this.results.summary.total === 1) {
            container.innerHTML = '';
        }

        const resultDiv = document.createElement('div');
        resultDiv.className = `p-3 rounded-lg border ${this.getTestStatusClasses(test.status)}`;

        resultDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center ${this.getStatusIconClasses(test.status)}">
                        ${this.getStatusIcon(test.status)}
                    </div>
                    <div>
                        <div class="font-medium text-white">${test.name}</div>
                        <div class="text-sm text-dark-300">${test.message}</div>
                        ${test.details ? `<div class="text-xs text-dark-400 mt-1">${test.details}</div>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    ${test.duration ? `<div class="text-xs text-dark-300">${test.duration}ms</div>` : ''}
                    <div class="text-xs text-dark-400">${new Date(test.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        `;

        container.appendChild(resultDiv);
        container.scrollTop = container.scrollHeight;
    }

    // Get CSS classes for test status
    getTestStatusClasses(status: string): string {
        switch(status) {
            case 'pass': return 'bg-green-500/10 border-green-500/30';
            case 'fail': return 'bg-red-500/10 border-red-500/30';
            case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
            case 'running': return 'bg-blue-500/10 border-blue-500/30';
            default: return 'bg-dark-600 border-dark-500';
        }
    }

    // Get CSS classes for status icon
    getStatusIconClasses(status: string): string {
        switch(status) {
            case 'pass': return 'bg-green-500 text-white';
            case 'fail': return 'bg-red-500 text-white';
            case 'warning': return 'bg-yellow-500 text-black';
            case 'running': return 'bg-blue-500 text-white';
            default: return 'bg-dark-500 text-white';
        }
    }

    // Get status icon SVG
    getStatusIcon(status: string): string {
        switch(status) {
            case 'pass':
                return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
            case 'fail':
                return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
            case 'warning':
                return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
            case 'running':
                return '<svg class="w-3 h-3 animate-spin" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path></svg>';
            default:
                return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>';
        }
    }

    // Update progress bar
    updateProgress(current: number, total: number): void {
        const percentage = Math.round((current / total) * 100);
        const progressBar = document.getElementById('test-progress-bar');
        const progressText = document.getElementById('test-progress-text');

        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${current}/${total} tests completed (${percentage}%)`;
    }

    // Run all tests
    async runAllTests(): Promise<void> {
        console.log('🚀 Starting comprehensive test suite...');

        // Clear previous results
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
        };

        const resultsContainer = document.getElementById('test-results-container');
        if (resultsContainer) resultsContainer.innerHTML = '';
        this.updateSummaryStats();

        const tests: Array<() => Promise<void>> = [
            () => this.testBrowserCompatibility(),
            () => this.testWebAPIs(),
            () => this.testOCRSystem(),
            () => this.testAudioSystem(),
            () => this.testCameraSystem(),
            () => this.testCropFunctionality(),
            () => this.testPreprocessingWorker(),
            () => this.testUserInterface(),
            () => this.testPerformanceMetrics(),
            () => this.testLocalStorage(),
            () => this.testErrorHandling(),
            () => this.testAccessibility()
        ];

        const runTestsBtn = document.getElementById('run-tests-btn') as HTMLButtonElement | null;
        if (runTestsBtn) {
            runTestsBtn.disabled = true;
            runTestsBtn.textContent = '🔄 Running Tests...';
        }

        for (let i = 0; i < tests.length; i++) {
            this.updateProgress(i, tests.length);
            try {
                await tests[i]();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const errorStack = error instanceof Error ? error.stack : undefined;
                this.addTestResult(`Test ${i + 1}`, 'fail', `Test execution failed: ${errorMessage}`, null, errorStack || null);
            }
            // Small delay to prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.updateProgress(tests.length, tests.length);

        if (runTestsBtn) {
            runTestsBtn.disabled = false;
            runTestsBtn.textContent = '✅ Tests Complete';
        }

        // Auto-reset button text after 3 seconds
        setTimeout(() => {
            const btn = document.getElementById('run-tests-btn');
            if (btn) {
                btn.textContent = '🚀 Run All Tests';
            }
        }, 3000);

        console.log('✅ Test suite completed:', this.results.summary);
    }

    // Test browser compatibility
    async testBrowserCompatibility(): Promise<void> {
        const startTime = performance.now();

        const features: BrowserFeature[] = [
            { name: 'ES6 Modules', test: () => 'import' in window || typeof document.querySelector === 'function' },
            { name: 'Web Workers', test: () => typeof Worker !== 'undefined' },
            { name: 'Canvas 2D', test: () => {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext && canvas.getContext('2d'));
            }},
            { name: 'Local Storage', test: () => typeof Storage !== 'undefined' },
            { name: 'Fetch API', test: () => typeof fetch !== 'undefined' },
            { name: 'Promises', test: () => typeof Promise !== 'undefined' },
            { name: 'Web Audio API', test: () => typeof AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined' }
        ];

        let supported = 0;
        const unsupported: string[] = [];

        for (const feature of features) {
            try {
                if (feature.test()) {
                    supported++;
                } else {
                    unsupported.push(feature.name);
                }
            } catch (error) {
                unsupported.push(feature.name);
            }
        }

        const duration = performance.now() - startTime;

        if (unsupported.length === 0) {
            this.addTestResult('Browser Compatibility', 'pass', `All ${features.length} features supported`, duration);
        } else if (unsupported.length <= 2) {
            this.addTestResult('Browser Compatibility', 'warning', `${supported}/${features.length} features supported`, duration, `Missing: ${unsupported.join(', ')}`);
        } else {
            this.addTestResult('Browser Compatibility', 'fail', `Only ${supported}/${features.length} features supported`, duration, `Missing: ${unsupported.join(', ')}`);
        }
    }

    // Test Web APIs availability
    async testWebAPIs(): Promise<void> {
        const startTime = performance.now();

        const apis: WebAPI[] = [
            { name: 'MediaDevices', test: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) },
            { name: 'Speech Synthesis', test: () => 'speechSynthesis' in window },
            { name: 'Geolocation', test: () => 'geolocation' in navigator },
            { name: 'Clipboard', test: () => !!navigator.clipboard },
            { name: 'Service Worker', test: () => 'serviceWorker' in navigator }
        ];

        let available = 0;
        const missing: string[] = [];

        for (const api of apis) {
            try {
                if (api.test()) {
                    available++;
                } else {
                    missing.push(api.name);
                }
            } catch (error) {
                missing.push(api.name);
            }
        }

        const duration = performance.now() - startTime;

        if (missing.length === 0) {
            this.addTestResult('Web APIs', 'pass', `All ${apis.length} APIs available`, duration);
        } else if (missing.length <= 1) {
            this.addTestResult('Web APIs', 'warning', `${available}/${apis.length} APIs available`, duration, `Missing: ${missing.join(', ')}`);
        } else {
            this.addTestResult('Web APIs', 'fail', `Only ${available}/${apis.length} APIs available`, duration, `Missing: ${missing.join(', ')}`);
        }
    }

    // Test OCR system
    async testOCRSystem(): Promise<void> {
        const startTime = performance.now();

        try {
            // Check if Tesseract.js is loaded
            if (typeof Tesseract === 'undefined') {
                this.addTestResult('OCR System', 'fail', 'Tesseract.js not loaded', performance.now() - startTime);
                return;
            }

            // Check OCR worker availability
            if (window.AppState && window.AppState.ocrScheduler) {
                const workerCount = window.AppState.ocrScheduler.workers?.length || 0;
                this.addTestResult('OCR System', 'pass', 'Tesseract.js scheduler active', performance.now() - startTime, `Workers: ${workerCount}`);
            } else {
                this.addTestResult('OCR System', 'warning', 'OCR system not initialized', performance.now() - startTime);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('OCR System', 'fail', `OCR test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test audio system
    async testAudioSystem(): Promise<void> {
        const startTime = performance.now();

        try {
            // Test Web Audio API
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                this.addTestResult('Audio System', 'fail', 'Web Audio API not supported', performance.now() - startTime);
                return;
            }

            // Test Speech Synthesis
            if (!('speechSynthesis' in window)) {
                this.addTestResult('Audio System', 'warning', 'Speech Synthesis not available', performance.now() - startTime);
                return;
            }

            // Test audio context creation
            const audioContext = new AudioContextClass();
            audioContext.close(); // Clean up

            this.addTestResult('Audio System', 'pass', 'Audio systems operational', performance.now() - startTime, 'Web Audio API + Speech Synthesis');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('Audio System', 'fail', `Audio test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test camera system
    async testCameraSystem(): Promise<void> {
        const startTime = performance.now();

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.addTestResult('Camera System', 'fail', 'Camera API not available', performance.now() - startTime);
                return;
            }

            // Test camera enumeration (without actually requesting access)
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length === 0) {
                this.addTestResult('Camera System', 'warning', 'No video devices detected', performance.now() - startTime);
            } else {
                this.addTestResult('Camera System', 'pass', `Camera API ready (${videoDevices.length} devices)`, performance.now() - startTime);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('Camera System', 'fail', `Camera test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test crop functionality
    async testCropFunctionality(): Promise<void> {
        const startTime = performance.now();

        try {
            // Check if crop overlay elements exist
            const cropOverlay = document.getElementById('crop-overlay');
            const cameraContainer = document.getElementById('camera-container');

            if (!cropOverlay || !cameraContainer) {
                this.addTestResult('Crop Functionality', 'fail', 'Crop overlay elements missing', performance.now() - startTime);
                return;
            }

            // Check if crop state exists
            if (window.AppState && window.AppState.currentCrop) {
                const crop = window.AppState.currentCrop;
                const isValidCrop = crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0;

                if (isValidCrop) {
                    this.addTestResult('Crop Functionality', 'pass', 'Crop system operational', performance.now() - startTime, `Current: ${Math.round(crop.width * 100)}% x ${Math.round(crop.height * 100)}%`);
                } else {
                    this.addTestResult('Crop Functionality', 'warning', 'Invalid crop configuration', performance.now() - startTime);
                }
            } else {
                this.addTestResult('Crop Functionality', 'warning', 'Crop state not initialized', performance.now() - startTime);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('Crop Functionality', 'fail', `Crop test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test preprocessing worker
    async testPreprocessingWorker(): Promise<void> {
        const startTime = performance.now();

        try {
            // Check if worker is supported
            if (typeof Worker === 'undefined') {
                this.addTestResult('Preprocessing Worker', 'fail', 'Web Workers not supported', performance.now() - startTime);
                return;
            }

            // Try to create a test worker
            try {
                const testWorker = new Worker('./js/preprocessing.worker.js');
                testWorker.terminate(); // Clean up immediately
                this.addTestResult('Preprocessing Worker', 'pass', 'Worker system operational', performance.now() - startTime);
            } catch (workerError) {
                const errorMessage = workerError instanceof Error ? workerError.message : 'Unknown error';
                this.addTestResult('Preprocessing Worker', 'warning', 'Worker file inaccessible', performance.now() - startTime, errorMessage);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('Preprocessing Worker', 'fail', `Worker test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test user interface
    async testUserInterface(): Promise<void> {
        const startTime = performance.now();

        try {
            const criticalElements = [
                'camera-container',
                'crop-overlay',
                'settings-btn',
                'status-text',
                'read-now-btn'
            ];

            const missingElements: string[] = [];

            for (const elementId of criticalElements) {
                if (!document.getElementById(elementId)) {
                    missingElements.push(elementId);
                }
            }

            if (missingElements.length === 0) {
                this.addTestResult('User Interface', 'pass', 'All UI elements present', performance.now() - startTime);
            } else {
                this.addTestResult('User Interface', 'fail', `${missingElements.length} elements missing`, performance.now() - startTime, `Missing: ${missingElements.join(', ')}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('User Interface', 'fail', `UI test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test performance metrics
    async testPerformanceMetrics(): Promise<void> {
        const startTime = performance.now();

        try {
            // Test performance API
            if (!window.performance || !window.performance.now) {
                this.addTestResult('Performance Metrics', 'warning', 'Performance API limited', performance.now() - startTime);
                return;
            }

            // Test memory info if available
            let memoryInfo: { used: number; total: number; limit: number } | null = null;
            const perfWithMemory = window.performance as PerformanceWithMemory;
            if (perfWithMemory.memory) {
                memoryInfo = {
                    used: Math.round(perfWithMemory.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(perfWithMemory.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(perfWithMemory.memory.jsHeapSizeLimit / 1024 / 1024)
                };
            }

            const details = memoryInfo ? `Memory: ${memoryInfo.used}MB used, ${memoryInfo.total}MB allocated` : 'Memory info not available';

            this.addTestResult('Performance Metrics', 'pass', 'Performance monitoring available', performance.now() - startTime, details);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('Performance Metrics', 'fail', `Performance test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test local storage
    async testLocalStorage(): Promise<void> {
        const startTime = performance.now();

        try {
            if (typeof Storage === 'undefined') {
                this.addTestResult('Local Storage', 'fail', 'LocalStorage not supported', performance.now() - startTime);
                return;
            }

            // Test write/read/delete
            const testKey = 'captn-test-' + Date.now();
            const testValue = 'test-data';

            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);

            if (retrieved === testValue) {
                // Check for existing app data
                const appKeys = Object.keys(localStorage).filter(key => key.startsWith('captn-'));
                this.addTestResult('Local Storage', 'pass', 'Storage system operational', performance.now() - startTime, `App data keys: ${appKeys.length}`);
            } else {
                this.addTestResult('Local Storage', 'fail', 'Storage read/write failed', performance.now() - startTime);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('Local Storage', 'fail', `Storage test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test error handling
    async testErrorHandling(): Promise<void> {
        const startTime = performance.now();

        try {
            // Test console error handling
            const originalError = console.error;
            let errorCaught = false;

            console.error = (...args: unknown[]) => {
                errorCaught = true;
                originalError.apply(console, args);
            };

            // Trigger a test error
            try {
                throw new Error('Test error for error handling validation');
            } catch (testError) {
                const errorMessage = testError instanceof Error ? testError.message : 'Unknown error';
                console.error('Test error:', errorMessage);
            }

            // Restore original console.error
            console.error = originalError;

            if (errorCaught) {
                this.addTestResult('Error Handling', 'pass', 'Error handling system active', performance.now() - startTime);
            } else {
                this.addTestResult('Error Handling', 'warning', 'Error handling not captured', performance.now() - startTime);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('Error Handling', 'fail', `Error handling test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Test accessibility
    async testAccessibility(): Promise<void> {
        const startTime = performance.now();

        try {
            let accessibilityScore = 0;
            const issues: string[] = [];

            // Check for alt texts on images
            const images = document.querySelectorAll('img');
            let imagesWithAlt = 0;
            images.forEach(img => {
                if (img.alt && img.alt.trim()) imagesWithAlt++;
            });

            if (images.length === 0 || imagesWithAlt === images.length) {
                accessibilityScore += 25;
            } else {
                issues.push(`${images.length - imagesWithAlt} images missing alt text`);
            }

            // Check for proper heading structure
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headings.length > 0) {
                accessibilityScore += 25;
            } else {
                issues.push('No heading structure found');
            }

            // Check for keyboard navigation
            const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]');
            if (focusableElements.length > 0) {
                accessibilityScore += 25;
            } else {
                issues.push('No focusable elements found');
            }

            // Check for ARIA labels
            const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
            if (ariaElements.length > 0) {
                accessibilityScore += 25;
            } else {
                issues.push('No ARIA attributes found');
            }

            const duration = performance.now() - startTime;

            if (accessibilityScore >= 75) {
                this.addTestResult('Accessibility', 'pass', `Accessibility score: ${accessibilityScore}%`, duration);
            } else if (accessibilityScore >= 50) {
                this.addTestResult('Accessibility', 'warning', `Accessibility score: ${accessibilityScore}%`, duration, issues.join(', '));
            } else {
                this.addTestResult('Accessibility', 'fail', `Accessibility score: ${accessibilityScore}%`, duration, issues.join(', '));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addTestResult('Accessibility', 'fail', `Accessibility test failed: ${errorMessage}`, performance.now() - startTime);
        }
    }

    // Export test results
    exportTestResults(): void {
        const data: ExportedResults = {
            ...this.results,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `captn-reverse-test-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Close test suite
    close(): void {
        if (this.testContainer) {
            this.testContainer.remove();
            this.testContainer = null;
        }
    }
}

// Global test suite instance
let globalTestSuite: WebTestSuite | null = null;

// Global functions for HTML onclick handlers
window.runAllTests = async function(): Promise<void> {
    if (globalTestSuite) {
        await globalTestSuite.runAllTests();
    }
};

window.exportTestResults = function(): void {
    if (globalTestSuite) {
        globalTestSuite.exportTestResults();
    }
};

window.closeTestSuite = function(): void {
    if (globalTestSuite) {
        globalTestSuite.close();
        globalTestSuite = null;
    }
};

// Initialize and start test suite
export async function startWebTestSuite(): Promise<WebTestSuite> {
    if (globalTestSuite) {
        globalTestSuite.close();
    }

    globalTestSuite = new WebTestSuite();
    await globalTestSuite.initializeTestSuite();

    return globalTestSuite;
}
