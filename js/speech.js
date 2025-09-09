/**
 * Speech Module - Handles Text-to-Speech functionality
 * Manages Web Speech API, voice selection, and audio output
 */

import { AppState } from './config.js';
import { updateStatus } from './ui.js';

// Initialize voice loading with proper async handling
export function initVoices() {
    // Load voices immediately if available
    AppState.voices = speechSynthesis.getVoices();
    if (AppState.voices.length > 0) {
        AppState.voicesLoaded = true;
        console.log('🗣️ Voices loaded immediately:', AppState.voices.length);
    }

    // Set up listener for when voices become available
    speechSynthesis.addEventListener('voiceschanged', () => {
        AppState.voices = speechSynthesis.getVoices();
        AppState.voicesLoaded = true;
        console.log('🗣️ Voices loaded via voiceschanged:', AppState.voices.length);
        
        // Update voice select if settings modal is open
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            populateVoiceSelect();
        }
    });
}

// Speak text using Web Speech API
export function speak(text) {
    if (!text || !text.trim()) return;
    
    // Cancel any current speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = AppState.settings.speechRate;
    utterance.pitch = 1.0;
    
    // Apply volume setting
    const volumeSlider = document.getElementById('speech-volume');
    const volume = volumeSlider ? parseInt(volumeSlider.value) / 100 : 1.0;
    utterance.volume = volume;
    
    // Try to get selected voice
    const voiceSelect = document.getElementById('voice-select');
    if (voiceSelect && voiceSelect.value && AppState.voices.length > 0) {
        const selectedIndex = parseInt(voiceSelect.value);
        if (selectedIndex >= 0 && selectedIndex < AppState.voices.length) {
            utterance.voice = AppState.voices[selectedIndex];
        }
    } else {
        // Fallback to default voice selection
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Prefer English voices
            const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
            utterance.voice = englishVoice;
        }
    }

    utterance.onstart = () => {
        console.log('🔊 Speaking:', text.substring(0, 50) + '...');
        document.getElementById('stop-speech-btn').classList.remove('hidden');
        updateStatus('Speaking...', 'bg-blue-400 animate-pulse');
    };
    
    utterance.onend = () => {
        console.log('🔇 Speech completed');
        document.getElementById('stop-speech-btn').classList.add('hidden');
        updateStatus(AppState.isMonitoring ? 'Monitoring active' : 'Ready', 'bg-green-400');
    };
    
    utterance.onerror = (event) => {
        console.error('🔇 Speech error:', event.error);
        document.getElementById('stop-speech-btn').classList.add('hidden');
        updateStatus('Speech error', 'bg-red-400');
    };

    // Ensure voices are loaded before speaking
    if (AppState.voices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
            speechSynthesis.speak(utterance);
        }, { once: true });
    } else {
        speechSynthesis.speak(utterance);
    }
}

// Populate voice selection dropdown
export function populateVoiceSelect() {
    const select = document.getElementById('voice-select');
    if (!select) {
        console.warn('⚠️ Voice select element not found');
        return;
    }
    
    const voices = speechSynthesis.getVoices();
    
    select.innerHTML = '<option value="">Default Voice</option>';
    
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        select.appendChild(option);
    });
    
    console.log(`🗣️ Populated ${voices.length} voices in selection dropdown`);
}

// Stop current speech
export function stopSpeech() {
    speechSynthesis.cancel();
    document.getElementById('stop-speech-btn').classList.add('hidden');
    updateStatus(AppState.isMonitoring ? 'Monitoring active' : 'Ready', 'bg-green-400');
}

// Test TTS with sample text
export function testTTS() {
    speak("CaptnReverse text-to-speech is working perfectly! This is a test of the speech synthesis system.");
}