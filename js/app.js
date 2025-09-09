/**
 * Main Application Entry Point - CaptnReverse OCR & TTS
 * Coordinates all modules and handles application lifecycle
 */

import { AppState } from './config.js';
import { initOCR, switchOCREngine, readNow } from './ocr.js';
import { requestCamera, checkSecureContext, cleanupCamera, applyCameraZoom, applyCameraFocus, setAutoFocus } from './camera.js';
import { speak, initVoices, stopSpeech, testTTS } from './speech.js';
import { loadSettings, saveSettings, openSettings, closeSettings, updateSettingsModalValues, updateModalAutoReadToggle, updateDebugToggle, updateDebugSizingButtons } from './settings.js';
import { updateStatus, setupCropSelector, setCrop, toggleMonitoring } from './ui.js';
import { initializeDebugLogging, toggleDebugConsole } from './debug.js';

// Initialize application
async function init() {
    initializeDebugLogging(); // Initialize debug logging first
    console.log('🔧 Initializing CaptnReverse...');
    loadSettings(); // Load saved settings first
    setupEventListeners();
    initVoices(); // Initialize voice loading
    await initOCR();
    checkSecureContext();
    console.log('✅ CaptnReverse ready!');
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
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupLifecycleListeners();
});

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