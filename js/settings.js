/**
 * Settings Module - Handles persistent settings storage and UI synchronization
 * Manages LocalStorage, settings modal, and user preferences
 */

import { AppState } from './config.js';
import { populateVoiceSelect } from './speech.js';

// Load persistent settings from localStorage
export function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('captn-reverse-settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Update AppState settings
            Object.assign(AppState.settings, settings);
            
            // Keep legacy variables in sync temporarily
            updateLegacyVarsFromSettings();
            
            console.log('💾 Loaded saved settings:', AppState.settings);
        }
    } catch (error) {
        console.warn('⚠️ Failed to load settings:', error);
    }
}

// Save persistent settings to localStorage
export function saveSettings() {
    try {
        localStorage.setItem('captn-reverse-settings', JSON.stringify(AppState.settings));
        console.log('💾 Settings saved:', AppState.settings);
    } catch (error) {
        console.warn('⚠️ Failed to save settings:', error);
    }
}

// Update legacy global variables from AppState (temporary compatibility)
export function updateLegacyVarsFromSettings() {
    // This function exists to keep legacy variables in sync during transition
    // TODO: Remove when all code uses AppState directly
    window.autoRead = AppState.settings.autoRead;
    window.speechRate = AppState.settings.speechRate;
    window.sensitivity = AppState.settings.sensitivity;
    window.imageThreshold = AppState.settings.imageThreshold;
    window.processingInterval = AppState.settings.processingInterval;
    window.showDebugCanvas = AppState.settings.showDebugCanvas;
    window.currentOCREngine = AppState.currentOCREngine;
}

// Open settings modal
export function openSettings() {
    console.log('⚙️ Opening settings modal...');
    const settingsModal = document.getElementById('settings-modal');
    
    if (settingsModal) {
        try {
            settingsModal.classList.remove('hidden');
            populateVoiceSelect();
            updateSettingsModalValues();
            updateStatus('Settings opened', 'bg-blue-400');
        } catch (error) {
            console.error('❌ Settings modal error:', error);
            updateStatus('Settings error', 'bg-red-400');
        }
    }
}

// Close settings modal
export function closeSettings() {
    console.log('✖️ Closing settings modal...');
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
        updateStatus('Settings closed', 'bg-green-400');
    }
}

// Update all settings modal controls with current values
export function updateSettingsModalValues() {
    // Update all modal controls with current values
    document.getElementById('speech-rate-modal').value = AppState.settings.speechRate;
    document.getElementById('rate-value-modal').textContent = AppState.settings.speechRate;
    
    document.getElementById('sensitivity-modal').value = AppState.settings.sensitivity;
    document.getElementById('sensitivity-value-modal').textContent = AppState.settings.sensitivity;
    
    document.getElementById('threshold-slider-modal').value = AppState.settings.imageThreshold;
    document.getElementById('threshold-value-modal').textContent = AppState.settings.imageThreshold;
    
    document.getElementById('processing-interval').value = AppState.settings.processingInterval;
    document.getElementById('interval-value').textContent = AppState.settings.processingInterval;
    
    // Update volume if available
    const volumeSlider = document.getElementById('speech-volume');
    if (volumeSlider) {
        document.getElementById('volume-value').textContent = volumeSlider.value;
    }
    
    // Update toggles
    updateModalAutoReadToggle();
    updateDebugToggle();
    updateDebugSizingButtons();
    
    // Update OCR engine buttons
    const tesseractBtn = document.getElementById('ocr-tesseract');
    const paddleBtn = document.getElementById('ocr-paddle');
    if (AppState.currentOCREngine === 'tesseract') {
        tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
        paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
    } else {
        tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
        paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
    }
}

// Update auto-read toggle visual state
export function updateAutoReadToggle() {
    const toggle = document.getElementById('auto-read-toggle');
    if (!toggle) return;
    
    const thumb = toggle.querySelector('span');
    
    if (AppState.settings.autoRead) {
        toggle.classList.add('bg-primary-600');
        toggle.classList.remove('bg-dark-600');
        thumb.classList.add('translate-x-6');
        thumb.classList.remove('translate-x-1');
    } else {
        toggle.classList.remove('bg-primary-600');
        toggle.classList.add('bg-dark-600');
        thumb.classList.remove('translate-x-6');
        thumb.classList.add('translate-x-1');
    }
}

// Update modal auto-read toggle
export function updateModalAutoReadToggle() {
    const toggle = document.getElementById('auto-read-toggle-modal');
    if (!toggle) return;
    
    const thumb = toggle.querySelector('span');
    
    if (AppState.settings.autoRead) {
        toggle.classList.add('bg-primary-600');
        toggle.classList.remove('bg-dark-600');
        thumb.classList.add('translate-x-6');
        thumb.classList.remove('translate-x-1');
    } else {
        toggle.classList.remove('bg-primary-600');
        toggle.classList.add('bg-dark-600');
        thumb.classList.remove('translate-x-6');
        thumb.classList.add('translate-x-1');
    }
}

// Update debug toggle
export function updateDebugToggle() {
    const toggle = document.getElementById('debug-toggle');
    if (!toggle) return;
    
    const thumb = toggle.querySelector('span');
    
    if (AppState.settings.showDebugCanvas) {
        toggle.classList.add('bg-primary-600');
        toggle.classList.remove('bg-dark-600');
        thumb.classList.add('translate-x-6');
        thumb.classList.remove('translate-x-1');
    } else {
        toggle.classList.remove('bg-primary-600');
        toggle.classList.add('bg-dark-600');
        thumb.classList.remove('translate-x-6');
        thumb.classList.add('translate-x-1');
    }
}

// Update debug sizing buttons
export function updateDebugSizingButtons() {
    const buttons = document.querySelectorAll('#debug-sizing-control button');
    buttons.forEach(btn => {
        const isSelected = btn.dataset.size === AppState.settings.debugViewSizing;
        btn.classList.toggle('bg-primary-600', isSelected);
        btn.classList.toggle('bg-dark-600', !isSelected);
        btn.classList.toggle('hover:bg-dark-500', !isSelected);
    });
}