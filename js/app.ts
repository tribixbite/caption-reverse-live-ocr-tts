/**
 * Main Application Entry Point - CaptnReverse OCR & TTS
 * Coordinates all modules and handles application lifecycle
 */

import { AppState } from './config.js';
import { initOCR, switchOCREngine, readNow, runAutoCalibration } from './ocr.js';
import { requestCamera, checkSecureContext, cleanupCamera, applyCameraZoom, applyCameraFocus, setAutoFocus } from './camera.js';
import { speak, initVoices, stopSpeech, testTTS } from './speech.js';
import { loadSettings, saveSettings, openSettings, closeSettings, updateSettingsModalValues, updateModalAutoReadToggle, updateDebugToggle, updateDebugSizingButtons } from './settings.js';
import { updateStatus, setupCropSelector, setCrop, toggleMonitoring } from './ui.js';
import { initializeDebugLogging, toggleDebugConsole } from './debug.js';
import { initPerformanceMonitoring, generatePerformanceReport, stopPerformanceMonitoring } from './performance.js';
import { initHotkeySystem, cleanupHotkeySystem, updateLastRecognizedText } from './hotkeys.js';
import { initHistorySystem, cleanupHistorySystem } from './history.js';
import { initMultiMonitorSupport, cleanupMultiMonitorSystem, updateSecondaryMonitor } from './multimonitor.js';
import { initVoiceCommands, cleanupVoiceCommands, loadVoicePreferencesDelayed } from './voice-commands.js';
import { initDiscordRPC, cleanupDiscordRPC } from './discord-rpc.js';
import { initSteamDeckOptimizations } from './steamdeck.js';
import { startSetupWizard } from './setup-wizard.js';
import { startWebTestSuite } from './web-test-suite.js';
import type { PerformanceReport, CropArea } from './types.js';

// Extend Window interface for global functions
declare global {
    interface Window {
        setCrop: (crop: CropArea) => void;
        speak: (text: string) => void;
    }
}

// Initialize application
async function init(): Promise<void> {
    initializeDebugLogging(); // Initialize debug logging first
    console.log('🔧 Initializing CaptnReverse...');
    loadSettings(); // Load saved settings first
    setupEventListeners();
    initVoices(); // Initialize voice loading
    initPerformanceMonitoring(); // Initialize performance monitoring
    initHotkeySystem(); // Initialize gaming hotkey system
    initHistorySystem(); // Initialize OCR history system
    await initMultiMonitorSupport(); // Initialize multi-monitor gaming support
    initVoiceCommands(); // Initialize voice command system
    initDiscordRPC(); // Initialize Discord Rich Presence
    initSteamDeckOptimizations(); // Initialize handheld gaming optimizations
    await initOCR();
    checkSecureContext();

    // Load voice preferences after everything is initialized
    loadVoicePreferencesDelayed();

    console.log('✅ CaptnReverse ready with Ultimate Gaming Arsenal!');
}

// Set up all event listeners
function setupEventListeners(): void {
    console.log('🔧 Setting up event listeners...');

    // Camera permission
    const requestCameraBtn = document.getElementById('request-camera');
    if (requestCameraBtn) {
        requestCameraBtn.addEventListener('click', requestCamera);
        console.log('✅ Camera request button listener added');
    }

    // Monitoring toggle
    const monitorToggleBtn = document.getElementById('monitor-toggle');
    if (monitorToggleBtn) {
        monitorToggleBtn.addEventListener('click', toggleMonitoring);
        console.log('✅ Monitor toggle button listener added');
    }

    // Read now
    const readNowBtn = document.getElementById('read-now-btn');
    if (readNowBtn) {
        readNowBtn.addEventListener('click', readNow);
        console.log('✅ Read now button listener added');
    }

    // Test TTS
    const testTTSBtn = document.getElementById('test-tts-btn');
    if (testTTSBtn) {
        testTTSBtn.addEventListener('click', testTTS);
        console.log('✅ Test TTS button listener added');
    }

    // Setup wizard
    const setupWizardBtn = document.getElementById('setup-wizard-btn');
    if (setupWizardBtn) {
        setupWizardBtn.addEventListener('click', startSetupWizard);
        console.log('✅ Setup wizard button listener added');
    }

    // Web test suite
    const webTestsBtn = document.getElementById('web-test-suite-btn');
    if (webTestsBtn) {
        webTestsBtn.addEventListener('click', startWebTestSuite);
        console.log('✅ Web test suite button listener added');
    }

    // Stop speech
    const stopSpeechBtn = document.getElementById('stop-speech-btn');
    if (stopSpeechBtn) {
        stopSpeechBtn.addEventListener('click', stopSpeech);
        console.log('✅ Stop speech button listener added');
    }

    // Speak detected text button (only exists after camera is active)
    setTimeout(() => {
        const speakBtn = document.getElementById('speak-text-btn');
        if (speakBtn) {
            speakBtn.addEventListener('click', () => {
                const detectedTextEl = document.getElementById('detected-text');
                const text = detectedTextEl?.textContent;
                if (text) speak(text);
            });
            console.log('✅ Speak text button listener added');
        }
    }, 100);

    // Settings modal - CRITICAL FIX
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            openSettings();
        });
        console.log('✅ Settings button listener added');
    } else {
        console.error('❌ Settings button or modal not found!');
    }

    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            closeSettings();
        });
        console.log('✅ Close settings button listener added');
    } else {
        console.error('❌ Close settings button not found!');
    }

    // Alternative click handler for settings (fallback)
    document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('#settings-btn') || target.id === 'settings-btn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ Settings button clicked via fallback handler');
            openSettings();
        }
    });

    // Camera zoom
    const cameraZoomEl = document.getElementById('camera-zoom') as HTMLInputElement | null;
    const zoomValueEl = document.getElementById('zoom-value');
    if (cameraZoomEl && zoomValueEl) {
        cameraZoomEl.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            AppState.cameraZoom = parseFloat(target.value);
            zoomValueEl.textContent = AppState.cameraZoom.toFixed(1);
            applyCameraZoom();
        });
    }

    // Camera focus
    const cameraFocusEl = document.getElementById('camera-focus') as HTMLInputElement | null;
    const focusValueEl = document.getElementById('focus-value');
    if (cameraFocusEl && focusValueEl) {
        cameraFocusEl.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const focusDistance = parseFloat(target.value);
            focusValueEl.textContent = focusDistance === 500 ? 'Auto' : focusDistance.toFixed(2);
            applyCameraFocus(focusDistance);
        });
    }

    // Auto focus button
    const focusAutoBtn = document.getElementById('focus-auto');
    if (focusAutoBtn) {
        focusAutoBtn.addEventListener('click', () => {
            setAutoFocus();
        });
    }

    // Crop selector
    setupCropSelector();
    setupSettingsEventListeners();
}

// Set up settings-specific event listeners
function setupSettingsEventListeners(): void {
    // OCR Engine toggle
    const ocrTesseractBtn = document.getElementById('ocr-tesseract');
    const ocrPaddleBtn = document.getElementById('ocr-paddle');
    if (ocrTesseractBtn) {
        ocrTesseractBtn.addEventListener('click', () => switchOCREngine('tesseract'));
    }
    if (ocrPaddleBtn) {
        ocrPaddleBtn.addEventListener('click', () => switchOCREngine('paddle'));
    }

    // Auto-read toggle (modal)
    const autoReadToggleModal = document.getElementById('auto-read-toggle-modal');
    if (autoReadToggleModal) {
        autoReadToggleModal.addEventListener('click', () => {
            AppState.settings.autoRead = !AppState.settings.autoRead;
            updateModalAutoReadToggle();
            saveSettings();
            console.log(`🔊 Auto-read toggled: ${AppState.settings.autoRead}`);
        });
    }

    // Speech settings (modal)
    const speechRateModal = document.getElementById('speech-rate-modal') as HTMLInputElement | null;
    const rateValueModal = document.getElementById('rate-value-modal');
    if (speechRateModal && rateValueModal) {
        speechRateModal.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            AppState.settings.speechRate = parseFloat(target.value);
            rateValueModal.textContent = String(AppState.settings.speechRate);
            saveSettings();
        });
    }

    const speechVolumeEl = document.getElementById('speech-volume') as HTMLInputElement | null;
    const volumeValueEl = document.getElementById('volume-value');
    if (speechVolumeEl && volumeValueEl) {
        speechVolumeEl.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const volume = parseInt(target.value);
            volumeValueEl.textContent = String(volume);
            saveSettings();
        });
    }

    // OCR settings (modal)
    const sensitivityModal = document.getElementById('sensitivity-modal') as HTMLInputElement | null;
    const sensitivityValueModal = document.getElementById('sensitivity-value-modal');
    if (sensitivityModal && sensitivityValueModal) {
        sensitivityModal.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            AppState.settings.sensitivity = parseInt(target.value);
            sensitivityValueModal.textContent = String(AppState.settings.sensitivity);
            saveSettings();
            console.log(`🎯 Sensitivity updated to ${AppState.settings.sensitivity}%`);
        });
    }

    const thresholdSliderModal = document.getElementById('threshold-slider-modal') as HTMLInputElement | null;
    const thresholdValueModal = document.getElementById('threshold-value-modal');
    if (thresholdSliderModal && thresholdValueModal) {
        thresholdSliderModal.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            AppState.settings.imageThreshold = parseInt(target.value);
            thresholdValueModal.textContent = String(AppState.settings.imageThreshold);
            saveSettings();
        });
    }

    const processingIntervalEl = document.getElementById('processing-interval') as HTMLInputElement | null;
    const intervalValueEl = document.getElementById('interval-value');
    if (processingIntervalEl && intervalValueEl) {
        processingIntervalEl.addEventListener('input', async (e: Event) => {
            const target = e.target as HTMLInputElement;
            AppState.settings.processingInterval = parseInt(target.value);
            intervalValueEl.textContent = String(AppState.settings.processingInterval);
            if (AppState.isMonitoring) {
                const { stopMonitoring, startMonitoring } = await import('./ui.js');
                stopMonitoring();
                startMonitoring(); // Restart with new interval
            }
            saveSettings();
        });
    }

    // Debug toggle
    const debugToggleBtn = document.getElementById('debug-toggle');
    if (debugToggleBtn) {
        debugToggleBtn.addEventListener('click', () => {
            AppState.settings.showDebugCanvas = !AppState.settings.showDebugCanvas;
            updateDebugToggle();
            if (!AppState.settings.showDebugCanvas) {
                // Remove debug elements
                const elements = ['debug-canvas', 'debug-label', 'debug-text'];
                elements.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                });
            }
            saveSettings();
        });
    }

    // Debug sizing control
    const debugSizingControl = document.getElementById('debug-sizing-control');
    if (debugSizingControl) {
        debugSizingControl.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON') {
                const button = target as HTMLButtonElement;
                const newSize = button.dataset.size as 'constrained' | 'autoWidth';
                if (newSize) {
                    AppState.settings.debugViewSizing = newSize;
                    saveSettings();

                    // Update button styles
                    const buttons = document.querySelectorAll('#debug-sizing-control button');
                    buttons.forEach(btn => {
                        const btnEl = btn as HTMLButtonElement;
                        btnEl.classList.toggle('bg-primary-600', btnEl.dataset.size === newSize);
                        btnEl.classList.toggle('bg-dark-600', btnEl.dataset.size !== newSize);
                        btnEl.classList.toggle('hover:bg-dark-500', btnEl.dataset.size !== newSize);
                    });

                    console.log(`🖼️ Debug view sizing changed to: ${newSize}`);
                }
            }
        });
    }

    // Release camera button - Enhanced reset functionality
    const releaseCameraBtn = document.getElementById('release-camera');
    if (releaseCameraBtn) {
        releaseCameraBtn.addEventListener('click', async () => {
            console.log('🛑 Releasing camera resources and resetting app...');

            // Cleanup camera resources
            cleanupCamera();

            // Clear application state
            AppState.stream = null;
            AppState.mediaStreamTrack = null;
            AppState.isMonitoring = false;
            AppState.cameraRequestInProgress = false;

            // Clear any cached OCR data
            if ((AppState as any).lastProcessedText) {
                (AppState as any).lastProcessedText = '';
            }

            // Reset UI to setup screen
            const mainApp = document.getElementById('main-app');
            const setupScreen = document.getElementById('setup-screen');
            if (mainApp) mainApp.classList.add('hidden');
            if (setupScreen) setupScreen.classList.remove('hidden');

            // Close settings modal if open
            const settingsModalEl = document.getElementById('settings-modal');
            if (settingsModalEl) {
                settingsModalEl.classList.add('hidden');
            }

            // Reset the setup screen to original state
            const setupCard = document.querySelector('#setup-screen .glass') as HTMLElement | null;
            if (setupCard) {
                setupCard.innerHTML = `
                    <div class="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                    </div>

                    <h2 class="text-2xl font-semibold mb-4">Welcome to CaptnReverse</h2>
                    <p class="text-dark-300 mb-6">
                        This app uses your camera to read text aloud using advanced OCR technology.
                        We'll need camera permission to get started.
                    </p>

                    <button id="request-camera" class="btn-primary w-full text-lg py-4 mb-4 rounded-xl font-medium">
                        🚀 Enable Camera Access
                    </button>

                    <button onclick="location.reload()" class="w-full bg-dark-600 hover:bg-dark-500 text-white py-3 px-6 rounded-xl transition-colors text-sm mb-4">
                        🔄 Reset Permissions
                    </button>

                    <div class="text-sm text-dark-400 space-y-1">
                        <p>✅ No downloads required - runs entirely in your browser</p>
                        <p>🔒 Your data never leaves your device</p>
                        <p>🚀 Uses cutting-edge Web APIs for optimal performance</p>
                    </div>
                `;

                // Re-attach camera request event listener
                const newRequestCameraBtn = setupCard.querySelector('#request-camera');
                if (newRequestCameraBtn) {
                    newRequestCameraBtn.addEventListener('click', requestCamera);
                }
            }

            // Clear video element
            const video = document.getElementById('camera-feed') as HTMLVideoElement | null;
            if (video) {
                video.srcObject = null;
            }

            updateStatus('Camera resources released - app reset', 'bg-green-400');
            console.log('✅ Camera resources released and app reset successfully');
        });
    }

    // Auto-calibration button
    const autoCalibrateBtn = document.getElementById('auto-calibrate');
    if (autoCalibrateBtn) {
        autoCalibrateBtn.addEventListener('click', async () => {
            try {
                updateStatus('Running auto-calibration...', 'bg-purple-400 animate-pulse');
                const bestConfig = await runAutoCalibration();
                console.log('✅ Auto-calibration completed successfully:', bestConfig);
            } catch (error) {
                console.error('❌ Auto-calibration failed:', error);
                updateStatus('Auto-calibration failed', 'bg-red-400');
            }
        });
    }

    // History panel toggle button
    const toggleHistoryBtn = document.getElementById('toggle-history');
    if (toggleHistoryBtn) {
        toggleHistoryBtn.addEventListener('click', () => {
            import('./history.js').then(({ toggleHistoryPanel }) => {
                toggleHistoryPanel();
            });
        });
    }

    // Performance report button
    const performanceReportBtn = document.getElementById('performance-report');
    if (performanceReportBtn) {
        performanceReportBtn.addEventListener('click', () => {
            const report: PerformanceReport = generatePerformanceReport();
            console.log('📊 Performance Report Generated:', report);

            // Show performance report in UI
            alert(`Performance Report:\n\n` +
                `Uptime: ${report.uptime}\n` +
                `Processed Frames: ${report.processedFrames}\n` +
                `Success Rate: ${report.successRate}\n` +
                `Average OCR Time: ${report.averageOCRTime}\n` +
                `Average Confidence: ${report.averageConfidence}\n` +
                `Memory Usage: ${report.currentMemoryUsage}\n` +
                `Performance Level: ${report.performance}`);
        });
    }

    // Show debug console button
    const showConsoleBtn = document.getElementById('show-console');
    if (showConsoleBtn) {
        showConsoleBtn.addEventListener('click', () => {
            toggleDebugConsole();
        });
    }
}

// Application lifecycle event listeners
function setupLifecycleListeners(): void {
    // Critical: Add multiple cleanup event listeners
    window.addEventListener('beforeunload', cleanupCamera);
    window.addEventListener('unload', cleanupCamera);
    window.addEventListener('pagehide', cleanupCamera);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('📱 Page hidden, cleaning up camera...');
            cleanupCamera();
        }
    });

    // Cleanup on focus loss (important for mobile)
    window.addEventListener('blur', () => {
        console.log('👁️ Window lost focus, pausing camera...');
        if (AppState.isMonitoring) {
            toggleMonitoring(); // Stop monitoring to reduce resource usage
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    init();
    setupLifecycleListeners();
    setupQuickToolButtons();

    // Initialize gesture controls for gaming handhelds
    if ('ontouchstart' in window) {
        try {
            const { initGestureControls } = await import('./gesture-controls.js');
            initGestureControls();
            console.log('🎮 Gesture controls loaded for gaming handhelds');
        } catch (error) {
            console.warn('⚠️ Gesture controls failed to load:', error);
        }
    }
});

// Setup event listeners for Setup Wizard and Web Test Suite buttons
function setupQuickToolButtons(): void {
    // Setup Wizard button
    const setupWizardBtn = document.getElementById('setup-wizard-btn');
    if (setupWizardBtn) {
        setupWizardBtn.addEventListener('click', async () => {
            try {
                const { SetupWizard } = await import('./setup-wizard.js');
                const wizard = new SetupWizard();
                wizard.showWizard();
            } catch (error) {
                console.error('❌ Failed to load Setup Wizard:', error);
                alert('Failed to load Setup Wizard. Please check console for details.');
            }
        });
    }

    // Web Test Suite button
    const webTestSuiteBtn = document.getElementById('web-test-suite-btn');
    if (webTestSuiteBtn) {
        webTestSuiteBtn.addEventListener('click', async () => {
            try {
                const { WebTestSuite } = await import('./web-test-suite.js');
                const testSuite = new WebTestSuite();
                testSuite.showTestSuite();
            } catch (error) {
                console.error('❌ Failed to load Web Test Suite:', error);
                alert('Failed to load Web Test Suite. Please check console for details.');
            }
        });
    }

    // Setup theme switching
    setupThemeSystem();
}

// Advanced Theme System
function setupThemeSystem(): void {
    // Load saved theme
    const savedTheme = localStorage.getItem('captnreverse-theme') || '';
    applyTheme(savedTheme);

    // Theme option buttons
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const buttonEl = button as HTMLButtonElement;
            const theme = buttonEl.dataset.theme || '';
            applyTheme(theme);
            localStorage.setItem('captnreverse-theme', theme);

            // Update button states
            themeButtons.forEach(btn => {
                btn.classList.remove('border-primary-600', 'bg-primary-600/10', 'text-primary-300');
                btn.classList.add('border-dark-600', 'bg-dark-700', 'text-dark-300');
            });

            buttonEl.classList.remove('border-dark-600', 'bg-dark-700', 'text-dark-300');
            buttonEl.classList.add('border-primary-600', 'bg-primary-600/10', 'text-primary-300');
        });
    });

    // Set initial button state
    const currentTheme = document.documentElement.dataset.theme || '';
    const activeButton = document.querySelector(`[data-theme="${currentTheme}"]`);
    if (activeButton) {
        activeButton.classList.remove('border-dark-600', 'bg-dark-700', 'text-dark-300');
        activeButton.classList.add('border-primary-600', 'bg-primary-600/10', 'text-primary-300');
    }
}

function applyTheme(theme: string): void {
    // Add transition class for smooth theme changes
    document.documentElement.classList.add('theme-transition');

    // Apply theme
    if (theme) {
        document.documentElement.setAttribute('data-theme', theme);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    // Remove transition class after animation
    setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
    }, 500);

    console.log(`🎨 Applied theme: ${theme || 'default'}`);
}

// Live reload for development
if (location.hostname === 'localhost') {
    let lastModified: string | null = null;
    setInterval(async () => {
        try {
            const response = await fetch(location.href, { method: 'HEAD' });
            const modified = response.headers.get('Last-Modified');
            if (lastModified && modified !== lastModified) {
                location.reload();
            }
            lastModified = modified;
        } catch (error) {
            // Ignore
        }
    }, 3000);
}

// Export main functions for global access (temporary compatibility)
window.setCrop = setCrop;
window.speak = speak;
