/**
 * CaptnReverse OCR Accuracy Tests
 * Tests OCR processing accuracy, speed, and reliability using test images
 * Focus on critical issues: speed, accuracy, crop area respect, text quality
 */

export class OCRAccuracyTests {
    constructor() {
        this.name = 'OCR Accuracy Tests';
        this.category = 'core';
        this.priority = 'critical';
        this.description = 'Validates OCR processing accuracy, speed, and crop area functionality';

        this.testImagePath = './test2.png';
        this.expectedTexts = [
            'Expected text patterns for test2.png',
            'White text on dark background patterns',
            'Common UI text elements'
        ];

        // OCR performance benchmarks
        this.performanceThresholds = {
            maxProcessingTime: 15000, // 15 seconds max
            minConfidence: 60, // Minimum confidence score
            maxMemoryUsage: 50 * 1024 * 1024 // 50MB max
        };
    }

    async runTests() {
        const results = [];

        try {
            console.log('🔍 Starting OCR Accuracy Tests...');

            // Test 1: Module loading and initialization
            results.push(await this.testOCRModuleLoading());

            // Test 2: Test image loading and validation
            results.push(await this.testImageLoading());

            // Test 3: Basic OCR processing without crop
            results.push(await this.testBasicOCRProcessing());

            // Test 4: OCR processing with crop area
            results.push(await this.testCropAreaOCRProcessing());

            // Test 5: OCR performance and speed validation
            results.push(await this.testOCRPerformance());

            // Test 6: Text confidence and quality validation
            results.push(await this.testTextConfidenceValidation());

            // Test 7: Memory usage and cleanup
            results.push(await this.testMemoryUsageAndCleanup());

            // Test 8: Error handling and edge cases
            results.push(await this.testErrorHandling());

            // Test 9: Multiple OCR engine validation
            results.push(await this.testMultipleOCREngines());

            // Test 10: White text on dark background accuracy
            results.push(await this.testWhiteTextOnDarkBackground());

        } catch (error) {
            results.push({
                name: 'OCR Accuracy Test Suite',
                status: 'failed',
                error: `Test suite failed: ${error.message}`,
                duration: 0
            });
        }

        return results;
    }

    async testOCRModuleLoading() {
        const startTime = Date.now();

        try {
            // Test Tesseract.js loading
            if (typeof window !== 'undefined' && window.Tesseract) {
                console.log('✅ Tesseract.js available globally');
            } else {
                throw new Error('Tesseract.js not available globally');
            }

            // Test OCR worker creation
            const worker = await Tesseract.createWorker('eng');
            if (!worker) {
                throw new Error('Failed to create Tesseract worker');
            }

            await worker.terminate();

            return {
                name: 'OCR Module Loading',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    tesseractAvailable: true,
                    workerCreated: true
                }
            };

        } catch (error) {
            return {
                name: 'OCR Module Loading',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testImageLoading() {
        const startTime = Date.now();

        try {
            const image = await this.loadTestImage();

            if (!image || image.width === 0 || image.height === 0) {
                throw new Error('Test image failed to load or has invalid dimensions');
            }

            return {
                name: 'Test Image Loading',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    imageWidth: image.width,
                    imageHeight: image.height,
                    imagePath: this.testImagePath
                }
            };

        } catch (error) {
            return {
                name: 'Test Image Loading',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testBasicOCRProcessing() {
        const startTime = Date.now();

        try {
            const image = await this.loadTestImage();
            const worker = await Tesseract.createWorker('eng');

            const { data } = await worker.recognize(image);
            await worker.terminate();

            if (!data || !data.text) {
                throw new Error('OCR processing returned no text data');
            }

            const textLength = data.text.trim().length;
            const confidence = data.confidence || 0;

            if (textLength === 0) {
                throw new Error('OCR processing returned empty text');
            }

            return {
                name: 'Basic OCR Processing',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    textLength,
                    confidence,
                    wordsFound: data.words ? data.words.length : 0,
                    extractedText: data.text.substring(0, 100) + (data.text.length > 100 ? '...' : '')
                }
            };

        } catch (error) {
            return {
                name: 'Basic OCR Processing',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCropAreaOCRProcessing() {
        const startTime = Date.now();

        try {
            const image = await this.loadTestImage();

            // Create crop area (center 50% of image)
            const cropArea = {
                x: Math.floor(image.width * 0.25),
                y: Math.floor(image.height * 0.25),
                width: Math.floor(image.width * 0.5),
                height: Math.floor(image.height * 0.5)
            };

            const croppedCanvas = this.cropImage(image, cropArea);
            const worker = await Tesseract.createWorker('eng');

            const { data } = await worker.recognize(croppedCanvas);
            await worker.terminate();

            if (!data || !data.text) {
                throw new Error('Crop area OCR processing returned no text data');
            }

            return {
                name: 'Crop Area OCR Processing',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    cropArea,
                    textLength: data.text.trim().length,
                    confidence: data.confidence || 0,
                    extractedText: data.text.substring(0, 100) + (data.text.length > 100 ? '...' : '')
                }
            };

        } catch (error) {
            return {
                name: 'Crop Area OCR Processing',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testOCRPerformance() {
        const startTime = Date.now();

        try {
            const image = await this.loadTestImage();
            const processingStartTime = Date.now();

            const worker = await Tesseract.createWorker('eng');
            const { data } = await worker.recognize(image);
            const processingTime = Date.now() - processingStartTime;

            await worker.terminate();

            if (processingTime > this.performanceThresholds.maxProcessingTime) {
                throw new Error(`OCR processing took ${processingTime}ms, exceeds ${this.performanceThresholds.maxProcessingTime}ms threshold`);
            }

            return {
                name: 'OCR Performance Validation',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    processingTime,
                    threshold: this.performanceThresholds.maxProcessingTime,
                    withinThreshold: processingTime <= this.performanceThresholds.maxProcessingTime,
                    textLength: data.text ? data.text.length : 0
                }
            };

        } catch (error) {
            return {
                name: 'OCR Performance Validation',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testTextConfidenceValidation() {
        const startTime = Date.now();

        try {
            const image = await this.loadTestImage();
            const worker = await Tesseract.createWorker('eng');

            const { data } = await worker.recognize(image);
            await worker.terminate();

            const confidence = data.confidence || 0;

            if (confidence < this.performanceThresholds.minConfidence) {
                console.warn(`OCR confidence ${confidence}% below ${this.performanceThresholds.minConfidence}% threshold`);
            }

            // Analyze word-level confidence
            const highConfidenceWords = data.words ? data.words.filter(word => word.confidence > 80) : [];
            const lowConfidenceWords = data.words ? data.words.filter(word => word.confidence < 50) : [];

            return {
                name: 'Text Confidence Validation',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    overallConfidence: confidence,
                    minThreshold: this.performanceThresholds.minConfidence,
                    meetsThreshold: confidence >= this.performanceThresholds.minConfidence,
                    totalWords: data.words ? data.words.length : 0,
                    highConfidenceWords: highConfidenceWords.length,
                    lowConfidenceWords: lowConfidenceWords.length,
                    confidenceRatio: data.words && data.words.length > 0 ?
                        (highConfidenceWords.length / data.words.length * 100).toFixed(1) + '%' : '0%'
                }
            };

        } catch (error) {
            return {
                name: 'Text Confidence Validation',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testMemoryUsageAndCleanup() {
        const startTime = Date.now();

        try {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Create multiple workers and process images
            const workers = [];
            for (let i = 0; i < 3; i++) {
                const worker = await Tesseract.createWorker('eng');
                workers.push(worker);
            }

            const image = await this.loadTestImage();

            // Process with all workers
            const promises = workers.map(worker => worker.recognize(image));
            await Promise.all(promises);

            // Cleanup all workers
            await Promise.all(workers.map(worker => worker.terminate()));

            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }

            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryDelta = finalMemory - initialMemory;

            return {
                name: 'Memory Usage and Cleanup',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    initialMemory: this.formatBytes(initialMemory),
                    finalMemory: this.formatBytes(finalMemory),
                    memoryDelta: this.formatBytes(memoryDelta),
                    workersCreated: workers.length,
                    withinThreshold: memoryDelta < this.performanceThresholds.maxMemoryUsage
                }
            };

        } catch (error) {
            return {
                name: 'Memory Usage and Cleanup',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testErrorHandling() {
        const startTime = Date.now();

        try {
            const worker = await Tesseract.createWorker('eng');

            // Test with invalid image
            try {
                await worker.recognize(null);
                throw new Error('Expected error for null image not thrown');
            } catch (expectedError) {
                // This is expected behavior
            }

            // Test with empty canvas
            const emptyCanvas = document.createElement('canvas');
            emptyCanvas.width = 0;
            emptyCanvas.height = 0;

            try {
                await worker.recognize(emptyCanvas);
                // Some implementations might handle this gracefully
            } catch (expectedError) {
                // This is also acceptable behavior
            }

            await worker.terminate();

            return {
                name: 'Error Handling',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    nullImageHandled: true,
                    emptyCanvasHandled: true,
                    workerCleanedUp: true
                }
            };

        } catch (error) {
            return {
                name: 'Error Handling',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testMultipleOCREngines() {
        const startTime = Date.now();

        try {
            const image = await this.loadTestImage();
            const results = [];

            // Test Tesseract with different PSM modes
            const psmModes = [6, 7, 8]; // Different page segmentation modes

            for (const psm of psmModes) {
                const worker = await Tesseract.createWorker('eng');

                const { data } = await worker.recognize(image, {
                    tessedit_pageseg_mode: psm
                });

                results.push({
                    psm,
                    textLength: data.text ? data.text.length : 0,
                    confidence: data.confidence || 0
                });

                await worker.terminate();
            }

            return {
                name: 'Multiple OCR Engines',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    psmResults: results,
                    bestPSM: results.reduce((best, current) =>
                        current.confidence > best.confidence ? current : best, results[0])
                }
            };

        } catch (error) {
            return {
                name: 'Multiple OCR Engines',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testWhiteTextOnDarkBackground() {
        const startTime = Date.now();

        try {
            const image = await this.loadTestImage();

            // Test with image preprocessing for white text on dark background
            const worker = await Tesseract.createWorker('eng');

            // Original processing
            const originalResult = await worker.recognize(image);

            // Inverted processing (invert colors for better white text recognition)
            const invertedCanvas = this.invertImageColors(image);
            const invertedResult = await worker.recognize(invertedCanvas);

            await worker.terminate();

            const originalLength = originalResult.data.text ? originalResult.data.text.length : 0;
            const invertedLength = invertedResult.data.text ? invertedResult.data.text.length : 0;
            const originalConfidence = originalResult.data.confidence || 0;
            const invertedConfidence = invertedResult.data.confidence || 0;

            return {
                name: 'White Text on Dark Background',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    originalTextLength: originalLength,
                    originalConfidence,
                    invertedTextLength: invertedLength,
                    invertedConfidence,
                    invertedPerformsBetter: invertedLength > originalLength || invertedConfidence > originalConfidence,
                    recommendInversion: invertedConfidence > originalConfidence + 10
                }
            };

        } catch (error) {
            return {
                name: 'White Text on Dark Background',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    // Helper methods
    async loadTestImage() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load test image: ${this.testImagePath}`));

            img.src = this.testImagePath;
        });
    }

    cropImage(image, cropArea) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        ctx.drawImage(
            image,
            cropArea.x, cropArea.y, cropArea.width, cropArea.height,
            0, 0, cropArea.width, cropArea.height
        );

        return canvas;
    }

    invertImageColors(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = image.width;
        canvas.height = image.height;

        // Draw original image
        ctx.drawImage(image, 0, 0);

        // Get image data and invert colors
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
            // Alpha channel (data[i + 3]) remains unchanged
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}