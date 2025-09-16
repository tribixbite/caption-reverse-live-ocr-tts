/**
 * Server-side PaddleOCR Test Script
 * Tests PaddleOCR functionality using test2.png
 */

const http = require('http');
const fs = require('fs');

async function testPaddleOCRServer() {
    console.log('🎮 PaddleOCR Server Test - CaptnReverse Gaming Companion');
    console.log('========================================================');

    try {
        // Test 1: Verify test image exists
        console.log('\n📁 Test 1: Verify Test Image');
        if (fs.existsSync('./tests/test2.png')) {
            const stats = fs.statSync('./tests/test2.png');
            console.log(`✅ test2.png found (${(stats.size/1024).toFixed(1)}KB)`);
        } else {
            console.log('❌ test2.png not found');
            return;
        }

        // Test 2: Verify server is running
        console.log('\n🌐 Test 2: Server Connectivity');
        const serverTest = await testServerConnection();
        if (!serverTest) {
            console.log('❌ Server not accessible at localhost:3000');
            return;
        }
        console.log('✅ Server accessible at localhost:3000');

        // Test 3: Test PaddleOCR CDN accessibility
        console.log('\n📦 Test 3: PaddleOCR CDN Accessibility');
        await testPaddleOCRCDNs();

        // Test 4: Test the web page loads
        console.log('\n🌐 Test 4: Web Test Page');
        const testPageWorks = await testWebPage();
        console.log(testPageWorks ? '✅ Test page loads correctly' : '❌ Test page has issues');

        // Test 5: Instructions for manual testing
        console.log('\n🧪 Test 5: Manual Browser Testing Instructions');
        console.log('================================================');
        console.log('1. Open: http://localhost:3000/test-paddle-web.html');
        console.log('2. Click "Test PaddleOCR Loading"');
        console.log('3. Wait for initialization (may take 30+ seconds)');
        console.log('4. Click "Test OCR Recognition" to test with test2.png');
        console.log('5. Click "Compare with Tesseract" for engine comparison');
        console.log('');
        console.log('Expected Results:');
        console.log('   ✅ PaddleOCR should load successfully');
        console.log('   ✅ Should recognize "This year we put" and "12"');
        console.log('   ✅ Should detect text bounding boxes');
        console.log('   ✅ Should be faster or more accurate than Tesseract');

        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Open the test page and run the tests');
        console.log('2. If PaddleOCR fails, it will automatically fallback to Tesseract');
        console.log('3. Report results and any console errors');

    } catch (error) {
        console.error('💥 Server test failed:', error);
    }
}

// Test server connection
function testServerConnection() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            resolve(res.statusCode === 200);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Test PaddleOCR CDN endpoints
async function testPaddleOCRCDNs() {
    const cdns = [
        'https://cdn.jsdelivr.net/npm/@paddle-js-models/ocr@4.1.1/lib/index.js',
        'https://unpkg.com/@paddle-js-models/ocr@4.1.1/lib/index.js'
    ];

    for (const [index, cdn] of cdns.entries()) {
        try {
            const response = await fetch(cdn, { method: 'HEAD' });
            console.log(`   ${response.ok ? '✅' : '❌'} CDN ${index + 1}: ${cdn} (${response.status})`);
        } catch (error) {
            console.log(`   ❌ CDN ${index + 1}: ${cdn} (${error.message})`);
        }
    }
}

// Test web page loads
function testWebPage() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000/test-paddle-web.html', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const hasRequiredElements = data.includes('PaddleOCR Web Test') &&
                                          data.includes('test2.png') &&
                                          data.includes('testPaddleOCRLoading');
                resolve(hasRequiredElements);
            });
        });

        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Run the test
testPaddleOCRServer().catch(console.error);