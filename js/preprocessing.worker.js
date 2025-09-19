/**
 * Optimized Image Preprocessing Web Worker
 * Performs advanced image preprocessing off the main thread with performance optimizations
 */

// Performance optimization: Reuse typed arrays to avoid GC pressure
let reusableArrays = new Map();

// Get or create reusable typed array
function getReusableArray(size, type = 'Uint8ClampedArray') {
    const key = `${type}_${size}`;
    if (!reusableArrays.has(key)) {
        const ArrayClass = type === 'Float32Array' ? Float32Array : Uint8ClampedArray;
        reusableArrays.set(key, new ArrayClass(size));
    }
    return reusableArrays.get(key);
}

// Advanced image preprocessing pipeline for optimal OCR accuracy
async function advancedImagePreprocessing(imageData, config = {}) {
    console.log('🎨 Worker: Starting optimized image preprocessing...');
    const startTime = performance.now();

    const {
        sauvolaK = 0.2,
        sauvolaWindow = 15,
        blurRadius = 0.5,
        enableMorphology = true,
        enableContrast = true
    } = config;

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    console.log(`📐 Worker: Processing image: ${width}x${height} pixels`);

    // Step 1: Convert to grayscale with luminance weighting
    console.log('   1️⃣ Worker: Converting to grayscale with luminance weighting...');
    for (let i = 0; i < data.length; i += 4) {
        // Use luminance formula: 0.299*R + 0.587*G + 0.114*B
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    // Step 2: Noise reduction with Gaussian blur
    if (blurRadius > 0) {
        console.log('   2️⃣ Worker: Applying noise reduction...');
        const blurredData = gaussianBlur(data, width, height, blurRadius);
        for (let i = 0; i < data.length; i += 4) {
            data[i] = blurredData[i];
            data[i + 1] = blurredData[i + 1];
            data[i + 2] = blurredData[i + 2];
        }
    }

    // Step 3: Contrast enhancement with histogram stretching
    if (enableContrast) {
        console.log('   3️⃣ Worker: Enhancing contrast...');
        enhanceContrast(data);
    }

    // Step 4: Adaptive thresholding (Sauvola method)
    console.log('   4️⃣ Worker: Applying adaptive thresholding (Sauvola)...');
    sauvolaThreshold(data, width, height, sauvolaWindow, sauvolaK);

    // Step 5: Morphological operations to clean up text
    if (enableMorphology) {
        console.log('   5️⃣ Worker: Applying morphological operations...');
        morphologicalCleanup(data, width, height);
    }

    const processingTime = performance.now() - startTime;
    console.log(`✅ Worker: Image preprocessing completed in ${processingTime.toFixed(2)}ms`);

    return {
        imageData: imageData,
        processingTime: processingTime,
        config: config
    };
}

// Optimized Gaussian blur for noise reduction using reusable arrays
function gaussianBlur(data, width, height, radius) {
    const kernel = generateGaussianKernel(radius);
    const kernelSize = kernel.length;
    const halfKernel = Math.floor(kernelSize / 2);
    const blurredData = getReusableArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, weightSum = 0;

            for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                    const py = Math.min(height - 1, Math.max(0, y + ky));
                    const px = Math.min(width - 1, Math.max(0, x + kx));
                    const pixelIndex = (py * width + px) * 4;
                    const weight = kernel[ky + halfKernel][kx + halfKernel];

                    r += data[pixelIndex] * weight;
                    g += data[pixelIndex + 1] * weight;
                    b += data[pixelIndex + 2] * weight;
                    weightSum += weight;
                }
            }

            const index = (y * width + x) * 4;
            blurredData[index] = r / weightSum;
            blurredData[index + 1] = g / weightSum;
            blurredData[index + 2] = b / weightSum;
            blurredData[index + 3] = data[index + 3];
        }
    }

    return blurredData;
}

// Generate Gaussian kernel
function generateGaussianKernel(radius) {
    const size = Math.ceil(radius * 6) | 1; // Ensure odd size
    const kernel = [];
    const sigma = radius;
    const sigma2 = 2 * sigma * sigma;
    const center = Math.floor(size / 2);

    for (let y = 0; y < size; y++) {
        kernel[y] = [];
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;
            kernel[y][x] = Math.exp(-(dx * dx + dy * dy) / sigma2) / (Math.PI * sigma2);
        }
    }

    return kernel;
}

// Contrast enhancement using histogram stretching
function enhanceContrast(data) {
    let min = 255, max = 0;

    // Find min and max values
    for (let i = 0; i < data.length; i += 4) {
        min = Math.min(min, data[i]);
        max = Math.max(max, data[i]);
    }

    // Avoid division by zero
    if (max === min) return;

    const range = max - min;

    // Stretch histogram
    for (let i = 0; i < data.length; i += 4) {
        const stretched = Math.round(((data[i] - min) / range) * 255);
        data[i] = stretched;
        data[i + 1] = stretched;
        data[i + 2] = stretched;
    }
}

// Sauvola adaptive thresholding
function sauvolaThreshold(data, width, height, windowSize, k) {
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
                    const value = data[pixelIndex];

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
            const value = data[index] > threshold[y * width + x] ? 255 : 0;
            data[index] = value;
            data[index + 1] = value;
            data[index + 2] = value;
        }
    }
}

// Morphological operations to clean up binary text
function morphologicalCleanup(data, width, height) {
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
        data[i] = eroded[i];
        data[i + 1] = eroded[i + 1];
        data[i + 2] = eroded[i + 2];
    }
}

// Optimized morphological dilation using reusable arrays
function dilate(data, width, height, kernel) {
    const result = getReusableArray(data.length);
    const kh = kernel.length;
    const kw = kernel[0].length;
    const kcy = Math.floor(kh / 2);
    const kcx = Math.floor(kw / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let maxVal = 0;

            for (let ky = 0; ky < kh; ky++) {
                for (let kx = 0; kx < kw; kx++) {
                    if (kernel[ky][kx] === 0) continue;

                    const py = y + ky - kcy;
                    const px = x + kx - kcx;

                    if (py >= 0 && py < height && px >= 0 && px < width) {
                        const pixelIndex = (py * width + px) * 4;
                        maxVal = Math.max(maxVal, data[pixelIndex]);
                    }
                }
            }

            const index = (y * width + x) * 4;
            result[index] = maxVal;
            result[index + 1] = maxVal;
            result[index + 2] = maxVal;
            result[index + 3] = data[index + 3];
        }
    }

    return result;
}

// Optimized morphological erosion using reusable arrays
function erode(data, width, height, kernel) {
    const result = getReusableArray(data.length);
    const kh = kernel.length;
    const kw = kernel[0].length;
    const kcy = Math.floor(kh / 2);
    const kcx = Math.floor(kw / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let minVal = 255;

            for (let ky = 0; ky < kh; ky++) {
                for (let kx = 0; kx < kw; kx++) {
                    if (kernel[ky][kx] === 0) continue;

                    const py = y + ky - kcy;
                    const px = x + kx - kcx;

                    if (py >= 0 && py < height && px >= 0 && px < width) {
                        const pixelIndex = (py * width + px) * 4;
                        minVal = Math.min(minVal, data[pixelIndex]);
                    }
                }
            }

            const index = (y * width + x) * 4;
            result[index] = minVal;
            result[index + 1] = minVal;
            result[index + 2] = minVal;
            result[index + 3] = data[index + 3];
        }
    }

    return result;
}

// Web Worker message handler
self.onmessage = async function(e) {
    const { type, imageData, config, jobId } = e.data;

    try {
        switch (type) {
            case 'preprocess':
                console.log('🎨 Worker: Received preprocessing job:', jobId);
                const result = await advancedImagePreprocessing(imageData, config);

                // Send result back to main thread
                self.postMessage({
                    type: 'preprocessingComplete',
                    jobId: jobId,
                    result: result,
                    success: true
                });
                break;

            case 'benchmark':
                console.log('🏁 Worker: Running preprocessing benchmark...');
                const benchmarkResults = [];

                for (let i = 0; i < 5; i++) {
                    const benchStart = performance.now();
                    await advancedImagePreprocessing(imageData, config);
                    const benchTime = performance.now() - benchStart;
                    benchmarkResults.push(benchTime);
                }

                const avgTime = benchmarkResults.reduce((a, b) => a + b, 0) / benchmarkResults.length;

                self.postMessage({
                    type: 'benchmarkComplete',
                    jobId: jobId,
                    results: {
                        times: benchmarkResults,
                        average: avgTime,
                        config: config
                    },
                    success: true
                });
                break;

            default:
                throw new Error(`Unknown worker message type: ${type}`);
        }
    } catch (error) {
        console.error('❌ Worker: Processing error:', error);

        self.postMessage({
            type: 'preprocessingError',
            jobId: jobId,
            error: error.message,
            success: false
        });
    }
};

// Worker ready signal
console.log('🎨 Image Preprocessing Worker ready for gaming OCR optimization!');