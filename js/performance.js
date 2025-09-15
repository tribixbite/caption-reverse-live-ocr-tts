/**
 * Performance Monitoring Module
 * Tracks OCR processing times, memory usage, and accuracy metrics
 */

import { AppState } from './config.js';
import { updateStatus } from './ui.js';

// Performance metrics storage
const performanceData = {
    ocrProcessingTimes: [],
    preprocessingTimes: [],
    memoryUsage: [],
    accuracyScores: [],
    totalProcessingTime: 0,
    processedFrames: 0,
    successfulRecognitions: 0,
    averageConfidence: 0,
    startTime: Date.now()
};

// Performance monitoring configuration
const PERFORMANCE_CONFIG = {
    maxDataPoints: 100, // Keep last 100 measurements
    memoryCheckInterval: 5000, // Check memory every 5 seconds
    performanceReportInterval: 30000 // Generate report every 30 seconds
};

let performanceInterval = null;
let memoryInterval = null;

// Initialize performance monitoring
export function initPerformanceMonitoring() {
    console.log('📊 Initializing performance monitoring...');

    // Reset performance data
    performanceData.startTime = Date.now();
    performanceData.processedFrames = 0;
    performanceData.successfulRecognitions = 0;

    // Start memory monitoring
    startMemoryMonitoring();

    // Start periodic performance reporting
    startPerformanceReporting();

    console.log('✅ Performance monitoring initialized');
}

// Record OCR processing performance
export function recordOCRPerformance(processingTime, preprocessingTime, confidence, success) {
    // Record timing data
    addDataPoint(performanceData.ocrProcessingTimes, processingTime);
    if (preprocessingTime) {
        addDataPoint(performanceData.preprocessingTimes, preprocessingTime);
    }

    // Update counters
    performanceData.processedFrames++;
    performanceData.totalProcessingTime += processingTime;

    if (success) {
        performanceData.successfulRecognitions++;
        addDataPoint(performanceData.accuracyScores, confidence);

        // Update average confidence
        const validScores = performanceData.accuracyScores.filter(score => score > 0);
        performanceData.averageConfidence = validScores.length > 0
            ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
            : 0;
    }

    console.log(`⚡ Performance: ${processingTime}ms OCR, ${confidence?.toFixed(1) || 'N/A'}% confidence`);
}

// Add data point with size limit
function addDataPoint(array, value) {
    array.push(value);
    if (array.length > PERFORMANCE_CONFIG.maxDataPoints) {
        array.shift(); // Remove oldest data point
    }
}

// Start memory usage monitoring
function startMemoryMonitoring() {
    if (memoryInterval) clearInterval(memoryInterval);

    memoryInterval = setInterval(() => {
        if ('memory' in performance) {
            const memoryInfo = performance.memory;
            const memoryUsageMB = memoryInfo.usedJSHeapSize / 1024 / 1024;

            addDataPoint(performanceData.memoryUsage, memoryUsageMB);

            // Check for memory leaks (significant increase in memory usage)
            if (performanceData.memoryUsage.length > 10) {
                const recent = performanceData.memoryUsage.slice(-5).reduce((a, b) => a + b, 0) / 5;
                const older = performanceData.memoryUsage.slice(-15, -10).reduce((a, b) => a + b, 0) / 5;

                if (recent > older * 1.5) { // 50% increase
                    console.warn('⚠️ Potential memory leak detected!');
                    console.warn(`Recent average: ${recent.toFixed(1)}MB, Previous: ${older.toFixed(1)}MB`);
                }
            }
        }
    }, PERFORMANCE_CONFIG.memoryCheckInterval);
}

// Start periodic performance reporting
function startPerformanceReporting() {
    if (performanceInterval) clearInterval(performanceInterval);

    performanceInterval = setInterval(() => {
        generatePerformanceReport();
    }, PERFORMANCE_CONFIG.performanceReportInterval);
}

// Generate comprehensive performance report
export function generatePerformanceReport() {
    const uptime = Date.now() - performanceData.startTime;
    const uptimeMinutes = uptime / 60000;

    const report = {
        uptime: `${uptimeMinutes.toFixed(1)} minutes`,
        processedFrames: performanceData.processedFrames,
        successfulRecognitions: performanceData.successfulRecognitions,
        successRate: performanceData.processedFrames > 0
            ? (performanceData.successfulRecognitions / performanceData.processedFrames * 100).toFixed(1) + '%'
            : '0%',

        // Timing metrics
        averageOCRTime: calculateAverage(performanceData.ocrProcessingTimes).toFixed(0) + 'ms',
        averagePreprocessingTime: calculateAverage(performanceData.preprocessingTimes).toFixed(0) + 'ms',
        totalProcessingTime: (performanceData.totalProcessingTime / 1000).toFixed(1) + 's',

        // Quality metrics
        averageConfidence: performanceData.averageConfidence.toFixed(1) + '%',

        // Memory metrics
        currentMemoryUsage: getLatestMemoryUsage().toFixed(1) + 'MB',
        averageMemoryUsage: calculateAverage(performanceData.memoryUsage).toFixed(1) + 'MB',

        // Performance indicators
        framesPerMinute: uptimeMinutes > 0 ? (performanceData.processedFrames / uptimeMinutes).toFixed(1) : '0',
        performance: getPerformanceLevel()
    };

    console.log('📊 Performance Report:', report);

    // Update status bar with key metrics
    const statusText = `${report.successRate} success, ${report.averageOCRTime} avg, ${report.currentMemoryUsage}`;
    updateStatus(statusText, getPerformanceStatusClass());

    // Store report in localStorage for debugging
    localStorage.setItem('performanceReport', JSON.stringify({
        timestamp: Date.now(),
        report,
        rawData: performanceData
    }));

    return report;
}

// Calculate average of array values
function calculateAverage(array) {
    if (array.length === 0) return 0;
    return array.reduce((sum, value) => sum + value, 0) / array.length;
}

// Get latest memory usage
function getLatestMemoryUsage() {
    if (performanceData.memoryUsage.length === 0) return 0;
    return performanceData.memoryUsage[performanceData.memoryUsage.length - 1];
}

// Determine overall performance level
function getPerformanceLevel() {
    const avgTime = calculateAverage(performanceData.ocrProcessingTimes);
    const avgConfidence = performanceData.averageConfidence;
    const memoryUsage = getLatestMemoryUsage();

    if (avgTime < 1000 && avgConfidence > 85 && memoryUsage < 100) {
        return 'Excellent';
    } else if (avgTime < 2000 && avgConfidence > 70 && memoryUsage < 150) {
        return 'Good';
    } else if (avgTime < 3000 && avgConfidence > 50 && memoryUsage < 200) {
        return 'Fair';
    } else {
        return 'Poor';
    }
}

// Get status class for performance level
function getPerformanceStatusClass() {
    const level = getPerformanceLevel();
    switch (level) {
        case 'Excellent': return 'bg-green-400';
        case 'Good': return 'bg-blue-400';
        case 'Fair': return 'bg-yellow-400';
        case 'Poor': return 'bg-red-400';
        default: return 'bg-gray-400';
    }
}

// Get real-time performance metrics
export function getPerformanceMetrics() {
    return {
        averageOCRTime: calculateAverage(performanceData.ocrProcessingTimes),
        averagePreprocessingTime: calculateAverage(performanceData.preprocessingTimes),
        averageConfidence: performanceData.averageConfidence,
        memoryUsage: getLatestMemoryUsage(),
        successRate: performanceData.processedFrames > 0
            ? (performanceData.successfulRecognitions / performanceData.processedFrames * 100)
            : 0,
        processedFrames: performanceData.processedFrames,
        performanceLevel: getPerformanceLevel()
    };
}

// Export performance data for debugging
export function exportPerformanceData() {
    return {
        timestamp: Date.now(),
        config: PERFORMANCE_CONFIG,
        data: { ...performanceData },
        metrics: getPerformanceMetrics(),
        report: generatePerformanceReport()
    };
}

// Reset performance monitoring
export function resetPerformanceMonitoring() {
    console.log('🔄 Resetting performance monitoring...');

    // Clear data arrays
    performanceData.ocrProcessingTimes.length = 0;
    performanceData.preprocessingTimes.length = 0;
    performanceData.memoryUsage.length = 0;
    performanceData.accuracyScores.length = 0;

    // Reset counters
    performanceData.totalProcessingTime = 0;
    performanceData.processedFrames = 0;
    performanceData.successfulRecognitions = 0;
    performanceData.averageConfidence = 0;
    performanceData.startTime = Date.now();

    console.log('✅ Performance monitoring reset');
}

// Stop performance monitoring
export function stopPerformanceMonitoring() {
    console.log('🛑 Stopping performance monitoring...');

    if (performanceInterval) {
        clearInterval(performanceInterval);
        performanceInterval = null;
    }

    if (memoryInterval) {
        clearInterval(memoryInterval);
        memoryInterval = null;
    }

    console.log('✅ Performance monitoring stopped');
}

// Benchmark OCR processing with test image
export async function benchmarkOCRPerformance(testImagePath, iterations = 5) {
    console.log(`🏁 Starting OCR performance benchmark with ${iterations} iterations...`);

    const results = [];

    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const imageLoadPromise = new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        img.src = testImagePath;
        await imageLoadPromise;

        // Create canvas for testing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Run benchmark iterations
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();

            // Simulate OCR processing (replace with actual OCR call if needed)
            const worker = await Tesseract.createWorker('eng');
            const result = await worker.recognize(canvas);
            await worker.terminate();

            const processingTime = performance.now() - startTime;

            results.push({
                iteration: i + 1,
                processingTime,
                confidence: result.data.confidence,
                textLength: result.data.text.length,
                text: result.data.text.substring(0, 50) + '...'
            });

            console.log(`   Iteration ${i + 1}: ${processingTime.toFixed(0)}ms, ${result.data.confidence.toFixed(1)}% confidence`);
        }

        // Calculate benchmark statistics
        const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
        const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
        const minTime = Math.min(...results.map(r => r.processingTime));
        const maxTime = Math.max(...results.map(r => r.processingTime));

        const benchmark = {
            iterations,
            averageTime: avgTime.toFixed(0) + 'ms',
            averageConfidence: avgConfidence.toFixed(1) + '%',
            minTime: minTime.toFixed(0) + 'ms',
            maxTime: maxTime.toFixed(0) + 'ms',
            results
        };

        console.log('🏆 Benchmark Results:', benchmark);

        // Store benchmark results
        localStorage.setItem('ocrBenchmark', JSON.stringify({
            timestamp: Date.now(),
            testImage: testImagePath,
            benchmark
        }));

        return benchmark;

    } catch (error) {
        console.error('❌ Benchmark failed:', error);
        throw error;
    }
}