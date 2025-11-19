/**
 * UI Module - Handles user interface interactions, crop overlay, and visual feedback
 * Manages settings modal, status updates, and crop selection interface
 */

import { AppState, CONFIG } from './config.js';
import { saveSettings } from './settings.js';
import type { CropArea } from './types.js';

// Extend Window interface for monitoringInterval
declare global {
    interface Window {
        monitoringInterval: number | null;
    }
}

// Crop overlay animation management
let cropOverlayAnimationId: number | null = null;
let isDraggingCrop: boolean = false;

// Update status indicator
export function updateStatus(text: string, dotClass: string): void {
    const statusText = document.getElementById('status-text') as HTMLElement | null;
    const dot = document.getElementById('status-dot') as HTMLElement | null;

    if (statusText) {
        statusText.textContent = text;
    }
    if (dot) {
        dot.className = `w-2 h-2 rounded-full ${dotClass}`;
    }
}

// Display detected text in UI with user feedback system
export function displayText(text: string, confidence: number, processingTime: number): void {
    const detectedText = document.getElementById('detected-text') as HTMLElement | null;
    const confidenceScore = document.getElementById('confidence-score') as HTMLElement | null;
    const processingTimeEl = document.getElementById('processing-time') as HTMLElement | null;
    const textDisplay = document.getElementById('text-display') as HTMLElement | null;

    if (detectedText) {
        detectedText.textContent = text;
    }
    if (confidenceScore) {
        confidenceScore.textContent = Math.round(confidence).toString();
    }
    if (processingTimeEl) {
        processingTimeEl.textContent = processingTime.toString();
    }
    if (textDisplay) {
        textDisplay.classList.remove('hidden');
    }

    // Add user feedback system for accuracy improvement
    showUserFeedbackPrompt(text, confidence);
}

// Show user feedback prompt to improve OCR accuracy
function showUserFeedbackPrompt(text: string, confidence: number): void {
    // Only show feedback for low-confidence results or periodically for high-confidence
    const shouldShowFeedback = confidence < 70 || (Math.random() < 0.1 && confidence < 90);

    if (!shouldShowFeedback) return;

    // Remove any existing feedback prompt
    const existingPrompt = document.getElementById('user-feedback-prompt');
    if (existingPrompt) {
        existingPrompt.remove();
    }

    // Create feedback prompt
    const feedbackPrompt = document.createElement('div');
    feedbackPrompt.id = 'user-feedback-prompt';
    feedbackPrompt.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:w-96 glass rounded-2xl p-4 z-50 border border-primary-500/30';

    feedbackPrompt.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="font-medium text-white">OCR Accuracy Feedback</h3>
                <button onclick="this.closest('#user-feedback-prompt').remove()" class="ml-auto text-dark-400 hover:text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <p class="text-sm text-dark-300">Was this text read correctly?</p>
            <div class="text-sm font-mono bg-dark-800 p-2 rounded text-gaming-cyan border border-dark-700">
                "${text}"
            </div>

            <div class="flex gap-2">
                <button onclick="handleUserFeedback(true, '${text.replace(/'/g, "\\'")}', ${confidence})"
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                    Correct
                </button>
                <button onclick="handleUserFeedback(false, '${text.replace(/'/g, "\\'")}', ${confidence})"
                        class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                    Incorrect
                </button>
            </div>

            <div class="text-xs text-dark-400 text-center">
                This helps improve OCR accuracy (Confidence: ${Math.round(confidence)}%)
            </div>
        </div>
    `;

    document.body.appendChild(feedbackPrompt);

    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (document.getElementById('user-feedback-prompt')) {
            feedbackPrompt.remove();
        }
    }, 15000);
}

// Start crop overlay rendering
export function startCropOverlay(): void {
    const video = document.getElementById('camera-feed') as HTMLVideoElement | null;
    const canvas = document.getElementById('crop-overlay') as HTMLCanvasElement | null;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;

    if (!ctx) return;

    function drawOverlay(): void {
        if (!video || !canvas || !ctx) return;

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            // Only continue animation if we're waiting for video to load
            cropOverlayAnimationId = requestAnimationFrame(drawOverlay);
            return;
        }

        // Set canvas size to match video
        const rect = video.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clear crop area
        const x = AppState.currentCrop.x * canvas.width;
        const y = AppState.currentCrop.y * canvas.height;
        const width = AppState.currentCrop.width * canvas.width;
        const height = AppState.currentCrop.height * canvas.height;

        ctx.clearRect(x, y, width, height);

        // Draw crop border
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw corner handles
        const handleSize = CONFIG.CROP_HANDLE_SIZE;
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
        ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);

        // Only continue animation loop while dragging or video not ready
        if (isDraggingCrop || video.videoWidth === 0 || video.videoHeight === 0) {
            cropOverlayAnimationId = requestAnimationFrame(drawOverlay);
        } else {
            cropOverlayAnimationId = null; // Stop the loop when not needed
        }
    }

    // Start initial draw
    drawOverlay();
}

// Force a single redraw without starting continuous loop
export function redrawCropOverlay(): void {
    if (!cropOverlayAnimationId && !isDraggingCrop) {
        const video = document.getElementById('camera-feed') as HTMLVideoElement | null;
        const canvas = document.getElementById('crop-overlay') as HTMLCanvasElement | null;

        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;

        if (!ctx) return;

        if (video.videoWidth > 0 && video.videoHeight > 0) {
            // Directly redraw without animation loop
            const rect = video.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const x = AppState.currentCrop.x * canvas.width;
            const y = AppState.currentCrop.y * canvas.height;
            const width = AppState.currentCrop.width * canvas.width;
            const height = AppState.currentCrop.height * canvas.height;

            ctx.clearRect(x, y, width, height);
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            const handleSize = CONFIG.CROP_HANDLE_SIZE;
            ctx.fillStyle = '#0ea5e9';
            ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
            ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
            ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
            ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
        }
    }
}

// Set up crop selection interface
export function setupCropSelector(): void {
    const container = document.getElementById('camera-container') as HTMLElement | null;

    if (!container) return;

    let startX: number = 0;
    let startY: number = 0;

    container.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        startX = (e.clientX - rect.left) / rect.width;
        startY = (e.clientY - rect.top) / rect.height;
        isDraggingCrop = true; // Use global dragging state

        // Start animation loop during dragging
        if (!cropOverlayAnimationId) {
            startCropOverlay();
        }

        // Hide instructions when user starts interacting
        const instructions = document.getElementById('crop-instructions') as HTMLElement | null;
        if (instructions) {
            instructions.style.opacity = '0';
        }
    });

    container.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isDraggingCrop) return;
        e.preventDefault();

        const rect = container.getBoundingClientRect();
        const endX = (e.clientX - rect.left) / rect.width;
        const endY = (e.clientY - rect.top) / rect.height;

        AppState.currentCrop = {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY)
        };

        // Animation loop will automatically redraw while isDraggingCrop is true
    });

    container.addEventListener('mouseup', () => {
        isDraggingCrop = false; // Stop animation loop
        // Final redraw and save crop to localStorage
        redrawCropOverlay();
        localStorage.setItem('captn-reverse-crop', JSON.stringify(AppState.currentCrop));
    });

    container.addEventListener('mouseleave', () => {
        isDraggingCrop = false; // Stop animation loop
        redrawCropOverlay(); // Final redraw
    });

    // Touch support for mobile
    container.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        startX = (touch.clientX - rect.left) / rect.width;
        startY = (touch.clientY - rect.top) / rect.height;
        isDraggingCrop = true; // Use global dragging state

        // Start animation loop during dragging
        if (!cropOverlayAnimationId) {
            startCropOverlay();
        }
        const instructions = document.getElementById('crop-instructions') as HTMLElement | null;
        if (instructions) {
            instructions.style.opacity = '0';
        }
    });

    container.addEventListener('touchmove', (e: TouchEvent) => {
        if (!isDraggingCrop) return;
        e.preventDefault();

        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const endX = (touch.clientX - rect.left) / rect.width;
        const endY = (touch.clientY - rect.top) / rect.height;

        AppState.currentCrop = {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY)
        };

        // Animation loop will automatically redraw while isDraggingCrop is true
    });

    container.addEventListener('touchend', () => {
        isDraggingCrop = false; // Stop animation loop
        redrawCropOverlay(); // Final redraw
        localStorage.setItem('captn-reverse-crop', JSON.stringify(AppState.currentCrop));
    });

    // Load saved crop or show default
    const savedCrop = localStorage.getItem('captn-reverse-crop');
    if (savedCrop) {
        try {
            AppState.currentCrop = JSON.parse(savedCrop) as CropArea;
        } catch (e) {
            setCrop(0.25, 0.25, 0.5, 0.5);
        }
    } else {
        setCrop(0.25, 0.25, 0.5, 0.5);
    }
}

// Set crop area programmatically
export function setCrop(x: number, y: number, width: number, height: number): void {
    AppState.currentCrop = { x, y, width, height };
    // Hide instructions once user selects a crop area
    const instructions = document.getElementById('crop-instructions') as HTMLElement | null;
    if (instructions) {
        instructions.style.opacity = '0';
    }
    localStorage.setItem('captn-reverse-crop', JSON.stringify(AppState.currentCrop));
    // Trigger redraw with new crop area
    redrawCropOverlay();
}

// Toggle monitoring mode
export function toggleMonitoring(): void {
    AppState.isMonitoring = !AppState.isMonitoring;
    const btn = document.getElementById('monitor-toggle') as HTMLElement | null;

    if (!btn) return;

    if (AppState.isMonitoring) {
        btn.textContent = 'Pause Monitoring';
        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        btn.classList.add('bg-red-600', 'hover:bg-red-700');
        updateStatus('Monitoring active', 'bg-green-400 animate-pulse');
        startMonitoring();
    } else {
        btn.textContent = 'Start Monitoring';
        btn.classList.remove('bg-red-600', 'hover:bg-red-700');
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
        updateStatus('Monitoring paused', 'bg-yellow-400');
        stopMonitoring();
    }
}

// Start monitoring with interval
export function startMonitoring(): void {
    if (!AppState.stream || !AppState.ocrWorker) return;

    window.monitoringInterval = window.setInterval(async () => {
        const { processFrame } = await import('./ocr.js');
        await processFrame();
    }, AppState.settings.processingInterval); // Use configurable interval
}

// Stop monitoring
export function stopMonitoring(): void {
    if (window.monitoringInterval) {
        clearInterval(window.monitoringInterval);
        window.monitoringInterval = null;
    }
}

// Update crop display (legacy compatibility)
export function updateCropDisplay(): void {
    redrawCropOverlay();
}
