/**
 * Settings Module - Handles persistent settings storage and UI synchronization
 * Manages LocalStorage, settings modal, and user preferences
 */

import { UserSettings } from './types.js';
import { AppState } from './config.js';
import { populateVoiceSelect } from './speech.js';
import { updateStatus } from './ui.js';

// Extend Window interface for legacy global variables
declare global {
    interface Window {
        autoRead: boolean;
        speechRate: number;
        sensitivity: number;
        imageThreshold: number;
        processingInterval: number;
        showDebugCanvas: boolean;
        currentOCREngine: 'tesseract' | 'paddle';
    }
}

// Load persistent settings from localStorage
export function loadSettings(): void {
    try {
        const savedSettings = localStorage.getItem('captn-reverse-settings');
        if (savedSettings) {
            const settings: Partial<UserSettings> = JSON.parse(savedSettings);

            // Update AppState settings
            Object.assign(AppState.settings, settings);

            // Keep legacy variables in sync temporarily
            updateLegacyVarsFromSettings();

            console.log('Loaded saved settings:', AppState.settings);
        }
    } catch (error) {
        console.warn('Failed to load settings:', error);
    }
}

// Save persistent settings to localStorage
export function saveSettings(): void {
    try {
        localStorage.setItem('captn-reverse-settings', JSON.stringify(AppState.settings));
        console.log('Settings saved:', AppState.settings);
    } catch (error) {
        console.warn('Failed to save settings:', error);
    }
}

// Update legacy global variables from AppState (temporary compatibility)
export function updateLegacyVarsFromSettings(): void {
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
export function openSettings(): void {
    console.log('Opening settings modal...');
    const settingsModal = document.getElementById('settings-modal');

    if (settingsModal) {
        try {
            settingsModal.classList.remove('hidden');
            populateVoiceSelect();
            updateSettingsModalValues();
            updateStatus('Settings opened', 'bg-blue-400');
        } catch (error) {
            console.error('Settings modal error:', error);
            updateStatus('Settings error', 'bg-red-400');
        }
    }
}

// Close settings modal
export function closeSettings(): void {
    console.log('Closing settings modal...');
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
        updateStatus('Settings closed', 'bg-green-400');
    }
}

// Update all settings modal controls with current values
export function updateSettingsModalValues(): void {
    // Update all modal controls with current values
    const speechRateModal = document.getElementById('speech-rate-modal') as HTMLInputElement | null;
    const rateValueModal = document.getElementById('rate-value-modal');
    if (speechRateModal && rateValueModal) {
        speechRateModal.value = String(AppState.settings.speechRate);
        rateValueModal.textContent = String(AppState.settings.speechRate);
    }

    const sensitivityModal = document.getElementById('sensitivity-modal') as HTMLInputElement | null;
    const sensitivityValueModal = document.getElementById('sensitivity-value-modal');
    if (sensitivityModal && sensitivityValueModal) {
        sensitivityModal.value = String(AppState.settings.sensitivity);
        sensitivityValueModal.textContent = String(AppState.settings.sensitivity);
    }

    const thresholdSliderModal = document.getElementById('threshold-slider-modal') as HTMLInputElement | null;
    const thresholdValueModal = document.getElementById('threshold-value-modal');
    if (thresholdSliderModal && thresholdValueModal) {
        thresholdSliderModal.value = String(AppState.settings.imageThreshold);
        thresholdValueModal.textContent = String(AppState.settings.imageThreshold);
    }

    const processingIntervalInput = document.getElementById('processing-interval') as HTMLInputElement | null;
    const intervalValue = document.getElementById('interval-value');
    if (processingIntervalInput && intervalValue) {
        processingIntervalInput.value = String(AppState.settings.processingInterval);
        intervalValue.textContent = String(AppState.settings.processingInterval);
    }

    // Update volume if available
    const volumeSlider = document.getElementById('speech-volume') as HTMLInputElement | null;
    const volumeValue = document.getElementById('volume-value');
    if (volumeSlider && volumeValue) {
        volumeValue.textContent = volumeSlider.value;
    }

    // Update toggles
    updateModalAutoReadToggle();
    updateDebugToggle();
    updateDebugSizingButtons();

    // Update OCR engine buttons
    const tesseractBtn = document.getElementById('ocr-tesseract');
    const paddleBtn = document.getElementById('ocr-paddle');
    if (tesseractBtn && paddleBtn) {
        if (AppState.currentOCREngine === 'tesseract') {
            tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
            paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
        } else {
            tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
            paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
        }
    }
}

// Update auto-read toggle visual state
export function updateAutoReadToggle(): void {
    const toggle = document.getElementById('auto-read-toggle');
    if (!toggle) return;

    const thumb = toggle.querySelector('span') as HTMLElement | null;
    if (!thumb) return;

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
export function updateModalAutoReadToggle(): void {
    const toggle = document.getElementById('auto-read-toggle-modal');
    if (!toggle) return;

    const thumb = toggle.querySelector('span') as HTMLElement | null;
    if (!thumb) return;

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
export function updateDebugToggle(): void {
    const toggle = document.getElementById('debug-toggle');
    if (!toggle) return;

    const thumb = toggle.querySelector('span') as HTMLElement | null;
    if (!thumb) return;

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
export function updateDebugSizingButtons(): void {
    const buttons = document.querySelectorAll('#debug-sizing-control button');
    buttons.forEach((btn) => {
        const button = btn as HTMLButtonElement;
        const isSelected = button.dataset.size === AppState.settings.debugViewSizing;
        button.classList.toggle('bg-primary-600', isSelected);
        button.classList.toggle('bg-dark-600', !isSelected);
        button.classList.toggle('hover:bg-dark-500', !isSelected);
    });
}
