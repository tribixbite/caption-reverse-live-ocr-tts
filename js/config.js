/**
 * Application Configuration and State Management
 * Central state management for CaptnReverse OCR & TTS application
 */

// Application State Management
export const AppState = {
    // Core functionality state
    isMonitoring: false,
    stream: null,
    ocrWorker: null,
    lastText: '',
    cameraRequestInProgress: false,
    
    // Camera and media state
    mediaStreamTrack: null,
    cameraZoom: 1.0,
    currentCrop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
    
    // OCR engine state
    currentOCREngine: 'tesseract', // 'tesseract' or 'paddle'
    paddleOCRLoaded: false,
    paddleOCRInstance: null,
    
    // Voice/TTS state
    voices: [],
    voicesLoaded: false,
    
    // User settings
    settings: {
        autoRead: true,
        speechRate: 1.0,
        sensitivity: 60, // Increased default for better quality filtering
        imageThreshold: 150,
        processingInterval: 2000,
        showDebugCanvas: true,
        debugViewSizing: 'constrained' // 'constrained' or 'autoWidth'
    }
};

// Performance optimization: Reusable canvas objects to prevent memory leaks
export const reusableCanvases = {
    processing: document.createElement('canvas'),
    crop: document.createElement('canvas'),
    temp: document.createElement('canvas')
};

// Get contexts once to avoid repeated getContext() calls
export const canvasContexts = {
    processing: reusableCanvases.processing.getContext('2d'),
    crop: reusableCanvases.crop.getContext('2d'),
    temp: reusableCanvases.temp.getContext('2d')
};

// Application constants
export const CONFIG = {
    OCR_TARGET_HEIGHT: 800, // Optimal height for Tesseract.js accuracy
    DEBUG_LOG_LIMIT: 200,
    PROCESSING_INTERVAL_DEFAULT: 2000,
    SENSITIVITY_DEFAULT: 60,
    CROP_HANDLE_SIZE: 8,
    ANIMATION_DURATION: 200
};

// Legacy global variables for compatibility (gradually remove these)
export let isMonitoring = AppState.isMonitoring;
export let stream = AppState.stream;
export let ocrWorker = AppState.ocrWorker;
export let currentCrop = AppState.currentCrop;
export let autoRead = AppState.settings.autoRead;
export let speechRate = AppState.settings.speechRate;
export let sensitivity = AppState.settings.sensitivity;
export let lastText = AppState.lastText;
export let cameraZoom = AppState.cameraZoom;
export let mediaStreamTrack = AppState.mediaStreamTrack;
export let imageThreshold = AppState.settings.imageThreshold;
export let currentOCREngine = AppState.currentOCREngine;
export let paddleOCRLoaded = AppState.paddleOCRLoaded;
export let showDebugCanvas = AppState.settings.showDebugCanvas;
export let processingInterval = AppState.settings.processingInterval;
export let cameraRequestInProgress = AppState.cameraRequestInProgress;
export let voices = AppState.voices;
export let voicesLoaded = AppState.voicesLoaded;