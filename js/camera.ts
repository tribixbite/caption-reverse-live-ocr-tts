/**
 * Camera Module - Handles camera access, controls, and video stream management
 * Manages MediaDevices API, camera constraints, and hardware capabilities
 */

import { AppState } from './config.js';
import { updateStatus } from './ui.js';
import type { AppState as AppStateType } from './types.js';

// Type declarations for extended MediaStreamTrack capabilities
interface MediaTrackCapabilitiesExtended extends MediaTrackCapabilities {
    zoom?: {
        min: number;
        max: number;
        step?: number;
    };
    focusDistance?: {
        min: number;
        max: number;
        step?: number;
    };
    focusMode?: string[];
}

interface MediaTrackSettingsExtended extends MediaTrackSettings {
    zoom?: number;
    focusDistance?: number;
    focusMode?: string;
}

interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
    zoom?: ConstrainDouble;
    focusDistance?: ConstrainDouble;
    focusMode?: ConstrainDOMString;
    advanced?: MediaTrackConstraintSet[];
}

// Extend Window interface for monitoringInterval
declare global {
    interface Window {
        monitoringInterval: ReturnType<typeof setInterval> | null;
    }
}

// Check if the browser supports camera access and auto-init if permissions granted
export async function checkSecureContext(): Promise<void> {
    console.log('🔒 Checking secure context...', {
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent.substring(0, 100)
    });

    if (!window.isSecureContext) {
        console.warn('⚠️ Not in secure context - camera may not work');
        const setupCard = document.querySelector('#setup-screen .glass') as HTMLElement | null;
        if (setupCard) {
            setupCard.innerHTML = `
                <div class="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h2 class="text-2xl font-semibold mb-4 text-yellow-300">HTTPS Required</h2>
                <p class="text-dark-300 mb-6">Camera access requires a secure connection (HTTPS) or localhost. Please access the app via HTTPS or localhost for full functionality.</p>
                <button onclick="location.reload()" class="btn-primary w-full text-lg py-4 mb-4">
                    🔄 Reload Page
                </button>
                <div class="text-sm text-dark-400 space-y-1">
                    <p>💡 Current: ${window.location.protocol}//${window.location.host}</p>
                    <p>🔧 Required: HTTPS or localhost</p>
                    <p>🌐 GitHub Pages automatically uses HTTPS</p>
                </div>
            `;
        }
    } else {
        console.log('✅ Secure context confirmed - camera should work');

        // Additional permission checks
        if (!navigator.mediaDevices) {
            console.error('❌ navigator.mediaDevices not available');
        } else if (!navigator.mediaDevices.getUserMedia) {
            console.error('❌ getUserMedia not available');
        } else {
            console.log('✅ getUserMedia API available');

            // Check if camera permissions are already granted and auto-initialize
            await checkAndAutoInitCamera();
        }
    }
}

// Check if camera permissions are already granted and automatically initialize
export async function checkAndAutoInitCamera(): Promise<void> {
    if (navigator.permissions) {
        try {
            const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            console.log('📋 Initial camera permission status:', permission.state);

            if (permission.state === 'granted') {
                console.log('🚀 Camera permissions already granted, auto-initializing...');
                updateStatus('Auto-initializing camera...', 'bg-blue-400 animate-pulse');

                // Show "Skip to Camera" option in the setup screen
                const setupCard = document.querySelector('#setup-screen .glass') as HTMLElement | null;
                if (setupCard) {
                    // Modify the existing setup card to show auto-init option
                    const requestCameraBtn = setupCard.querySelector('#request-camera') as HTMLButtonElement | null;

                    if (requestCameraBtn) {
                        requestCameraBtn.innerHTML = '🚀 Use Camera (Auto-Detected)';
                        requestCameraBtn.classList.add('animate-pulse');

                        // Add skip to camera button
                        const skipButton = document.createElement('button');
                        skipButton.className = 'w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl transition-colors text-sm mb-4 font-medium';
                        skipButton.innerHTML = '⚡ Skip Setup - Go Directly to Camera';
                        skipButton.addEventListener('click', async () => {
                            await requestCamera();
                        });

                        requestCameraBtn.insertAdjacentElement('afterend', skipButton);

                        console.log('✅ Added auto-init options to setup screen');
                    }
                }
            }
        } catch (permError) {
            const error = permError as Error;
            console.log('⚠️ Could not query camera permission for auto-init:', error.message);
        }
    }
}

// Request camera permission and initialize stream
export async function requestCamera(): Promise<void> {
    try {
        // Prevent duplicate camera requests
        if (AppState.cameraRequestInProgress) {
            console.log('⏳ Camera request already in progress...');
            return;
        }

        AppState.cameraRequestInProgress = true;
        console.log('📸 Requesting camera permission...');
        updateStatus('Requesting camera...', 'bg-yellow-400 animate-pulse');

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia not supported in this browser');
        }

        // Cleanup any existing stream first
        if (AppState.stream) {
            console.log('🧹 Cleaning up existing camera stream...');
            AppState.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            AppState.stream = null;
            AppState.mediaStreamTrack = null;
        }

        // Check permission first (if supported) and handle granted permissions
        if (navigator.permissions) {
            try {
                const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
                console.log('📋 Camera permission status:', permission.state);

                if (permission.state === 'granted') {
                    console.log('✅ Camera permission already granted, proceeding directly...');
                    updateStatus('Permission already granted...', 'bg-green-400');
                } else if (permission.state === 'denied') {
                    console.log('❌ Camera permission denied by user');
                    AppState.cameraRequestInProgress = false;
                    updateStatus('Camera permission denied', 'bg-red-400');
                    showCameraPermissionDeniedUI();
                    return;
                }
            } catch (permError) {
                const error = permError as Error;
                console.log('⚠️ Could not query camera permission:', error.message);
            }
        }

        // Request camera permission with simplified constraints for better compatibility
        AppState.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        console.log('✅ Camera permission granted!');
        AppState.cameraRequestInProgress = false;
        showMainApp();

    } catch (error) {
        AppState.cameraRequestInProgress = false;
        const err = error as DOMException;
        console.error('❌ Camera access denied:', err);

        let errorMessage = 'Camera access is required for CaptnReverse to function.';
        let debugInfo = `Error: ${err.name} - ${err.message}`;

        if (err.name === 'NotAllowedError') {
            errorMessage = 'Camera permission was denied. Please refresh and allow camera access, or check your browser settings.';
        } else if (err.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (err.name === 'NotSupportedError') {
            errorMessage = 'Camera is not supported in this browser. Try Chrome, Edge, or Firefox.';
        } else if (err.name === 'OverconstrainedError') {
            errorMessage = 'Camera constraints not supported. Trying with basic settings...';
        } else {
            errorMessage = `Camera error: ${err.message}`;
        }

        updateStatus('Camera error', 'bg-red-400');

        // Update UI to show error
        const setupCard = document.querySelector('#setup-screen .glass') as HTMLElement | null;
        if (setupCard) {
            setupCard.innerHTML = `
                <div class="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h2 class="text-2xl font-semibold mb-4 text-red-300">Camera Access Required</h2>
                <p class="text-dark-300 mb-6">${errorMessage}</p>
                <button id="retry-camera" class="btn-primary w-full text-lg py-4 mb-4">
                    🔄 Try Again
                </button>
                <button id="retry-basic" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl transition-colors text-sm mb-4">
                    📱 Try Basic Camera
                </button>
                <details class="text-xs text-dark-400 mt-4">
                    <summary class="cursor-pointer hover:text-dark-300">Debug Info</summary>
                    <div class="mt-2 p-2 bg-dark-800 rounded font-mono">
                        <p>URL: ${window.location.href}</p>
                        <p>Secure: ${window.isSecureContext}</p>
                        <p>${debugInfo}</p>
                    </div>
                </details>
                <div class="text-sm text-dark-400 space-y-1 mt-4">
                    <p>💡 Make sure you're using HTTPS or localhost</p>
                    <p>🔒 Your privacy is protected - all processing is local</p>
                    <p>🌐 Works best in Chrome, Edge, or Firefox</p>
                </div>
            `;

            // Add retry event listeners using event delegation
            setupCard.addEventListener('click', (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.id === 'retry-camera') {
                    requestCamera();
                } else if (target.id === 'retry-basic') {
                    requestBasicCamera();
                }
            });
        }
    }
}

// Request basic camera with minimal constraints
export async function requestBasicCamera(): Promise<void> {
    try {
        console.log('📱 Trying basic camera constraints...');
        updateStatus('Trying basic camera...', 'bg-yellow-400 animate-pulse');

        // Cleanup any existing stream first
        if (AppState.stream) {
            AppState.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            AppState.stream = null;
            AppState.mediaStreamTrack = null;
        }

        AppState.stream = await navigator.mediaDevices.getUserMedia({
            video: true // Minimal constraints
        });

        console.log('✅ Basic camera access granted!');
        showMainApp();

    } catch (basicError) {
        console.error('❌ Basic camera also failed:', basicError);
        updateStatus('Basic camera failed', 'bg-red-400');
    }
}

// Show main application interface
export function showMainApp(): void {
    const video = document.getElementById('camera-feed') as HTMLVideoElement | null;
    if (!video || !AppState.stream) {
        console.error('❌ Video element or stream not available');
        return;
    }

    video.srcObject = AppState.stream;

    // Get camera track for zoom control
    AppState.mediaStreamTrack = AppState.stream.getVideoTracks()[0];

    // Configure camera controls based on actual capabilities
    configureCameraControls();

    // Wait for video to start playing
    video.onloadedmetadata = async () => {
        console.log('📹 Video metadata loaded, starting overlay');
        const { startCropOverlay } = await import('./ui.js');
        startCropOverlay();
    };

    // Hide setup, show main app
    const setupScreen = document.getElementById('setup-screen');
    const mainApp = document.getElementById('main-app');

    if (setupScreen) {
        setupScreen.classList.add('hidden');
    }
    if (mainApp) {
        mainApp.classList.remove('hidden');
    }

    updateStatus('Camera active', 'bg-green-400');
}

// Configure camera controls based on actual hardware capabilities
export async function configureCameraControls(): Promise<void> {
    if (!AppState.mediaStreamTrack) return;

    try {
        const capabilities = AppState.mediaStreamTrack.getCapabilities() as MediaTrackCapabilitiesExtended;
        const settings = AppState.mediaStreamTrack.getSettings() as MediaTrackSettingsExtended;
        console.log('📷 Camera capabilities:', capabilities);
        console.log('📷 Current settings:', settings);

        // Configure focus control based on actual capabilities
        const focusSlider = document.getElementById('camera-focus') as HTMLInputElement | null;
        if (!focusSlider) {
            console.warn('⚠️ Focus slider element not found');
            return;
        }

        const focusRow = focusSlider.closest('.flex') as HTMLElement | null;

        if (capabilities.focusDistance && focusRow) {
            const { min, max, step } = capabilities.focusDistance;
            console.log(`🎯 Configuring focus slider: min=${min}, max=${max}, step=${step}`);

            focusSlider.min = String(min);
            focusSlider.max = String(max);
            focusSlider.step = String(step || 0.1);

            // Set current value from device settings
            if (settings.focusDistance !== undefined) {
                focusSlider.value = String(settings.focusDistance);
                const focusValue = document.getElementById('focus-value');
                if (focusValue) {
                    focusValue.textContent = settings.focusDistance.toFixed(2);
                }
            }
            focusRow.style.display = 'flex'; // Ensure it's visible
        } else if (focusRow) {
            console.warn('⚠️ Focus distance control not supported');
            focusRow.style.display = 'none'; // Hide the control
        }

        // Configure zoom control
        const zoomSlider = document.getElementById('camera-zoom') as HTMLInputElement | null;
        if (!zoomSlider) {
            console.warn('⚠️ Zoom slider element not found');
            return;
        }

        const zoomRow = zoomSlider.closest('.flex') as HTMLElement | null;

        if (capabilities.zoom && zoomRow) {
            const { min, max, step } = capabilities.zoom;
            console.log(`📷 Configuring zoom slider: min=${min}, max=${max}, step=${step}`);

            zoomSlider.min = String(min);
            zoomSlider.max = String(max);
            zoomSlider.step = String(step || 0.1);

            if (settings.zoom !== undefined) {
                zoomSlider.value = String(settings.zoom);
                AppState.cameraZoom = settings.zoom;
                const zoomValue = document.getElementById('zoom-value');
                if (zoomValue) {
                    zoomValue.textContent = settings.zoom.toFixed(1) + 'x';
                }
            }
            zoomRow.style.display = 'flex';
        } else if (zoomRow) {
            console.warn('⚠️ Camera zoom not supported');
            zoomRow.style.display = 'none';
        }

    } catch (error) {
        console.error('❌ Failed to configure camera controls:', error);
    }
}

// Apply camera zoom
export async function applyCameraZoom(): Promise<void> {
    if (!AppState.mediaStreamTrack) return;

    try {
        const capabilities = AppState.mediaStreamTrack.getCapabilities() as MediaTrackCapabilitiesExtended;
        console.log('📷 Camera capabilities:', capabilities);

        if (capabilities.zoom) {
            await AppState.mediaStreamTrack.applyConstraints({
                advanced: [{ zoom: AppState.cameraZoom }]
            } as MediaTrackConstraintsExtended);
            console.log(`📷 Applied zoom: ${AppState.cameraZoom}x`);
            updateStatus(`Zoom: ${AppState.cameraZoom}x applied`, 'bg-blue-400');
        } else {
            console.warn('⚠️ Camera does not support optical zoom');
            updateStatus('Zoom not supported by camera', 'bg-yellow-400');
        }
    } catch (error) {
        console.warn('⚠️ Camera zoom not supported:', error);
        updateStatus('Zoom failed to apply', 'bg-red-400');
    }
}

// Apply camera focus with enhanced constraint handling
export async function applyCameraFocus(focusDistance: number | string): Promise<void> {
    if (!AppState.mediaStreamTrack) {
        console.warn('⚠️ No media stream track available for focus control');
        return;
    }

    try {
        const capabilities = AppState.mediaStreamTrack.getCapabilities() as MediaTrackCapabilitiesExtended;
        console.log('📷 Camera capabilities for focus:', capabilities);

        if (capabilities.focusDistance) {
            const focusValue = parseFloat(String(focusDistance));
            console.log(`🎯 Attempting to set focus distance: ${focusValue}`);

            // Try multiple constraint approaches for better compatibility
            const constraintApproaches: MediaTrackConstraintsExtended[] = [
                // Approach 1: Advanced constraints (most cameras)
                {
                    advanced: [{
                        focusMode: 'manual',
                        focusDistance: focusValue
                    } as MediaTrackConstraintSet]
                },
                // Approach 2: Basic constraints
                {
                    focusMode: 'manual',
                    focusDistance: { ideal: focusValue }
                },
                // Approach 3: Simple focus mode only
                {
                    focusMode: 'manual'
                }
            ];

            let focusApplied = false;

            for (const constraints of constraintApproaches) {
                try {
                    await AppState.mediaStreamTrack.applyConstraints(constraints);
                    console.log(`✅ Focus applied using constraints:`, constraints);
                    focusApplied = true;
                    break;
                } catch (constraintError) {
                    const err = constraintError as Error;
                    console.warn(`❌ Focus constraint failed:`, constraints, err.message);
                }
            }

            if (focusApplied) {
                console.log(`🎯 Manual focus successfully applied: ${focusValue}`);
                updateStatus(`Focus: ${focusValue.toFixed(2)}`, 'bg-blue-400');

                // Update UI
                const focusValueElement = document.getElementById('focus-value');
                if (focusValueElement) {
                    focusValueElement.textContent = focusValue.toFixed(2);
                }

                // Show visual focus indicator
                showFocusIndicator(focusValue);
            } else {
                throw new Error('All focus constraint approaches failed');
            }

        } else if (capabilities.focusMode) {
            // Camera supports focus mode but not distance
            console.log('📷 Camera supports focus mode but not distance control');
            await AppState.mediaStreamTrack.applyConstraints({
                focusMode: 'manual'
            } as MediaTrackConstraintsExtended);
            updateStatus('Focus mode: Manual', 'bg-blue-400');
        } else {
            console.warn('⚠️ Manual focus not supported on this camera');
            updateStatus('Focus control not supported', 'bg-yellow-400');
        }
    } catch (error) {
        const err = error as Error;
        console.error('❌ Focus control error:', err);
        console.error('Error details:', err.message);
        updateStatus('Focus adjustment failed', 'bg-red-400');
    }
}

// Show visual focus indicator overlay
function showFocusIndicator(focusValue: number): void {
    // Remove existing focus indicator
    const existingIndicator = document.getElementById('focus-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // Create focus indicator overlay
    const indicator = document.createElement('div');
    indicator.id = 'focus-indicator';
    indicator.className = 'absolute inset-0 pointer-events-none z-10';

    // Calculate focus ring size based on focus distance
    const focusPercentage = (focusValue - 0) / (1000 - 0); // Normalize 0-1000 to 0-1
    const ringSize = 50 + (focusPercentage * 100); // 50-150px ring

    indicator.innerHTML = `
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div class="border-2 border-gaming-cyan rounded-full animate-pulse"
                 style="width: ${ringSize}px; height: ${ringSize}px; border-style: dashed;">
            </div>
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gaming-cyan text-white text-xs px-2 py-1 rounded">
                Focus: ${focusValue.toFixed(1)}
            </div>
        </div>
    `;

    // Add to camera container
    const cameraContainer = document.getElementById('camera-container');
    if (cameraContainer) {
        cameraContainer.appendChild(indicator);

        // Remove after 3 seconds
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }
}

// Set auto-focus mode
export async function setAutoFocus(): Promise<void> {
    if (!AppState.mediaStreamTrack) return;

    try {
        await AppState.mediaStreamTrack.applyConstraints({
            focusMode: 'continuous' // Better for live video than 'auto'
        } as MediaTrackConstraintsExtended);
        console.log('🎯 Set focus mode to continuous auto-focus');
        updateStatus('Auto-focus enabled', 'bg-green-400');
        const focusValue = document.getElementById('focus-value');
        if (focusValue) {
            focusValue.textContent = 'Auto';
        }
    } catch (error) {
        console.warn('⚠️ Could not set auto focus:', error);
        updateStatus('Auto-focus failed', 'bg-red-400');
    }
}

// Clean up camera resources
export function cleanupCamera(): void {
    console.log('🧹 Cleaning up camera resources...');

    if (AppState.stream) {
        // Stop all tracks to release camera
        AppState.stream.getTracks().forEach((track: MediaStreamTrack) => {
            console.log(`🛑 Stopping track: ${track.kind} (${track.label})`);
            track.stop();
        });
        AppState.stream = null;
        AppState.mediaStreamTrack = null;
    }

    // Stop monitoring
    if (window.monitoringInterval) {
        clearInterval(window.monitoringInterval);
        window.monitoringInterval = null;
    }

    // Cleanup OCR scheduler and workers
    if (AppState.ocrScheduler) {
        AppState.ocrScheduler.terminate().catch((e: Error) => console.warn('OCR scheduler cleanup error:', e));
        AppState.ocrScheduler = null;
    }

    if (AppState.ocrWorker) {
        AppState.ocrWorker.terminate().catch((e: Error) => console.warn('OCR worker cleanup error:', e));
        AppState.ocrWorker = null;
    }

    // Cleanup preprocessing worker
    import('./ocr.js').then(({ cleanupPreprocessingWorker }) => {
        cleanupPreprocessingWorker();
    }).catch((e: Error) => {
        console.warn('Preprocessing worker cleanup error:', e);
    });

    // Cleanup hotkey system
    import('./hotkeys.js').then(({ cleanupHotkeySystem }) => {
        cleanupHotkeySystem();
    }).catch((e: Error) => {
        console.warn('Hotkey cleanup error:', e);
    });

    console.log('✅ Camera resources and hotkey system cleaned up');
}

// Show camera permission denied UI
function showCameraPermissionDeniedUI(): void {
    const setupCard = document.querySelector('#setup-screen .glass') as HTMLElement | null;
    if (setupCard) {
        setupCard.innerHTML = `
            <div class="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
            </div>
            <h2 class="text-2xl font-semibold mb-4 text-red-300">Camera Permission Denied</h2>
            <p class="text-dark-300 mb-6">Camera access was previously denied. To use CaptnReverse, please:</p>
            <div class="text-left text-sm text-dark-300 mb-6 space-y-2">
                <p>• Click the camera icon in your address bar</p>
                <p>• Select "Always allow" for camera access</p>
                <p>• Or go to browser Settings → Privacy & Security → Camera</p>
                <p>• Refresh this page after granting permission</p>
            </div>
            <button onclick="location.reload()" class="btn-primary w-full text-lg py-4 mb-4">
                🔄 Refresh Page
            </button>
            <div class="text-xs text-dark-400 mt-4">
                <p>🔒 Your privacy is protected - all processing stays local</p>
                <p>📱 Camera is required for text recognition</p>
            </div>
        `;
    }
}
