/**
 * Setup Wizard Module - Guided OCR optimization and parameter tuning
 * Helps users optimize OCR settings for their specific use case
 */

import { AppState, CONFIG } from './config.js';
import { updateStatus } from './ui.js';
import { runAutoCalibration, initOCR, isOCRReady } from './ocr.js';
import { processFrame } from './ocr.js';

// Wizard state interface
interface WizardState {
    step: number;
    totalSteps: number;
    results: {
        cameraTest?: { success: boolean; stream?: MediaStream; error?: string };
        textType?: string;
        optimization?: { success: boolean; error?: string };
    };
    currentTest: string | null;
    userFeedback: string[];
}

// Setup wizard state
let wizardState: WizardState = {
    step: 0,
    totalSteps: 5,
    results: {},
    currentTest: null,
    userFeedback: []
};

// Initialize and show setup wizard
export async function startSetupWizard(): Promise<void> {
    console.log('🧙‍♂️ Starting OCR Setup Wizard...');

    // Reset wizard state
    wizardState = {
        step: 0,
        totalSteps: 5,
        results: {},
        currentTest: null,
        userFeedback: []
    };

    showWizardModal();
    await nextWizardStep();
}

// Show wizard modal
function showWizardModal(): void {
    // Remove existing wizard if any
    const existingWizard = document.getElementById('setup-wizard-modal');
    if (existingWizard) {
        existingWizard.remove();
    }

    const wizardModal = document.createElement('div');
    wizardModal.id = 'setup-wizard-modal';
    wizardModal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';

    wizardModal.innerHTML = `
        <div class="bg-dark-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-500/30">
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-white">OCR Setup Wizard</h2>
                            <p class="text-sm text-dark-300">Optimize settings for your use case</p>
                        </div>
                    </div>
                    <button onclick="closeSetupWizard()" class="text-dark-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Progress Bar -->
                <div class="mb-6">
                    <div class="flex justify-between text-sm text-dark-300 mb-2">
                        <span>Step <span id="wizard-current-step">1</span> of <span id="wizard-total-steps">5</span></span>
                        <span id="wizard-progress-percent">20%</span>
                    </div>
                    <div class="w-full bg-dark-700 rounded-full h-2">
                        <div id="wizard-progress-bar" class="bg-gradient-to-r from-primary-500 to-secondary-600 h-2 rounded-full transition-all duration-500" style="width: 20%"></div>
                    </div>
                </div>

                <!-- Step Content -->
                <div id="wizard-step-content" class="min-h-[300px]">
                    <!-- Dynamic content will be inserted here -->
                </div>

                <!-- Navigation -->
                <div class="flex justify-between mt-6 pt-6 border-t border-dark-700">
                    <button id="wizard-prev-btn" onclick="previousWizardStep()"
                            class="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        ← Previous
                    </button>
                    <button id="wizard-next-btn" onclick="nextWizardStep()"
                            class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                        Next →
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(wizardModal);
}

// Navigate to next wizard step
export async function nextWizardStep(): Promise<void> {
    wizardState.step++;

    // Update progress
    const progressPercent = Math.round((wizardState.step / wizardState.totalSteps) * 100);
    const currentStepEl = document.getElementById('wizard-current-step');
    const progressPercentEl = document.getElementById('wizard-progress-percent');
    const progressBar = document.getElementById('wizard-progress-bar');

    if (currentStepEl) currentStepEl.textContent = String(wizardState.step);
    if (progressPercentEl) progressPercentEl.textContent = `${progressPercent}%`;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    // Update navigation buttons
    const prevBtn = document.getElementById('wizard-prev-btn') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('wizard-next-btn') as HTMLButtonElement | null;

    if (prevBtn) prevBtn.disabled = wizardState.step <= 1;

    if (nextBtn && wizardState.step >= wizardState.totalSteps) {
        nextBtn.textContent = 'Complete Setup';
        nextBtn.onclick = completeSetupWizard;
    }

    // Load step content
    await loadWizardStep(wizardState.step);
}

// Navigate to previous wizard step
export function previousWizardStep(): void {
    if (wizardState.step > 1) {
        wizardState.step--;
        nextWizardStep();
    }
}

// Load content for current wizard step
async function loadWizardStep(step: number): Promise<void> {
    const contentDiv = document.getElementById('wizard-step-content');
    if (!contentDiv) return;

    switch (step) {
        case 1:
            contentDiv.innerHTML = getWelcomeStepContent();
            break;
        case 2:
            contentDiv.innerHTML = getCameraTestStepContent();
            await initializeCameraTest();
            break;
        case 3:
            contentDiv.innerHTML = getTextTypeStepContent();
            break;
        case 4:
            contentDiv.innerHTML = getOptimizationStepContent();
            await runOptimizationTests();
            break;
        case 5:
            contentDiv.innerHTML = getCompletionStepContent();
            break;
    }
}

// Step 1: Welcome and introduction
function getWelcomeStepContent(): string {
    return `
        <div class="text-center space-y-6">
            <div class="w-24 h-24 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto">
                <svg class="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
            </div>

            <div>
                <h3 class="text-2xl font-bold text-white mb-3">Welcome to OCR Setup</h3>
                <p class="text-dark-300 text-lg leading-relaxed max-w-lg mx-auto">
                    This wizard will help optimize CaptnReverse for your specific use case.
                    We'll test different settings and find the best configuration for your needs.
                </p>
            </div>

            <div class="grid md:grid-cols-2 gap-4 mt-8">
                <div class="glass rounded-xl p-4 text-left">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h4 class="font-medium text-white">Automatic Testing</h4>
                    </div>
                    <p class="text-sm text-dark-300">Test multiple OCR configurations automatically</p>
                </div>

                <div class="glass rounded-xl p-4 text-left">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                        </div>
                        <h4 class="font-medium text-white">Smart Optimization</h4>
                    </div>
                    <p class="text-sm text-dark-300">AI-powered parameter tuning for your content</p>
                </div>
            </div>

            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-6">
                <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <div class="text-left">
                        <p class="text-sm text-yellow-200 font-medium">Setup takes 2-3 minutes</p>
                        <p class="text-xs text-yellow-300/80">Make sure your camera is working and you have good lighting</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Step 2: Camera test
function getCameraTestStepContent(): string {
    return `
        <div class="space-y-6">
            <div class="text-center">
                <h3 class="text-xl font-bold text-white mb-3">Camera Test</h3>
                <p class="text-dark-300">Let's make sure your camera is working properly</p>
            </div>

            <div id="wizard-camera-test" class="aspect-video bg-dark-800 rounded-xl overflow-hidden relative border-2 border-dashed border-dark-600">
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                        <div class="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg class="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                            </svg>
                        </div>
                        <p class="text-dark-300">Initializing camera...</p>
                    </div>
                </div>
            </div>

            <div id="wizard-camera-status" class="text-center">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg">
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Testing camera...
                </div>
            </div>
        </div>
    `;
}

// Initialize camera test
async function initializeCameraTest(): Promise<void> {
    try {
        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.className = 'w-full h-full object-cover';

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        const testContainer = document.getElementById('wizard-camera-test');
        if (testContainer) {
            testContainer.innerHTML = '';
            testContainer.appendChild(video);
        }

        // Update status
        const statusDiv = document.getElementById('wizard-camera-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Camera working perfectly!
                </div>
            `;
        }

        wizardState.results.cameraTest = { success: true, stream };

    } catch (error) {
        console.error('Camera test failed:', error);

        const statusDiv = document.getElementById('wizard-camera-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Camera access failed: ${(error as Error).message}
                </div>
            `;
        }

        wizardState.results.cameraTest = { success: false, error: (error as Error).message };
    }
}

// Step 3: Text type selection
function getTextTypeStepContent(): string {
    return `
        <div class="space-y-6">
            <div class="text-center">
                <h3 class="text-xl font-bold text-white mb-3">What type of text will you read?</h3>
                <p class="text-dark-300">This helps us optimize the OCR settings for your specific use case</p>
            </div>

            <div class="grid gap-4">
                <label class="wizard-text-type-option glass rounded-xl p-4 cursor-pointer border-2 border-transparent hover:border-primary-500/50 transition-all">
                    <input type="radio" name="textType" value="gaming" class="sr-only">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-gaming-blue/20 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6 text-gaming-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6-4h12a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"></path>
                            </svg>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="font-medium text-white">Gaming Text</h4>
                            <p class="text-sm text-dark-300">Game UI, dialogue, notifications</p>
                        </div>
                    </div>
                </label>

                <label class="wizard-text-type-option glass rounded-xl p-4 cursor-pointer border-2 border-transparent hover:border-primary-500/50 transition-all">
                    <input type="radio" name="textType" value="movies" class="sr-only">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0v16l5-3 5 3V4"></path>
                            </svg>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="font-medium text-white">Movies & Videos</h4>
                            <p class="text-sm text-dark-300">Subtitles, credits, on-screen text</p>
                        </div>
                    </div>
                </label>

                <label class="wizard-text-type-option glass rounded-xl p-4 cursor-pointer border-2 border-transparent hover:border-primary-500/50 transition-all">
                    <input type="radio" name="textType" value="documents" class="sr-only">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="font-medium text-white">Documents & Books</h4>
                            <p class="text-sm text-dark-300">Paper documents, books, articles</p>
                        </div>
                    </div>
                </label>

                <label class="wizard-text-type-option glass rounded-xl p-4 cursor-pointer border-2 border-transparent hover:border-primary-500/50 transition-all">
                    <input type="radio" name="textType" value="mixed" class="sr-only">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                            </svg>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="font-medium text-white">Mixed Content</h4>
                            <p class="text-sm text-dark-300">Various types of text content</p>
                        </div>
                    </div>
                </label>
            </div>
        </div>
    `;
}

// Step 4: Optimization tests
function getOptimizationStepContent(): string {
    return `
        <div class="space-y-6">
            <div class="text-center">
                <h3 class="text-xl font-bold text-white mb-3">Running Optimization Tests</h3>
                <p class="text-dark-300">Testing different OCR configurations to find the best settings</p>
            </div>

            <div id="optimization-progress" class="space-y-4">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-dark-300">Testing configurations...</span>
                    <span id="optimization-percent" class="text-primary-400">0%</span>
                </div>
                <div class="w-full bg-dark-700 rounded-full h-2">
                    <div id="optimization-progress-bar" class="bg-gradient-to-r from-primary-500 to-secondary-600 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
            </div>

            <div id="optimization-results" class="space-y-4">
                <!-- Results will be populated here -->
            </div>

            <div id="optimization-status" class="text-center">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg">
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Starting optimization tests...
                </div>
            </div>
        </div>
    `;
}

// Run optimization tests
async function runOptimizationTests(): Promise<void> {
    const statusDiv = document.getElementById('optimization-status');
    const progressBar = document.getElementById('optimization-progress-bar');
    const progressPercent = document.getElementById('optimization-percent');
    const resultsDiv = document.getElementById('optimization-results');

    try {
        // FIXED: First ensure OCR is initialized
        if (!isOCRReady()) {
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg">
                        <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Initializing OCR system...
                    </div>
                `;
            }

            console.log('🤖 OCR not initialized, initializing now...');
            await initOCR();
            console.log('✅ OCR initialization complete');
        }

        // Check if camera stream is available from the wizard test
        if (!AppState.stream && wizardState.results.cameraTest?.stream) {
            // Use the stream from camera test
            AppState.stream = wizardState.results.cameraTest.stream;

            // Also set up the video element
            const cameraFeed = document.getElementById('camera-feed') as HTMLVideoElement | null;
            if (cameraFeed) {
                cameraFeed.srcObject = wizardState.results.cameraTest.stream;
            }
        }

        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg">
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Running auto-calibration...
                </div>
            `;
        }

        // Simulate progress during auto-calibration
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressPercent) progressPercent.textContent = `${progress}%`;

            if (progress >= 100) {
                clearInterval(progressInterval);
            }
        }, 500);

        // Run actual auto-calibration
        await runAutoCalibration();

        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';
        if (progressPercent) progressPercent.textContent = '100%';

        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Optimization completed successfully!
                </div>
            `;
        }

        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="glass rounded-xl p-4">
                    <h4 class="font-medium text-white mb-3">Optimization Results</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-dark-300">Configurations tested:</span>
                            <span class="text-white">9</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-dark-300">Best configuration:</span>
                            <span class="text-green-400">Auto-selected</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-dark-300">Optimization status:</span>
                            <span class="text-green-400">✅ Complete</span>
                        </div>
                    </div>
                </div>
            `;
        }

        wizardState.results.optimization = { success: true };

    } catch (error) {
        console.error('Optimization failed:', error);

        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Optimization failed: ${(error as Error).message}
                </div>
            `;
        }

        wizardState.results.optimization = { success: false, error: (error as Error).message };
    }
}

// Step 5: Completion
function getCompletionStepContent(): string {
    const cameraSuccess = wizardState.results.cameraTest?.success ?? false;
    const optimizationSuccess = wizardState.results.optimization?.success ?? false;

    return `
        <div class="text-center space-y-6">
            <div class="w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                <svg class="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>

            <div>
                <h3 class="text-2xl font-bold text-white mb-3">Setup Complete!</h3>
                <p class="text-dark-300 text-lg">
                    CaptnReverse has been optimized for your use case
                </p>
            </div>

            <div class="space-y-3">
                <div class="flex items-center justify-between glass rounded-lg p-3">
                    <span class="text-dark-300">Camera Test</span>
                    <span class="${cameraSuccess ? 'text-green-400' : 'text-red-400'}">
                        ${cameraSuccess ? '✅ Passed' : '❌ Failed'}
                    </span>
                </div>

                <div class="flex items-center justify-between glass rounded-lg p-3">
                    <span class="text-dark-300">OCR Optimization</span>
                    <span class="${optimizationSuccess ? 'text-green-400' : 'text-red-400'}">
                        ${optimizationSuccess ? '✅ Optimized' : '❌ Failed'}
                    </span>
                </div>

                <div class="flex items-center justify-between glass rounded-lg p-3">
                    <span class="text-dark-300">Text Type</span>
                    <span class="text-blue-400 capitalize">
                        ${wizardState.results.textType || 'Not selected'}
                    </span>
                </div>
            </div>

            <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p class="text-green-200 font-medium">🎉 Ready to use!</p>
                <p class="text-green-300/80 text-sm mt-1">
                    Your OCR settings have been optimized. You can always re-run this setup from the settings menu.
                </p>
            </div>
        </div>
    `;
}

// Complete setup wizard
export function completeSetupWizard(): void {
    // Save wizard results
    localStorage.setItem('setupWizardResults', JSON.stringify({
        timestamp: Date.now(),
        results: wizardState.results,
        version: '1.0'
    }));

    // Close wizard
    closeSetupWizard();

    // Show success notification
    updateStatus('Setup wizard completed successfully!', 'bg-green-400');

    console.log('🎉 Setup wizard completed:', wizardState.results);
}

// Close setup wizard
export function closeSetupWizard(): void {
    const wizard = document.getElementById('setup-wizard-modal');
    if (wizard) {
        wizard.remove();
    }
}

// Make functions globally accessible
(window as any).nextWizardStep = nextWizardStep;
(window as any).previousWizardStep = previousWizardStep;
(window as any).completeSetupWizard = completeSetupWizard;
(window as any).closeSetupWizard = closeSetupWizard;
(window as any).wizardState = wizardState;

// Initialize text type selection handling
function initTextTypeSelection(): void {
    // This is called after the step content is loaded
    document.querySelectorAll('.wizard-text-type-option').forEach(option => {
        option.addEventListener('click', function(this: HTMLElement) {
            // Remove previous selection
            document.querySelectorAll('.wizard-text-type-option').forEach(opt => {
                opt.classList.remove('border-primary-500');
                opt.classList.add('border-transparent');
            });

            // Add selection to current option
            this.classList.remove('border-transparent');
            this.classList.add('border-primary-500');

            // Check the radio button
            const radio = this.querySelector('input[type="radio"]') as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                wizardState.results.textType = radio.value;
            }
        });
    });
}
