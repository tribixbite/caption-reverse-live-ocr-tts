/**
 * PaddleOCR Browser Functionality Test
 * Tests actual PaddleOCR functionality in browser environment
 */

async function testPaddleOCRBrowser() {
    console.log('🧪 Starting PaddleOCR Browser Test...');

    let testsPassed = 0;
    let testsFailed = 0;

    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
        console.log(`${timestamp} ${prefix} ${message}`);

        if (type === 'success') testsPassed++;
        else if (type === 'error') testsFailed++;
    }

    try {
        // Test 1: Load ONNX Runtime
        log('Loading ONNX Runtime Web...');
        if (!window.ort) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
                script.onload = () => {
                    log('ONNX Runtime Web loaded successfully', 'success');
                    resolve();
                };
                script.onerror = () => {
                    log('Failed to load ONNX Runtime Web', 'error');
                    reject(new Error('ONNX Runtime load failed'));
                };
                document.head.appendChild(script);
            });
        } else {
            log('ONNX Runtime already available', 'success');
        }

        // Test 2: Load OpenCV.js
        log('Loading OpenCV.js...');
        if (!window.cv) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
                script.async = true;
                script.onload = () => {
                    // OpenCV needs initialization time
                    setTimeout(() => {
                        if (window.cv && window.cv.Mat) {
                            log('OpenCV.js loaded and initialized successfully', 'success');
                            resolve();
                        } else {
                            log('OpenCV.js loaded but not properly initialized', 'error');
                            reject(new Error('OpenCV initialization failed'));
                        }
                    }, 2000);
                };
                script.onerror = () => {
                    log('Failed to load OpenCV.js', 'error');
                    reject(new Error('OpenCV load failed'));
                };
                document.head.appendChild(script);
            });
        } else {
            log('OpenCV.js already available', 'success');
        }

        // Test 3: Load eSearch-OCR
        log('Loading eSearch-OCR module...');
        try {
            const esearchModule = await import('https://cdn.jsdelivr.net/npm/esearch-ocr@5.1.5/dist/esearch-ocr.js');
            log(`eSearch-OCR loaded, exports: ${Object.keys(esearchModule).join(', ')}`, 'success');

            // Test 4: Initialize PaddleOCR
            if (esearchModule.init) {
                log('Initializing PaddleOCR with eSearch-OCR...');

                // Load dictionary
                const assetsPath = "https://cdn.jsdelivr.net/npm/paddleocr-browser/dist/";
                const dictResponse = await fetch(assetsPath + "ppocr_keys_v1.txt");

                if (dictResponse.ok) {
                    const dic = await dictResponse.text();
                    log(`Dictionary loaded: ${dic.split('\\n').length} characters`, 'success');

                    // Initialize OCR
                    await esearchModule.init({
                        detPath: assetsPath + "ppocr_det.onnx",
                        recPath: assetsPath + "ppocr_rec.onnx",
                        dic: dic,
                        ort: window.ort,
                        node: false,
                        cv: window.cv
                    });

                    log('PaddleOCR initialized successfully!', 'success');

                    // Test 5: Run OCR on test image
                    log('Testing OCR on sample image...');
                    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAAfCAYAAABsjHuIAAAA...'; // Simple test image

                    try {
                        const result = await esearchModule.ocr(testImageData);
                        log(`OCR completed! Result: ${JSON.stringify(result, null, 2)}`, 'success');
                    } catch (ocrError) {
                        log(`OCR test failed: ${ocrError.message}`, 'error');
                    }

                } else {
                    log(`Failed to load dictionary: ${dictResponse.status}`, 'error');
                }

            } else {
                log('eSearch-OCR module missing init function', 'error');
            }

        } catch (importError) {
            log(`Failed to import eSearch-OCR: ${importError.message}`, 'error');
        }

    } catch (error) {
        log(`Overall test failed: ${error.message}`, 'error');
    }

    // Results
    console.log('\\n📊 PaddleOCR Browser Test Results:');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`🎯 Success Rate: ${testsPassed > 0 ? Math.round((testsPassed / (testsPassed + testsFailed)) * 100) : 0}%`);

    return { passed: testsPassed, failed: testsFailed };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    // Wait for page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', testPaddleOCRBrowser);
    } else {
        testPaddleOCRBrowser();
    }
}