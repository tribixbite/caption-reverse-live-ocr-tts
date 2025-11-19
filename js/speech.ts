/**
 * Speech Module - Handles Text-to-Speech functionality
 * Manages Web Speech API, voice selection, and audio output
 */

import { AppState } from './config.js';
import { updateStatus } from './ui.js';
import type { AppState as AppStateType } from './types.js';

// Extend Window interface for webkit AudioContext support
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

// Global audio context for better browser compatibility
let globalAudioContext: AudioContext | null = null;

// Initialize voice loading with proper async handling
export function initVoices(): void {
    // Load voices immediately if available
    AppState.voices = speechSynthesis.getVoices();
    if (AppState.voices.length > 0) {
        AppState.voicesLoaded = true;
        console.log('Voices loaded immediately:', AppState.voices.length);
    }

    // Set up listener for when voices become available
    speechSynthesis.addEventListener('voiceschanged', (): void => {
        AppState.voices = speechSynthesis.getVoices();
        AppState.voicesLoaded = true;
        console.log('Voices loaded via voiceschanged:', AppState.voices.length);

        // Update voice select if settings modal is open
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            populateVoiceSelect();
        }
    });
}

// Speak text using Web Speech API
export function speak(text: string): void {
    if (!text || !text.trim()) return;

    // Cancel any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = AppState.settings.speechRate;
    utterance.pitch = 1.0;

    // Apply volume setting
    const volumeSlider = document.getElementById('speech-volume') as HTMLInputElement | null;
    const volume: number = volumeSlider ? parseInt(volumeSlider.value, 10) / 100 : 1.0;
    utterance.volume = volume;

    // Try to get selected voice
    const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement | null;
    if (voiceSelect && voiceSelect.value && AppState.voices.length > 0) {
        const selectedIndex: number = parseInt(voiceSelect.value, 10);
        if (selectedIndex >= 0 && selectedIndex < AppState.voices.length) {
            utterance.voice = AppState.voices[selectedIndex];
        }
    } else {
        // Fallback to default voice selection
        const voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Prefer English voices
            const englishVoice: SpeechSynthesisVoice = voices.find(
                (voice: SpeechSynthesisVoice) => voice.lang.startsWith('en')
            ) || voices[0];
            utterance.voice = englishVoice;
        }
    }

    utterance.onstart = (): void => {
        console.log('Speaking:', text.substring(0, 50) + '...');
        const stopBtn = document.getElementById('stop-speech-btn');
        if (stopBtn) {
            stopBtn.classList.remove('hidden');
        }
        updateStatus('Speaking...', 'bg-blue-400 animate-pulse');
    };

    utterance.onend = (): void => {
        console.log('Speech completed');
        const stopBtn = document.getElementById('stop-speech-btn');
        if (stopBtn) {
            stopBtn.classList.add('hidden');
        }
        updateStatus(AppState.isMonitoring ? 'Monitoring active' : 'Ready', 'bg-green-400');
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent): void => {
        console.error('Speech error:', event.error);
        const stopBtn = document.getElementById('stop-speech-btn');
        if (stopBtn) {
            stopBtn.classList.add('hidden');
        }
        updateStatus('Speech error', 'bg-red-400');
    };

    // Ensure voices are loaded before speaking
    if (AppState.voices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', (): void => {
            speechSynthesis.speak(utterance);
        }, { once: true });
    } else {
        speechSynthesis.speak(utterance);
    }
}

// Populate voice selection dropdown
export function populateVoiceSelect(): void {
    const select = document.getElementById('voice-select') as HTMLSelectElement | null;
    if (!select) {
        console.warn('Voice select element not found');
        return;
    }

    const voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices();

    select.innerHTML = '<option value="">Default Voice</option>';

    voices.forEach((voice: SpeechSynthesisVoice, index: number): void => {
        const option: HTMLOptionElement = document.createElement('option');
        option.value = index.toString();
        option.textContent = `${voice.name} (${voice.lang})`;
        select.appendChild(option);
    });

    console.log(`Populated ${voices.length} voices in selection dropdown`);
}

// Stop current speech
export function stopSpeech(): void {
    speechSynthesis.cancel();
    const stopBtn = document.getElementById('stop-speech-btn');
    if (stopBtn) {
        stopBtn.classList.add('hidden');
    }
    updateStatus(AppState.isMonitoring ? 'Monitoring active' : 'Ready', 'bg-green-400');
}

// Initialize audio context with user interaction
function initAudioContext(): AudioContext | null {
    if (!globalAudioContext) {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            globalAudioContext = new AudioContextClass();

            // Handle audio context state for better browser compatibility
            if (globalAudioContext.state === 'suspended') {
                // Auto-resume on next user interaction
                const resumeAudio = (): void => {
                    if (globalAudioContext) {
                        globalAudioContext.resume().then((): void => {
                            console.log('Audio context resumed');
                            document.removeEventListener('click', resumeAudio);
                            document.removeEventListener('touchstart', resumeAudio);
                        });
                    }
                };
                document.addEventListener('click', resumeAudio, { once: true });
                document.addEventListener('touchstart', resumeAudio, { once: true });
            }

            console.log('Audio context initialized');
        } catch (error) {
            console.warn('Could not initialize audio context:', error);
        }
    }
    return globalAudioContext;
}

// Audio feedback for OCR recognition events
export function playRecognitionSound(): void {
    try {
        const audioContext: AudioContext | null = initAudioContext();
        if (!audioContext || audioContext.state === 'suspended') {
            console.warn('Audio context not available or suspended');
            return;
        }

        // Create a pleasant recognition chime (C major chord)
        const frequencies: number[] = [261.63, 329.63, 392.00]; // C4, E4, G4
        const duration: number = 0.2; // 200ms

        frequencies.forEach((freq: number, index: number): void => {
            const oscillator: OscillatorNode = audioContext.createOscillator();
            const gainNode: GainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';

            // Fade in/out envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime + index * 0.05);
            oscillator.stop(audioContext.currentTime + duration);
        });

        console.log('Recognition sound played');
    } catch (error) {
        console.warn('Could not play recognition sound:', error);
    }
}

// Audio feedback for processing start
export function playProcessingSound(): void {
    try {
        const audioContext: AudioContext | null = initAudioContext();
        if (!audioContext || audioContext.state === 'suspended') {
            console.warn('Audio context not available or suspended');
            return;
        }

        const oscillator: OscillatorNode = audioContext.createOscillator();
        const gainNode: GainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        console.log('Processing sound played');
    } catch (error) {
        console.warn('Could not play processing sound:', error);
    }
}

// Test TTS with sample text
export function testTTS(): void {
    speak("CaptnReverse text-to-speech is working perfectly! This is a test of the speech synthesis system.");
}
