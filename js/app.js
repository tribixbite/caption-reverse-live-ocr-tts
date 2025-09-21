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

// Initialize application
async function init() {
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
function setupEventListeners() {
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
    const webTestsBtn = document.getElementById('run-web-tests');
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
                const text = document.getElementById('detected-text').textContent;
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
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSettings();
        });
        console.log('✅ Settings button listener added');
    } else {
        console.error('❌ Settings button or modal not found!');
    }
    
    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeSettings();
        });
        console.log('✅ Close settings button listener added');
    } else {
        console.error('❌ Close settings button not found!');
    }

    // Alternative click handler for settings (fallback)
    document.addEventListener('click', (e) => {
        if (e.target.closest('#settings-btn') || e.target.id === 'settings-btn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ Settings button clicked via fallback handler');
            openSettings();
        }
    });

    // Camera zoom
    document.getElementById('camera-zoom').addEventListener('input', (e) => {
        AppState.cameraZoom = parseFloat(e.target.value);
        document.getElementById('zoom-value').textContent = AppState.cameraZoom.toFixed(1);
        applyCameraZoom();
    });

    // Camera focus
    document.getElementById('camera-focus').addEventListener('input', (e) => {
        const focusDistance = parseFloat(e.target.value);
        document.getElementById('focus-value').textContent = focusDistance === 500 ? 'Auto' : focusDistance.toFixed(2);
        applyCameraFocus(focusDistance);
    });

    // Auto focus button
    document.getElementById('focus-auto').addEventListener('click', () => {
        setAutoFocus();
    });

    // Crop selector
    setupCropSelector();
    setupSettingsEventListeners();
}

// Set up settings-specific event listeners
function setupSettingsEventListeners() {
    // OCR Engine toggle
    document.getElementById('ocr-tesseract').addEventListener('click', () => switchOCREngine('tesseract'));
    document.getElementById('ocr-paddle').addEventListener('click', () => switchOCREngine('paddle'));

    // Auto-read toggle (modal)
    document.getElementById('auto-read-toggle-modal').addEventListener('click', () => {
        AppState.settings.autoRead = !AppState.settings.autoRead;
        updateModalAutoReadToggle();
        saveSettings();
        console.log(`🔊 Auto-read toggled: ${AppState.settings.autoRead}`);
    });

    // Speech settings (modal)
    document.getElementById('speech-rate-modal').addEventListener('input', (e) => {
        AppState.settings.speechRate = parseFloat(e.target.value);
        document.getElementById('rate-value-modal').textContent = AppState.settings.speechRate;
        saveSettings();
    });

    document.getElementById('speech-volume').addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        document.getElementById('volume-value').textContent = volume;
        saveSettings();
    });

    // OCR settings (modal)
    document.getElementById('sensitivity-modal').addEventListener('input', (e) => {
        AppState.settings.sensitivity = parseInt(e.target.value);
        document.getElementById('sensitivity-value-modal').textContent = AppState.settings.sensitivity;
        saveSettings();
        console.log(`🎯 Sensitivity updated to ${AppState.settings.sensitivity}%`);
    });

    document.getElementById('threshold-slider-modal').addEventListener('input', (e) => {
        AppState.settings.imageThreshold = parseInt(e.target.value);
        document.getElementById('threshold-value-modal').textContent = AppState.settings.imageThreshold;
        saveSettings();
    });

    document.getElementById('processing-interval').addEventListener('input', (e) => {
        AppState.settings.processingInterval = parseInt(e.target.value);
        document.getElementById('interval-value').textContent = AppState.settings.processingInterval;
        if (AppState.isMonitoring) {
            const { stopMonitoring, startMonitoring } = require('./ui.js');
            stopMonitoring();
            startMonitoring(); // Restart with new interval
        }
        saveSettings();
    });

    // Debug toggle
    document.getElementById('debug-toggle').addEventListener('click', () => {
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

    // Debug sizing control
    document.getElementById('debug-sizing-control').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const newSize = e.target.dataset.size;
            AppState.settings.debugViewSizing = newSize;
            saveSettings();
            
            // Update button styles
            document.querySelectorAll('#debug-sizing-control button').forEach(btn => {
                btn.classList.toggle('bg-primary-600', btn.dataset.size === newSize);
                btn.classList.toggle('bg-dark-600', btn.dataset.size !== newSize);
                btn.classList.toggle('hover:bg-dark-500', btn.dataset.size !== newSize);
            });
            
            console.log(`🖼️ Debug view sizing changed to: ${newSize}`);
        }
    });

    // Release camera button
    document.getElementById('release-camera').addEventListener('click', () => {
        cleanupCamera();
        // Reset UI to setup screen
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
        document.getElementById('settings-modal').classList.add('hidden');
        updateStatus('Camera released', 'bg-yellow-400');
    });

    // Auto-calibration button
    document.getElementById('auto-calibrate').addEventListener('click', async () => {
        try {
            updateStatus('Running auto-calibration...', 'bg-purple-400 animate-pulse');
            const bestConfig = await runAutoCalibration();
            console.log('✅ Auto-calibration completed successfully:', bestConfig);
        } catch (error) {
            console.error('❌ Auto-calibration failed:', error);
            updateStatus('Auto-calibration failed', 'bg-red-400');
        }
    });

    // History panel toggle button
    document.getElementById('toggle-history').addEventListener('click', () => {
        import('./history.js').then(({ toggleHistoryPanel }) => {
            toggleHistoryPanel();
        });
    });

    // Performance report button
    document.getElementById('performance-report').addEventListener('click', () => {
        const report = generatePerformanceReport();
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

    // Show debug console button
    document.getElementById('show-console').addEventListener('click', () => {
        toggleDebugConsole();
    });
}

// Application lifecycle event listeners
function setupLifecycleListeners() {
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
function setupQuickToolButtons() {
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
function setupThemeSystem() {
    // Load saved theme
    const savedTheme = localStorage.getItem('captnreverse-theme') || '';
    applyTheme(savedTheme);

    // Theme option buttons
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            applyTheme(theme);
            localStorage.setItem('captnreverse-theme', theme);

            // Update button states
            themeButtons.forEach(btn => {
                btn.classList.remove('border-primary-600', 'bg-primary-600/10', 'text-primary-300');
                btn.classList.add('border-dark-600', 'bg-dark-700', 'text-dark-300');
            });

            button.classList.remove('border-dark-600', 'bg-dark-700', 'text-dark-300');
            button.classList.add('border-primary-600', 'bg-primary-600/10', 'text-primary-300');
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

function applyTheme(theme) {
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
    let lastModified = null;
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