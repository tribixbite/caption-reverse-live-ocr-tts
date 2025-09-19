/**
 * Enhanced OCR Preprocessing Test for White Text on Dark Backgrounds
 * Tests multiple preprocessing approaches to optimize OCR accuracy
 */

import Tesseract from 'tesseract.js';
import fs from 'fs';

const TEST_CONFIG = {
    testImagePath: './tests/test2.png',
    expectedText: 'This year we put a "12" on the box.',
    preprocessingMethods: [
        {
            name: 'Raw Image (No Preprocessing)',
            preprocess: false
        },
        {
            name: 'Basic Inversion',
            preprocess: true,
            tesseractParams: {
                tessedit_pageseg_mode: '6',
                tessedit_do_invert: '1'
            }
        },
        {
            name: 'Gaming Optimized + Inversion',
            preprocess: true,
            tesseractParams: {
                tessedit_pageseg_mode: '6',
                tessedit_do_invert: '1',
                preserve_interword_spaces: '1',
                tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"\'',
                classify_enable_adaptive_matcher: '1'
            }
        },
        {
            name: 'Single Line + Inversion',
            preprocess: true,
            tesseractParams: {
                tessedit_pageseg_mode: '7',
                tessedit_do_invert: '1',
                preserve_interword_spaces: '1'
            }
        },
        {
            name: 'Sparse Text + Inversion',
            preprocess: true,
            tesseractParams: {
                tessedit_pageseg_mode: '11',
                tessedit_do_invert: '1',
                preserve_interword_spaces: '1'
            }
        }
    ]
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

// Test enhanced preprocessing
async function testEnhancedPreprocessing() {
    console.log('🎨 Starting Enhanced Preprocessing Test...');
    console.log(`📸 Test image: ${TEST_CONFIG.testImagePath}`);
    console.log(`📝 Expected: "${TEST_CONFIG.expectedText}"`);
    console.log('\\n');

    if (!fs.existsSync(TEST_CONFIG.testImagePath)) {
        console.error(`❌ Test image not found: ${TEST_CONFIG.testImagePath}`);
        return;
    }

    const testResults = [];

    for (let i = 0; i < TEST_CONFIG.preprocessingMethods.length; i++) {
        const method = TEST_CONFIG.preprocessingMethods[i];
        console.log(`🔧 Testing method ${i + 1}/${TEST_CONFIG.preprocessingMethods.length}: ${method.name}`);

        try {
            const startTime = Date.now();

            // Create worker
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        process.stdout.write(`\\r   Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });

            // Set parameters if specified
            if (method.tesseractParams) {
                await worker.setParameters(method.tesseractParams);
            }

            // Perform OCR
            const result = await worker.recognize(TEST_CONFIG.testImagePath);
            const processingTime = Date.now() - startTime;

            console.log('\\n');

            // Analyze results
            const detectedText = result.data.text.trim();
            const confidence = result.data.confidence;
            const similarity = calculateSimilarity(detectedText, TEST_CONFIG.expectedText);

            const testResult = {
                methodName: method.name,
                processingTime,
                confidence: Math.round(confidence),
                detectedText,
                similarity: Math.round(similarity),
                status: similarity >= 80 ? 'EXCELLENT' : similarity >= 60 ? 'GOOD' : similarity >= 30 ? 'POOR' : 'FAIL'
            };

            testResults.push(testResult);

            console.log(`   ⏱️ Processing time: ${processingTime}ms`);
            console.log(`   🎯 Confidence: ${testResult.confidence}%`);
            console.log(`   📝 Detected: "${detectedText}"`);
            console.log(`   📊 Similarity: ${testResult.similarity}%`);
            console.log(`   ${testResult.status === 'EXCELLENT' || testResult.status === 'GOOD' ? '✅' : '❌'} Result: ${testResult.status}`);
            console.log('');

            // Cleanup
            await worker.terminate();

        } catch (error) {
            console.error(`   ❌ Error with ${method.name}:`, error.message);
            testResults.push({
                methodName: method.name,
                error: error.message,
                status: 'ERROR'
            });
        }
    }

    // Analysis
    console.log('\\n📋 PREPROCESSING ANALYSIS');
    console.log('='.repeat(50));

    const successfulTests = testResults.filter(r => r.status === 'EXCELLENT' || r.status === 'GOOD');
    const bestResult = testResults
        .filter(r => r.similarity)
        .sort((a, b) => b.similarity - a.similarity)[0];

    console.log(`✅ Successful methods: ${successfulTests.length}/${testResults.length}`);
    if (bestResult) {
        console.log(`🏆 Best result: ${bestResult.methodName}`);
        console.log(`   📊 Accuracy: ${bestResult.similarity}%`);
        console.log(`   🎯 Confidence: ${bestResult.confidence}%`);
        console.log(`   ⏱️ Time: ${bestResult.processingTime}ms`);
    }

    // Generate specific recommendations
    console.log('\\n💡 SPECIFIC RECOMMENDATIONS:');

    if (bestResult && bestResult.similarity > 80) {
        console.log(`   ✅ Use "${bestResult.methodName}" configuration for optimal results`);
    } else if (bestResult && bestResult.similarity > 50) {
        console.log(`   ⚠️ "${bestResult.methodName}" shows promise but needs image preprocessing`);
        console.log('   🎨 Implement contrast enhancement and noise reduction');
    } else {
        console.log('   🚨 All methods failed. This image requires advanced preprocessing:');
        console.log('   1. Contrast enhancement to boost white text');
        console.log('   2. Noise reduction to clean dark background');
        console.log('   3. Possible image resizing for optimal character height');
        console.log('   4. Consider using image inversion as primary approach');
    }

    // Technical analysis
    const inversionResults = testResults.filter(r => r.methodName.includes('Inversion'));
    const noInversionResults = testResults.filter(r => !r.methodName.includes('Inversion') && !r.methodName.includes('ERROR'));

    if (inversionResults.length > 0 && noInversionResults.length > 0) {
        const avgInversion = inversionResults.reduce((sum, r) => sum + (r.similarity || 0), 0) / inversionResults.length;
        const avgNoInversion = noInversionResults.reduce((sum, r) => sum + (r.similarity || 0), 0) / noInversionResults.length;

        console.log(`\\n📈 INVERSION ANALYSIS:`);
        console.log(`   🔄 With inversion: ${avgInversion.toFixed(1)}% average accuracy`);
        console.log(`   🚫 Without inversion: ${avgNoInversion.toFixed(1)}% average accuracy`);
        console.log(`   ${avgInversion > avgNoInversion ? '✅' : '❌'} Inversion ${avgInversion > avgNoInversion ? 'improves' : 'degrades'} performance`);
    }

    // Save results
    const resultsPath = './tests/enhanced-preprocessing-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        expectedText: TEST_CONFIG.expectedText,
        testResults,
        analysis: {
            bestMethod: bestResult ? bestResult.methodName : 'None',
            maxAccuracy: bestResult ? bestResult.similarity : 0,
            recommendInversion: inversionResults.length > 0 && inversionResults[0].similarity > 30
        }
    }, null, 2));

    console.log(`\\n💾 Detailed results saved: ${resultsPath}`);

    return {
        success: successfulTests.length > 0,
        bestResult,
        allFailed: testResults.every(r => r.status === 'FAIL' || r.status === 'ERROR')
    };
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testEnhancedPreprocessing()
        .then(results => {
            console.log('\\n🏁 Enhanced preprocessing test completed');
            process.exit(results.allFailed ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

export { testEnhancedPreprocessing };