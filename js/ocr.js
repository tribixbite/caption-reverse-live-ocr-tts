/**
 * OCR Module - Handles Tesseract.js and PaddleOCR integration
 * Manages text recognition, engine switching, and result processing
 */

import { AppState, reusableCanvases, canvasContexts, CONFIG } from './config.js';
import { updateStatus } from './ui.js';

// Helper function to detect blank, noise, or meaningless OCR results
export function isBlankOrNoise(text) {
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

// Initialize Tesseract OCR worker
export async function initOCR() {
    try {
        console.log('🤖 Initializing OCR worker...');
        AppState.ocrWorker = await Tesseract.createWorker('eng', 1, {
            logger: ({ status, progress }) => {
                if (status === 'recognizing text') {
                    const progressEl = document.getElementById('ocr-progress');
                    if (progressEl) {
                        progressEl.textContent = `${Math.round(progress * 100)}%`;
                    }
                }
            }
        });

        // Optimized OCR parameters based on comprehensive test suite results
        await AppState.ocrWorker.setParameters({
            tessedit_pageseg_mode: '6', // OPTIMAL: Single uniform block - best for general text
            preserve_interword_spaces: '1', // Better word spacing
            tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'', // Improve accuracy by restricting to common characters
            tessedit_do_invert: '0', // Disable auto-invert for better consistency
            classify_enable_adaptive_matcher: '1' // Enable adaptive matching for better accuracy
        });

        console.log('✅ OCR Worker ready');
    } catch (error) {
        console.error('❌ OCR initialization failed:', error);
    }
}

// Switch between OCR engines
export async function switchOCREngine(engine) {
    console.log(`🔄 Switching to ${engine} OCR engine...`);
    AppState.currentOCREngine = engine;
    
    // Update UI
    const tesseractBtn = document.getElementById('ocr-tesseract');
    const paddleBtn = document.getElementById('ocr-paddle');
    const infoDiv = document.getElementById('ocr-engine-info');
    
    if (engine === 'tesseract') {
        tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
        paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
        infoDiv.innerHTML = '<p>Tesseract.js - Fast, lightweight, good for general text</p>';
        
        // Initialize Tesseract if needed
        if (!AppState.ocrWorker) {
            await initOCR();
        }
    } else {
        tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
        paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
        infoDiv.innerHTML = '<p>PaddleOCR - Higher accuracy, larger download, slower processing</p>';
        
        // Load PaddleOCR dynamically
        await loadPaddleOCR();
    }
}

// Load PaddleOCR using ES module dynamic import
export async function loadPaddleOCR() {
    if (AppState.paddleOCRLoaded) {
        console.log('✅ PaddleOCR already loaded.');
        return;
    }
    
    try {
        updateStatus('Loading PaddleOCR...', 'bg-yellow-400 animate-pulse');
        console.log('⏳ Loading PaddleOCR engine via dynamic import...');

        // Dynamically import the ocr module using the corrected import name
        const ocr = await import('@paddle-js-models/ocr');
        console.log('📦 PaddleOCR module loaded:', ocr);
        
        console.log('🤖 Initializing PaddleOCR model... (this may take a moment)');
        // Initialize the model. This will download the necessary model files.
        await ocr.init(); 
        
        AppState.paddleOCRInstance = ocr;
        AppState.paddleOCRLoaded = true;
        
        console.log('✅ PaddleOCR loaded and initialized successfully!');
        updateStatus('PaddleOCR ready', 'bg-green-400');

    } catch (error) {
        console.error('❌ PaddleOCR loading failed:', error);
        console.error('Error details:', error.message);
        
        // Provide more specific error messages
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
            console.error('Network error: Check internet connection or CDN availability');
            updateStatus('PaddleOCR load failed: Network error', 'bg-red-400');
        } else if (error.message.includes('import')) {
            console.error('Import error: Module structure may have changed');
            updateStatus('PaddleOCR load failed: Import error', 'bg-red-400');
        } else {
            console.error('Unknown error loading PaddleOCR');
            updateStatus('PaddleOCR load failed: Unknown error', 'bg-red-400');
        }
        
        // Automatically fallback to Tesseract if loading fails
        console.log('🔄 Automatically falling back to Tesseract.js');
        AppState.currentOCREngine = 'tesseract';
        
        // Update UI to reflect fallback
        setTimeout(() => {
            const tesseractBtn = document.getElementById('ocr-tesseract');
            const paddleBtn = document.getElementById('ocr-paddle');
            const infoDiv = document.getElementById('ocr-engine-info');
            
            if (tesseractBtn && paddleBtn && infoDiv) {
                tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
                paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
                infoDiv.innerHTML = '<p>Tesseract.js - PaddleOCR failed to load, using fallback</p>';
            }
            updateStatus('Using Tesseract.js (PaddleOCR unavailable)', 'bg-blue-400');
        }, 1000);
    }
}

// Process a video frame for OCR
export async function processFrame() {
    try {
        const video = document.getElementById('camera-feed');
        
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

        // *** CRITICAL: Image preprocessing for OCR ***
        const imageData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
        const data = imageData.data;

        // Advanced adaptive thresholding for better OCR accuracy
        const blockSize = 32; // Size of neighborhood to consider
        const C = 5; // Constant subtracted from mean
        
        // First pass: convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        
        // Second pass: adaptive thresholding
        for (let y = 0; y < cropCanvas.height; y++) {
            for (let x = 0; x < cropCanvas.width; x++) {
                let sum = 0;
                let count = 0;
                
                // Calculate local mean for block around (x,y)
                const startY = Math.max(0, y - Math.floor(blockSize / 2));
                const endY = Math.min(cropCanvas.height, y + Math.floor(blockSize / 2));
                const startX = Math.max(0, x - Math.floor(blockSize / 2));
                const endX = Math.min(cropCanvas.width, x + Math.floor(blockSize / 2));
                
                for (let by = startY; by < endY; by++) {
                    for (let bx = startX; bx < endX; bx++) {
                        const pixelIndex = (by * cropCanvas.width + bx) * 4;
                        sum += data[pixelIndex]; // Already grayscale
                        count++;
                    }
                }
                
                const localThreshold = (sum / count) - C;
                const pixelIndex = (y * cropCanvas.width + x) * 4;
                const pixelValue = data[pixelIndex];
                const value = pixelValue > localThreshold ? 255 : 0;
                
                data[pixelIndex] = value;
                data[pixelIndex + 1] = value;
                data[pixelIndex + 2] = value;
            }
        }
        
        // Apply the processed image data back to canvas
        cropCtx.putImageData(imageData, 0, 0);

        // DEBUG: Show processed crop image (if enabled)
        if (AppState.settings.showDebugCanvas) {
            const { renderDebugCanvas } = await import('./debug.js');
            renderDebugCanvas(cropCanvas);
        }

        // Show processing state and play processing sound
        document.getElementById('processing-state').classList.remove('hidden');

        // Play processing start sound
        const { playProcessingSound } = await import('./speech.js');
        playProcessingSound();

        const startTime = Date.now();
        let result;
        
        // Use the selected OCR engine
        if (AppState.currentOCREngine === 'paddle' && AppState.paddleOCRLoaded) {
            console.log('🤖 Using PaddleOCR engine...');
            try {
                // Use correct PaddleOCR API - pass canvas/image directly
                const paddleResult = await AppState.paddleOCRInstance.recognize(cropCanvas);
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
                
                if (paddleResult && paddleResult.points && paddleResult.points.length > 0) {
                    // Estimate confidence based on successful detection
                    avgConfidence = 85; // Default high confidence for successful detection
                } else if (ocrText.length > 0) {
                    avgConfidence = 75; // Lower confidence if no points but text found
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
                result = await AppState.ocrWorker.recognize(cropCanvas);
            }

        } else {
            if (AppState.currentOCREngine === 'paddle' && !AppState.paddleOCRLoaded) {
                console.warn('⚠️ PaddleOCR selected but not loaded. Using Tesseract instead.');
                updateStatus('Using Tesseract (Paddle not ready)', 'bg-blue-400');
            }
            console.log('🤖 Using Tesseract.js engine...');
            result = await AppState.ocrWorker.recognize(cropCanvas);
        }
        
        const processingTime = Date.now() - startTime;

        // Hide processing state
        document.getElementById('processing-state').classList.add('hidden');

        const ocrText = result.data.text.trim();
        const ocrConfidence = result.data.confidence;
        
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
        document.getElementById('processing-state').classList.add('hidden');
        console.error('❌ OCR processing error:', error);
    }
}

// Auto-calibration system - finds optimal OCR settings
export async function runAutoCalibration() {
    console.log('🎯 Starting OCR auto-calibration...');
    updateStatus('Running auto-calibration...', 'bg-purple-400 animate-pulse');

    const calibrationResults = [];
    const testConfigurations = [
        // PSM (Page Segmentation Mode) configurations
        { name: 'Single uniform block', psm: '6', threshold: 150 },
        { name: 'Single text line', psm: '7', threshold: 150 },
        { name: 'Single word', psm: '8', threshold: 150 },
        { name: 'Single character', psm: '10', threshold: 150 },

        // Different threshold values
        { name: 'High contrast', psm: '6', threshold: 200 },
        { name: 'Low contrast', psm: '6', threshold: 100 },
        { name: 'Adaptive threshold', psm: '6', threshold: 'adaptive' }
    ];

    try {
        console.log(`📊 Testing ${testConfigurations.length} different configurations...`);

        for (let i = 0; i < testConfigurations.length; i++) {
            const config = testConfigurations[i];
            console.log(`🔧 Testing configuration ${i + 1}/${testConfigurations.length}: ${config.name}`);

            const startTime = Date.now();

            // Temporarily update OCR parameters
            await AppState.ocrWorker.setParameters({
                tessedit_pageseg_mode: config.psm,
                preserve_interword_spaces: '1',
                tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
                tessedit_do_invert: '0',
                classify_enable_adaptive_matcher: '1'
            });

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
        console.log(`   Threshold: ${bestConfig.threshold}`);
        console.log(`   Score: ${bestConfig.score.toFixed(2)}`);
        console.log(`   Confidence: ${Math.round(bestConfig.confidence)}%`);
        console.log(`   Processing time: ${bestConfig.processingTime}ms`);

        // Apply best configuration
        await AppState.ocrWorker.setParameters({
            tessedit_pageseg_mode: bestConfig.psm,
            preserve_interword_spaces: '1',
            tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
            tessedit_do_invert: '0',
            classify_enable_adaptive_matcher: '1'
        });

        // Update UI settings to reflect optimal values
        if (bestConfig.threshold !== 'adaptive') {
            const thresholdSlider = document.getElementById('threshold-slider-modal');
            if (thresholdSlider) {
                thresholdSlider.value = bestConfig.threshold;
                document.getElementById('threshold-value-modal').textContent = bestConfig.threshold;
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

        // Restore default settings
        await AppState.ocrWorker.setParameters({
            tessedit_pageseg_mode: '6',
            preserve_interword_spaces: '1',
            tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
            tessedit_do_invert: '0',
            classify_enable_adaptive_matcher: '1'
        });

        throw error;
    }
}

// Test a specific OCR configuration
async function testConfiguration(config) {
    const video = document.getElementById('camera-feed');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Video not ready for calibration');
    }

    ctx.drawImage(video, 0, 0);

    // Apply current crop area
    const cropX = AppState.currentCrop.x * canvas.width;
    const cropY = AppState.currentCrop.y * canvas.height;
    const cropWidth = AppState.currentCrop.width * canvas.width;
    const cropHeight = AppState.currentCrop.height * canvas.height;

    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    cropCanvas.width = Math.max(cropWidth, 50);
    cropCanvas.height = Math.max(cropHeight, 50);

    cropCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropCanvas.width, cropCanvas.height);

    // Apply threshold based on configuration
    if (config.threshold !== 'adaptive') {
        const imageData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
        const data = imageData.data;

        // Simple threshold
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const value = avg > config.threshold ? 255 : 0;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }

        cropCtx.putImageData(imageData, 0, 0);
    }

    // Run OCR with current configuration
    const result = await AppState.ocrWorker.recognize(cropCanvas);

    return {
        text: result.data.text.trim(),
        confidence: result.data.confidence
    };
}

// Calculate calibration score based on multiple factors
function calculateCalibrationScore(text, confidence, processingTime) {
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

// Read text from current frame immediately
export async function readNow() {
    if (!AppState.stream || !AppState.ocrWorker) return;
    await processFrame();
}