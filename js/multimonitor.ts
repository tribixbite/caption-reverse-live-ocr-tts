/**
 * Multi-Monitor Support for Gaming Setups
 * Detects and utilizes multiple displays for optimal OCR placement
 */

import { AppState } from './config.js';
import { updateStatus } from './ui.js';
import { MultiMonitorState } from './types.js';

// Window Management API type declarations
interface ScreenDetailed {
    width: number;
    height: number;
    left: number;
    top: number;
    isPrimary: boolean;
    label?: string;
    availWidth?: number;
    availHeight?: number;
    availLeft?: number;
    availTop?: number;
    devicePixelRatio?: number;
}

interface ScreenDetails {
    screens: ScreenDetailed[];
    currentScreen: ScreenDetailed;
}

// Extend Window interface for Window Management API
declare global {
    interface Window {
        getScreenDetails(): Promise<ScreenDetails>;
        executeOverlayAction: (action: string) => void;
        exitFullscreenOverlay: () => void;
    }
}

// Permission name extension for window-management
interface PermissionDescriptor {
    name: PermissionName | 'window-management';
}

// Popup window message data interface
interface PopupMessageData {
    action: string;
}

// Multi-monitor status interface
interface MultiMonitorStatus {
    supported: boolean;
    screensDetected: number;
    hasSecondaryWindow: boolean;
    gamingDisplay: string;
    ocrDisplay: string;
}

// Multi-monitor state
let monitorState: MultiMonitorState = {
    screens: [],
    currentScreen: null,
    popupWindow: null,
    isMultiMonitorSupported: false,
    gamingDisplay: null,
    ocrDisplay: null
};

// Initialize multi-monitor support
export async function initMultiMonitorSupport(): Promise<void> {
    console.log('Initializing Multi-Monitor Support...');

    // Check for Screen Capture API support
    if ('getDisplayMedia' in navigator.mediaDevices) {
        monitorState.isMultiMonitorSupported = true;
        console.log('Screen Capture API available for monitor detection');
    }

    // Check for Window Management API (experimental)
    if ('getScreenDetails' in window) {
        try {
            const permission = await navigator.permissions.query({ name: 'window-management' as PermissionName });
            if (permission.state === 'granted' || permission.state === 'prompt') {
                monitorState.isMultiMonitorSupported = true;
                console.log('Window Management API available');
                await detectScreens();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log('Window Management API not available:', errorMessage);
        }
    }

    // Fallback: Basic multi-window support
    if (!monitorState.isMultiMonitorSupported) {
        console.log('Using basic multi-window support for gaming setups');
        monitorState.isMultiMonitorSupported = true; // Enable basic support
    }

    // Create multi-monitor controls
    createMultiMonitorControls();

    console.log('Multi-Monitor Support initialized');
}

// Detect available screens (if supported)
async function detectScreens(): Promise<ScreenDetailed[]> {
    try {
        if ('getScreenDetails' in window) {
            const screenDetails = await window.getScreenDetails();
            monitorState.screens = screenDetails.screens;

            console.log(`Detected ${monitorState.screens.length} screens:`);
            monitorState.screens.forEach((screen: ScreenDetailed, index: number) => {
                console.log(`   Screen ${index + 1}: ${screen.width}x${screen.height} at (${screen.left}, ${screen.top})`);
            });

            // Identify primary vs secondary displays
            const primaryScreen = monitorState.screens.find((s: ScreenDetailed) => s.isPrimary) || monitorState.screens[0];
            const secondaryScreens = monitorState.screens.filter((s: ScreenDetailed) => !s.isPrimary);

            if (secondaryScreens.length > 0) {
                monitorState.gamingDisplay = primaryScreen;
                monitorState.ocrDisplay = secondaryScreens[0]; // Use first secondary for OCR
                console.log('Gaming setup detected: Primary + Secondary displays');
            }

            return monitorState.screens;
        }
    } catch (error) {
        console.warn('Screen detection failed:', error);
        return [];
    }
    return [];
}

// Create multi-monitor control panel
function createMultiMonitorControls(): void {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'multimonitor-controls';
    controlPanel.className = 'glass rounded-xl p-4 mt-4 hidden';

    controlPanel.innerHTML = `
        <h4 class="text-md font-medium mb-3 text-gaming-blue">Multi-Monitor Gaming Setup</h4>

        <div class="space-y-3">
            <!-- Display Selection -->
            <div>
                <label class="block text-sm font-medium mb-2">OCR Display</label>
                <select id="display-select" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="current">Current Window</option>
                    <option value="popup">Secondary Monitor (Popup)</option>
                    <option value="fullscreen">Fullscreen Overlay</option>
                </select>
            </div>

            <!-- Gaming Mode Options -->
            <div>
                <label class="block text-sm font-medium mb-2">Gaming Mode</label>
                <div class="flex gap-2">
                    <button id="gaming-companion" class="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-gaming-blue text-white">
                        Companion
                    </button>
                    <button id="gaming-overlay" class="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-dark-600 hover:bg-dark-500 text-white">
                        Overlay
                    </button>
                </div>
            </div>

            <!-- Window Controls -->
            <div class="grid grid-cols-2 gap-2">
                <button id="open-secondary" class="btn-gaming py-2 px-3 text-xs rounded-lg">
                    Open on Secondary
                </button>
                <button id="always-on-top" class="btn-gaming py-2 px-3 text-xs rounded-lg">
                    Always on Top
                </button>
            </div>

            <!-- Gaming Integration -->
            <div class="pt-2 border-t border-dark-700">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-dark-300">Gaming Integration</span>
                    <button id="gaming-integration-toggle" class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-dark-600">
                        <span class="inline-block h-3 w-3 transform rounded-full bg-white transition"></span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add to settings modal (but show by default for gaming)
    const debugSection = document.querySelector('section:last-child .space-y-4');
    if (debugSection) {
        debugSection.appendChild(controlPanel);
        controlPanel.classList.remove('hidden'); // Show by default for gaming
    }

    // Setup event listeners
    setupMultiMonitorEventListeners();
}

// Setup multi-monitor event listeners
function setupMultiMonitorEventListeners(): void {
    // Display selection
    const displaySelect = document.getElementById('display-select') as HTMLSelectElement | null;
    if (displaySelect) {
        displaySelect.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLSelectElement;
            const mode = target.value;
            handleDisplayModeChange(mode);
        });
    }

    // Gaming mode buttons
    const gamingCompanion = document.getElementById('gaming-companion');
    if (gamingCompanion) {
        gamingCompanion.addEventListener('click', () => {
            setGamingMode('companion');
        });
    }

    const gamingOverlay = document.getElementById('gaming-overlay');
    if (gamingOverlay) {
        gamingOverlay.addEventListener('click', () => {
            setGamingMode('overlay');
        });
    }

    // Window controls
    const openSecondary = document.getElementById('open-secondary');
    if (openSecondary) {
        openSecondary.addEventListener('click', () => {
            openOnSecondaryMonitor();
        });
    }

    const alwaysOnTop = document.getElementById('always-on-top');
    if (alwaysOnTop) {
        alwaysOnTop.addEventListener('click', () => {
            toggleAlwaysOnTop();
        });
    }

    // Gaming integration toggle
    const gamingIntegrationToggle = document.getElementById('gaming-integration-toggle');
    if (gamingIntegrationToggle) {
        gamingIntegrationToggle.addEventListener('click', () => {
            toggleGamingIntegration();
        });
    }
}

// Handle display mode changes
async function handleDisplayModeChange(mode: string): Promise<void> {
    console.log(`Switching to display mode: ${mode}`);

    switch (mode) {
        case 'current':
            closeSecondaryWindow();
            break;

        case 'popup':
            await openOnSecondaryMonitor();
            break;

        case 'fullscreen':
            await openFullscreenOverlay();
            break;

        default:
            console.warn(`Unknown display mode: ${mode}`);
    }
}

// Open OCR interface on secondary monitor
async function openOnSecondaryMonitor(): Promise<void> {
    try {
        console.log('Opening OCR interface on secondary monitor...');

        // Calculate optimal popup dimensions
        const width = 800;
        const height = 600;

        // Try to position on secondary monitor if detected
        let left = screen.width + 100; // Default to right of primary
        let top = 100;

        if (monitorState.ocrDisplay) {
            left = monitorState.ocrDisplay.left + 100;
            top = monitorState.ocrDisplay.top + 100;
        }

        // Open popup window
        const popup = window.open(
            '',
            'ocr-secondary',
            `width=${width},height=${height},left=${left},top=${top},` +
            'menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes'
        );

        if (!popup) {
            throw new Error('Popup blocked or failed to open');
        }

        monitorState.popupWindow = popup;

        // Clone OCR interface to popup
        await cloneOCRInterface(popup);

        updateStatus('OCR opened on secondary monitor', 'bg-gaming-blue');
        console.log('Secondary monitor OCR window opened');

    } catch (error) {
        console.error('Failed to open secondary monitor:', error);
        updateStatus('Secondary monitor failed', 'bg-red-400');
    }
}

// Clone OCR interface to popup window
async function cloneOCRInterface(popup: Window): Promise<void> {
    // Create minimal OCR interface for popup
    popup.document.write(`
        <!DOCTYPE html>
        <html class="dark">
        <head>
            <meta charset="UTF-8">
            <title>CaptnReverse - Secondary Monitor</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://unpkg.com/tesseract.js@6.0.0/dist/tesseract.min.js"></script>
            <style>
                body { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
                .glass {
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                }
            </style>
        </head>
        <body class="text-white p-6">
            <div class="glass rounded-2xl p-6 text-center">
                <h1 class="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Gaming OCR Companion
                </h1>
                <div id="secondary-status" class="text-gaming-cyan mb-4">Ready for gaming!</div>
                <div class="space-y-3">
                    <button onclick="window.opener.readNow()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl">
                        Read Text Now (F1)
                    </button>
                    <button onclick="window.opener.toggleMonitoring()" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl">
                        Toggle Monitoring (F2)
                    </button>
                    <button onclick="window.opener.runAutoCalibration()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl">
                        Auto-Calibrate (F3)
                    </button>
                </div>
                <div class="mt-6 p-4 bg-dark-800 rounded-xl">
                    <div class="text-sm text-dark-300 mb-2">Last Recognized Text:</div>
                    <div id="last-text" class="font-mono text-gaming-green">None yet</div>
                </div>
                <div class="mt-4 text-xs text-dark-400">
                    Use F1-F12 hotkeys in main window or these buttons for OCR control
                </div>
            </div>
        </body>
        </html>
    `);

    // Setup communication with main window
    popup.document.close();

    // Handle popup close
    popup.addEventListener('beforeunload', () => {
        monitorState.popupWindow = null;
        updateStatus('Secondary monitor closed', 'bg-yellow-400');
    });

    // Expose functions to popup
    (popup as any).readNow = () => {
        // Send message to main window
        window.postMessage({ action: 'readNow' }, '*');
    };

    (popup as any).toggleMonitoring = () => {
        window.postMessage({ action: 'toggleMonitoring' }, '*');
    };

    (popup as any).runAutoCalibration = () => {
        window.postMessage({ action: 'runAutoCalibration' }, '*');
    };

    // Listen for messages from popup
    window.addEventListener('message', (event: MessageEvent) => {
        if (event.source === popup) {
            handlePopupMessage(event.data as PopupMessageData);
        }
    });
}

// Handle messages from popup window
async function handlePopupMessage(data: PopupMessageData): Promise<void> {
    const { action } = data;

    try {
        switch (action) {
            case 'readNow':
                const { readNow } = await import('./ocr.js');
                await readNow();
                break;

            case 'toggleMonitoring':
                const { toggleMonitoring } = await import('./ui.js');
                toggleMonitoring();
                break;

            case 'runAutoCalibration':
                const { runAutoCalibration } = await import('./ocr.js');
                await runAutoCalibration();
                break;

            default:
                console.warn(`Unknown popup action: ${action}`);
        }
    } catch (error) {
        console.error(`Error handling popup action ${action}:`, error);
    }
}

// Update secondary monitor with latest text
export function updateSecondaryMonitor(text: string, confidence: number): void {
    if (monitorState.popupWindow && !monitorState.popupWindow.closed) {
        try {
            const lastTextEl = monitorState.popupWindow.document.getElementById('last-text');
            const statusEl = monitorState.popupWindow.document.getElementById('secondary-status');

            if (lastTextEl) {
                lastTextEl.textContent = text || 'None yet';
            }

            if (statusEl) {
                statusEl.textContent = `Latest: ${confidence}% confidence`;
                statusEl.className = confidence > 80 ? 'text-gaming-green' : 'text-gaming-yellow';
            }
        } catch (error) {
            console.warn('Could not update secondary monitor:', error);
        }
    }
}

// Open fullscreen overlay mode
async function openFullscreenOverlay(): Promise<void> {
    try {
        console.log('Opening fullscreen OCR overlay...');

        // Request fullscreen permission
        await document.documentElement.requestFullscreen();

        // Create overlay interface
        const overlay = document.createElement('div');
        overlay.id = 'fullscreen-ocr-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';

        overlay.innerHTML = `
            <div class="gaming-panel max-w-4xl w-full mx-4 p-8 rounded-2xl">
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gaming-cyan mb-4">Gaming OCR Overlay</h1>
                    <p class="text-gaming-purple">Press ESC to exit fullscreen - F1-F12 hotkeys active</p>
                </div>

                <div class="grid md:grid-cols-3 gap-6">
                    <!-- Quick Actions -->
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-gaming-blue mb-3">Quick Actions</h3>
                        <button onclick="executeOverlayAction('readNow')" class="w-full btn-primary py-3 rounded-xl">
                            Read Text (F1)
                        </button>
                        <button onclick="executeOverlayAction('toggleMonitoring')" class="w-full btn-gaming py-3 rounded-xl">
                            Monitoring (F2)
                        </button>
                        <button onclick="executeOverlayAction('autoCalibrate')" class="w-full btn-gaming py-3 rounded-xl">
                            Calibrate (F3)
                        </button>
                    </div>

                    <!-- Status Display -->
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-gaming-green mb-3">Status</h3>
                        <div id="overlay-status" class="bg-dark-800 rounded-lg p-4">
                            <div class="text-sm text-dark-300 mb-2">System Status:</div>
                            <div class="text-gaming-green font-mono">Ready for gaming</div>
                        </div>
                        <div id="overlay-last-text" class="bg-dark-800 rounded-lg p-4">
                            <div class="text-sm text-dark-300 mb-2">Last Text:</div>
                            <div class="text-gaming-cyan font-mono text-sm">None yet</div>
                        </div>
                    </div>

                    <!-- Performance -->
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-gaming-yellow mb-3">Performance</h3>
                        <div id="overlay-performance" class="bg-dark-800 rounded-lg p-4 text-sm">
                            <div class="flex justify-between mb-1">
                                <span class="text-dark-300">Processing:</span>
                                <span class="text-gaming-yellow font-mono">-- ms</span>
                            </div>
                            <div class="flex justify-between mb-1">
                                <span class="text-dark-300">Confidence:</span>
                                <span class="text-gaming-green font-mono">--%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-dark-300">Memory:</span>
                                <span class="text-gaming-purple font-mono">-- MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 text-center">
                    <button onclick="exitFullscreenOverlay()" class="btn-primary px-8 py-3 rounded-xl">
                        Exit Fullscreen (ESC)
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Handle ESC key to exit
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                exitFullscreenOverlay();
                document.removeEventListener('keydown', escapeHandler);
            }
        };

        document.addEventListener('keydown', escapeHandler);

        updateStatus('Fullscreen OCR overlay active', 'bg-gaming-purple');

    } catch (error) {
        console.error('Failed to open fullscreen overlay:', error);
        updateStatus('Fullscreen overlay failed', 'bg-red-400');
    }
}

// Execute overlay action
function executeOverlayAction(action: string): void {
    window.postMessage({ action }, '*');
}

// Exit fullscreen overlay
function exitFullscreenOverlay(): void {
    const overlay = document.getElementById('fullscreen-ocr-overlay');
    if (overlay) {
        overlay.remove();
    }

    if (document.fullscreenElement) {
        document.exitFullscreen();
    }

    updateStatus('Exited fullscreen overlay', 'bg-blue-400');
}

// Set gaming mode
function setGamingMode(mode: 'companion' | 'overlay'): void {
    console.log(`Setting gaming mode: ${mode}`);

    const companionBtn = document.getElementById('gaming-companion');
    const overlayBtn = document.getElementById('gaming-overlay');

    if (!companionBtn || !overlayBtn) {
        console.warn('Gaming mode buttons not found');
        return;
    }

    if (mode === 'companion') {
        companionBtn.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-gaming-blue text-white';
        overlayBtn.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-dark-600 hover:bg-dark-500 text-white';

        // Companion mode: Normal operation, optimized for secondary display
        updateStatus('Gaming Companion Mode', 'bg-gaming-blue');

    } else if (mode === 'overlay') {
        companionBtn.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-dark-600 hover:bg-dark-500 text-white';
        overlayBtn.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-gaming-purple text-white';

        // Overlay mode: Minimal UI, transparent background
        document.body.style.background = 'rgba(0, 0, 0, 0.3)';
        updateStatus('Gaming Overlay Mode', 'bg-gaming-purple');
    }

    // Save preference
    localStorage.setItem('gamingMode', mode);
}

// Toggle always on top (limited browser support)
function toggleAlwaysOnTop(): void {
    // This feature has limited browser support
    // For now, provide user guidance
    const message = `
Always on Top Tips:

For Gaming Setups:
- Use secondary monitor popup mode
- Set window to stay above games manually
- Consider using browser's picture-in-picture mode
- Use F11 for fullscreen overlay mode

Browser Support:
- Chrome: Limited support via --enable-features=WindowPlacement
- Firefox: Not supported
- Edge: Limited support
    `;

    alert(message);
    console.log('Always on top guidance shown');
}

// Toggle gaming integration features
function toggleGamingIntegration(): void {
    const toggle = document.getElementById('gaming-integration-toggle');
    if (!toggle) {
        console.warn('Gaming integration toggle not found');
        return;
    }

    const isEnabled = toggle.classList.contains('bg-gaming-blue');
    const toggleSpan = toggle.querySelector('span');

    if (isEnabled) {
        toggle.classList.remove('bg-gaming-blue');
        toggle.classList.add('bg-dark-600');
        if (toggleSpan) {
            toggleSpan.classList.remove('translate-x-5');
        }
        updateStatus('Gaming integration disabled', 'bg-gray-400');
    } else {
        toggle.classList.add('bg-gaming-blue');
        toggle.classList.remove('bg-dark-600');
        if (toggleSpan) {
            toggleSpan.classList.add('translate-x-5');
        }
        updateStatus('Gaming integration enabled', 'bg-gaming-blue');
    }

    const enabled = !isEnabled;
    localStorage.setItem('gamingIntegrationEnabled', String(enabled));
    console.log(`Gaming integration ${enabled ? 'enabled' : 'disabled'}`);
}

// Close secondary window
function closeSecondaryWindow(): void {
    if (monitorState.popupWindow && !monitorState.popupWindow.closed) {
        monitorState.popupWindow.close();
        monitorState.popupWindow = null;
        updateStatus('Secondary monitor closed', 'bg-yellow-400');
        console.log('Secondary monitor window closed');
    }
}

// Show/hide multi-monitor controls
export function toggleMultiMonitorControls(): void {
    const controls = document.getElementById('multimonitor-controls');
    if (controls) {
        const isHidden = controls.classList.contains('hidden');
        controls.classList.toggle('hidden', !isHidden);

        if (!isHidden) {
            console.log('Multi-monitor controls shown');
        } else {
            console.log('Multi-monitor controls hidden');
        }
    }
}

// Get multi-monitor status
export function getMultiMonitorStatus(): MultiMonitorStatus {
    return {
        supported: monitorState.isMultiMonitorSupported,
        screensDetected: monitorState.screens.length,
        hasSecondaryWindow: monitorState.popupWindow !== null && !monitorState.popupWindow.closed,
        gamingDisplay: monitorState.gamingDisplay ? 'Primary' : 'Unknown',
        ocrDisplay: monitorState.ocrDisplay ? 'Secondary' : 'Primary'
    };
}

// Cleanup multi-monitor system
export function cleanupMultiMonitorSystem(): void {
    closeSecondaryWindow();

    const overlay = document.getElementById('fullscreen-ocr-overlay');
    if (overlay) overlay.remove();

    const controls = document.getElementById('multimonitor-controls');
    if (controls) controls.remove();

    console.log('Multi-monitor system cleaned up');
}

// Make functions globally accessible
window.executeOverlayAction = executeOverlayAction;
window.exitFullscreenOverlay = exitFullscreenOverlay;
