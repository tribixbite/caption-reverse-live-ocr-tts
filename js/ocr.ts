/**
 * OCR Module - Handles Tesseract.js and PaddleOCR integration
 * Manages text recognition, engine switching, and result processing
 */

import { AppState, reusableCanvases, canvasContexts, CONFIG } from './config.js';
import { updateStatus } from './ui.js';
import { recordOCRPerformance } from './performance.js';
import type { PreprocessingConfig, OCRResult } from './types.js';

// Declare Tesseract as global (loaded via CDN)
declare const Tesseract: {
    createScheduler: () => Promise<Tesseract.Scheduler>;
    createWorker: (lang: string, oem: number, options?: object) => Promise<Tesseract.Worker>;
};

declare namespace Tesseract {
    interface Worker {
        setParameters: (params: Record<string, string>) => Promise<void>;
        terminate: () => Promise<void>;
    }
    interface Scheduler {
        addWorker: (worker: Worker) => void;
        addJob: (type: string, data: HTMLCanvasElement | ImageData) => Promise<OCRResult>;
        terminate: () => Promise<void>;
        workers: Worker[];
    }
}

// Preprocessing worker for off-main-thread image processing
let preprocessingWorker: Worker | null = null;
let preprocessingJobCounter = 0;

// Helper function to detect blank, noise, or meaningless OCR results
export function isBlankOrNoise(text: string | null | undefined): boolean {
    if (!text || typeof text !== 'string') return true;

    // Common OCR noise patterns
    const noisePatterns = [
        /^[\s\-_|\\\/\.\,\;\:\!\?\'\"\`\~\@\#\$\%\^\&\*\(\)\[\]\{\}\<\>\=\+]+$/, // Only symbols/punctuation
        /^[lI1|]{1,3}$/, // Common OCR misreads (l, I, 1, |)
        /^[oO0]{1,3}$/, // Circles mistaken for O's or 0's
        /^[\.\s]+$/, // Only dots and spaces
        /^[\-\s]+$/, // Only dashes and spaces
        /^[_\s]+$/, // Only underscores and spaces
        /^[,\s]+$/, // Only commas and spaces
        /^\s*$/, // Only whitespace
    ];

    // Check against noise patterns
    for (const pattern of noisePatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }

    // Check for very repetitive patterns (like "|||" or "...")
    if (text.length > 1) {
        const firstChar = text.charAt(0);
        if (text.split('').every(char => char === firstChar || char === ' ')) {
            return true; // All characters are the same (ignoring spaces)
        }
    }

    // Check for suspicious character ratios
    const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const totalLength = text.length;

    if (totalLength > 0 && (alphanumericCount / totalLength) < 0.3) {
        return true; // Less than 30% alphanumeric characters
    }

    return false;
}

// Advanced image preprocessing pipeline optimized for challenging text scenarios
async function advancedImagePreprocessing(inputCanvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
    console.log('🎨 Starting advanced image preprocessing...');
    const startTime = performance.now();

    // Create processing canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = inputCanvas.width;
    canvas.height = inputCanvas.height;

    // Copy input image
    ctx.drawImage(inputCanvas, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    console.log(`📐 Processing image: ${width}x${height} pixels`);

    // Step 1: Analyze image to detect white text on dark background
    console.log('   🔍 Analyzing image characteristics...');
    const imageStats = analyzeImageCharacteristics(data);
    console.log(`   📊 Image stats: brightness=${imageStats.avgBrightness}, contrast=${imageStats.contrast}, isDarkBackground=${imageStats.isDarkBackground}`);

    // Step 2: Convert to grayscale with luminance weighting
    console.log('   1️⃣ Converting to grayscale with luminance weighting...');
    for (let i = 0; i < data.length; i += 4) {
        // Use luminance formula: 0.299*R + 0.587*G + 0.114*B
        const gray = Math.round(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    // Step 3: Enhanced contrast for white text on dark backgrounds
    if (imageStats.isDarkBackground) {
        console.log('   2️⃣ Applying dark background optimizations...');
        enhanceWhiteTextOnDark(data);
    } else {
        console.log('   2️⃣ Applying standard contrast enhancement...');
        enhanceContrast(data);
    }

    // Step 4: Intelligent noise reduction
    console.log('   3️⃣ Applying intelligent noise reduction...');
    const blurredData = gaussianBlur(data, width, height, imageStats.isDarkBackground ? 0.3 : 0.5);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = blurredData[i]!;
        data[i + 1] = blurredData[i + 1]!;
        data[i + 2] = blurredData[i + 2]!;
    }

    // Step 5: Adaptive thresholding (Sauvola method with dynamic parameters)
    console.log('   4️⃣ Applying adaptive thresholding...');
    const sauvolaK = imageStats.isDarkBackground ? 0.1 : 0.2;
    const sauvolaWindow = Math.max(10, Math.min(25, Math.round(Math.min(width, height) / 20)));
    sauvolaThreshold(data, width, height, sauvolaWindow, sauvolaK);

    // Step 6: Morphological operations to clean up text
    console.log('   5️⃣ Applying morphological operations...');
    morphologicalCleanup(data, width, height);

    // Apply processed image data back to canvas
    ctx.putImageData(imageData, 0, 0);

    const processingTime = performance.now() - startTime;
    console.log(`✅ Image preprocessing completed in ${processingTime.toFixed(2)}ms`);

    return canvas;
}

// Gaussian blur for noise reduction
function gaussianBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
    const kernel = generateGaussianKernel(radius);
    const kernelSize = kernel.length;
    const halfKernel = Math.floor(kernelSize / 2);
    const blurredData = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, weightSum = 0;

            for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                    const py = Math.min(height - 1, Math.max(0, y + ky));
                    const px = Math.min(width - 1, Math.max(0, x + kx));
                    const pixelIndex = (py * width + px) * 4;
                    const weight = kernel[ky + halfKernel]![kx + halfKernel]!;

                    r += data[pixelIndex]! * weight;
                    g += data[pixelIndex + 1]! * weight;
                    b += data[pixelIndex + 2]! * weight;
                    weightSum += weight;
                }
            }

            const index = (y * width + x) * 4;
            blurredData[index] = r / weightSum;
            blurredData[index + 1] = g / weightSum;
            blurredData[index + 2] = b / weightSum;
            blurredData[index + 3] = data[index + 3]!;
        }
    }

    return blurredData;
}

// Generate Gaussian kernel
function generateGaussianKernel(radius: number): number[][] {
    const size = Math.ceil(radius * 6) | 1; // Ensure odd size
    const kernel: number[][] = [];
    const sigma = radius;
    const sigma2 = 2 * sigma * sigma;
    const center = Math.floor(size / 2);

    for (let y = 0; y < size; y++) {
        kernel[y] = [];
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;
            kernel[y]![x] = Math.exp(-(dx * dx + dy * dy) / sigma2) / (Math.PI * sigma2);
        }
    }

    return kernel;
}

// Contrast enhancement using histogram stretching
function enhanceContrast(data: Uint8ClampedArray): void {
    let min = 255, max = 0;

    // Find min and max values
    for (let i = 0; i < data.length; i += 4) {
        min = Math.min(min, data[i]!);
        max = Math.max(max, data[i]!);
    }

    // Avoid division by zero
    if (max === min) return;

    const range = max - min;

    // Stretch histogram
    for (let i = 0; i < data.length; i += 4) {
        const stretched = Math.round(((data[i]! - min) / range) * 255);
        data[i] = stretched;
        data[i + 1] = stretched;
        data[i + 2] = stretched;
    }
}

// Sauvola adaptive thresholding
function sauvolaThreshold(data: Uint8ClampedArray, width: number, height: number, windowSize: number, k: number): void {
    const threshold = new Array(width * height);
    const halfWindow = Math.floor(windowSize / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0, sumSq = 0, count = 0;

            // Calculate local statistics
            for (let dy = -halfWindow; dy <= halfWindow; dy++) {
                for (let dx = -halfWindow; dx <= halfWindow; dx++) {
                    const py = Math.min(height - 1, Math.max(0, y + dy));
                    const px = Math.min(width - 1, Math.max(0, x + dx));
                    const pixelIndex = (py * width + px) * 4;
                    const value = data[pixelIndex]!;

                    sum += value;
                    sumSq += value * value;
                    count++;
                }
            }

            const mean = sum / count;
            const variance = (sumSq / count) - (mean * mean);
            const stdDev = Math.sqrt(Math.max(0, variance));

            // Sauvola threshold formula
            const localThreshold = mean * (1 + k * ((stdDev / 128) - 1));
            threshold[y * width + x] = localThreshold;
        }
    }

    // Apply threshold
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const value = data[index]! > threshold[y * width + x] ? 255 : 0;
            data[index] = value;
            data[index + 1] = value;
            data[index + 2] = value;
        }
    }
}

// Morphological operations to clean up binary text
function morphologicalCleanup(data: Uint8ClampedArray, width: number, height: number): void {
    // Apply closing operation (dilation followed by erosion) to connect broken characters
    const structuringElement = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ];

    // Dilation
    const dilated = dilate(data, width, height, structuringElement);

    // Erosion
    const eroded = erode(dilated, width, height, structuringElement);

    // Copy result back
    for (let i = 0; i < data.length; i += 4) {
        data[i] = eroded[i]!;
        data[i + 1] = eroded[i + 1]!;
        data[i + 2] = eroded[i + 2]!;
    }
}

// Morphological dilation
function dilate(data: Uint8ClampedArray, width: number, height: number, kernel: number[][]): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length);
    const kh = kernel.length;
    const kw = kernel[0]!.length;
    const kcy = Math.floor(kh / 2);
    const kcx = Math.floor(kw / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let maxVal = 0;

            for (let ky = 0; ky < kh; ky++) {
                for (let kx = 0; kx < kw; kx++) {
                    if (kernel[ky]![kx] === 0) continue;

                    const py = y + ky - kcy;
                    const px = x + kx - kcx;

                    if (py >= 0 && py < height && px >= 0 && px < width) {
                        const pixelIndex = (py * width + px) * 4;
                        maxVal = Math.max(maxVal, data[pixelIndex]!);
                    }
                }
            }

            const index = (y * width + x) * 4;
            result[index] = maxVal;
            result[index + 1] = maxVal;
            result[index + 2] = maxVal;
            result[index + 3] = data[index + 3]!;
        }
    }

    return result;
}

// Morphological erosion
function erode(data: Uint8ClampedArray, width: number, height: number, kernel: number[][]): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length);
    const kh = kernel.length;
    const kw = kernel[0]!.length;
    const kcy = Math.floor(kh / 2);
    const kcx = Math.floor(kw / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let minVal = 255;

            for (let ky = 0; ky < kh; ky++) {
                for (let kx = 0; kx < kw; kx++) {
                    if (kernel[ky]![kx] === 0) continue;

                    const py = y + ky - kcy;
                    const px = x + kx - kcx;

                    if (py >= 0 && py < height && px >= 0 && px < width) {
                        const pixelIndex = (py * width + px) * 4;
                        minVal = Math.min(minVal, data[pixelIndex]!);
                    }
                }
            }

            const index = (y * width + x) * 4;
            result[index] = minVal;
            result[index + 1] = minVal;
            result[index + 2] = minVal;
            result[index + 3] = data[index + 3]!;
        }
    }

    return result;
}

// Process image using Web Worker (eliminates UI jank)
async function processImageInWorker(canvas: HTMLCanvasElement, config: PreprocessingConfig = {}): Promise<HTMLCanvasElement> {
    if (!preprocessingWorker) {
        console.warn('⚠️ Preprocessing worker not initialized, falling back to main thread');
        return await advancedImagePreprocessingFallback(canvas);
    }

    return new Promise((resolve, reject) => {
        const jobId = `preprocess_${++preprocessingJobCounter}_${Date.now()}`;

        // Get image data from canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Store job promise
        AppState.preprocessingJobs?.set(jobId, { resolve, reject });

        // Send to worker
        preprocessingWorker!.postMessage({
            type: 'preprocess',
            imageData: imageData,
            config: config,
            jobId: jobId
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (AppState.preprocessingJobs?.has(jobId)) {
                AppState.preprocessingJobs.delete(jobId);
                reject(new Error('Preprocessing worker timeout'));
            }
        }, 10000);
    }).then((result: any) => {
        // Create canvas from processed image data
        const processedCanvas = document.createElement('canvas');
        const processedCtx = processedCanvas.getContext('2d');
        if (!processedCtx) throw new Error('Could not get canvas context');

        processedCanvas.width = result.imageData.width;
        processedCanvas.height = result.imageData.height;
        processedCtx.putImageData(result.imageData, 0, 0);

        console.log(`✅ Worker preprocessing completed in ${result.processingTime.toFixed(2)}ms`);
        return processedCanvas;
    });
}

// Fallback preprocessing for main thread (if worker fails)
async function advancedImagePreprocessingFallback(inputCanvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
    console.log('⚠️ Using main thread preprocessing fallback');

    // Use the original preprocessing function (simplified version)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = inputCanvas.width;
    canvas.height = inputCanvas.height;
    ctx.drawImage(inputCanvas, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Basic grayscale conversion only (minimal processing to prevent jank)
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

// Initialize preprocessing Web Worker
function initPreprocessingWorker(): void {
    if (preprocessingWorker) {
        preprocessingWorker.terminate();
    }

    preprocessingWorker = new Worker('./js/preprocessing.worker.js');
    console.log('🎨 Preprocessing worker initialized for gaming performance');

    // Handle worker messages
    preprocessingWorker.onmessage = (e) => {
        const { type, jobId, result, error } = e.data;

        // Find and resolve the corresponding promise
        const job = AppState.preprocessingJobs?.get(jobId);
        if (job) {
            AppState.preprocessingJobs?.delete(jobId);

            if (type === 'preprocessingComplete') {
                job.resolve(result);
            } else if (type === 'preprocessingError') {
                job.reject(new Error(error));
            }
        }
    };

    preprocessingWorker.onerror = (error) => {
        console.error('❌ Preprocessing worker error:', error);
    };

    // Initialize job tracking
    if (!AppState.preprocessingJobs) {
        AppState.preprocessingJobs = new Map();
    }
}

// Initialize Tesseract OCR worker
export async function initOCR(): Promise<void> {
    try {
        console.log('🤖 Initializing OCR systems...');

        // Initialize preprocessing worker first
        initPreprocessingWorker();

        // Check if Tesseract is available
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js not loaded. Make sure the CDN script is included.');
        }

        // Initialize Tesseract scheduler for robust worker pooling
        const workerCount = Math.min(navigator.hardwareConcurrency || 2, 4); // Max 4 workers
        console.log(`🤖 Creating OCR scheduler with ${workerCount} workers...`);

        AppState.ocrScheduler = await Tesseract.createScheduler();

        // Add workers to scheduler
        for (let i = 0; i < workerCount; i++) {
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: ({ status, progress }: { status: string; progress: number; jobId?: string }) => {
                    if (status === 'recognizing text') {
                        const progressEl = document.getElementById('ocr-progress');
                        if (progressEl) {
                            progressEl.textContent = `${Math.round(progress * 100)}%`;
                        }
                    }
                }
            });

            // Optimized OCR parameters for gaming
            await worker.setParameters({
                tessedit_pageseg_mode: '6', // Single uniform block - best for general text
                preserve_interword_spaces: '1', // Better word spacing
                tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
                tessedit_do_invert: '0', // Disable auto-invert for consistency
                classify_enable_adaptive_matcher: '1' // Enable adaptive matching
            });

            AppState.ocrScheduler.addWorker(worker);
            console.log(`✅ OCR Worker ${i + 1}/${workerCount} added to scheduler`);
        }

        // Keep reference to first worker for legacy compatibility
        AppState.ocrWorker = AppState.ocrScheduler.workers[0] ?? null;

        console.log('✅ OCR Scheduler ready with robust worker pooling');
    } catch (error) {
        console.error('❌ OCR initialization failed:', error);
        throw error;
    }
}

// Check if OCR is initialized and ready
export function isOCRReady(): boolean {
    return AppState.ocrScheduler !== null && AppState.ocrScheduler.workers.length > 0;
}

// Switch between OCR engines
export async function switchOCREngine(engine: 'tesseract' | 'paddle'): Promise<void> {
    console.log(`🔄 Switching to ${engine} OCR engine...`);
    AppState.currentOCREngine = engine;

    // Update UI
    const tesseractBtn = document.getElementById('ocr-tesseract');
    const paddleBtn = document.getElementById('ocr-paddle');
    const infoDiv = document.getElementById('ocr-engine-info');

    if (engine === 'tesseract') {
        if (tesseractBtn) tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
        if (paddleBtn) paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
        if (infoDiv) infoDiv.innerHTML = '<p>Tesseract.js - Fast, lightweight, good for general text</p>';

        // Initialize Tesseract if needed
        if (!AppState.ocrWorker) {
            await initOCR();
        }
    } else {
        if (tesseractBtn) tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
        if (paddleBtn) paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
        if (infoDiv) infoDiv.innerHTML = '<p>PaddleOCR - Higher accuracy, larger download, slower processing</p>';

        // Load PaddleOCR dynamically
        await loadPaddleOCR();
    }
}

// Load PaddleOCR dependencies (ONNX Runtime and OpenCV.js)
async function loadPaddleOCRDependencies(): Promise<void> {
    console.log('📦 Loading PaddleOCR dependencies...');

    // Load ONNX Runtime Web
    if (!(window as any).ort) {
        try {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
                script.onload = () => {
                    console.log('✅ ONNX Runtime Web loaded');
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load ONNX Runtime'));
                document.head.appendChild(script);
            });
        } catch (error) {
            console.warn('⚠️ Failed to load ONNX Runtime:', (error as Error).message);
        }
    }

    // Load OpenCV.js
    if (!(window as any).cv) {
        try {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
                script.async = true;
                script.onload = () => {
                    console.log('✅ OpenCV.js loaded');
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
                document.head.appendChild(script);
            });
        } catch (error) {
            console.warn('⚠️ Failed to load OpenCV.js:', (error as Error).message);
        }
    }
}

// PaddleOCR endpoint configuration
interface PaddleOCREndpoint {
    name: string;
    url: string;
    useImportMap: boolean;
    type: string;
    dependencies?: string[];
    validated: boolean;
    fallbackUrl?: string;
}

// Load PaddleOCR with multiple CDN fallbacks and better error handling
export async function loadPaddleOCR(): Promise<void> {
    if (AppState.paddleOCRLoaded) {
        console.log('✅ PaddleOCR already loaded.');
        return;
    }

    // Validated PaddleOCR endpoints (CDN accessibility confirmed)
    const paddleOCREndpoints: PaddleOCREndpoint[] = [
        {
            name: 'eSearch-OCR (PaddleOCR browser wrapper)',
            url: 'https://cdn.jsdelivr.net/npm/esearch-ocr@5.1.5/dist/esearch-ocr.js',
            useImportMap: false,
            type: 'browser-specific',
            dependencies: ['onnx', 'opencv'],
            validated: true
        },
        {
            name: 'paddleocr-browser v1.0.3',
            url: 'https://cdn.jsdelivr.net/npm/paddleocr-browser@1.0.3/index.js',
            useImportMap: false,
            type: 'browser-package',
            validated: true
        },
        {
            name: '@paddle-js-models/ocr',
            url: 'https://cdn.jsdelivr.net/npm/@paddle-js-models/ocr/lib/index.js',
            useImportMap: false,
            type: 'models-package',
            validated: true
        },
        {
            name: 'Original PaddlePaddle.js (browser compatibility test)',
            url: 'https://cdn.jsdelivr.net/npm/@paddlepaddle/paddlejs@latest/dist/paddlejs.min.js',
            useImportMap: false,
            type: 'original-compatibility-test',
            validated: false // Expected to fail due to Node.js dependencies
        }
    ];

    // Load dependencies first
    await loadPaddleOCRDependencies();

    let lastError: Error | null = null;

    for (let i = 0; i < paddleOCREndpoints.length; i++) {
        const endpoint = paddleOCREndpoints[i]!;

        try {
            updateStatus(`Loading PaddleOCR... (${i + 1}/${paddleOCREndpoints.length}) - ${endpoint.name}`, 'bg-yellow-400 animate-pulse');
            console.log(`⏳ Attempting to load PaddleOCR from ${endpoint.name} (${endpoint.type}): ${endpoint.url}`);

            // Try dynamic import with current endpoint (with fallback URL support)
            let ocr: any;
            let importUrl = endpoint.url;

            try {
                console.log(`📦 Direct import from ${endpoint.name}...`);
                ocr = await import(importUrl);
            } catch (primaryError) {
                if (endpoint.fallbackUrl) {
                    console.log(`⚠️ Primary URL failed, trying fallback: ${endpoint.fallbackUrl}`);
                    importUrl = endpoint.fallbackUrl;
                    ocr = await import(importUrl);
                } else {
                    throw primaryError;
                }
            }

            console.log(`📦 PaddleOCR module loaded from ${endpoint.name}:`, ocr);

            // Validate the module has expected methods
            if (!ocr.init || typeof ocr.init !== 'function') {
                throw new Error(`${endpoint.name}: Module missing init function`);
            }

            if (!ocr.recognize || typeof ocr.recognize !== 'function') {
                throw new Error(`${endpoint.name}: Module missing recognize function`);
            }

            console.log(`🤖 Initializing PaddleOCR model from ${endpoint.name}... (this may take a moment)`);

            // Initialize with enhanced timeout and retry logic
            const initTimeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('PaddleOCR init timeout (30s)')), 30000)
            );

            let initAttempts = 0;
            const maxAttempts = 3;

            while (initAttempts < maxAttempts) {
                try {
                    console.log(`🔄 PaddleOCR init attempt ${initAttempts + 1}/${maxAttempts}...`);
                    await Promise.race([ocr.init(), initTimeout]);
                    break; // Success, exit retry loop
                } catch (initError) {
                    initAttempts++;
                    console.warn(`⚠️ PaddleOCR init attempt ${initAttempts} failed:`, (initError as Error).message);

                    if (initAttempts >= maxAttempts) {
                        throw new Error(`PaddleOCR init failed after ${maxAttempts} attempts: ${(initError as Error).message}`);
                    }

                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            AppState.paddleOCRInstance = ocr;
            AppState.paddleOCRLoaded = true;

            console.log(`✅ PaddleOCR loaded and initialized successfully from ${endpoint.name}!`);
            updateStatus('PaddleOCR ready', 'bg-green-400');

            // Store successful endpoint for future reference
            localStorage.setItem('paddleOCRSuccessfulEndpoint', JSON.stringify({
                endpoint: endpoint,
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            }));

            return; // Success, exit function

        } catch (error) {
            lastError = error as Error;
            console.warn(`⚠️ ${endpoint.name} failed:`, lastError.message);

            // Log detailed error information
            console.warn(`   Error type: ${lastError.name}`);
            console.warn(`   Error stack: ${lastError.stack?.substring(0, 200)}...`);

            // Handle specific browser compatibility issues
            if (lastError.message.includes('exports is not defined')) {
                console.warn(`   🔧 Diagnosis: ${endpoint.name} uses Node.js CommonJS modules, incompatible with browser ES modules`);
            } else if (lastError.message.includes('fs') && lastError.message.includes('does not exist')) {
                console.warn(`   🔧 Diagnosis: ${endpoint.name} requires Node.js file system access, unavailable in browser`);
            } else if (lastError.message.includes('require is not defined')) {
                console.warn(`   🔧 Diagnosis: ${endpoint.name} uses CommonJS require(), not supported in browser ES modules`);
            }

            // Continue to next CDN if available
            if (i < paddleOCREndpoints.length - 1) {
                console.log(`🔄 Trying next CDN: ${paddleOCREndpoints[i + 1]!.name}...`);
                continue;
            }
        }
    }

    // All CDN attempts failed
    console.error('❌ All PaddleOCR CDNs failed. Last error:', lastError);

    // Enhanced error reporting with browser compatibility detection
    let errorCategory = 'Unknown error';
    if (lastError) {
        if (lastError.message.includes('exports is not defined') ||
            lastError.message.includes('require is not defined') ||
            (lastError.message.includes('fs') && lastError.message.includes('does not exist'))) {
            errorCategory = 'Browser compatibility issue';
            updateStatus('PaddleOCR unavailable: Browser incompatible', 'bg-yellow-400');
        } else if (lastError.message.includes('NetworkError') || lastError.message.includes('fetch')) {
            errorCategory = 'Network/CDN error';
            updateStatus('PaddleOCR unavailable: Network error', 'bg-red-400');
        } else if (lastError.message.includes('import') || lastError.message.includes('module')) {
            errorCategory = 'Module loading error';
            updateStatus('PaddleOCR unavailable: Module error', 'bg-red-400');
        } else if (lastError.message.includes('init')) {
            errorCategory = 'Initialization error';
            updateStatus('PaddleOCR unavailable: Init failed', 'bg-red-400');
        } else {
            updateStatus('PaddleOCR unavailable: Unknown error', 'bg-red-400');
        }
    }

    console.error(`Error category: ${errorCategory}`);
    console.error('Detailed error:', lastError);

    // Automatically fallback to Tesseract
    console.log('🔄 All PaddleOCR CDNs failed. Falling back to Tesseract.js');
    AppState.currentOCREngine = 'tesseract';

    // Update UI to reflect fallback with better information and user guidance
    setTimeout(() => {
        const tesseractBtn = document.getElementById('ocr-tesseract');
        const paddleBtn = document.getElementById('ocr-paddle');
        const infoDiv = document.getElementById('ocr-engine-info');

        if (tesseractBtn && paddleBtn && infoDiv) {
            tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
            paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white opacity-50 cursor-not-allowed';

            // Enhanced error information with user guidance
            const troubleshootingTips: Record<string, string> = {
                'Browser compatibility issue': 'PaddleOCR requires Node.js environment - using Tesseract.js instead',
                'Network/CDN error': 'Check internet connection and try refreshing',
                'Module loading error': 'Clear browser cache and reload',
                'Initialization error': 'PaddleOCR models failed to download'
            };

            const tip = troubleshootingTips[errorCategory] || 'Unknown error occurred';

            infoDiv.innerHTML = `
                <div class="space-y-2">
                    <p class="font-medium">🤖 Tesseract.js Active (PaddleOCR unavailable)</p>
                    <p class="text-xs text-dark-400">Issue: ${errorCategory}</p>
                    <p class="text-xs text-gaming-cyan">💡 ${tip}</p>
                    <button onclick="retryPaddleOCR()" class="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded mt-1">
                        🔄 Retry PaddleOCR
                    </button>
                </div>
            `;

            // Disable PaddleOCR button with detailed tooltip
            (paddleBtn as HTMLButtonElement).disabled = true;
            paddleBtn.title = `PaddleOCR failed to load: ${errorCategory}\nTesseract.js is working as fallback\nClick "Retry PaddleOCR" to try again`;
        }

        updateStatus('Using Tesseract.js (PaddleOCR unavailable)', 'bg-blue-400');

        // Show user-friendly notification about fallback
        showPaddleOCRFallbackNotification(errorCategory);
    }, 1000);

    // Store failure information for debugging
    localStorage.setItem('paddleOCRFailureInfo', JSON.stringify({
        timestamp: Date.now(),
        errorCategory,
        errorMessage: lastError?.message,
        attemptedCDNs: paddleOCREndpoints,
        userAgent: navigator.userAgent,
        location: window.location.href
    }));
}

// Process a video frame for OCR
export async function processFrame(): Promise<void> {
    try {
        const video = document.getElementById('camera-feed') as HTMLVideoElement | null;
        if (!video) {
            console.error('❌ Camera feed element not found');
            return;
        }

        // Use reusable canvas objects to prevent memory leaks
        const canvas = reusableCanvases.processing;
        const ctx = canvasContexts.processing;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (canvas.width === 0 || canvas.height === 0) return;

        // Clear previous frame data
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0);

        // Apply crop based on video dimensions and crop area
        const cropCanvas = reusableCanvases.crop;
        const cropCtx = canvasContexts.crop;

        // Get actual video element dimensions for proper crop calculation
        const videoEl = document.getElementById('camera-feed');
        if (!videoEl) return;
        const videoRect = videoEl.getBoundingClientRect();

        // Calculate crop coordinates based on video's actual dimensions
        const scaleX = canvas.width / videoRect.width;
        const scaleY = canvas.height / videoRect.height;

        const cropX = AppState.currentCrop.x * canvas.width;
        const cropY = AppState.currentCrop.y * canvas.height;
        const cropWidth = AppState.currentCrop.width * canvas.width;
        const cropHeight = AppState.currentCrop.height * canvas.height;

        console.log(`🔲 Crop area: x=${Math.round(cropX)}, y=${Math.round(cropY)}, w=${Math.round(cropWidth)}, h=${Math.round(cropHeight)}`);
        console.log(`📐 Video: ${canvas.width}x${canvas.height}, Display: ${Math.round(videoRect.width)}x${Math.round(videoRect.height)}`);

        // Set crop canvas to exact crop size
        cropCanvas.width = Math.max(cropWidth, 50); // Minimum 50px width
        cropCanvas.height = Math.max(cropHeight, 50); // Minimum 50px height

        // Clear previous crop data and draw only the cropped portion
        cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        cropCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropCanvas.width, cropCanvas.height);

        // OPTIMIZATION: Rescale cropCanvas for optimal OCR resolution (20-40px character height)
        if (cropCanvas.height > 0 && cropCanvas.height !== CONFIG.OCR_TARGET_HEIGHT) {
            const aspectRatio = cropCanvas.width / cropCanvas.height;
            const scaledWidth = CONFIG.OCR_TARGET_HEIGHT * aspectRatio;

            // Use reusable temp canvas instead of creating new one
            const tempCanvas = reusableCanvases.temp;
            const tempCtx = canvasContexts.temp;
            tempCanvas.width = scaledWidth;
            tempCanvas.height = CONFIG.OCR_TARGET_HEIGHT;

            // Clear and scale the cropped image to optimal resolution
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(cropCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

            // Copy scaled image back to cropCanvas
            cropCanvas.width = tempCanvas.width;
            cropCanvas.height = tempCanvas.height;
            cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
            cropCtx.drawImage(tempCanvas, 0, 0);

            console.log(`📏 Scaled crop to optimal OCR size: ${Math.round(scaledWidth)}×${CONFIG.OCR_TARGET_HEIGHT}px`);
        }

        // *** ADVANCED IMAGE PREPROCESSING PIPELINE (Web Worker) ***
        const preprocessingStartTime = performance.now();

        // Use optimal preprocessing config if available from auto-calibration
        const preprocessingConfig: PreprocessingConfig = (AppState as any).optimalPreprocessingConfig || {
            sauvolaK: 0.2,
            sauvolaWindow: 15,
            blurRadius: 0.5,
            enableMorphology: true,
            enableContrast: true
        };

        console.log('🎨 Using preprocessing config:', preprocessingConfig);
        const processedCanvas = await processImageInWorker(cropCanvas, preprocessingConfig);
        const preprocessingTime = performance.now() - preprocessingStartTime;

        // Use processed canvas for OCR
        const processedCropCanvas = processedCanvas;

        // DEBUG: Show processed crop image (if enabled)
        if (AppState.settings.showDebugCanvas) {
            const { renderDebugCanvas } = await import('./debug.js');
            renderDebugCanvas(processedCropCanvas);
        }

        // Show processing state and play processing sound
        const processingStateEl = document.getElementById('processing-state');
        if (processingStateEl) processingStateEl.classList.remove('hidden');

        // Play processing start sound
        const { playProcessingSound } = await import('./speech.js');
        playProcessingSound();

        const startTime = Date.now();
        let result: OCRResult;

        // Use the selected OCR engine
        if (AppState.currentOCREngine === 'paddle' && AppState.paddleOCRLoaded) {
            console.log('🤖 Using PaddleOCR engine...');
            try {
                // Use correct PaddleOCR API - pass processed canvas/image directly
                const paddleResult = await AppState.paddleOCRInstance.recognize(processedCropCanvas);
                console.log('📊 PaddleOCR raw result:', paddleResult);

                // Adapt PaddleOCR's result format to match Tesseract's structure for compatibility
                let ocrText = '';
                let avgConfidence = 0;

                if (paddleResult && paddleResult.text) {
                    if (Array.isArray(paddleResult.text)) {
                        ocrText = paddleResult.text.join('\n');
                    } else {
                        ocrText = paddleResult.text;
                    }
                }

                // Enhanced confidence estimation for PaddleOCR (JS version lacks native confidence)
                if (paddleResult && paddleResult.points && paddleResult.points.length > 0) {
                    // Calculate confidence based on detection quality and text characteristics
                    const textQuality = calculateTextQuality(ocrText);
                    const detectionQuality = calculateDetectionQuality(paddleResult.points);

                    // Weighted confidence: 60% text quality + 40% detection quality
                    avgConfidence = Math.round((textQuality * 0.6) + (detectionQuality * 0.4));

                    console.log(`📊 PaddleOCR confidence estimation: text=${textQuality}%, detection=${detectionQuality}%, final=${avgConfidence}%`);
                } else if (ocrText.length > 0) {
                    // Text found but no bounding boxes - lower confidence
                    const textQuality = calculateTextQuality(ocrText);
                    avgConfidence = Math.max(50, Math.round(textQuality * 0.8)); // Cap at 80% without detection data
                } else {
                    avgConfidence = 10; // Very low confidence for no results
                }

                result = {
                    data: {
                        text: ocrText,
                        confidence: avgConfidence
                    }
                };

                console.log('✅ PaddleOCR recognition completed:', { text: ocrText, confidence: avgConfidence });
            } catch (paddleError) {
                console.error('❌ PaddleOCR recognition failed:', paddleError);
                updateStatus('PaddleOCR failed, using Tesseract', 'bg-yellow-400');

                // FIXED: Check if scheduler is initialized before using
                if (!AppState.ocrScheduler) {
                    throw new Error('OCR scheduler not initialized. Please wait for OCR to initialize.');
                }
                result = await AppState.ocrScheduler.addJob('recognize', processedCropCanvas);
            }

        } else {
            if (AppState.currentOCREngine === 'paddle' && !AppState.paddleOCRLoaded) {
                console.warn('⚠️ PaddleOCR selected but not loaded. Using Tesseract instead.');
                updateStatus('Using Tesseract (Paddle not ready)', 'bg-blue-400');
            }
            console.log('🤖 Using Tesseract.js scheduler...');

            // FIXED: Check if scheduler is initialized before using
            if (!AppState.ocrScheduler) {
                throw new Error('OCR scheduler not initialized. Please wait for OCR to initialize.');
            }
            // Use scheduler for robust worker pooling
            result = await AppState.ocrScheduler.addJob('recognize', processedCropCanvas);
        }

        const processingTime = Date.now() - startTime;

        // Hide processing state
        if (processingStateEl) processingStateEl.classList.add('hidden');

        const ocrText = result.data.text.trim();
        const ocrConfidence = result.data.confidence;

        // Record performance metrics
        const isSuccessful = ocrConfidence > AppState.settings.sensitivity && ocrText && ocrText.length > 2;
        recordOCRPerformance(processingTime, preprocessingTime, ocrConfidence, isSuccessful);

        console.log(`🔍 OCR Result: "${ocrText}" (confidence: ${Math.round(ocrConfidence)}%)`);

        // Update debug display with OCR result
        const { updateDebugText } = await import('./debug.js');
        updateDebugText(ocrText, ocrConfidence);

        // Enhanced text validation to prevent false positives on blank/empty content
        const text = result.data.text.trim();
        const hasActualText = text &&
            text.length > 2 &&
            /[a-zA-Z0-9]/.test(text) && // Contains at least one alphanumeric character
            text !== AppState.lastText &&
            !isBlankOrNoise(text); // Additional noise filtering

        if (ocrConfidence > AppState.settings.sensitivity && hasActualText) {
            const { displayText } = await import('./ui.js');
            displayText(text, result.data.confidence, processingTime);
            AppState.lastText = text;

            console.log(`📝 New text detected: "${text}"`);

            // Update hotkey system with new text
            const { updateLastRecognizedText } = await import('./hotkeys.js');
            updateLastRecognizedText(text);

            // Add to history system
            const { addToHistory } = await import('./history.js');
            addToHistory(text, result.data.confidence, Date.now(), {
                processingTime,
                preprocessingTime,
                cropArea: { ...AppState.currentCrop }
            });

            // Update secondary monitor if active
            const { updateSecondaryMonitor } = await import('./multimonitor.js');
            updateSecondaryMonitor(text, result.data.confidence);

            // Play recognition success sound
            const { playRecognitionSound, speak } = await import('./speech.js');
            playRecognitionSound();

            if (AppState.settings.autoRead) {
                console.log(`🔊 Auto-reading enabled, speaking text...`);
                speak(text);
            }
        } else {
            // Detailed logging for why text was rejected
            if (!hasActualText) {
                if (!text || text.length <= 2) {
                    console.log(`📏 Text too short (${text.length} chars): "${text}"`);
                } else if (!/[a-zA-Z0-9]/.test(text)) {
                    console.log(`🚫 No alphanumeric characters in: "${text}"`);
                } else if (text === AppState.lastText) {
                    console.log(`🔄 Same text as before, skipping: "${text}"`);
                } else if (isBlankOrNoise(text)) {
                    console.log(`🔇 Detected noise/blank pattern: "${text}"`);
                }
                updateStatus('No readable text found', 'bg-gray-400');
            } else if (ocrConfidence <= AppState.settings.sensitivity) {
                console.log(`🎯 Confidence ${Math.round(ocrConfidence)}% below threshold ${AppState.settings.sensitivity}%`);
                updateStatus(`Low confidence: ${Math.round(ocrConfidence)}%`, 'bg-yellow-400');
            }

            // Enhanced user feedback for rejected OCR results
            if (ocrConfidence < 20) {
                updateDebugText('No clear text detected. Try adjusting lighting, focus, or crop area.', ocrConfidence);
            } else if (ocrConfidence < AppState.settings.sensitivity) {
                updateDebugText(`Text detected but confidence (${Math.round(ocrConfidence)}%) below threshold (${AppState.settings.sensitivity}%). Consider lowering sensitivity.`, ocrConfidence);
            } else if (!hasActualText) {
                updateDebugText(`High confidence (${Math.round(ocrConfidence)}%) but invalid text content: "${text}"`, ocrConfidence);
            }
        }
    } catch (error) {
        const processingStateEl = document.getElementById('processing-state');
        if (processingStateEl) processingStateEl.classList.add('hidden');
        console.error('❌ OCR processing error:', error);
        updateStatus(`OCR error: ${(error as Error).message}`, 'bg-red-400');
    }
}

// Calibration configuration interface
interface CalibrationConfig {
    name: string;
    psm: string;
    sauvolaK: number;
    sauvolaWindow: number;
    blurRadius: number;
    invert: boolean;
    enableMorphology?: boolean;
    enableContrast?: boolean;
    threshold?: string;
}

// Calibration result interface
interface CalibrationResultExtended extends CalibrationConfig {
    result: string;
    confidence: number;
    processingTime: number;
    score: number;
}

// Auto-calibration system - finds optimal OCR settings
export async function runAutoCalibration(): Promise<CalibrationConfig> {
    console.log('🎯 Starting OCR auto-calibration...');
    updateStatus('Running auto-calibration...', 'bg-purple-400 animate-pulse');

    // FIXED: Check if OCR is initialized before running calibration
    if (!AppState.ocrScheduler) {
        const error = new Error('OCR scheduler not initialized. Please ensure OCR is initialized before running calibration.');
        console.error('❌ Auto-calibration failed:', error.message);
        updateStatus('OCR not initialized', 'bg-red-400');
        throw error;
    }

    const calibrationResults: CalibrationResultExtended[] = [];
    const testConfigurations: CalibrationConfig[] = [
        // Standard configurations with preprocessing variations
        { name: 'Standard Sauvola', psm: '6', sauvolaK: 0.2, sauvolaWindow: 15, blurRadius: 0.5, invert: false },
        { name: 'Aggressive Sauvola', psm: '6', sauvolaK: 0.1, sauvolaWindow: 25, blurRadius: 0.5, invert: false },
        { name: 'Conservative Sauvola', psm: '6', sauvolaK: 0.3, sauvolaWindow: 10, blurRadius: 0.3, invert: false },
        { name: 'Single line optimized', psm: '7', sauvolaK: 0.2, sauvolaWindow: 15, blurRadius: 0.2, invert: false },
        { name: 'Single word focused', psm: '8', sauvolaK: 0.15, sauvolaWindow: 20, blurRadius: 0.4, invert: false },
        // Optimized for white text on dark backgrounds
        { name: 'Dark Background + Invert', psm: '6', sauvolaK: 0.1, sauvolaWindow: 20, blurRadius: 0.3, invert: true },
        { name: 'White Text Single Line', psm: '7', sauvolaK: 0.15, sauvolaWindow: 15, blurRadius: 0.2, invert: true },
        { name: 'White Text Sparse', psm: '11', sauvolaK: 0.1, sauvolaWindow: 25, blurRadius: 0.3, invert: true },
        { name: 'High Contrast Gaming', psm: '6', sauvolaK: 0.05, sauvolaWindow: 30, blurRadius: 0.4, invert: true }
    ];

    try {
        console.log(`📊 Testing ${testConfigurations.length} different configurations...`);

        for (let i = 0; i < testConfigurations.length; i++) {
            const config = testConfigurations[i]!;
            console.log(`🔧 Testing configuration ${i + 1}/${testConfigurations.length}: ${config.name}`);

            const startTime = Date.now();

            // Temporarily update OCR parameters on ALL workers in scheduler
            const parameters = {
                tessedit_pageseg_mode: config.psm,
                preserve_interword_spaces: '1',
                tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
                tessedit_do_invert: config.invert ? '1' : '0',
                classify_enable_adaptive_matcher: '1'
            };

            // Update all workers in the scheduler
            if (AppState.ocrScheduler && AppState.ocrScheduler.workers) {
                for (const worker of AppState.ocrScheduler.workers) {
                    await worker.setParameters(parameters);
                }
                console.log(`🔧 Updated ${AppState.ocrScheduler.workers.length} workers with config: ${config.name}`);
            } else if (AppState.ocrWorker) {
                // Fallback for single worker mode
                await AppState.ocrWorker.setParameters(parameters);
                console.log(`🔧 Updated single worker with config: ${config.name}`);
            }

            // Process current frame with this configuration
            const result = await testConfiguration(config);
            const processingTime = Date.now() - startTime;

            calibrationResults.push({
                ...config,
                result: result.text,
                confidence: result.confidence,
                processingTime,
                score: calculateCalibrationScore(result.text, result.confidence, processingTime)
            });

            console.log(`   📝 Result: "${result.text.substring(0, 50)}..." (${Math.round(result.confidence)}%, ${processingTime}ms)`);

            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Find best configuration
        const bestConfig = calibrationResults.reduce((best, current) =>
            current.score > best.score ? current : best
        );

        console.log('🏆 Auto-calibration complete! Best configuration:');
        console.log(`   Name: ${bestConfig.name}`);
        console.log(`   PSM: ${bestConfig.psm}`);
        console.log(`   Score: ${bestConfig.score.toFixed(2)}`);
        console.log(`   Confidence: ${Math.round(bestConfig.confidence)}%`);
        console.log(`   Processing time: ${bestConfig.processingTime}ms`);

        // Apply best configuration to ALL workers in scheduler
        const bestParameters = {
            tessedit_pageseg_mode: bestConfig.psm,
            preserve_interword_spaces: '1',
            tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
            tessedit_do_invert: '0',
            classify_enable_adaptive_matcher: '1'
        };

        if (AppState.ocrScheduler && AppState.ocrScheduler.workers) {
            // Apply to all workers in scheduler
            for (const worker of AppState.ocrScheduler.workers) {
                await worker.setParameters(bestParameters);
            }
            console.log(`✅ Applied optimal config to ${AppState.ocrScheduler.workers.length} workers: ${bestConfig.name}`);
        } else if (AppState.ocrWorker) {
            // Fallback for single worker
            await AppState.ocrWorker.setParameters(bestParameters);
            console.log(`✅ Applied optimal config to single worker: ${bestConfig.name}`);
        }

        // CRITICAL: Store optimal preprocessing config in AppState for main processing
        (AppState as any).optimalPreprocessingConfig = {
            sauvolaK: bestConfig.sauvolaK,
            sauvolaWindow: bestConfig.sauvolaWindow,
            blurRadius: bestConfig.blurRadius,
            enableMorphology: bestConfig.enableMorphology !== false,
            enableContrast: bestConfig.enableContrast !== false
        };

        console.log('🎯 Stored optimal preprocessing config:', (AppState as any).optimalPreprocessingConfig);

        // Update UI settings to reflect optimal values
        if (bestConfig.threshold && bestConfig.threshold !== 'adaptive') {
            const thresholdSlider = document.getElementById('threshold-slider-modal') as HTMLInputElement | null;
            if (thresholdSlider) {
                thresholdSlider.value = bestConfig.threshold;
                const thresholdValue = document.getElementById('threshold-value-modal');
                if (thresholdValue) thresholdValue.textContent = bestConfig.threshold;
            }
        }

        updateStatus(`Auto-calibrated: ${bestConfig.name}`, 'bg-green-400');

        // Store calibration results for future use
        localStorage.setItem('ocrCalibrationResults', JSON.stringify({
            timestamp: Date.now(),
            bestConfig: bestConfig,
            allResults: calibrationResults
        }));

        // Show success message with audio feedback
        const { playRecognitionSound } = await import('./speech.js');
        playRecognitionSound();

        return bestConfig;

    } catch (error) {
        console.error('❌ Auto-calibration failed:', error);
        updateStatus('Auto-calibration failed', 'bg-red-400');

        // Restore default settings to all workers
        const defaultParameters = {
            tessedit_pageseg_mode: '6',
            preserve_interword_spaces: '1',
            tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
            tessedit_do_invert: '0',
            classify_enable_adaptive_matcher: '1'
        };

        if (AppState.ocrScheduler && AppState.ocrScheduler.workers) {
            for (const worker of AppState.ocrScheduler.workers) {
                await worker.setParameters(defaultParameters);
            }
            console.log('🔄 Restored default settings to all workers');
        } else if (AppState.ocrWorker) {
            await AppState.ocrWorker.setParameters(defaultParameters);
            console.log('🔄 Restored default settings to single worker');
        }

        // Clear optimal config
        (AppState as any).optimalPreprocessingConfig = null;

        throw error;
    }
}

// Test a specific OCR configuration using ACTUAL preprocessing pipeline
async function testConfiguration(config: CalibrationConfig): Promise<{ text: string; confidence: number }> {
    const video = document.getElementById('camera-feed') as HTMLVideoElement | null;
    if (!video) {
        throw new Error('Camera feed not found for calibration');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Video not ready for calibration');
    }

    ctx.drawImage(video, 0, 0);

    // Apply current crop area (same as main processing)
    const cropX = AppState.currentCrop.x * canvas.width;
    const cropY = AppState.currentCrop.y * canvas.height;
    const cropWidth = AppState.currentCrop.width * canvas.width;
    const cropHeight = AppState.currentCrop.height * canvas.height;

    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) throw new Error('Could not get crop canvas context');

    cropCanvas.width = Math.max(cropWidth, 50);
    cropCanvas.height = Math.max(cropHeight, 50);

    cropCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropCanvas.width, cropCanvas.height);

    // Apply scaling optimization (same as main processing)
    if (cropCanvas.height > 0 && cropCanvas.height !== CONFIG.OCR_TARGET_HEIGHT) {
        const aspectRatio = cropCanvas.width / cropCanvas.height;
        const scaledWidth = CONFIG.OCR_TARGET_HEIGHT * aspectRatio;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error('Could not get temp canvas context');

        tempCanvas.width = scaledWidth;
        tempCanvas.height = CONFIG.OCR_TARGET_HEIGHT;

        tempCtx.drawImage(cropCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

        cropCanvas.width = tempCanvas.width;
        cropCanvas.height = tempCanvas.height;
        cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        cropCtx.drawImage(tempCanvas, 0, 0);
    }

    // Use ACTUAL preprocessing pipeline with worker
    let processedCanvas: HTMLCanvasElement;
    try {
        const preprocessingConfig: PreprocessingConfig = {
            sauvolaK: config.sauvolaK || 0.2,
            sauvolaWindow: config.sauvolaWindow || 15,
            blurRadius: config.blurRadius || 0.5,
            enableMorphology: config.enableMorphology !== false,
            enableContrast: config.enableContrast !== false
        };

        console.log(`   🎨 Using preprocessing config:`, preprocessingConfig);
        processedCanvas = await processImageInWorker(cropCanvas, preprocessingConfig);
    } catch (error) {
        console.warn(`   ⚠️ Worker preprocessing failed, using fallback:`, error);
        processedCanvas = await advancedImagePreprocessingFallback(cropCanvas);
    }

    // FIXED: Check if scheduler is initialized before using
    if (!AppState.ocrScheduler) {
        throw new Error('OCR scheduler not initialized');
    }

    // Run OCR with current configuration using scheduler
    const result = await AppState.ocrScheduler.addJob('recognize', processedCanvas);

    return {
        text: result.data.text.trim(),
        confidence: result.data.confidence
    };
}

// Calculate calibration score based on multiple factors
function calculateCalibrationScore(text: string, confidence: number, processingTime: number): number {
    let score = 0;

    // Confidence score (0-100 points)
    score += confidence;

    // Text quality score (bonus points for meaningful text)
    if (text && text.length > 0) {
        // Bonus for alphanumeric characters
        const alphanumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
        score += alphanumericRatio * 20;

        // Bonus for reasonable length (not too short, not too long)
        if (text.length >= 3 && text.length <= 100) {
            score += 10;
        }

        // Bonus for common English patterns
        if (/\b(the|and|that|this|with|for|are|was)\b/i.test(text)) {
            score += 5;
        }
    }

    // Speed bonus (faster processing gets bonus points)
    const speedBonus = Math.max(0, 10 - (processingTime / 200));
    score += speedBonus;

    // Penalty for very slow processing (over 3 seconds)
    if (processingTime > 3000) {
        score -= 20;
    }

    return Math.max(0, score); // Ensure non-negative score
}

// Calculate text quality score for confidence estimation
function calculateTextQuality(text: string): number {
    if (!text || text.length === 0) return 0;

    let score = 60; // Base score

    // Length scoring
    if (text.length >= 3 && text.length <= 100) {
        score += 15; // Good length
    } else if (text.length > 100) {
        score -= 10; // Too long, possibly noise
    } else {
        score -= 20; // Too short
    }

    // Alphanumeric ratio
    const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const alphanumericRatio = alphanumericCount / text.length;
    score += alphanumericRatio * 20;

    // Common English patterns
    if (/\b(the|and|that|this|with|for|are|was|you|not|but|can|had|her|any|our|out|day)\b/i.test(text)) {
        score += 10;
    }

    // Penalty for excessive punctuation or symbols
    const symbolCount = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const symbolRatio = symbolCount / text.length;
    if (symbolRatio > 0.3) {
        score -= 15;
    }

    // Penalty for repetitive characters
    const uniqueChars = new Set(text.toLowerCase()).size;
    const diversityRatio = uniqueChars / text.length;
    if (diversityRatio < 0.3) {
        score -= 10;
    }

    return Math.max(10, Math.min(95, score));
}

// Calculate detection quality score based on bounding box geometry
function calculateDetectionQuality(points: number[][][]): number {
    if (!points || points.length === 0) return 0;

    let totalScore = 0;
    let validBoxes = 0;

    for (const point of points) {
        if (!point || point.length < 4) continue;

        let boxScore = 70; // Base score for detected box

        // Calculate bounding box area and aspect ratio
        const [topLeft, topRight, bottomRight, bottomLeft] = point as [number[], number[], number[], number[]];
        const width = Math.abs(topRight[0]! - topLeft[0]!);
        const height = Math.abs(bottomLeft[1]! - topLeft[1]!);
        const area = width * height;

        // Reasonable size check
        if (area > 100 && area < 50000) {
            boxScore += 15;
        } else {
            boxScore -= 10;
        }

        // Aspect ratio check (text usually has reasonable width/height ratio)
        const aspectRatio = width / height;
        if (aspectRatio > 0.5 && aspectRatio < 20) {
            boxScore += 10;
        } else {
            boxScore -= 5;
        }

        // Rectangle regularity check (corners should form approximate rectangle)
        const regularity = calculateRectangleRegularity(point as [number[], number[], number[], number[]]);
        boxScore += regularity * 10;

        totalScore += Math.max(10, Math.min(95, boxScore));
        validBoxes++;
    }

    return validBoxes > 0 ? Math.round(totalScore / validBoxes) : 0;
}

// Calculate how regular/rectangular a set of 4 points is
function calculateRectangleRegularity(points: [number[], number[], number[], number[]]): number {
    const [tl, tr, br, bl] = points;

    // Calculate side lengths
    const topLength = Math.sqrt(Math.pow(tr[0]! - tl[0]!, 2) + Math.pow(tr[1]! - tl[1]!, 2));
    const rightLength = Math.sqrt(Math.pow(br[0]! - tr[0]!, 2) + Math.pow(br[1]! - tr[1]!, 2));
    const bottomLength = Math.sqrt(Math.pow(bl[0]! - br[0]!, 2) + Math.pow(bl[1]! - br[1]!, 2));
    const leftLength = Math.sqrt(Math.pow(tl[0]! - bl[0]!, 2) + Math.pow(tl[1]! - bl[1]!, 2));

    // Check if opposite sides are approximately equal
    const horizontalRatio = Math.min(topLength, bottomLength) / Math.max(topLength, bottomLength);
    const verticalRatio = Math.min(leftLength, rightLength) / Math.max(leftLength, rightLength);

    // Average regularity score (1.0 = perfect rectangle, 0 = very irregular)
    return (horizontalRatio + verticalRatio) / 2;
}

// Cleanup preprocessing worker
export function cleanupPreprocessingWorker(): void {
    if (preprocessingWorker) {
        preprocessingWorker.terminate();
        preprocessingWorker = null;
        console.log('🎨 Preprocessing worker terminated');
    }

    if (AppState.preprocessingJobs) {
        AppState.preprocessingJobs.clear();
    }
}

// Show user-friendly notification about PaddleOCR fallback
function showPaddleOCRFallbackNotification(errorCategory: string): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 gaming-panel p-4 rounded-xl z-40 max-w-xs';
    notification.innerHTML = `
        <div class="space-y-2">
            <div class="flex items-center gap-2">
                <span class="text-gaming-yellow">⚠️</span>
                <span class="font-medium text-white">PaddleOCR Unavailable</span>
            </div>
            <p class="text-xs text-dark-300">Using Tesseract.js as fallback OCR engine</p>
            <p class="text-xs text-gaming-cyan">Issue: ${errorCategory}</p>
            <div class="flex gap-2 mt-3">
                <button onclick="retryPaddleOCR()" class="text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded">
                    🔄 Retry
                </button>
                <button onclick="this.closest('.fixed').remove()" class="text-xs bg-dark-600 hover:bg-dark-500 px-3 py-1 rounded">
                    Dismiss
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        notification.remove();
    }, 10000);
}

// Retry PaddleOCR loading (exposed globally)
async function retryPaddleOCR(): Promise<void> {
    console.log('🔄 Retrying PaddleOCR loading...');

    // Reset PaddleOCR state
    AppState.paddleOCRLoaded = false;
    AppState.paddleOCRInstance = null;

    // Remove existing notification
    document.querySelectorAll('.fixed.top-20').forEach(el => el.remove());

    // Attempt to load PaddleOCR again
    try {
        await loadPaddleOCR();
        console.log('✅ PaddleOCR retry successful');
    } catch (error) {
        console.error('❌ PaddleOCR retry failed:', error);
    }
}

// Make retryPaddleOCR globally accessible
(window as any).retryPaddleOCR = retryPaddleOCR;

// Read text from current frame immediately
export async function readNow(): Promise<void> {
    if (!AppState.stream || (!AppState.ocrWorker && !AppState.ocrScheduler)) {
        console.warn('⚠️ OCR system not ready');
        updateStatus('OCR system not ready', 'bg-red-400');
        return;
    }
    await processFrame();
}

// =================== ENHANCED PREPROCESSING FUNCTIONS ===================

// Image statistics interface
interface ImageStats {
    avgBrightness: number;
    contrast: number;
    isDarkBackground: boolean;
    darkRatio: number;
    brightRatio: number;
}

// Analyze image characteristics to optimize preprocessing
function analyzeImageCharacteristics(data: Uint8ClampedArray): ImageStats {
    let totalBrightness = 0;
    let darkPixels = 0;
    let brightPixels = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
        totalBrightness += brightness;

        if (brightness < 80) darkPixels++;
        if (brightness > 200) brightPixels++;
    }

    const avgBrightness = totalBrightness / pixelCount;
    const darkRatio = darkPixels / pixelCount;
    const brightRatio = brightPixels / pixelCount;

    return {
        avgBrightness: Math.round(avgBrightness),
        contrast: Math.round((brightRatio - darkRatio) * 100),
        isDarkBackground: darkRatio > 0.6 && avgBrightness < 100,
        darkRatio,
        brightRatio
    };
}

// Enhanced contrast for white text on dark backgrounds
function enhanceWhiteTextOnDark(data: Uint8ClampedArray): void {
    // First pass: identify likely text pixels (bright pixels)
    const textThreshold = 120;
    const backgroundThreshold = 80;

    for (let i = 0; i < data.length; i += 4) {
        const brightness = data[i]!;

        if (brightness > textThreshold) {
            // Enhance white text - make it brighter
            const enhanced = Math.min(255, brightness * 1.5);
            data[i] = enhanced;
            data[i + 1] = enhanced;
            data[i + 2] = enhanced;
        } else if (brightness < backgroundThreshold) {
            // Suppress dark background - make it darker
            const suppressed = Math.max(0, brightness * 0.5);
            data[i] = suppressed;
            data[i + 1] = suppressed;
            data[i + 2] = suppressed;
        }
    }
}
