/**
 * Gaming Hotkey System
 * Global keyboard shortcuts for hands-free OCR operation during gaming
 */

import { AppState } from './config.js';
import { readNow, runAutoCalibration } from './ocr.js';
import { speak, stopSpeech } from './speech.js';
import { toggleMonitoring } from './ui.js';
import { generatePerformanceReport } from './performance.js';
import { openSettings, closeSettings } from './settings.js';
import type { HotkeyConfig, PerformanceReport } from './types.js';

// Extend Window interface for global function
declare global {
    interface Window {
        toggleHotkeyHelp: () => void;
    }
}

// Hotkey configuration map type
type HotkeyConfigMap = Record<string, HotkeyConfig>;

// Notification type
type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Hotkey state interface
interface HotkeyState {
    enabled: boolean;
    lastText: string;
    isMonitoringPaused: boolean;
    helpVisible: boolean;
    sessionPaused: boolean;
}

// Session data interface for saving
interface SessionData {
    timestamp: number;
    settings: typeof AppState.settings;
    lastText: string;
    performance: PerformanceReport;
    crop: typeof AppState.currentCrop;
}

// Hotkey configuration with gaming-optimized defaults
const HOTKEY_CONFIG: HotkeyConfigMap = {
    // Primary OCR Functions (F1-F4)
    F1: { action: 'readNow', description: 'Read Text Now', enabled: true },
    F2: { action: 'toggleMonitoring', description: 'Toggle Continuous Monitoring', enabled: true },
    F3: { action: 'autoCalibrate', description: 'Auto-Calibrate OCR Settings', enabled: true },
    F4: { action: 'clearHistory', description: 'Clear OCR History', enabled: true },

    // Audio Controls (F5-F8)
    F5: { action: 'speakLastText', description: 'Repeat Last Text', enabled: true },
    F6: { action: 'stopSpeech', description: 'Stop Speech', enabled: true },
    F7: { action: 'toggleAutoRead', description: 'Toggle Auto-Read', enabled: true },
    F8: { action: 'testTTS', description: 'Test Text-to-Speech', enabled: true },

    // System Controls (F9-F12)
    F9: { action: 'showPerformanceReport', description: 'Show Performance Report', enabled: true },
    F10: { action: 'toggleSettings', description: 'Toggle Settings', enabled: true },
    F11: { action: 'toggleFullscreen', description: 'Toggle Fullscreen Mode', enabled: true },
    F12: { action: 'showHelp', description: 'Show Hotkey Help', enabled: true },

    // Gaming-specific combinations (Ctrl + key)
    'Ctrl+F1': { action: 'quickOCR', description: 'Quick OCR (No Audio)', enabled: true },
    'Ctrl+F2': { action: 'pauseMonitoring', description: 'Pause All OCR Activity', enabled: true },
    'Ctrl+F3': { action: 'switchOCREngine', description: 'Switch OCR Engine', enabled: true },
    'Ctrl+F4': { action: 'saveOCRSession', description: 'Save Current Session', enabled: true },

    // Alternative keys for accessibility
    'Alt+R': { action: 'readNow', description: 'Alt: Read Text Now', enabled: true },
    'Alt+M': { action: 'toggleMonitoring', description: 'Alt: Toggle Monitoring', enabled: true },
    'Alt+S': { action: 'speakLastText', description: 'Alt: Speak Last Text', enabled: true },
    'Alt+Q': { action: 'stopSpeech', description: 'Alt: Stop Speech', enabled: true }
};

// State management
let hotkeyState: HotkeyState = {
    enabled: true,
    lastText: '',
    isMonitoringPaused: false,
    helpVisible: false,
    sessionPaused: false
};

// Initialize hotkey system
export function initHotkeySystem(): void {
    console.log('Initializing Gaming Hotkey System...');

    // Add global event listeners
    document.addEventListener('keydown', handleGlobalKeydown);
    document.addEventListener('keyup', handleGlobalKeyup);

    // Create hotkey help overlay
    createHotkeyHelpOverlay();

    // Load user hotkey preferences
    loadHotkeyPreferences();

    console.log('Gaming Hotkey System initialized');
    console.log('Available hotkeys:', Object.keys(HOTKEY_CONFIG));

    // Show initial hotkey notification
    showHotkeyNotification('Gaming Hotkeys Enabled! Press F12 for help');
}

// Handle global keydown events
function handleGlobalKeydown(event: KeyboardEvent): void {
    if (!hotkeyState.enabled) return;

    // Don't interfere with typing in input fields (except when gaming)
    const activeElement = document.activeElement as HTMLElement | null;
    const isInputField = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
    );

    // Allow hotkeys in input fields only for critical gaming functions
    const criticalKeys: string[] = ['F1', 'F2', 'F5', 'F6', 'F12'];
    const keyString = getKeyString(event);

    if (isInputField && !criticalKeys.includes(keyString)) {
        return;
    }

    const hotkeyConfig = HOTKEY_CONFIG[keyString];
    if (hotkeyConfig && hotkeyConfig.enabled) {
        event.preventDefault();
        event.stopPropagation();

        console.log(`Hotkey triggered: ${keyString} - ${hotkeyConfig.description}`);
        executeHotkeyAction(hotkeyConfig.action, keyString);

        // Visual feedback for hotkey activation
        showHotkeyFeedback(keyString, hotkeyConfig.description);
    }
}

// Handle global keyup events (for key combinations that need release detection)
function handleGlobalKeyup(_event: KeyboardEvent): void {
    // Currently no keyup-specific actions, but ready for future features
    // like push-to-talk functionality
}

// Get standardized key string from event
function getKeyString(event: KeyboardEvent): string {
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    if (event.metaKey) modifiers.push('Meta');

    let key = event.code;

    // Normalize function keys
    if (key.startsWith('F') && key.length <= 3) {
        key = key;
    } else if (key.startsWith('Key')) {
        key = key.replace('Key', '');
    } else if (key.startsWith('Digit')) {
        key = key.replace('Digit', '');
    }

    return modifiers.length > 0 ? modifiers.join('+') + '+' + key : key;
}

// Execute hotkey action
async function executeHotkeyAction(action: string, keyString: string): Promise<void> {
    try {
        switch (action) {
            case 'readNow':
                await readNow();
                break;

            case 'toggleMonitoring':
                toggleMonitoring();
                break;

            case 'autoCalibrate':
                await runAutoCalibration();
                break;

            case 'clearHistory':
                clearOCRHistory();
                break;

            case 'speakLastText':
                speakLastRecognizedText();
                break;

            case 'stopSpeech':
                stopSpeech();
                break;

            case 'toggleAutoRead':
                toggleAutoRead();
                break;

            case 'testTTS':
                speak('Gaming hotkeys are working perfectly! Press F12 to see all available shortcuts.');
                break;

            case 'showPerformanceReport':
                const report = generatePerformanceReport();
                displayPerformanceReport(report);
                break;

            case 'toggleSettings':
                toggleSettingsPanel();
                break;

            case 'toggleFullscreen':
                toggleFullscreenMode();
                break;

            case 'showHelp':
                toggleHotkeyHelp();
                break;

            case 'quickOCR':
                await quickOCRWithoutAudio();
                break;

            case 'pauseMonitoring':
                pauseAllOCRActivity();
                break;

            case 'switchOCREngine':
                switchOCREngine();
                break;

            case 'saveOCRSession':
                saveCurrentSession();
                break;

            default:
                console.warn(`Unknown hotkey action: ${action}`);
        }
    } catch (error) {
        console.error(`Error executing hotkey action ${action}:`, error);
        showHotkeyNotification(`Error: ${action} failed`, 'error');
    }
}

// Hotkey action implementations
function clearOCRHistory(): void {
    // Implementation will be added with history system
    hotkeyState.lastText = '';
    showHotkeyNotification('OCR History Cleared');
    console.log('OCR history cleared via hotkey');
}

function speakLastRecognizedText(): void {
    if (hotkeyState.lastText) {
        speak(hotkeyState.lastText);
        showHotkeyNotification(`Speaking: "${hotkeyState.lastText.substring(0, 30)}..."`);
    } else {
        speak('No text has been recognized yet.');
        showHotkeyNotification('No previous text to speak');
    }
}

function toggleAutoRead(): void {
    AppState.settings.autoRead = !AppState.settings.autoRead;
    // Import dynamically to avoid circular dependencies
    import('./settings.js').then(({ saveSettings }) => {
        saveSettings();
    });

    const status = AppState.settings.autoRead ? 'Enabled' : 'Disabled';
    showHotkeyNotification(`Auto-Read ${status}`);
    console.log(`Auto-read ${status.toLowerCase()} via hotkey`);
}

async function quickOCRWithoutAudio(): Promise<void> {
    const originalAutoRead = AppState.settings.autoRead;
    AppState.settings.autoRead = false; // Temporarily disable audio

    try {
        await readNow();
        showHotkeyNotification('Quick OCR completed (silent)');
    } finally {
        AppState.settings.autoRead = originalAutoRead; // Restore setting
    }
}

function pauseAllOCRActivity(): void {
    hotkeyState.sessionPaused = !hotkeyState.sessionPaused;

    if (hotkeyState.sessionPaused) {
        // Stop monitoring if active
        if (AppState.isMonitoring) {
            toggleMonitoring();
        }
        stopSpeech();
        showHotkeyNotification('All OCR Activity Paused', 'warning');
        console.log('OCR activity paused via hotkey');
    } else {
        showHotkeyNotification('OCR Activity Resumed', 'success');
        console.log('OCR activity resumed via hotkey');
    }
}

function switchOCREngine(): void {
    const newEngine = AppState.currentOCREngine === 'tesseract' ? 'paddle' : 'tesseract';

    // Import dynamically to avoid circular dependencies
    import('./ocr.js').then(({ switchOCREngine: switchEngine }) => {
        switchEngine(newEngine);
        showHotkeyNotification(`Switched to ${newEngine === 'tesseract' ? 'Tesseract.js' : 'PaddleOCR'}`);
    });
}

function saveCurrentSession(): void {
    const sessionData: SessionData = {
        timestamp: Date.now(),
        settings: AppState.settings,
        lastText: hotkeyState.lastText,
        performance: generatePerformanceReport(),
        crop: AppState.currentCrop
    };

    localStorage.setItem('ocrGameSession', JSON.stringify(sessionData));
    showHotkeyNotification('Gaming session saved!');
    console.log('Gaming session saved via hotkey');
}

function toggleSettingsPanel(): void {
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) {
        console.warn('Settings modal not found');
        return;
    }

    const isVisible = !settingsModal.classList.contains('hidden');

    if (isVisible) {
        closeSettings();
        showHotkeyNotification('Settings Closed');
    } else {
        openSettings();
        showHotkeyNotification('Settings Opened');
    }
}

function toggleFullscreenMode(): void {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            showHotkeyNotification('Fullscreen Mode Enabled');
        }).catch((_err: Error) => {
            showHotkeyNotification('Fullscreen not supported', 'error');
        });
    } else {
        document.exitFullscreen().then(() => {
            showHotkeyNotification('Fullscreen Mode Disabled');
        });
    }
}

// Display performance report in gaming-friendly overlay
function displayPerformanceReport(report: PerformanceReport): void {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    overlay.id = 'performance-overlay';

    overlay.innerHTML = `
        <div class="gaming-panel max-w-2xl w-full mx-4 p-8 rounded-2xl">
            <h2 class="text-2xl font-bold text-gaming-cyan mb-6 text-center">Performance Report</h2>
            <div class="grid grid-cols-2 gap-6 text-sm">
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-dark-300">Uptime:</span>
                        <span class="text-gaming-green font-mono">${report.uptime}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-dark-300">Frames Processed:</span>
                        <span class="text-gaming-blue font-mono">${report.processedFrames}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-dark-300">Success Rate:</span>
                        <span class="text-gaming-green font-mono">${report.successRate}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-dark-300">Avg OCR Time:</span>
                        <span class="text-gaming-yellow font-mono">${report.averageOCRTime}</span>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-dark-300">Avg Confidence:</span>
                        <span class="text-gaming-purple font-mono">${report.averageConfidence}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-dark-300">Memory Usage:</span>
                        <span class="text-gaming-cyan font-mono">${report.currentMemoryUsage}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-dark-300">Performance:</span>
                        <span class="text-gaming-green font-mono">${report.performance}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-dark-300">Frames/Min:</span>
                        <span class="text-gaming-blue font-mono">${report.framesPerMinute}</span>
                    </div>
                </div>
            </div>
            <div class="mt-8 text-center">
                <button onclick="document.getElementById('performance-overlay')?.remove()"
                        class="btn-primary px-8 py-3 rounded-xl">
                    Close (F9)
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Auto-close after 10 seconds or on F9 press
    const closeTimer = setTimeout(() => {
        overlay.remove();
    }, 10000);

    overlay.addEventListener('click', (e: MouseEvent) => {
        if (e.target === overlay) {
            clearTimeout(closeTimer);
            overlay.remove();
        }
    });
}

// Create hotkey help overlay
function createHotkeyHelpOverlay(): void {
    const helpOverlay = document.createElement('div');
    helpOverlay.id = 'hotkey-help-overlay';
    helpOverlay.className = 'fixed inset-0 bg-black bg-opacity-80 hidden items-center justify-center z-50';

    const hotkeyList = Object.entries(HOTKEY_CONFIG)
        .filter(([_key, config]) => config.enabled)
        .map(([key, config]) =>
            `<div class="flex justify-between items-center py-2 border-b border-dark-700">
                <span class="font-mono text-gaming-cyan">${key}</span>
                <span class="text-dark-300">${config.description}</span>
            </div>`
        ).join('');

    helpOverlay.innerHTML = `
        <div class="gaming-panel max-w-4xl w-full mx-4 p-8 rounded-2xl max-h-[80vh] overflow-y-auto">
            <h2 class="text-3xl font-bold text-gaming-cyan mb-6 text-center animate-glow">
                Gaming Hotkeys Reference
            </h2>
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-xl font-semibold text-gaming-blue mb-4">Primary OCR Functions</h3>
                    <div class="space-y-1 text-sm">${hotkeyList}</div>
                </div>
                <div>
                    <h3 class="text-xl font-semibold text-gaming-purple mb-4">Gaming Tips</h3>
                    <div class="space-y-3 text-sm text-dark-300">
                        <p>* <span class="text-gaming-green">F1</span> - Quick OCR for instant text recognition</p>
                        <p>* <span class="text-gaming-blue">F2</span> - Start/stop continuous monitoring</p>
                        <p>* <span class="text-gaming-yellow">F5</span> - Repeat last recognized text</p>
                        <p>* <span class="text-gaming-purple">Ctrl+F2</span> - Pause all activity during cutscenes</p>
                        <p>* <span class="text-gaming-cyan">Alt combinations</span> - Alternative keys for accessibility</p>
                        <p>* <span class="text-gaming-red">F12</span> - Show/hide this help panel</p>
                    </div>
                </div>
            </div>
            <div class="mt-8 text-center">
                <button onclick="toggleHotkeyHelp()" class="btn-primary px-8 py-3 rounded-xl">
                    Close Help (F12)
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(helpOverlay);
}

// Toggle hotkey help visibility
function toggleHotkeyHelp(): void {
    const helpOverlay = document.getElementById('hotkey-help-overlay');
    if (!helpOverlay) {
        console.warn('Hotkey help overlay not found');
        return;
    }

    hotkeyState.helpVisible = !hotkeyState.helpVisible;

    if (hotkeyState.helpVisible) {
        helpOverlay.classList.remove('hidden');
        helpOverlay.classList.add('flex');
        showHotkeyNotification('Hotkey Help Displayed');
    } else {
        helpOverlay.classList.add('hidden');
        helpOverlay.classList.remove('flex');
        showHotkeyNotification('Hotkey Help Hidden');
    }
}

// Show visual feedback for hotkey activation
function showHotkeyFeedback(keyString: string, description: string): void {
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-4 right-4 gaming-panel p-4 rounded-xl z-40 animate-float';
    feedback.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gaming-blue rounded-lg flex items-center justify-center">
                <span class="text-white font-mono text-xs">${keyString}</span>
            </div>
            <span class="text-gaming-cyan font-medium">${description}</span>
        </div>
    `;

    document.body.appendChild(feedback);

    // Remove after 3 seconds
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

// Show general hotkey notifications
function showHotkeyNotification(message: string, type: NotificationType = 'info'): void {
    const colors: Record<NotificationType, string> = {
        info: 'text-gaming-cyan',
        success: 'text-gaming-green',
        warning: 'text-gaming-yellow',
        error: 'text-gaming-red'
    };

    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 gaming-panel p-3 rounded-lg z-30';
    notification.innerHTML = `
        <span class="${colors[type]} font-medium">${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2500);
}

// Load user hotkey preferences
function loadHotkeyPreferences(): void {
    try {
        const saved = localStorage.getItem('hotkeyPreferences');
        if (saved) {
            const preferences = JSON.parse(saved) as Partial<HotkeyConfigMap>;
            Object.assign(HOTKEY_CONFIG, preferences);
            console.log('Loaded custom hotkey preferences');
        }
    } catch (error) {
        console.warn('Could not load hotkey preferences:', error);
    }
}

// Save user hotkey preferences
export function saveHotkeyPreferences(): void {
    try {
        localStorage.setItem('hotkeyPreferences', JSON.stringify(HOTKEY_CONFIG));
        console.log('Saved hotkey preferences');
    } catch (error) {
        console.warn('Could not save hotkey preferences:', error);
    }
}

// Update last recognized text (called from OCR module)
export function updateLastRecognizedText(text: string): void {
    hotkeyState.lastText = text;
}

// Enable/disable hotkey system
export function toggleHotkeySystem(enabled: boolean): void {
    hotkeyState.enabled = enabled;
    const status = enabled ? 'Enabled' : 'Disabled';
    showHotkeyNotification(`Gaming Hotkeys ${status}`);
    console.log(`Hotkey system ${status.toLowerCase()}`);
}

// Get current hotkey configuration
export function getHotkeyConfig(): HotkeyConfigMap {
    return { ...HOTKEY_CONFIG };
}

// Cleanup hotkey system
export function cleanupHotkeySystem(): void {
    document.removeEventListener('keydown', handleGlobalKeydown);
    document.removeEventListener('keyup', handleGlobalKeyup);

    // Remove overlays
    const helpOverlay = document.getElementById('hotkey-help-overlay');
    const performanceOverlay = document.getElementById('performance-overlay');

    if (helpOverlay) helpOverlay.remove();
    if (performanceOverlay) performanceOverlay.remove();

    console.log('Hotkey system cleaned up');
}

// Make toggleHotkeyHelp globally accessible
window.toggleHotkeyHelp = toggleHotkeyHelp;
