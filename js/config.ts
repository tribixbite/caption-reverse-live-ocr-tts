/**
 * Application Configuration and State Management - TypeScript
 * Central state management for CaptnReverse OCR & TTS application
 */

import type {
  AppState as AppStateType,
  UserSettings,
  CropArea,
  ReusableCanvases,
  CanvasContexts,
  CONFIG as ConfigType
} from './types.js';

// Application State Management with TypeScript
export const AppState: AppStateType = {
  // Core functionality state
  isMonitoring: false,
  stream: null,
  ocrWorker: null,
  ocrScheduler: null,
  lastText: '',
  cameraRequestInProgress: false,

  // Camera and media state
  mediaStreamTrack: null,
  cameraZoom: 1.0,
  currentCrop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },

  // OCR engine state
  currentOCREngine: 'tesseract',
  paddleOCRLoaded: false,
  paddleOCRInstance: null,

  // Voice/TTS state
  voices: [],
  voicesLoaded: false,

  // User settings with type safety
  settings: {
    autoRead: true,
    speechRate: 1.0,
    sensitivity: 60, // Increased default for better quality filtering
    imageThreshold: 150,
    processingInterval: 2000,
    showDebugCanvas: true,
    debugViewSizing: 'constrained' // Type-safe sizing option
  },

  // Web Worker job tracking
  preprocessingJobs: new Map()
};

// Performance optimization: Reusable canvas objects to prevent memory leaks
export const reusableCanvases: ReusableCanvases = {
  processing: document.createElement('canvas'),
  crop: document.createElement('canvas'),
  temp: document.createElement('canvas')
};

// Get contexts once to avoid repeated getContext() calls
export const canvasContexts: CanvasContexts = {
  processing: reusableCanvases.processing.getContext('2d')!,
  crop: reusableCanvases.crop.getContext('2d')!,
  temp: reusableCanvases.temp.getContext('2d')!
};

// Application constants with type safety
export const CONFIG: ConfigType = {
  OCR_TARGET_HEIGHT: 800, // Optimal height for Tesseract.js accuracy
  CROP_HANDLE_SIZE: 8,
  MIN_CROP_SIZE: 50,
  MAX_CROP_SIZE: 2000
} as const;

// Gaming-specific configuration
export const GAMING_CONFIG = {
  HOTKEY_COUNT: 16,
  VOICE_COMMANDS_COUNT: 25,
  MONITOR_MODES: 3,
  MAX_HISTORY_ENTRIES: 500,
  PERFORMANCE_METRICS: 7,
  AUDIO_EFFECTS: 2,
  UI_ANIMATIONS: 8
} as const;

// Performance thresholds for gaming optimization
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT_OCR_TIME: 1000,
  EXCELLENT_CONFIDENCE: 85,
  EXCELLENT_MEMORY: 100,
  GOOD_OCR_TIME: 2000,
  GOOD_CONFIDENCE: 70,
  GOOD_MEMORY: 150,
  FAIR_OCR_TIME: 3000,
  FAIR_CONFIDENCE: 50,
  FAIR_MEMORY: 200
} as const;

// Audio configuration for gaming effects
export const AUDIO_CONFIG = {
  RECOGNITION_FREQUENCIES: [261.63, 329.63, 392.00] as const, // C major chord
  PROCESSING_FREQUENCY: 440, // A4 tone
  RECOGNITION_DURATION: 0.2,
  PROCESSING_DURATION: 0.1,
  DEFAULT_VOLUME: 0.1
} as const;

// Type guards for runtime validation
export function isValidCropArea(crop: any): crop is CropArea {
  return crop &&
    typeof crop.x === 'number' &&
    typeof crop.y === 'number' &&
    typeof crop.width === 'number' &&
    typeof crop.height === 'number' &&
    crop.x >= 0 && crop.x <= 1 &&
    crop.y >= 0 && crop.y <= 1 &&
    crop.width > 0 && crop.width <= 1 &&
    crop.height > 0 && crop.height <= 1;
}

export function isValidOCREngine(engine: any): engine is 'tesseract' | 'paddle' {
  return engine === 'tesseract' || engine === 'paddle';
}

export function isValidPerformanceLevel(level: any): level is 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  return ['Excellent', 'Good', 'Fair', 'Poor'].includes(level);
}

// Legacy exports for backward compatibility (gradually remove these)
export const { isMonitoring, stream, ocrWorker, currentCrop, settings } = AppState;