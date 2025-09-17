/**
 * Steam Deck Gaming Handheld Optimization
 * Optimizations for Steam Deck, ROG Ally, and other gaming handhelds
 */

import { AppState } from './config.js';
import { updateStatus } from './ui.js';

// Steam Deck detection and optimization state
let steamDeckState = {
    isHandheld: false,
    deviceType: 'unknown',
    orientation: 'landscape',
    touchSupported: false,
    gamepadConnected: false,
    optimizationsApplied: false
};

// Initialize Steam Deck and handheld gaming optimizations
export function initSteamDeckOptimizations() {
    console.log('🎮 Initializing Steam Deck & Gaming Handheld Optimizations...');

    // Detect gaming handheld devices
    detectGamingHandheld();

    // Apply handheld-specific optimizations
    if (steamDeckState.isHandheld) {
        applyHandheldOptimizations();
    }

    // Setup gamepad support
    setupGamepadSupport();

    // Setup orientation handling
    setupOrientationHandling();

    console.log('✅ Steam Deck optimizations initialized');
}

// Detect if running on gaming handheld device
function detectGamingHandheld() {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = screen.width;
    const screenHeight = screen.height;

    // Steam Deck detection
    if (userAgent.includes('steamdeck') ||
        (screenWidth === 1280 && screenHeight === 800) ||
        userAgent.includes('steamos')) {
        steamDeckState.deviceType = 'steam-deck';
        steamDeckState.isHandheld = true;
        console.log('🎮 Steam Deck detected!');
    }
    // ROG Ally detection
    else if (userAgent.includes('rog ally') ||
             (screenWidth === 1920 && screenHeight === 1080 && 'ontouchstart' in window)) {
        steamDeckState.deviceType = 'rog-ally';
        steamDeckState.isHandheld = true;
        console.log('🎮 ROG Ally detected!');
    }
    // Legion Go detection
    else if (userAgent.includes('legion go') || userAgent.includes('legion')) {
        steamDeckState.deviceType = 'legion-go';
        steamDeckState.isHandheld = true;
        console.log('🎮 Legion Go detected!');
    }
    // Generic handheld detection (touch + gamepad + landscape)
    else if ('ontouchstart' in window &&
             navigator.getGamepads &&
             screenWidth > screenHeight) {
        steamDeckState.deviceType = 'generic-handheld';
        steamDeckState.isHandheld = true;
        console.log('🎮 Generic gaming handheld detected!');
    }

    steamDeckState.touchSupported = 'ontouchstart' in window;

    if (steamDeckState.isHandheld) {
        console.log(`📱 Device: ${steamDeckState.deviceType}`);
        console.log(`👆 Touch support: ${steamDeckState.touchSupported}`);
        console.log(`📐 Screen: ${screenWidth}x${screenHeight}`);
    }
}

// Apply handheld-specific optimizations
function applyHandheldOptimizations() {
    console.log('🎮 Applying gaming handheld optimizations...');

    // Add handheld-specific CSS
    const handheldStyles = document.createElement('style');
    handheldStyles.id = 'handheld-optimizations';
    handheldStyles.textContent = `
        /* Steam Deck and gaming handheld optimizations */
        @media (max-width: 1280px) and (orientation: landscape) {
            /* Larger touch targets for handheld use */
            button {
                min-height: 44px;
                min-width: 44px;
            }

            /* Optimized button spacing for thumb control */
            .space-y-3 > * + * {
                margin-top: 1rem;
            }

            /* Larger text for handheld readability */
            .text-sm {
                font-size: 1rem;
            }

            .text-xs {
                font-size: 0.875rem;
            }

            /* Enhanced glassmorphism for OLED screens */
            .glass {
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(12px);
            }

            /* Steam Deck specific optimizations */
            .gaming-handheld-mode {
                padding: 1rem;
                border-radius: 16px;
            }

            /* Reduce motion for battery optimization */
            .animate-float {
                animation-duration: 8s;
            }

            /* Optimize for gamepad navigation */
            button:focus,
            input:focus,
            select:focus {
                outline: 3px solid #3b82f6;
                outline-offset: 2px;
            }
        }

        /* Steam Deck portrait mode (rare but possible) */
        @media (max-width: 800px) and (orientation: portrait) {
            .container {
                max-width: 100%;
                padding: 0.5rem;
            }

            .grid {
                grid-template-columns: 1fr;
            }
        }
    `;

    document.head.appendChild(handheldStyles);

    // Add handheld indicator
    addHandheldIndicator();

    // Optimize performance for handheld
    optimizeForHandheld();

    steamDeckState.optimizationsApplied = true;
    console.log('✅ Gaming handheld optimizations applied');
}

// Add visual indicator for handheld mode
function addHandheldIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'fixed top-4 left-4 bg-gaming-purple rounded-lg p-2 z-30 text-xs font-medium';
    indicator.innerHTML = `
        <div class="flex items-center gap-2">
            <span>🎮</span>
            <span>${getDeviceDisplayName()}</span>
        </div>
    `;

    document.body.appendChild(indicator);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        indicator.style.opacity = '0.7';
        indicator.style.transition = 'opacity 0.5s';
    }, 5000);
}

// Get user-friendly device name
function getDeviceDisplayName() {
    const names = {
        'steam-deck': 'Steam Deck',
        'rog-ally': 'ROG Ally',
        'legion-go': 'Legion Go',
        'generic-handheld': 'Gaming Handheld'
    };

    return names[steamDeckState.deviceType] || 'Gaming Device';
}

// Optimize performance for handheld devices
function optimizeForHandheld() {
    // Reduce processing interval for better battery life
    if (AppState.settings.processingInterval < 3000) {
        AppState.settings.processingInterval = 3000; // 3 seconds for battery optimization
        console.log('🔋 Processing interval increased for battery optimization');
    }

    // Reduce sensitivity for faster processing
    if (AppState.settings.sensitivity > 70) {
        AppState.settings.sensitivity = 70; // Balanced for handheld performance
        console.log('⚡ Sensitivity optimized for handheld performance');
    }

    // Enable power-saving animations
    document.body.classList.add('power-saving-mode');
}

// Setup gamepad support for gaming handhelds
function setupGamepadSupport() {
    if (!navigator.getGamepads) {
        console.log('⚠️ Gamepad API not supported');
        return;
    }

    // Listen for gamepad connections
    window.addEventListener('gamepadconnected', (e) => {
        steamDeckState.gamepadConnected = true;
        console.log(`🎮 Gamepad connected: ${e.gamepad.id}`);
        updateStatus('Gamepad connected', 'bg-gaming-blue');

        setupGamepadControls(e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
        steamDeckState.gamepadConnected = false;
        console.log(`🎮 Gamepad disconnected: ${e.gamepad.id}`);
        updateStatus('Gamepad disconnected', 'bg-yellow-400');
    });

    // Check for already connected gamepads
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
        if (gamepad) {
            steamDeckState.gamepadConnected = true;
            console.log(`🎮 Existing gamepad found: ${gamepad.id}`);
            setupGamepadControls(gamepad);
            break;
        }
    }
}

// Setup gamepad controls for OCR functions
function setupGamepadControls(gamepad) {
    let lastButtonStates = new Array(gamepad.buttons.length).fill(false);

    const gamepadLoop = () => {
        const currentGamepads = navigator.getGamepads();
        const currentGamepad = currentGamepads[gamepad.index];

        if (!currentGamepad) return;

        // Check button presses
        currentGamepad.buttons.forEach((button, index) => {
            const pressed = button.pressed;
            const wasPressed = lastButtonStates[index];

            // Button was just pressed (edge detection)
            if (pressed && !wasPressed) {
                handleGamepadButton(index, currentGamepad.id);
            }

            lastButtonStates[index] = pressed;
        });

        // Continue loop if gamepad still connected
        if (steamDeckState.gamepadConnected) {
            requestAnimationFrame(gamepadLoop);
        }
    };

    requestAnimationFrame(gamepadLoop);
}

// Handle gamepad button presses
async function handleGamepadButton(buttonIndex, gamepadId) {
    console.log(`🎮 Gamepad button ${buttonIndex} pressed on ${gamepadId}`);

    // Steam Deck button mappings
    const steamDeckMappings = {
        0: 'readNow',        // A button
        1: 'toggleMonitoring', // B button
        2: 'autoCalibrate',  // X button
        3: 'showHistory',    // Y button
        9: 'showHelp',       // Menu button
        8: 'showPerformance' // View button
    };

    // Generic gamepad mappings
    const genericMappings = {
        0: 'readNow',        // Button 0 (usually A/Cross)
        1: 'toggleMonitoring', // Button 1 (usually B/Circle)
        2: 'autoCalibrate',  // Button 2 (usually X/Square)
        3: 'showHistory'     // Button 3 (usually Y/Triangle)
    };

    const mappings = gamepadId.toLowerCase().includes('steam') ? steamDeckMappings : genericMappings;
    const action = mappings[buttonIndex];

    if (action) {
        console.log(`🎮 Executing gamepad action: ${action}`);
        await executeGamepadAction(action);

        // Visual feedback
        showGamepadFeedback(buttonIndex, action);
    }
}

// Execute gamepad action
async function executeGamepadAction(action) {
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

            case 'autoCalibrate':
                const { runAutoCalibration } = await import('./ocr.js');
                await runAutoCalibration();
                break;

            case 'showHistory':
                const { toggleHistoryPanel } = await import('./history.js');
                toggleHistoryPanel();
                break;

            case 'showHelp':
                const { toggleHotkeyHelp } = await import('./hotkeys.js');
                if (window.toggleHotkeyHelp) {
                    window.toggleHotkeyHelp();
                }
                break;

            case 'showPerformance':
                const { generatePerformanceReport } = await import('./performance.js');
                generatePerformanceReport();
                break;

            default:
                console.warn(`Unknown gamepad action: ${action}`);
        }
    } catch (error) {
        console.error(`Gamepad action ${action} failed:`, error);
    }
}

// Show visual feedback for gamepad actions
function showGamepadFeedback(buttonIndex, action) {
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 gaming-panel p-4 rounded-xl z-50';
    feedback.innerHTML = `
        <div class="text-center">
            <div class="text-2xl mb-2">🎮</div>
            <div class="text-gaming-cyan font-medium">Button ${buttonIndex}</div>
            <div class="text-white text-sm">${action}</div>
        </div>
    `;

    document.body.appendChild(feedback);

    // Remove after 2 seconds
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

// Setup orientation handling for handheld devices
function setupOrientationHandling() {
    if (!steamDeckState.isHandheld) return;

    const handleOrientationChange = () => {
        const orientation = screen.orientation?.type ||
                          (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');

        if (orientation !== steamDeckState.orientation) {
            steamDeckState.orientation = orientation;
            console.log(`📱 Orientation changed to: ${orientation}`);

            // Apply orientation-specific optimizations
            applyOrientationOptimizations(orientation);
        }
    };

    // Listen for orientation changes
    if (screen.orientation) {
        screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
        window.addEventListener('resize', handleOrientationChange);
    }

    handleOrientationChange(); // Initial check
}

// Apply orientation-specific optimizations
function applyOrientationOptimizations(orientation) {
    const body = document.body;

    if (orientation.includes('landscape')) {
        body.classList.add('handheld-landscape');
        body.classList.remove('handheld-portrait');

        // Optimize for landscape gaming
        console.log('🎮 Landscape mode optimizations applied');
    } else {
        body.classList.add('handheld-portrait');
        body.classList.remove('handheld-landscape');

        // Optimize for portrait (rare on gaming handhelds)
        console.log('📱 Portrait mode optimizations applied');
    }
}

// Create handheld-specific UI enhancements
export function createHandheldUI() {
    if (!steamDeckState.isHandheld) return;

    // Add handheld control panel
    const handheldPanel = document.createElement('div');
    handheldPanel.id = 'handheld-controls';
    handheldPanel.className = 'fixed bottom-4 right-4 gaming-panel p-3 rounded-xl z-30';

    handheldPanel.innerHTML = `
        <div class="space-y-2">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-gaming-purple">🎮</span>
                <span class="font-medium text-white text-sm">${getDeviceDisplayName()}</span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="text-center p-2 bg-dark-800 rounded">
                    <div class="text-gaming-cyan">A/🔍</div>
                    <div class="text-dark-300">Read Text</div>
                </div>
                <div class="text-center p-2 bg-dark-800 rounded">
                    <div class="text-gaming-green">B/📹</div>
                    <div class="text-dark-300">Monitor</div>
                </div>
                <div class="text-center p-2 bg-dark-800 rounded">
                    <div class="text-gaming-yellow">X/🎯</div>
                    <div class="text-dark-300">Calibrate</div>
                </div>
                <div class="text-center p-2 bg-dark-800 rounded">
                    <div class="text-gaming-purple">Y/📚</div>
                    <div class="text-dark-300">History</div>
                </div>
            </div>

            <button onclick="toggleHandheldControls()" class="w-full bg-dark-600 hover:bg-dark-500 text-white py-1 text-xs rounded">
                Hide Controls
            </button>
        </div>
    `;

    document.body.appendChild(handheldPanel);

    // Auto-hide after 10 seconds
    setTimeout(() => {
        const panel = document.getElementById('handheld-controls');
        if (panel) {
            panel.style.opacity = '0.3';
            panel.style.transition = 'opacity 0.5s';
        }
    }, 10000);
}

// Toggle handheld controls visibility
function toggleHandheldControls() {
    const panel = document.getElementById('handheld-controls');
    if (panel) {
        const isVisible = panel.style.opacity !== '0';
        panel.style.opacity = isVisible ? '0' : '1';
        panel.style.pointerEvents = isVisible ? 'none' : 'auto';
    }
}

// Optimize OCR settings for handheld gaming
export function optimizeForHandheldGaming() {
    if (!steamDeckState.isHandheld) return;

    console.log('🎮 Optimizing OCR settings for handheld gaming...');

    // Battery-optimized settings
    const handheldSettings = {
        processingInterval: 3000, // Longer interval for battery life
        sensitivity: 75, // Higher sensitivity for quicker recognition
        speechRate: 1.2, // Slightly faster speech for gaming
        imageThreshold: 160 // Adjusted for handheld screens
    };

    // Apply settings
    Object.assign(AppState.settings, handheldSettings);

    // Save optimized settings
    const { saveSettings } = require('./settings.js');
    saveSettings();

    updateStatus(`Optimized for ${getDeviceDisplayName()}`, 'bg-gaming-purple');
    console.log('✅ Handheld gaming optimizations applied');
}

// Handle Steam Deck specific features
export function handleSteamDeckFeatures() {
    if (steamDeckState.deviceType !== 'steam-deck') return;

    console.log('🎮 Enabling Steam Deck specific features...');

    // Steam Deck haptic feedback (if available)
    if (navigator.vibrate) {
        // Add haptic feedback for OCR events
        window.addEventListener('ocr-success', () => {
            navigator.vibrate(100); // Short vibration on text recognition
        });

        window.addEventListener('ocr-calibration', () => {
            navigator.vibrate([50, 50, 50]); // Pattern for calibration complete
        });
    }

    // Steam Deck performance mode detection
    if (navigator.hardwareConcurrency >= 8) {
        console.log('🚀 High performance Steam Deck detected');
        // Enable more aggressive OCR settings
        AppState.settings.processingInterval = 1500; // Faster on powerful Steam Deck
    }

    // Steam Deck trackpad support (if available)
    setupTrackpadGestures();
}

// Setup trackpad gestures for Steam Deck
function setupTrackpadGestures() {
    const cameraContainer = document.getElementById('camera-container');
    if (!cameraContainer) return;

    let gestureStartTime = 0;
    let gestureStartPos = { x: 0, y: 0 };

    cameraContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // Two-finger gesture start
            gestureStartTime = Date.now();
            gestureStartPos = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
        }
    });

    cameraContainer.addEventListener('touchend', (e) => {
        const gestureDuration = Date.now() - gestureStartTime;

        // Quick two-finger tap for OCR
        if (gestureDuration < 300 && gestureDuration > 50) {
            console.log('🎮 Steam Deck trackpad gesture: Quick OCR');
            import('./ocr.js').then(({ readNow }) => readNow());
        }
    });

    console.log('🎮 Steam Deck trackpad gestures enabled');
}

// Get handheld device information
export function getHandheldInfo() {
    return {
        isHandheld: steamDeckState.isHandheld,
        deviceType: steamDeckState.deviceType,
        deviceName: getDeviceDisplayName(),
        touchSupported: steamDeckState.touchSupported,
        gamepadConnected: steamDeckState.gamepadConnected,
        orientation: steamDeckState.orientation,
        optimizationsApplied: steamDeckState.optimizationsApplied,
        screenSize: {
            width: screen.width,
            height: screen.height
        }
    };
}

// Cleanup handheld optimizations
export function cleanupHandheldOptimizations() {
    // Remove handheld styles
    const styles = document.getElementById('handheld-optimizations');
    if (styles) styles.remove();

    // Remove handheld controls
    const controls = document.getElementById('handheld-controls');
    if (controls) controls.remove();

    // Remove indicators
    document.querySelectorAll('.fixed.top-4.left-4').forEach(el => el.remove());

    console.log('🎮 Handheld optimizations cleaned up');
}

// Make functions globally accessible
window.toggleHandheldControls = toggleHandheldControls;

// Auto-initialize if on handheld device
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initSteamDeckOptimizations();
            if (steamDeckState.isHandheld) {
                createHandheldUI();
                optimizeForHandheldGaming();
                if (steamDeckState.deviceType === 'steam-deck') {
                    handleSteamDeckFeatures();
                }
            }
        }, 2000);
    });
} else {
    setTimeout(() => {
        initSteamDeckOptimizations();
        if (steamDeckState.isHandheld) {
            createHandheldUI();
            optimizeForHandheldGaming();
            if (steamDeckState.deviceType === 'steam-deck') {
                handleSteamDeckFeatures();
            }
        }
    }, 2000);
}

// Functions exported individually above