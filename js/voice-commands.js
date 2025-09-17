/**
 * Voice Command System for Gaming Accessibility
 * Speech-to-command functionality for hands-free OCR control
 */

import { AppState } from './config.js';
import { updateStatus } from './ui.js';

// Voice command configuration
const VOICE_COMMANDS = {
    // OCR Functions
    'read text': { action: 'readNow', description: 'Read text from current view' },
    'read now': { action: 'readNow', description: 'Read text immediately' },
    'scan text': { action: 'readNow', description: 'Scan and read text' },

    // Monitoring Control
    'start monitoring': { action: 'startMonitoring', description: 'Start continuous monitoring' },
    'stop monitoring': { action: 'stopMonitoring', description: 'Stop continuous monitoring' },
    'toggle monitoring': { action: 'toggleMonitoring', description: 'Toggle monitoring state' },
    'pause monitoring': { action: 'pauseMonitoring', description: 'Pause OCR monitoring' },

    // Audio Control
    'repeat text': { action: 'repeatLastText', description: 'Repeat last recognized text' },
    'speak again': { action: 'repeatLastText', description: 'Speak last text again' },
    'stop speaking': { action: 'stopSpeech', description: 'Stop current speech' },
    'shut up': { action: 'stopSpeech', description: 'Stop speech (casual)' },
    'silence': { action: 'stopSpeech', description: 'Stop all audio' },

    // Auto-read Control
    'enable auto read': { action: 'enableAutoRead', description: 'Enable automatic text reading' },
    'disable auto read': { action: 'disableAutoRead', description: 'Disable automatic reading' },
    'toggle auto read': { action: 'toggleAutoRead', description: 'Toggle auto-read setting' },

    // System Control
    'calibrate': { action: 'autoCalibrate', description: 'Run auto-calibration' },
    'auto calibrate': { action: 'autoCalibrate', description: 'Auto-calibrate OCR settings' },
    'optimize settings': { action: 'autoCalibrate', description: 'Optimize OCR settings' },

    // History Management
    'show history': { action: 'showHistory', description: 'Show OCR history panel' },
    'hide history': { action: 'hideHistory', description: 'Hide history panel' },
    'clear history': { action: 'clearHistory', description: 'Clear all OCR history' },
    'search history': { action: 'startHistorySearch', description: 'Start history search mode' },

    // Performance & Debug
    'show performance': { action: 'showPerformance', description: 'Display performance report' },
    'performance report': { action: 'showPerformance', description: 'Generate performance report' },
    'show console': { action: 'showConsole', description: 'Display debug console' },

    // Settings & Configuration
    'open settings': { action: 'openSettings', description: 'Open settings panel' },
    'close settings': { action: 'closeSettings', description: 'Close settings panel' },
    'save session': { action: 'saveSession', description: 'Save current gaming session' },

    // Multi-monitor
    'secondary monitor': { action: 'openSecondaryMonitor', description: 'Open OCR on secondary monitor' },
    'fullscreen overlay': { action: 'openFullscreenOverlay', description: 'Open fullscreen OCR overlay' },
    'close secondary': { action: 'closeSecondaryMonitor', description: 'Close secondary monitor window' },

    // Gaming-specific
    'gaming mode': { action: 'enableGamingMode', description: 'Enable gaming optimizations' },
    'help': { action: 'showHelp', description: 'Show voice command help' },
    'commands': { action: 'showCommands', description: 'List available commands' }
};

// Voice recognition state
let voiceState = {
    recognition: null,
    isListening: false,
    isEnabled: false,
    confidence: 0.7, // Minimum confidence for command recognition
    lastCommand: '',
    commandHistory: [],
    listeningTimeout: null
};

// Initialize voice command system
export function initVoiceCommands() {
    console.log('🎤 Initializing Voice Command System...');

    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Web Speech API not supported in this browser');
        showVoiceNotification('Voice commands not supported in this browser', 'warning');
        return false;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceState.recognition = new SpeechRecognition();

    // Configure recognition settings
    voiceState.recognition.continuous = false; // Stop after each command
    voiceState.recognition.interimResults = false; // Only final results
    voiceState.recognition.lang = 'en-US'; // English commands
    voiceState.recognition.maxAlternatives = 3; // Consider multiple interpretations

    // Setup event listeners
    setupVoiceRecognitionListeners();

    // Create voice command UI
    createVoiceCommandUI();

    console.log('✅ Voice Command System initialized');
    console.log(`📢 Available commands: ${Object.keys(VOICE_COMMANDS).length}`);

    return true;
}

// Setup speech recognition event listeners
function setupVoiceRecognitionListeners() {
    voiceState.recognition.onstart = () => {
        console.log('🎤 Voice recognition started - listening for commands...');
        voiceState.isListening = true;
        updateVoiceUI('listening');
        showVoiceNotification('Listening for voice commands...', 'info');

        // Auto-stop after 10 seconds of listening
        voiceState.listeningTimeout = setTimeout(() => {
            stopVoiceListening();
        }, 10000);
    };

    voiceState.recognition.onresult = (event) => {
        clearTimeout(voiceState.listeningTimeout);

        const result = event.results[0];
        const command = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence || 0;

        console.log(`🎤 Voice command received: "${command}" (confidence: ${Math.round(confidence * 100)}%)`);

        if (confidence >= voiceState.confidence) {
            executeVoiceCommand(command);
        } else {
            console.log(`🎤 Command confidence too low: ${Math.round(confidence * 100)}% < ${Math.round(voiceState.confidence * 100)}%`);
            showVoiceNotification(`Command unclear (${Math.round(confidence * 100)}%) - try again`, 'warning');
        }
    };

    voiceState.recognition.onerror = (event) => {
        console.error('🎤 Voice recognition error:', event.error);
        voiceState.isListening = false;
        updateVoiceUI('error');

        let errorMessage = 'Voice recognition error';
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected - try again';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone access denied';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission required';
                break;
            case 'network':
                errorMessage = 'Network error - check connection';
                break;
        }

        showVoiceNotification(errorMessage, 'error');
    };

    voiceState.recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        voiceState.isListening = false;
        updateVoiceUI('ready');
        clearTimeout(voiceState.listeningTimeout);
    };
}

// Execute voice command
async function executeVoiceCommand(commandText) {
    voiceState.lastCommand = commandText;
    voiceState.commandHistory.unshift({ text: commandText, timestamp: Date.now() });

    // Keep only last 20 commands
    if (voiceState.commandHistory.length > 20) {
        voiceState.commandHistory = voiceState.commandHistory.slice(0, 20);
    }

    // Find matching command
    const matchedCommand = findBestCommandMatch(commandText);

    if (matchedCommand) {
        console.log(`🎮 Executing voice command: ${matchedCommand.action}`);
        showVoiceNotification(`Executing: ${matchedCommand.description}`, 'success');

        try {
            await executeCommandAction(matchedCommand.action);
        } catch (error) {
            console.error('Voice command execution error:', error);
            showVoiceNotification('Command execution failed', 'error');
        }
    } else {
        console.log(`🎤 No matching command found for: "${commandText}"`);
        showVoiceNotification(`Unknown command: "${commandText}"`, 'warning');

        // Suggest similar commands
        const suggestions = findSimilarCommands(commandText);
        if (suggestions.length > 0) {
            console.log('💡 Similar commands:', suggestions);
            showVoiceNotification(`Did you mean: ${suggestions[0]}?`, 'info');
        }
    }
}

// Find best matching command
function findBestCommandMatch(commandText) {
    const normalizedCommand = commandText.toLowerCase().trim();

    // Exact match first
    if (VOICE_COMMANDS[normalizedCommand]) {
        return VOICE_COMMANDS[normalizedCommand];
    }

    // Partial match with highest similarity
    let bestMatch = null;
    let bestScore = 0;

    for (const [command, config] of Object.entries(VOICE_COMMANDS)) {
        const score = calculateSimilarity(normalizedCommand, command);
        if (score > bestScore && score > 0.6) { // 60% similarity threshold
            bestScore = score;
            bestMatch = config;
        }
    }

    return bestMatch;
}

// Calculate text similarity
function calculateSimilarity(text1, text2) {
    // Simple word-based similarity
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));

    return commonWords.length / Math.max(words1.length, words2.length);
}

// Find similar commands for suggestions
function findSimilarCommands(commandText, limit = 3) {
    const similarities = Object.keys(VOICE_COMMANDS).map(command => ({
        command,
        score: calculateSimilarity(commandText.toLowerCase(), command)
    }));

    return similarities
        .filter(item => item.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.command);
}

// Execute command action
async function executeCommandAction(action) {
    switch (action) {
        case 'readNow':
            const { readNow } = await import('./ocr.js');
            await readNow();
            break;

        case 'startMonitoring':
        case 'toggleMonitoring':
            const { toggleMonitoring } = await import('./ui.js');
            toggleMonitoring();
            break;

        case 'stopMonitoring':
        case 'pauseMonitoring':
            if (AppState.isMonitoring) {
                const { toggleMonitoring } = await import('./ui.js');
                toggleMonitoring();
            }
            break;

        case 'repeatLastText':
            const { speak } = await import('./speech.js');
            if (AppState.lastText) {
                speak(AppState.lastText);
            } else {
                speak('No text has been recognized yet');
            }
            break;

        case 'stopSpeech':
            const { stopSpeech } = await import('./speech.js');
            stopSpeech();
            break;

        case 'enableAutoRead':
            AppState.settings.autoRead = true;
            saveVoiceSettings();
            speak('Auto-read enabled');
            break;

        case 'disableAutoRead':
            AppState.settings.autoRead = false;
            saveVoiceSettings();
            speak('Auto-read disabled');
            break;

        case 'toggleAutoRead':
            AppState.settings.autoRead = !AppState.settings.autoRead;
            saveVoiceSettings();
            speak(AppState.settings.autoRead ? 'Auto-read enabled' : 'Auto-read disabled');
            break;

        case 'autoCalibrate':
            const { runAutoCalibration } = await import('./ocr.js');
            await runAutoCalibration();
            break;

        case 'showHistory':
            const { toggleHistoryPanel } = await import('./history.js');
            toggleHistoryPanel();
            break;

        case 'showPerformance':
            const { generatePerformanceReport } = await import('./performance.js');
            const report = generatePerformanceReport();
            speak(`Performance report: ${report.successRate} success rate, ${report.averageOCRTime} average processing time`);
            break;

        case 'openSettings':
            const { openSettings } = await import('./settings.js');
            openSettings();
            break;

        case 'closeSettings':
            const { closeSettings } = await import('./settings.js');
            closeSettings();
            break;

        case 'showHelp':
        case 'showCommands':
            showVoiceCommandHelp();
            break;

        case 'openSecondaryMonitor':
            const { openOnSecondaryMonitor } = await import('./multimonitor.js');
            await openOnSecondaryMonitor();
            break;

        case 'enableGamingMode':
            enableGamingOptimizations();
            break;

        default:
            console.warn(`Unknown voice command action: ${action}`);
            speak('Unknown command');
    }
}

// Save voice command settings
function saveVoiceSettings() {
    try {
        const { saveSettings } = require('./settings.js');
        saveSettings();
    } catch (error) {
        // Fallback to direct localStorage
        localStorage.setItem('voiceCommandSettings', JSON.stringify({
            autoRead: AppState.settings.autoRead,
            enabled: voiceState.isEnabled,
            confidence: voiceState.confidence
        }));
    }
}

// Create voice command UI
function createVoiceCommandUI() {
    const voicePanel = document.createElement('div');
    voicePanel.id = 'voice-command-panel';
    voicePanel.className = 'glass rounded-xl p-4 mt-4';

    voicePanel.innerHTML = `
        <h4 class="text-md font-medium mb-3 text-gaming-purple">🎤 Voice Commands</h4>

        <div class="space-y-3">
            <!-- Voice Control Toggle -->
            <div class="flex items-center justify-between">
                <label class="text-sm font-medium">Voice Commands</label>
                <button id="voice-toggle" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-dark-600">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                </button>
            </div>

            <!-- Microphone Control -->
            <div class="flex gap-2">
                <button id="start-listening" class="flex-1 bg-gaming-blue hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50" disabled>
                    🎤 Listen for Commands
                </button>
                <button id="stop-listening" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors hidden">
                    🛑 Stop Listening
                </button>
            </div>

            <!-- Voice Status -->
            <div id="voice-status" class="bg-dark-800 rounded-lg p-3">
                <div class="text-xs text-dark-300 mb-1">Status:</div>
                <div id="voice-status-text" class="text-gaming-cyan font-mono text-sm">Ready</div>
            </div>

            <!-- Last Command -->
            <div class="bg-dark-800 rounded-lg p-3">
                <div class="text-xs text-dark-300 mb-1">Last Command:</div>
                <div id="last-voice-command" class="text-gaming-green font-mono text-sm">None</div>
            </div>

            <!-- Confidence Setting -->
            <div>
                <label class="block text-sm font-medium mb-2">Recognition Confidence: <span id="voice-confidence-value">70</span>%</label>
                <input id="voice-confidence" type="range" min="50" max="95" step="5" value="70" class="w-full h-2 bg-dark-600 rounded-lg">
            </div>

            <!-- Quick Commands -->
            <div class="pt-3 border-t border-dark-700">
                <div class="text-xs text-dark-400 mb-2">Quick Commands:</div>
                <div class="grid grid-cols-2 gap-1 text-xs">
                    <span class="text-gaming-cyan">"read text"</span>
                    <span class="text-gaming-green">"stop speaking"</span>
                    <span class="text-gaming-blue">"start monitoring"</span>
                    <span class="text-gaming-purple">"calibrate"</span>
                </div>
            </div>
        </div>
    `;

    // Add to settings modal
    const debugSection = document.querySelector('section:last-child .space-y-4');
    if (debugSection) {
        debugSection.appendChild(voicePanel);
    }

    // Setup voice UI event listeners
    setupVoiceUIListeners();
}

// Setup voice UI event listeners
function setupVoiceUIListeners() {
    // Voice toggle
    document.getElementById('voice-toggle').addEventListener('click', () => {
        toggleVoiceCommands();
    });

    // Start listening button
    document.getElementById('start-listening').addEventListener('click', () => {
        startVoiceListening();
    });

    // Stop listening button
    document.getElementById('stop-listening').addEventListener('click', () => {
        stopVoiceListening();
    });

    // Confidence slider
    document.getElementById('voice-confidence').addEventListener('input', (e) => {
        voiceState.confidence = parseInt(e.target.value) / 100;
        document.getElementById('voice-confidence-value').textContent = e.target.value;

        console.log(`🎤 Voice confidence threshold set to ${Math.round(voiceState.confidence * 100)}%`);
        localStorage.setItem('voiceConfidence', voiceState.confidence);
    });
}

// Toggle voice commands on/off
function toggleVoiceCommands() {
    voiceState.isEnabled = !voiceState.isEnabled;

    const toggle = document.getElementById('voice-toggle');
    const startBtn = document.getElementById('start-listening');

    if (voiceState.isEnabled) {
        toggle.classList.add('bg-gaming-purple');
        toggle.classList.remove('bg-dark-600');
        toggle.querySelector('span').classList.add('translate-x-5');
        startBtn.disabled = false;

        showVoiceNotification('Voice commands enabled', 'success');
        console.log('🎤 Voice commands enabled');
    } else {
        toggle.classList.remove('bg-gaming-purple');
        toggle.classList.add('bg-dark-600');
        toggle.querySelector('span').classList.remove('translate-x-5');
        startBtn.disabled = true;

        stopVoiceListening();
        showVoiceNotification('Voice commands disabled', 'info');
        console.log('🎤 Voice commands disabled');
    }

    updateVoiceUI(voiceState.isEnabled ? 'ready' : 'disabled');
    localStorage.setItem('voiceCommandsEnabled', voiceState.isEnabled);
}

// Start voice listening
function startVoiceListening() {
    if (!voiceState.isEnabled || !voiceState.recognition) return;

    try {
        voiceState.recognition.start();

        // Update UI
        document.getElementById('start-listening').classList.add('hidden');
        document.getElementById('stop-listening').classList.remove('hidden');

    } catch (error) {
        console.error('Failed to start voice recognition:', error);
        showVoiceNotification('Failed to start listening', 'error');
    }
}

// Stop voice listening
function stopVoiceListening() {
    if (voiceState.recognition && voiceState.isListening) {
        voiceState.recognition.stop();
    }

    clearTimeout(voiceState.listeningTimeout);

    // Update UI
    document.getElementById('start-listening').classList.remove('hidden');
    document.getElementById('stop-listening').classList.add('hidden');
}

// Update voice UI status
function updateVoiceUI(status) {
    const statusText = document.getElementById('voice-status-text');
    if (!statusText) return;

    const statusMessages = {
        disabled: 'Disabled',
        ready: 'Ready - Click to listen',
        listening: 'Listening for commands...',
        processing: 'Processing command...',
        error: 'Error occurred'
    };

    const statusColors = {
        disabled: 'text-dark-400',
        ready: 'text-gaming-cyan',
        listening: 'text-gaming-green animate-pulse',
        processing: 'text-gaming-blue',
        error: 'text-gaming-red'
    };

    statusText.textContent = statusMessages[status] || 'Unknown';
    statusText.className = `font-mono text-sm ${statusColors[status] || 'text-white'}`;

    // Update last command display
    const lastCommandEl = document.getElementById('last-voice-command');
    if (lastCommandEl && voiceState.lastCommand) {
        lastCommandEl.textContent = voiceState.lastCommand;
    }
}

// Show voice command help
function showVoiceCommandHelp() {
    const helpOverlay = document.createElement('div');
    helpOverlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';

    const commandList = Object.entries(VOICE_COMMANDS)
        .map(([command, config]) =>
            `<div class="flex justify-between items-center py-1 border-b border-dark-700">
                <span class="font-mono text-gaming-cyan text-sm">"${command}"</span>
                <span class="text-dark-300 text-sm">${config.description}</span>
            </div>`
        ).join('');

    helpOverlay.innerHTML = `
        <div class="gaming-panel max-w-4xl w-full mx-4 p-8 rounded-2xl max-h-[80vh] overflow-y-auto">
            <h2 class="text-2xl font-bold text-gaming-purple mb-6 text-center">
                🎤 Voice Commands Reference
            </h2>
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-lg font-semibold text-gaming-blue mb-4">Available Commands</h3>
                    <div class="space-y-1 max-h-96 overflow-y-auto">${commandList}</div>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-gaming-green mb-4">Usage Tips</h3>
                    <div class="space-y-3 text-sm text-dark-300">
                        <p>• <span class="text-gaming-cyan">Speak clearly</span> and wait for response</p>
                        <p>• <span class="text-gaming-blue">Use exact phrases</span> from the command list</p>
                        <p>• <span class="text-gaming-green">Enable microphone</span> permissions when prompted</p>
                        <p>• <span class="text-gaming-yellow">Adjust confidence</span> if commands aren't recognized</p>
                        <p>• <span class="text-gaming-purple">Combine with hotkeys</span> for maximum efficiency</p>
                        <p>• <span class="text-gaming-red">Say "help"</span> to show this panel anytime</p>
                    </div>
                </div>
            </div>
            <div class="mt-8 text-center">
                <button onclick="this.closest('.fixed').remove()" class="btn-primary px-8 py-3 rounded-xl">
                    Close Help
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(helpOverlay);

    // Auto-close after 30 seconds
    setTimeout(() => {
        helpOverlay.remove();
    }, 30000);
}

// Show voice notifications
function showVoiceNotification(message, type = 'info') {
    const colors = {
        info: 'bg-gaming-blue',
        success: 'bg-gaming-green',
        warning: 'bg-gaming-yellow text-black',
        error: 'bg-gaming-red'
    };

    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 left-4 ${colors[type]} rounded-lg p-3 z-40 gaming-glow`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-lg">🎤</span>
            <span class="font-medium">${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Enable gaming optimizations
function enableGamingOptimizations() {
    console.log('🎮 Enabling gaming optimizations...');

    // Set optimal gaming settings
    AppState.settings.processingInterval = 1000; // Faster processing for gaming
    AppState.settings.sensitivity = 70; // Balanced sensitivity for gaming text
    AppState.settings.autoRead = true; // Enable auto-read for accessibility

    saveVoiceSettings();

    showVoiceNotification('Gaming optimizations enabled!', 'success');
    updateStatus('Gaming mode optimized', 'bg-gaming-green');
}

// Get voice command statistics
export function getVoiceCommandStats() {
    return {
        enabled: voiceState.isEnabled,
        isListening: voiceState.isListening,
        commandsExecuted: voiceState.commandHistory.length,
        lastCommand: voiceState.lastCommand,
        confidence: Math.round(voiceState.confidence * 100) + '%',
        availableCommands: Object.keys(VOICE_COMMANDS).length
    };
}

// Cleanup voice command system
export function cleanupVoiceCommands() {
    stopVoiceListening();

    if (voiceState.recognition) {
        voiceState.recognition = null;
    }

    const voicePanel = document.getElementById('voice-command-panel');
    if (voicePanel) voicePanel.remove();

    console.log('🎤 Voice command system cleaned up');
}

// Load voice preferences from storage
function loadVoicePreferences() {
    try {
        const enabled = localStorage.getItem('voiceCommandsEnabled') === 'true';
        const confidence = parseFloat(localStorage.getItem('voiceConfidence')) || 0.7;

        if (enabled) {
            setTimeout(() => toggleVoiceCommands(), 1000); // Enable after UI loads
        }

        voiceState.confidence = confidence;

        const confidenceSlider = document.getElementById('voice-confidence');
        if (confidenceSlider) {
            confidenceSlider.value = Math.round(confidence * 100);
            document.getElementById('voice-confidence-value').textContent = Math.round(confidence * 100);
        }

    } catch (error) {
        console.warn('Could not load voice preferences:', error);
    }
}

// Load voice preferences (called after voice commands are initialized)
export function loadVoicePreferencesDelayed() {
    setTimeout(() => {
        loadVoicePreferences();
    }, 1000);
}

// Functions exported individually above