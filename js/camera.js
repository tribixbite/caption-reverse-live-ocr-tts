/**
 * Camera Module - Handles camera access, controls, and video stream management
 * Manages MediaDevices API, camera constraints, and hardware capabilities
 */

import { AppState } from './config.js';
import { updateStatus } from './ui.js';

// Check if the browser supports camera access
export function checkSecureContext() {
    console.log('🔒 Checking secure context...', {
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent.substring(0, 100)
    });
    
    if (!window.isSecureContext) {
        console.warn('⚠️ Not in secure context - camera may not work');
        const setupCard = document.querySelector('#setup-screen .glass');
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
        }
    }
}

// Request camera permission and initialize stream
export async function requestCamera() {
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
            AppState.stream.getTracks().forEach(track => track.stop());
            AppState.stream = null;
            AppState.mediaStreamTrack = null;
        }
        
        // Check permission first (if supported)
        if (navigator.permissions) {
            try {
                const permission = await navigator.permissions.query({name: 'camera'});
                console.log('📋 Camera permission status:', permission.state);
            } catch (permError) {
                console.log('⚠️ Could not query camera permission:', permError.message);
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
        console.error('❌ Camera access denied:', error);
        
        let errorMessage = 'Camera access is required for CaptnReverse to function.';
        let debugInfo = `Error: ${error.name} - ${error.message}`;
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera permission was denied. Please refresh and allow camera access, or check your browser settings.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Camera is not supported in this browser. Try Chrome, Edge, or Firefox.';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage = 'Camera constraints not supported. Trying with basic settings...';
        } else {
            errorMessage = `Camera error: ${error.message}`;
        }
        
        updateStatus('Camera error', 'bg-red-400');
        
        // Update UI to show error
        const setupCard = document.querySelector('#setup-screen .glass');
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
            setupCard.addEventListener('click', (e) => {
                if (e.target.id === 'retry-camera') {
                    requestCamera();
                } else if (e.target.id === 'retry-basic') {
                    requestBasicCamera();
                }
            });
        }
    }
}

// Request basic camera with minimal constraints
export async function requestBasicCamera() {
    try {
        console.log('📱 Trying basic camera constraints...');
        updateStatus('Trying basic camera...', 'bg-yellow-400 animate-pulse');
        
        // Cleanup any existing stream first
        if (AppState.stream) {
            AppState.stream.getTracks().forEach(track => track.stop());
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
export function showMainApp() {
    const video = document.getElementById('camera-feed');
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
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    updateStatus('Camera active', 'bg-green-400');
}

// Configure camera controls based on actual hardware capabilities
export async function configureCameraControls() {
    if (!AppState.mediaStreamTrack) return;
    
    try {
        const capabilities = AppState.mediaStreamTrack.getCapabilities();
        const settings = AppState.mediaStreamTrack.getSettings();
        console.log('📷 Camera capabilities:', capabilities);
        console.log('📷 Current settings:', settings);
        
        // Configure focus control based on actual capabilities
        const focusSlider = document.getElementById('camera-focus');
        const focusRow = focusSlider.closest('.flex');
        
        if (capabilities.focusDistance) {
            const { min, max, step } = capabilities.focusDistance;
            console.log(`🎯 Configuring focus slider: min=${min}, max=${max}, step=${step}`);
            
            focusSlider.min = min;
            focusSlider.max = max;
            focusSlider.step = step || 0.1;
            
            // Set current value from device settings
            if (settings.focusDistance !== undefined) {
                focusSlider.value = settings.focusDistance;
                document.getElementById('focus-value').textContent = settings.focusDistance.toFixed(2);
            }
            focusRow.style.display = 'flex'; // Ensure it's visible
        } else {
            console.warn('⚠️ Focus distance control not supported');
            focusRow.style.display = 'none'; // Hide the control
        }
        
        // Configure zoom control
        const zoomSlider = document.getElementById('camera-zoom');
        const zoomRow = zoomSlider.closest('.flex');
        
        if (capabilities.zoom) {
            const { min, max, step } = capabilities.zoom;
            console.log(`📷 Configuring zoom slider: min=${min}, max=${max}, step=${step}`);
            
            zoomSlider.min = min;
            zoomSlider.max = max;
            zoomSlider.step = step || 0.1;
            
            if (settings.zoom !== undefined) {
                zoomSlider.value = settings.zoom;
                AppState.cameraZoom = settings.zoom;
                document.getElementById('zoom-value').textContent = settings.zoom.toFixed(1) + 'x';
            }
            zoomRow.style.display = 'flex';
        } else {
            console.warn('⚠️ Camera zoom not supported');
            zoomRow.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Failed to configure camera controls:', error);
    }
}

// Apply camera zoom
export async function applyCameraZoom() {
    if (!AppState.mediaStreamTrack) return;
    
    try {
        const capabilities = AppState.mediaStreamTrack.getCapabilities();
        console.log('📷 Camera capabilities:', capabilities);
        
        if (capabilities.zoom) {
            await AppState.mediaStreamTrack.applyConstraints({
                zoom: { ideal: AppState.cameraZoom }
            });
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

// Apply camera focus
export async function applyCameraFocus(focusDistance) {
    if (!AppState.mediaStreamTrack) return;
    
    try {
        const capabilities = AppState.mediaStreamTrack.getCapabilities();
        
        if (capabilities.focusDistance) {
            // Use the actual focus distance value from camera capabilities
            const constraints = {
                focusMode: 'manual',
                focusDistance: { ideal: parseFloat(focusDistance) }
            };
            
            await AppState.mediaStreamTrack.applyConstraints({ advanced: [constraints] });
            console.log(`🎯 Applied manual focus: ${focusDistance}`);
            updateStatus(`Focus: ${parseFloat(focusDistance).toFixed(2)}`, 'bg-blue-400');
        } else {
            console.warn('⚠️ Manual focus not supported on this camera');
            updateStatus('Focus control not supported', 'bg-yellow-400');
        }
    } catch (error) {
        console.warn('⚠️ Focus control error:', error);
        updateStatus('Focus adjustment failed', 'bg-red-400');
    }
}

// Set auto-focus mode
export async function setAutoFocus() {
    if (!AppState.mediaStreamTrack) return;
    
    try {
        await AppState.mediaStreamTrack.applyConstraints({ 
            focusMode: 'continuous' // Better for live video than 'auto'
        });
        console.log('🎯 Set focus mode to continuous auto-focus');
        updateStatus('Auto-focus enabled', 'bg-green-400');
        document.getElementById('focus-value').textContent = 'Auto';
    } catch (error) {
        console.warn('⚠️ Could not set auto focus:', error);
        updateStatus('Auto-focus failed', 'bg-red-400');
    }
}

// Clean up camera resources
export function cleanupCamera() {
    console.log('🧹 Cleaning up camera resources...');
    
    if (AppState.stream) {
        // Stop all tracks to release camera
        AppState.stream.getTracks().forEach(track => {
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

    // Cleanup OCR worker
    if (AppState.ocrWorker) {
        AppState.ocrWorker.terminate().catch(e => console.warn('OCR cleanup error:', e));
        AppState.ocrWorker = null;
    }

    console.log('✅ Camera resources cleaned up');
}