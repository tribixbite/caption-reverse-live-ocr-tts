import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

async function testOCRPipeline() {
    console.log('🧪 Testing CaptnReverse OCR Pipeline...');
    
    try {
        // Initialize OCR worker with same config as app
        console.log('🤖 Initializing OCR worker...');
        const ocrWorker = await createWorker('eng', 1, {
            logger: ({ status, progress }) => {
                if (status === 'recognizing text') {
                    console.log(`📊 Progress: ${Math.round(progress * 100)}%`);
                }
            }
        });

        // Apply same parameters as web app (working configuration)
        await ocrWorker.setParameters({
            tessedit_pageseg_mode: '6', // Single uniform block - same as web app
            tessedit_char_blacklist: '', // Remove restrictions
            preserve_interword_spaces: '1' // Better word spacing
        });

        console.log('✅ OCR Worker configured');

        // Load test image
        const imagePath = path.join(__dirname, 'test.png');
        console.log(`📸 Loading test image: ${imagePath}`);
        
        if (!fs.existsSync(imagePath)) {
            console.error('❌ test.png not found in tests/ directory');
            process.exit(1);
        }

        // Process image with OCR
        const startTime = Date.now();
        const result = await ocrWorker.recognize(imagePath);
        const processingTime = Date.now() - startTime;

        // Display results
        console.log('\n🔍 OCR Results:');
        console.log('================');
        console.log(`📝 Detected Text: "${result.data.text.trim()}"`);
        console.log(`🎯 Confidence: ${Math.round(result.data.confidence)}%`);
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        console.log(`📊 Word Count: ${result.data.words.length}`);
        
        // Test with same sensitivity as web app (60%)
        const sensitivity = 60;
        const text = result.data.text.trim();
        
        console.log('\n🧮 Web App Logic Test:');
        console.log('=====================');
        console.log(`Sensitivity Threshold: ${sensitivity}%`);
        console.log(`Confidence: ${Math.round(result.data.confidence)}%`);
        console.log(`Text Length: ${text.length} characters`);
        
        if (result.data.confidence > sensitivity) {
            if (text && text.length > 2) {
                console.log('✅ PASS: Text would be detected and spoken in web app');
                console.log(`🔊 TTS would say: "${text}"`);
            } else {
                console.log('❌ FAIL: Text too short, would be filtered out');
            }
        } else {
            console.log('❌ FAIL: Confidence below threshold, text would be ignored');
        }

        // Test word-by-word confidence
        console.log('\n📋 Word-by-Word Analysis:');
        console.log('==========================');
        result.data.words.forEach((word, index) => {
            console.log(`Word ${index + 1}: "${word.text}" (confidence: ${Math.round(word.confidence)}%)`);
        });

        // Cleanup
        await ocrWorker.terminate();
        console.log('\n🎉 OCR pipeline test completed successfully!');
        
        return {
            text: text,
            confidence: result.data.confidence,
            processingTime: processingTime,
            wordCount: result.data.words.length,
            passed: result.data.confidence > sensitivity && text.length > 2
        };

    } catch (error) {
        console.error('❌ OCR pipeline test failed:', error);
        process.exit(1);
    }
}

// Run test if called directly
if (require.main === module) {
    testOCRPipeline()
        .then(result => {
            console.log(`\n📊 Final Result: ${result.passed ? 'PASS' : 'FAIL'}`);
            process.exit(result.passed ? 0 : 1);
        })
        .catch(error => {
            console.error('Test runner error:', error);
            process.exit(1);
        });
}

export { testOCRPipeline };