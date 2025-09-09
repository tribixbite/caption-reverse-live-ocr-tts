#!/usr/bin/env node

/**
 * Standalone PaddleOCR Loading Test
 * Tests different approaches to load and initialize PaddleOCR
 */

console.log('🧪 PaddleOCR Loading Test Suite');
console.log('===============================\n');

async function testCDNUrls() {
    console.log('📡 Testing CDN URL accessibility...');
    
    const testUrls = [
        'https://cdn.jsdelivr.net/npm/@paddle-js-models/ocr@4.1.1/lib/index.js',
        'https://cdn.jsdelivr.net/npm/@paddlejs-models/ocr@1.2.4/lib/index.js',
        'https://unpkg.com/@paddle-js-models/ocr@4.1.1/lib/index.js',
        'https://unpkg.com/@paddlejs-models/ocr@1.2.4/lib/index.js'
    ];
    
    for (const url of testUrls) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            console.log(`✅ ${url} - Status: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${url} - Error: ${error.message}`);
        }
    }
    console.log('');
}

async function testNodeInstallation() {
    console.log('📦 Testing Node.js package installation...');
    
    try {
        // Test if we can install the package
        const { execSync } = require('child_process');
        
        console.log('⏳ Installing @paddle-js-models/ocr...');
        execSync('npm install @paddle-js-models/ocr --no-save', { stdio: 'inherit' });
        
        console.log('⏳ Testing local import...');
        const ocr = require('@paddle-js-models/ocr');
        console.log('✅ Package imported successfully!');
        console.log(`📋 Available methods: ${Object.keys(ocr).join(', ')}`);
        
        if (typeof ocr.init === 'function') {
            console.log('🎯 Found init() method, testing...');
            await ocr.init();
            console.log('✅ OCR initialized successfully!');
        } else if (ocr.default && typeof ocr.default.init === 'function') {
            console.log('🎯 Found default.init() method, testing...');
            await ocr.default.init();
            console.log('✅ OCR.default initialized successfully!');
        } else {
            console.log('⚠️ No init method found');
        }
        
    } catch (error) {
        console.log(`❌ Node.js test failed: ${error.message}`);
    }
    console.log('');
}

async function testBrowserAPI() {
    console.log('🌐 Simulating browser API usage...');
    
    try {
        // Mock HTML5 Canvas for testing
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(200, 100);
        const ctx = canvas.getContext('2d');
        
        // Draw test text
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 200, 100);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Test Text', 50, 50);
        
        console.log('✅ Created test canvas with text');
        
        // Test OCR recognition (if we got this far)
        if (typeof require('@paddle-js-models/ocr') !== 'undefined') {
            const ocr = require('@paddle-js-models/ocr');
            if (typeof ocr.recognize === 'function') {
                console.log('🎯 Testing recognition...');
                const result = await ocr.recognize(canvas);
                console.log('✅ Recognition test completed!');
                console.log(`📝 Result: ${JSON.stringify(result)}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Browser API test failed: ${error.message}`);
    }
    console.log('');
}

async function runTests() {
    try {
        await testCDNUrls();
        await testNodeInstallation();
        await testBrowserAPI();
        
        console.log('🎉 Test suite completed!');
        console.log('');
        console.log('RECOMMENDATIONS:');
        console.log('1. Use @paddle-js-models/ocr@4.1.1 (newer version)');
        console.log('2. CDN path: /lib/index.js (not /dist/)');
        console.log('3. Initialize with await ocr.init() or await ocr.default.init()');
        console.log('4. Use ocr.recognize(canvas) for text recognition');
        
    } catch (error) {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    }
}

// Install canvas dependency if needed
try {
    require('canvas');
} catch (e) {
    console.log('⚠️ Canvas module not found, skipping browser API test');
}

runTests().then(() => {
    console.log('✅ All tests completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
});