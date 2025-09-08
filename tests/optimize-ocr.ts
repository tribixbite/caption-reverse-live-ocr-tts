import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

interface TestResult {
    params: any;
    text: string;
    confidence: number;
    processingTime: number;
    containsTargetText: boolean;
    score: number;
}

async function comprehensiveOCRTest() {
    console.log('🧪 CaptnReverse OCR Optimization Suite - 50+ Parameter Tests');
    console.log('Target: Extract "This year we put a \\"12\\" on the box." from test2.png');
    console.log('========================================================\n');

    const imagePath = path.join(__dirname, 'test2.png');
    if (!fs.existsSync(imagePath)) {
        console.error('❌ test2.png not found');
        process.exit(1);
    }

    const targetText = 'This year we put a "12" on the box.';
    const results: TestResult[] = [];

    // Parameter combinations to test
    const testConfigs = [
        // Page Segmentation Modes
        { tessedit_pageseg_mode: '0', name: 'OSD only' },
        { tessedit_pageseg_mode: '1', name: 'Auto with OSD' },
        { tessedit_pageseg_mode: '2', name: 'Auto, no OSD' },
        { tessedit_pageseg_mode: '3', name: 'Fully auto' },
        { tessedit_pageseg_mode: '4', name: 'Single column' },
        { tessedit_pageseg_mode: '5', name: 'Single vertical block' },
        { tessedit_pageseg_mode: '6', name: 'Single uniform block' },
        { tessedit_pageseg_mode: '7', name: 'Single text line' },
        { tessedit_pageseg_mode: '8', name: 'Single word' },
        { tessedit_pageseg_mode: '9', name: 'Single character' },
        { tessedit_pageseg_mode: '10', name: 'Sparse text' },
        { tessedit_pageseg_mode: '11', name: 'Sparse text, OSD' },
        { tessedit_pageseg_mode: '12', name: 'Raw line, no heuristics' },
        { tessedit_pageseg_mode: '13', name: 'Raw line' },

        // OCR Engine Modes
        { tessedit_ocr_engine_mode: '0', tessedit_pageseg_mode: '6', name: 'Legacy + Single block' },
        { tessedit_ocr_engine_mode: '1', tessedit_pageseg_mode: '6', name: 'LSTM + Single block' },
        { tessedit_ocr_engine_mode: '2', tessedit_pageseg_mode: '6', name: 'Legacy+LSTM + Single block' },

        // Character restrictions
        { tessedit_pageseg_mode: '6', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', name: 'Basic whitelist' },
        { tessedit_pageseg_mode: '6', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?";:-()[]{}', name: 'Extended whitelist' },
        { tessedit_pageseg_mode: '6', tesseract_char_blacklist: '|[]{}()\\/', name: 'Blacklist symbols' },

        // Text direction and orientation
        { tessedit_pageseg_mode: '6', textord_equation_detect: '0', name: 'No equation detect' },
        { tessedit_pageseg_mode: '6', textord_tabfind_show_vlines: '0', name: 'No vertical lines' },

        // Quality improvements
        { tessedit_pageseg_mode: '6', tessedit_write_images: '0', name: 'No debug images' },
        { tessedit_pageseg_mode: '6', tessedit_dump_pageseg_images: '0', name: 'No pageseg debug' },

        // Language specific
        { tessedit_pageseg_mode: '6', load_system_dawg: '0', name: 'No system dictionary' },
        { tessedit_pageseg_mode: '6', load_freq_dawg: '0', name: 'No frequency dictionary' },
        { tessedit_pageseg_mode: '6', load_unambig_dawg: '0', name: 'No unambiguous dictionary' },

        // Preprocessing hints
        { tessedit_pageseg_mode: '6', tessedit_do_invert: '1', name: 'Auto invert' },
        { tessedit_pageseg_mode: '6', tessedit_do_invert: '0', name: 'No auto invert' },

        // Combined optimizations
        { tessedit_pageseg_mode: '3', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', tessedit_do_invert: '0', name: 'Auto + whitelist + no invert' },
        { tessedit_pageseg_mode: '6', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', tessedit_do_invert: '1', name: 'Block + whitelist + invert' },
        { tessedit_pageseg_mode: '7', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', name: 'Single line + whitelist' },

        // Confidence boosters
        { tessedit_pageseg_mode: '6', classify_enable_adaptive_matcher: '1', name: 'Adaptive matcher' },
        { tessedit_pageseg_mode: '6', classify_enable_learning: '0', name: 'No learning' },
        { tessedit_pageseg_mode: '6', matcher_debug_level: '0', name: 'No matcher debug' },

        // Advanced combinations
        { tessedit_pageseg_mode: '6', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', tessedit_do_invert: '0', classify_enable_adaptive_matcher: '1', name: 'Optimized combo 1' },
        { tessedit_pageseg_mode: '3', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', classify_enable_adaptive_matcher: '1', tessedit_do_invert: '0', name: 'Optimized combo 2' },
        { tessedit_pageseg_mode: '7', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', classify_enable_adaptive_matcher: '1', name: 'Optimized combo 3' },

        // Minimal restrictions
        { tessedit_pageseg_mode: '6', tessedit_char_blacklist: '', name: 'No char restrictions' },
        { tessedit_pageseg_mode: '3', tessedit_char_blacklist: '', name: 'Auto + no restrictions' },

        // Word confidence
        { tessedit_pageseg_mode: '6', classify_class_pruner_threshold: '230', name: 'Lower class threshold' },
        { tessedit_pageseg_mode: '6', classify_class_pruner_multiplier: '15', name: 'Higher class multiplier' },

        // Additional language model tweaks
        { tessedit_pageseg_mode: '6', language_model_penalty_non_dict_word: '0.5', name: 'Lower non-dict penalty' },
        { tessedit_pageseg_mode: '6', language_model_penalty_non_freq_dict_word: '0.3', name: 'Lower freq penalty' },

        // User patterns (simulating good settings combinations)
        { tessedit_pageseg_mode: '6', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', preserve_interword_spaces: '1', tessedit_do_invert: '0', name: 'Web app config' },

        // Edge cases and experimental
        { tessedit_pageseg_mode: '4', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', name: 'Column mode' },
        { tessedit_pageseg_mode: '11', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,"', name: 'Sparse with OSD' },
        { tessedit_pageseg_mode: '12', name: 'Raw line no heuristics' },

        // Conservative approaches
        { tessedit_pageseg_mode: '6', tesseract_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ', name: 'Letters numbers spaces only' },
        { tessedit_pageseg_mode: '6', tesseract_char_whitelist: 'Thisyeawputon"12"box.', name: 'Target chars only' }
    ];

    console.log(`🎯 Running ${testConfigs.length} different parameter combinations...\n`);

    for (let i = 0; i < testConfigs.length; i++) {
        const config = testConfigs[i];
        console.log(`\n📋 Test ${i + 1}/${testConfigs.length}: ${config.name}`);
        console.log(`⚙️ Parameters: ${JSON.stringify(config)}`);
        
        try {
            // Create fresh worker for each test
            const worker = await createWorker('eng', 1);
            
            // Remove 'name' from config before applying
            const { name, ...params } = config;
            
            try {
                await worker.setParameters(params);
            } catch (paramError) {
                console.log(`⚠️ Parameter error: ${paramError.message}`);
                await worker.terminate();
                continue;
            }

            const startTime = Date.now();
            const result = await worker.recognize(imagePath);
            const processingTime = Date.now() - startTime;

            const detectedText = result.data.text.trim();
            const confidence = result.data.confidence;
            
            // Check if target text is contained (fuzzy matching)
            const containsTarget = detectedText.toLowerCase().includes('this year') || 
                                 detectedText.toLowerCase().includes('"12"') ||
                                 detectedText.toLowerCase().includes('box');
            
            // Score based on confidence + target match + processing speed
            const targetBonus = containsTarget ? 50 : 0;
            const speedBonus = processingTime < 1000 ? 10 : 0;
            const score = confidence + targetBonus + speedBonus;
            
            const testResult: TestResult = {
                params: params,
                text: detectedText,
                confidence: confidence,
                processingTime: processingTime,
                containsTargetText: containsTarget,
                score: score
            };
            
            results.push(testResult);
            
            console.log(`📊 Result: "${detectedText.substring(0, 50)}${detectedText.length > 50 ? '...' : ''}"`);
            console.log(`🎯 Confidence: ${Math.round(confidence)}% | Target: ${containsTarget ? '✅' : '❌'} | Score: ${Math.round(score)} | Time: ${processingTime}ms`);
            
            await worker.terminate();
            
        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
        }
    }

    // Sort results by score (best first)
    results.sort((a, b) => b.score - a.score);
    
    console.log('\n\n🏆 TOP 10 BEST CONFIGURATIONS:');
    console.log('===============================');
    
    results.slice(0, 10).forEach((result, index) => {
        console.log(`\n${index + 1}. SCORE: ${Math.round(result.score)} | Confidence: ${Math.round(result.confidence)}% | Target: ${result.containsTargetText ? '✅' : '❌'}`);
        console.log(`   Parameters: ${JSON.stringify(result.params)}`);
        console.log(`   Text: "${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}"`);
        console.log(`   Processing: ${result.processingTime}ms`);
    });

    // Find best configuration that contains target text
    const bestWithTarget = results.find(r => r.containsTargetText);
    if (bestWithTarget) {
        console.log('\n\n🎯 OPTIMAL CONFIGURATION FOR TARGET TEXT:');
        console.log('========================================');
        console.log(`📊 Score: ${Math.round(bestWithTarget.score)}`);
        console.log(`🎯 Confidence: ${Math.round(bestWithTarget.confidence)}%`);
        console.log(`⏱️ Processing Time: ${bestWithTarget.processingTime}ms`);
        console.log(`📝 Detected Text: "${bestWithTarget.text}"`);
        console.log(`⚙️ Parameters: ${JSON.stringify(bestWithTarget.params, null, 2)}`);
        
        // Generate web app update code
        console.log('\n\n🔧 WEB APP UPDATE CODE:');
        console.log('======================');
        console.log('Copy this into your web app\'s initOCR function:');
        console.log('\nawait ocrWorker.setParameters({');
        Object.entries(bestWithTarget.params).forEach(([key, value]) => {
            console.log(`    ${key}: '${value}',`);
        });
        console.log('});');
        
    } else {
        console.log('\n❌ No configuration successfully detected the target text');
    }

    // Statistics
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const successRate = results.filter(r => r.containsTargetText).length / results.length;
    
    console.log('\n\n📈 OVERALL STATISTICS:');
    console.log('====================');
    console.log(`Tests Run: ${results.length}`);
    console.log(`Average Confidence: ${Math.round(avgConfidence)}%`);
    console.log(`Average Processing Time: ${Math.round(avgTime)}ms`);
    console.log(`Target Detection Rate: ${Math.round(successRate * 100)}%`);
    console.log(`Best Overall Score: ${Math.round(results[0].score)}`);

    return bestWithTarget;
}

// Run comprehensive test
if (require.main === module) {
    comprehensiveOCRTest()
        .then(bestConfig => {
            if (bestConfig) {
                console.log('\n🎉 Optimization complete! Use the parameters above in your web app.');
                process.exit(0);
            } else {
                console.log('\n😞 No optimal configuration found. Consider preprocessing the image.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Test suite failed:', error);
            process.exit(1);
        });
}

export { comprehensiveOCRTest };