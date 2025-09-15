/**
 * TypeScript Type Definitions for CaptnReverse Gaming Companion
 */

// Core application state interface
export interface AppState {
  // Camera and video
  stream: MediaStream | null;
  mediaStreamTrack: MediaStreamTrack | null;
  cameraRequestInProgress: boolean;
  cameraZoom: number;

  // OCR systems
  ocrWorker: Tesseract.Worker | null;
  ocrScheduler: Tesseract.Scheduler | null;
  currentOCREngine: 'tesseract' | 'paddle';
  paddleOCRInstance: any | null;
  paddleOCRLoaded: boolean;
  lastText: string;

  // Preprocessing
  preprocessingJobs?: Map<string, { resolve: Function; reject: Function }>;

  // Monitoring and processing
  isMonitoring: boolean;
  currentCrop: CropArea;

  // Voice and speech
  voices: SpeechSynthesisVoice[];
  voicesLoaded: boolean;

  // Settings
  settings: UserSettings;
}

// User settings interface
export interface UserSettings {
  sensitivity: number;
  imageThreshold: number;
  speechRate: number;
  autoRead: boolean;
  showDebugCanvas: boolean;
  debugViewSizing: 'constrained' | 'autoWidth';
  processingInterval: number;
}

// Crop area interface
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// OCR result interface
export interface OCRResult {
  data: {
    text: string;
    confidence: number;
  };
}

// PaddleOCR result interface
export interface PaddleOCRResult {
  text: string | string[];
  points?: number[][][]; // Array of bounding box coordinates
}

// Performance metrics interface
export interface PerformanceMetrics {
  averageOCRTime: number;
  averagePreprocessingTime: number;
  averageConfidence: number;
  memoryUsage: number;
  successRate: number;
  processedFrames: number;
  performanceLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

// History entry interface
export interface HistoryEntry {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  sessionId: string;
  metadata: {
    ocrEngine: 'tesseract' | 'paddle';
    processingTime: number;
    cropArea: CropArea;
    settings: {
      sensitivity: number;
      imageThreshold: number;
    };
    preprocessingTime?: number;
  };
}

// Gaming session interface
export interface GamingSession {
  id: string;
  startTime: number;
  lastActivity: number;
  entryCount: number;
  type: 'gaming' | 'general';
  name: string;
}

// Hotkey configuration interface
export interface HotkeyConfig {
  action: string;
  description: string;
  enabled: boolean;
}

// Voice command interface
export interface VoiceCommand {
  action: string;
  description: string;
}

// Audio context for gaming effects
export interface AudioEffect {
  context: AudioContext;
  oscillator: OscillatorNode;
  gainNode: GainNode;
  frequency: number;
  duration: number;
}

// Multi-monitor state interface
export interface MultiMonitorState {
  screens: any[]; // Screen objects from Window Management API
  currentScreen: any | null;
  popupWindow: Window | null;
  isMultiMonitorSupported: boolean;
  gamingDisplay: any | null;
  ocrDisplay: any | null;
}

// Preprocessing configuration interface
export interface PreprocessingConfig {
  sauvolaK?: number;
  sauvolaWindow?: number;
  blurRadius?: number;
  enableMorphology?: boolean;
  enableContrast?: boolean;
}

// Auto-calibration configuration interface
export interface CalibrationConfig {
  name: string;
  psm: string;
  sauvolaK?: number;
  sauvolaWindow?: number;
  blurRadius?: number;
  enableMorphology?: boolean;
  enableContrast?: boolean;
}

// Calibration result interface
export interface CalibrationResult {
  name: string;
  psm: string;
  result: string;
  confidence: number;
  processingTime: number;
  score: number;
  sauvolaK?: number;
  sauvolaWindow?: number;
  blurRadius?: number;
}

// Performance report interface
export interface PerformanceReport {
  uptime: string;
  processedFrames: number;
  successfulRecognitions: number;
  successRate: string;
  averageOCRTime: string;
  averagePreprocessingTime: string;
  totalProcessingTime: string;
  averageConfidence: string;
  currentMemoryUsage: string;
  averageMemoryUsage: string;
  framesPerMinute: string;
  performance: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

// Test configuration interface
export interface TestConfig {
  testImage: string;
  expectedTexts: string[];
  timeout: number;
  confidenceThreshold: number;
}

// Browser test result interface
export interface BrowserTestResult {
  hotkeySystem: boolean;
  historySystem: boolean;
  audioSystem: boolean;
  performanceMonitoring: boolean;
  voiceCommands: boolean;
  multiMonitor: boolean;
  gamingUI: boolean;
}

// Gaming feature statistics interface
export interface GamingFeatureStats {
  hotkeyMappings: number;
  voiceCommands: number;
  audioEffects: number;
  performanceMetrics: number;
  uiAnimations: number;
  multiMonitorModes: number;
}

// Configuration constants interface
export interface CONFIG {
  readonly CROP_HANDLE_SIZE: number;
  readonly OCR_TARGET_HEIGHT: number;
  readonly MIN_CROP_SIZE: number;
  readonly MAX_CROP_SIZE: number;
}

// Reusable canvas objects interface
export interface ReusableCanvases {
  processing: HTMLCanvasElement;
  crop: HTMLCanvasElement;
  temp: HTMLCanvasElement;
}

// Canvas contexts interface
export interface CanvasContexts {
  processing: CanvasRenderingContext2D;
  crop: CanvasRenderingContext2D;
  temp: CanvasRenderingContext2D;
}

// Worker message interfaces
export interface WorkerMessage {
  type: 'preprocess' | 'benchmark';
  imageData: ImageData;
  config: PreprocessingConfig;
  jobId: string;
}

export interface WorkerResponse {
  type: 'preprocessingComplete' | 'preprocessingError' | 'benchmarkComplete';
  jobId: string;
  result?: {
    imageData: ImageData;
    processingTime: number;
    config: PreprocessingConfig;
  };
  error?: string;
  success: boolean;
}

// Gaming optimization result interface
export interface GamingOptimizationResult {
  allOriginalIssuesResolved: boolean;
  bonusGamingFeaturesComplete: boolean;
  architecturalImprovementsImplemented: boolean;
  productionReady: boolean;
  testValidationPassed: boolean;
}

// Export default AppState for backward compatibility
export type { AppState as default };