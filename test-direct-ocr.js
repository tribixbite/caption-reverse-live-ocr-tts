/**
 * Direct OCR Performance Test - Tests OCR without browser dependencies
 * Uses Tesseract.js directly to test OCR accuracy and performance with test2.png
 */

import Tesseract from 'tesseract.js';
import fs from 'fs';

const TEST_CONFIG = {
    testImagePath: './tests/test2.png',
    expectedText: 'This year we put a "12" on the box.',
    expectedWords: ['This', 'year', 'we', 'put', 'a', '12', 'on', 'the', 'box'],
    ocrConfigs: [
        {
            name: 'Default Config',
            config: {
                tessedit_pageseg_mode: '6'
            }
        },
        {
            name: 'Single Line Mode',
            config: {
                tessedit_pageseg_mode: '7'
            }
        },
        {
            name: 'Single Word Mode',
            config: {
                tessedit_pageseg_mode: '8'
            }
        },
        {
            name: 'Gaming Optimized',
            config: {
                tessedit_pageseg_mode: '6',
                preserve_interword_spaces: '1',
                tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
                tessedit_do_invert: '0',
                classify_enable_adaptive_matcher: '1'
            }
        }
    ],
    performanceTargets: {
        maxProcessingTime: 3000, // 3 seconds
        minConfidence: 70,
        minAccuracy: 80
    }
};

// Calculate text similarity
function calculateSimilarity(actual, expected) {
    const actualWords = actual.toLowerCase().split(/\\s+/).filter(w => w.length > 0);
    const expectedWords = expected.toLowerCase().split(/\\s+/).filter(w => w.length > 0);

    let matches = 0;
    for (const word of expectedWords) {
        if (actualWords.includes(word)) {
            matches++;
        }
    }

    return (matches / expectedWords.length) * 100;
}

// Test OCR performance with different configurations
async function testOCRPerformance() {
    console.log('🧪 Starting Direct OCR Performance Test...');
    console.log(`📸 Test image: ${TEST_CONFIG.testImagePath}`);
    console.log(`📝 Expected: "${TEST_CONFIG.expectedText}"`);
    console.log('\\n');

    // Check if test image exists
    if (!fs.existsSync(TEST_CONFIG.testImagePath)) {
        console.error(`❌ Test image not found: ${TEST_CONFIG.testImagePath}`);
        return;
    }

    const testResults = [];

    for (let i = 0; i < TEST_CONFIG.ocrConfigs.length; i++) {
        const config = TEST_CONFIG.ocrConfigs[i];
        console.log(`🔧 Testing configuration ${i + 1}/${TEST_CONFIG.ocrConfigs.length}: ${config.name}`);

        try {
            const startTime = Date.now();

            // Create worker with specific configuration
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        process.stdout.write(`\\r   Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });

            // Set parameters
            await worker.setParameters(config.config);

            // Perform OCR
            const result = await worker.recognize(TEST_CONFIG.testImagePath);
            const processingTime = Date.now() - startTime;

            console.log('\\n');

            // Analyze results
            const detectedText = result.data.text.trim();
            const confidence = result.data.confidence;
            const similarity = calculateSimilarity(detectedText, TEST_CONFIG.expectedText);

            const testResult = {
                configName: config.name,
                processingTime,
                confidence: Math.round(confidence),
                detectedText,
                similarity: Math.round(similarity),
                status: similarity >= TEST_CONFIG.performanceTargets.minAccuracy ? 'PASS' : 'FAIL'
            };

            testResults.push(testResult);

            console.log(`   ⏱️ Processing time: ${processingTime}ms`);
            console.log(`   🎯 Confidence: ${testResult.confidence}%`);
            console.log(`   📝 Detected: "${detectedText}"`);
            console.log(`   📊 Similarity: ${testResult.similarity}%`);
            console.log(`   ${testResult.status === 'PASS' ? '✅' : '❌'} Result: ${testResult.status}`);
            console.log('');

            // Cleanup
            await worker.terminate();

        } catch (error) {
            console.error(`   ❌ Error with ${config.name}:`, error.message);
            testResults.push({
                configName: config.name,
                error: error.message,
                status: 'ERROR'
            });
        }
    }

    // Final analysis
    console.log('\\n📋 PERFORMANCE ANALYSIS');
    console.log('='.repeat(50));

    const successfulTests = testResults.filter(r => r.status === 'PASS');
    const fastestTest = testResults
        .filter(r => r.processingTime)
        .sort((a, b) => a.processingTime - b.processingTime)[0];
    const mostAccurate = testResults
        .filter(r => r.similarity)
        .sort((a, b) => b.similarity - a.similarity)[0];

    console.log(`✅ Successful configs: ${successfulTests.length}/${testResults.length}`);
    if (fastestTest) {
        console.log(`⚡ Fastest: ${fastestTest.configName} (${fastestTest.processingTime}ms)`);
    }
    if (mostAccurate) {
        console.log(`🎯 Most accurate: ${mostAccurate.configName} (${mostAccurate.similarity}%)`);
    }

    // Performance recommendations
    console.log('\\n💡 RECOMMENDATIONS:');
    if (fastestTest && fastestTest.processingTime > TEST_CONFIG.performanceTargets.maxProcessingTime) {
        console.log('   🐌 OCR is slower than target. Consider using Web Workers for preprocessing.');
    }
    if (mostAccurate && mostAccurate.similarity < TEST_CONFIG.performanceTargets.minAccuracy) {
        console.log('   📉 Accuracy below target. Improve image preprocessing pipeline.');
    }
    if (successfulTests.length === 0) {
        console.log('   🚨 All configs failed. Check image quality and preprocessing.');
    }

    // Specific issues found
    const lowConfidenceResults = testResults.filter(r => r.confidence && r.confidence < 70);
    if (lowConfidenceResults.length > 0) {
        console.log('   ⚠️ Low confidence detected. Implement better preprocessing for white text on dark backgrounds.');
    }

    // Save detailed results
    const resultsPath = './tests/direct-ocr-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        expectedText: TEST_CONFIG.expectedText,
        testResults,
        analysis: {
            successRate: (successfulTests.length / testResults.length) * 100,
            averageProcessingTime: testResults
                .filter(r => r.processingTime)
                .reduce((sum, r) => sum + r.processingTime, 0) / testResults.filter(r => r.processingTime).length,
            averageAccuracy: testResults
                .filter(r => r.similarity)
                .reduce((sum, r) => sum + r.similarity, 0) / testResults.filter(r => r.similarity).length
        }
    }, null, 2));

    console.log(`\\n💾 Detailed results saved: ${resultsPath}`);

    return {
        success: successfulTests.length > 0,
        bestConfig: mostAccurate || fastestTest,
        issues: testResults.filter(r => r.status !== 'PASS').length
    };
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testOCRPerformance()
        .then(results => {
            console.log('\\n🏁 Test completed');
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

export { testOCRPerformance, TEST_CONFIG };