/**
 * Gesture Controls for Gaming Handhelds
 * Optimized for Steam Deck, ROG Ally, Legion Go, and mobile devices
 */

class GestureControls {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isDoubleTapDetection = false;
        this.lastTapTime = 0;
        this.gestureThreshold = 50; // Minimum distance for swipe
        this.tapTimeout = 300; // Maximum time for tap
        this.doubleTapTimeout = 500; // Maximum time between taps
        this.longPressTimeout = 800; // Time for long press
        this.longPressTimer = null;
        this.isLongPress = false;

        this.init();
    }

    init() {
        // Only enable on touch devices
        if (!('ontouchstart' in window)) {
            console.log('📱 Gesture controls: Not a touch device, skipping');
            return;
        }

        this.setupGestureListeners();
        console.log('🎮 Gesture controls initialized for gaming handhelds');
    }

    setupGestureListeners() {
        // Main content area for gestures
        const mainContent = document.querySelector('main');
        if (!mainContent) return;

        // Touch events
        mainContent.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        mainContent.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        mainContent.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Camera video for crop area gestures
        const video = document.getElementById('camera-feed');
        if (video) {
            video.addEventListener('touchstart', this.handleVideoTouchStart.bind(this), { passive: false });
            video.addEventListener('touchmove', this.handleVideoTouchMove.bind(this), { passive: false });
            video.addEventListener('touchend', this.handleVideoTouchEnd.bind(this), { passive: false });
        }

        // Settings for gesture preferences
        this.loadGestureSettings();
    }

    handleTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
            this.isLongPress = false;

            // Start long press detection
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.handleLongPress(touch);
            }, this.longPressTimeout);
        } else if (event.touches.length === 2) {
            // Two-finger gesture
            this.handleTwoFingerStart(event);
        }
    }

    handleTouchMove(event) {
        // Cancel long press if finger moves too much
        if (this.longPressTimer) {
            const touch = event.touches[0];
            const deltaX = Math.abs(touch.clientX - this.touchStartX);
            const deltaY = Math.abs(touch.clientY - this.touchStartY);

            if (deltaX > 10 || deltaY > 10) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }

        if (event.touches.length === 2) {
            this.handleTwoFingerMove(event);
        }
    }

    handleTouchEnd(event) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (this.isLongPress) {
            this.isLongPress = false;
            return;
        }

        if (event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;
            const deltaTime = Date.now() - this.touchStartTime;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance < 10 && deltaTime < this.tapTimeout) {
                // Tap detected
                this.handleTap(touch);
            } else if (distance > this.gestureThreshold) {
                // Swipe detected
                this.handleSwipe(deltaX, deltaY, deltaTime);
            }
        }
    }

    handleTap(touch) {
        const now = Date.now();

        if (now - this.lastTapTime < this.doubleTapTimeout) {
            // Double tap detected
            this.handleDoubleTap(touch);
            this.lastTapTime = 0; // Reset to prevent triple tap
        } else {
            // Single tap - delay to check for double tap
            setTimeout(() => {
                if (!this.isDoubleTapDetection) {
                    this.handleSingleTap(touch);
                }
                this.isDoubleTapDetection = false;
            }, this.doubleTapTimeout);
        }

        this.lastTapTime = now;
    }

    handleSingleTap(touch) {
        // Single tap: Show/hide UI elements or activate focused element
        console.log('🎮 Single tap detected');

        // If settings are open, close them
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            this.closeSettings();
            return;
        }

        // Focus/activate element under touch
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.click) {
            element.click();
        }
    }

    handleDoubleTap(touch) {
        console.log('🎮 Double tap detected');
        this.isDoubleTapDetection = true;

        // Double tap: Toggle monitoring or read now
        const readNowBtn = document.getElementById('read-now-btn');
        const monitorToggle = document.getElementById('monitor-toggle');

        if (readNowBtn && readNowBtn.offsetParent) {
            readNowBtn.click();
        } else if (monitorToggle) {
            monitorToggle.click();
        }
    }

    handleLongPress(touch) {
        console.log('🎮 Long press detected');

        // Long press: Open settings or context menu
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.click();
        }

        // Haptic feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    handleSwipe(deltaX, deltaY, deltaTime) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const isHorizontal = absX > absY;

        console.log(`🎮 Swipe detected: ${isHorizontal ? 'horizontal' : 'vertical'}, deltaX: ${deltaX}, deltaY: ${deltaY}`);

        if (isHorizontal) {
            if (deltaX > 0) {
                this.handleSwipeRight();
            } else {
                this.handleSwipeLeft();
            }
        } else {
            if (deltaY > 0) {
                this.handleSwipeDown();
            } else {
                this.handleSwipeUp();
            }
        }

        // Haptic feedback for swipes
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    }

    handleSwipeLeft() {
        console.log('🎮 Swipe left: Switch to previous setting or close panel');

        // Close settings if open
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            this.closeSettings();
            return;
        }

        // Navigate or adjust settings
        this.adjustCameraSetting('zoom', -0.2);
    }

    handleSwipeRight() {
        console.log('🎮 Swipe right: Open settings or next setting');

        // Open settings if closed
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && settingsModal.classList.contains('hidden')) {
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.click();
            return;
        }

        // Navigate or adjust settings
        this.adjustCameraSetting('zoom', 0.2);
    }

    handleSwipeUp() {
        console.log('🎮 Swipe up: Increase setting or zoom in');
        this.adjustCameraSetting('focus', 50);
    }

    handleSwipeDown() {
        console.log('🎮 Swipe down: Decrease setting or zoom out');
        this.adjustCameraSetting('focus', -50);
    }

    handleTwoFingerStart(event) {
        // Two finger gestures for advanced controls
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        this.initialPinchDistance = this.getDistance(touch1, touch2);
        this.initialRotation = this.getAngle(touch1, touch2);
    }

    handleTwoFingerMove(event) {
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            const currentDistance = this.getDistance(touch1, touch2);
            const currentRotation = this.getAngle(touch1, touch2);

            // Pinch to zoom
            if (this.initialPinchDistance) {
                const scale = currentDistance / this.initialPinchDistance;
                if (scale > 1.1) {
                    this.adjustCameraSetting('zoom', 0.1);
                    this.initialPinchDistance = currentDistance;
                } else if (scale < 0.9) {
                    this.adjustCameraSetting('zoom', -0.1);
                    this.initialPinchDistance = currentDistance;
                }
            }
        }
    }

    // Video-specific touch handlers for crop area
    handleVideoTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const rect = event.target.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width;
            const y = (touch.clientY - rect.top) / rect.height;

            this.cropStartX = x;
            this.cropStartY = y;
        }
    }

    handleVideoTouchMove(event) {
        // Visual feedback for crop area selection
        event.preventDefault();
    }

    handleVideoTouchEnd(event) {
        if (this.cropStartX !== undefined && this.cropStartY !== undefined) {
            const touch = event.changedTouches[0];
            const rect = event.target.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width;
            const y = (touch.clientY - rect.top) / rect.height;

            // Set crop area
            const width = Math.abs(x - this.cropStartX);
            const height = Math.abs(y - this.cropStartY);
            const cropX = Math.min(x, this.cropStartX);
            const cropY = Math.min(y, this.cropStartY);

            if (width > 0.1 && height > 0.1) {
                window.setCrop(cropX, cropY, width, height);
                console.log(`🎮 Crop area set via gesture: ${cropX.toFixed(2)}, ${cropY.toFixed(2)}, ${width.toFixed(2)}, ${height.toFixed(2)}`);
            }
        }

        this.cropStartX = undefined;
        this.cropStartY = undefined;
    }

    // Utility functions
    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getAngle(touch1, touch2) {
        return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
    }

    adjustCameraSetting(setting, delta) {
        if (setting === 'zoom') {
            const zoomControl = document.getElementById('camera-zoom');
            if (zoomControl) {
                const currentValue = parseFloat(zoomControl.value);
                const newValue = Math.max(1, Math.min(5, currentValue + delta));
                zoomControl.value = newValue;
                zoomControl.dispatchEvent(new Event('input'));
            }
        } else if (setting === 'focus') {
            const focusControl = document.getElementById('camera-focus');
            if (focusControl) {
                const currentValue = parseFloat(focusControl.value);
                const newValue = Math.max(0, Math.min(1000, currentValue + delta));
                focusControl.value = newValue;
                focusControl.dispatchEvent(new Event('input'));
            }
        }
    }

    closeSettings() {
        const closeBtn = document.getElementById('close-settings');
        if (closeBtn) closeBtn.click();
    }

    loadGestureSettings() {
        // Load gesture preferences from localStorage
        const settings = JSON.parse(localStorage.getItem('captnreverse-gestures') || '{}');

        this.gestureThreshold = settings.threshold || 50;
        this.tapTimeout = settings.tapTimeout || 300;
        this.doubleTapTimeout = settings.doubleTapTimeout || 500;
        this.longPressTimeout = settings.longPressTimeout || 800;
    }

    saveGestureSettings() {
        const settings = {
            threshold: this.gestureThreshold,
            tapTimeout: this.tapTimeout,
            doubleTapTimeout: this.doubleTapTimeout,
            longPressTimeout: this.longPressTimeout
        };

        localStorage.setItem('captnreverse-gestures', JSON.stringify(settings));
    }
}

// Initialize gesture controls when module loads
let gestureControls = null;

function initGestureControls() {
    if (!gestureControls) {
        gestureControls = new GestureControls();
    }
    return gestureControls;
}

// Auto-initialize on touch devices
if ('ontouchstart' in window) {
    document.addEventListener('DOMContentLoaded', initGestureControls);
}

export { GestureControls, initGestureControls };