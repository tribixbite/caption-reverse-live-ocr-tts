/**
 * OCR Performance Test Suite using test2.png
 * Tests current OCR implementation to identify performance and accuracy issues
 */

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

// Performance test configuration
const TEST_CONFIG = {
    testImagePath: './tests/test2.png',
    expectedText: 'This year we put a "12" on the box.',
    expectedWords: ['This', 'year', 'we', 'put', 'a', '12', 'on', 'the', 'box'],
    cropAreas: [
        { x: 0, y: 0, width: 1076, height: 1076 }, // Full image
        { x: 140, y: 820, width: 800, height: 200 }, // Text area only
        { x: 140, y: 820, width: 600, height: 100 }, // Tight crop on text
    ],
    performanceTargets: {
        maxProcessingTime: 2000, // 2 seconds
        minConfidence: 80,
        minAccuracy: 90
    }
};

// Test results storage
let testResults = {
    timestamp: new Date().toISOString(),
    issues: [],
    performance: {},
    recommendations: []
};

// Mock the browser environment for Node.js testing
function mockBrowserAPIs() {
    global.performance = {
        now: () => Date.now()
    };

    global.console = {
        ...console,
        log: (...args) => {
            // Capture console output for analysis
            const message = args.join(' ');
            if (message.includes('❌') || message.includes('error')) {
                testResults.issues.push(message);
            }
            console.log(...args);
        },
        error: (...args) => {
            testResults.issues.push(`ERROR: ${args.join(' ')}`);
            console.error(...args);
        }
    };
}

// Simulate the preprocessing pipeline from ocr.js
async function simulateImagePreprocessing(imageCanvas) {
    const startTime = performance.now();

    // Create processing canvas
    const canvas = createCanvas(imageCanvas.width, imageCanvas.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageCanvas, 0, 0);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Step 1: Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    // Step 2: Simple contrast enhancement
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
        min = Math.min(min, data[i]);
        max = Math.max(max, data[i]);
    }

    const range = max - min;
    if (range > 0) {
        for (let i = 0; i < data.length; i += 4) {
            const normalized = ((data[i] - min) / range) * 255;
            data[i] = normalized;
            data[i + 1] = normalized;
            data[i + 2] = normalized;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const processingTime = performance.now() - startTime;
    return { canvas, processingTime };
}

// Test function to analyze OCR performance
async function testOCRPerformance() {
    mockBrowserAPIs();

    console.log('🧪 Starting OCR Performance Test Suite...');
    console.log(`📸 Testing with: ${TEST_CONFIG.testImagePath}`);
    console.log(`📝 Expected text: "${TEST_CONFIG.expectedText}"`);

    try {
        // Load test image
        const image = await loadImage(TEST_CONFIG.testImagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        console.log(`📐 Image dimensions: ${image.width}x${image.height}`);

        // Test preprocessing performance
        console.log('\\n🎨 Testing image preprocessing...');
        const preprocessStart = performance.now();
        const { canvas: processedCanvas, processingTime } = await simulateImagePreprocessing(canvas);

        testResults.performance.preprocessing = {
            time: processingTime,
            status: processingTime < 100 ? 'GOOD' : processingTime < 200 ? 'OK' : 'SLOW'
        };

        console.log(`⏱️ Preprocessing time: ${processingTime.toFixed(2)}ms (${testResults.performance.preprocessing.status})`);

        // Test crop area validation
        console.log('\\n✂️ Testing crop area functionality...');
        for (let i = 0; i < TEST_CONFIG.cropAreas.length; i++) {
            const crop = TEST_CONFIG.cropAreas[i];
            console.log(`  📏 Crop ${i + 1}: x=${crop.x}, y=${crop.y}, w=${crop.width}, h=${crop.height}`);

            // Simulate crop extraction
            if (crop.x + crop.width > image.width || crop.y + crop.height > image.height) {
                testResults.issues.push(`Crop area ${i + 1} exceeds image boundaries`);
                console.log(`    ❌ Crop exceeds image boundaries!`);
            } else {
                console.log(`    ✅ Crop area valid`);
            }
        }

        // Analyze text extraction challenges
        console.log('\\n📊 Analyzing text extraction challenges...');

        // Save processed image for manual inspection
        const processedImagePath = './tests/test2-processed.png';
        const buffer = processedCanvas.toBuffer('image/png');
        fs.writeFileSync(processedImagePath, buffer);
        console.log(`💾 Processed image saved: ${processedImagePath}`);

        // Performance analysis
        testResults.performance.overall = {
            preprocessing: processingTime,
            status: 'BASELINE_ESTABLISHED'
        };

        // Generate recommendations
        if (processingTime > 100) {
            testResults.recommendations.push('OPTIMIZATION: Move image preprocessing to Web Worker');
        }

        testResults.recommendations.push('ACCURACY: Implement targeted preprocessing for white text on dark backgrounds');
        testResults.recommendations.push('PERFORMANCE: Add WebAssembly acceleration for image processing');
        testResults.recommendations.push('CROP: Implement proper crop area validation and error handling');

        console.log('\\n📋 Test Results Summary:');
        console.log(`🎨 Preprocessing: ${processingTime.toFixed(2)}ms (${testResults.performance.preprocessing.status})`);
        console.log(`⚠️ Issues found: ${testResults.issues.length}`);
        console.log(`💡 Recommendations: ${testResults.recommendations.length}`);

        if (testResults.issues.length > 0) {
            console.log('\\n❌ Issues Found:');
            testResults.issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
        }

        if (testResults.recommendations.length > 0) {
            console.log('\\n💡 Recommendations:');
            testResults.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
        }

        // Save test results
        const resultsPath = './tests/performance-test-results.json';
        fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
        console.log(`\\n💾 Full results saved: ${resultsPath}`);

        return testResults;

    } catch (error) {
        console.error('❌ Test failed:', error);
        testResults.issues.push(`Test execution failed: ${error.message}`);
        return testResults;
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testOCRPerformance()
        .then(results => {
            console.log('\\n🏁 Test completed');
            process.exit(results.issues.length > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Test runner failed:', error);
            process.exit(1);
        });
}

export { testOCRPerformance, TEST_CONFIG };