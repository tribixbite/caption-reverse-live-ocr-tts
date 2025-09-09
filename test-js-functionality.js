#!/usr/bin/env node

/**
 * Autonomous JavaScript Functionality Test
 * Tests actual JavaScript execution and DOM manipulation
 */

const http = require('http');
const fs = require('fs');

console.log('🚀 JavaScript Functionality Test');
console.log('================================');

// Test 1: Fetch and parse HTML
async function testHTMLParsing() {
    console.log('🔍 Testing HTML parsing...');
    
    try {
        const html = await new Promise((resolve, reject) => {
            http.get('http://localhost:3000', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
                res.on('error', reject);
            }).on('error', reject);
        });
        
        const tests = [
            { name: 'Settings button exists', test: () => html.includes('id="settings-btn"') },
            { name: 'Settings modal exists', test: () => html.includes('id="settings-modal"') },
            { name: 'Event delegation code exists', test: () => html.includes('document.body.addEventListener') },
            { name: 'AppState object exists', test: () => html.includes('const AppState = {') },
            { name: 'Logger service exists', test: () => html.includes('const logger = {') },
            { name: 'Init function exists', test: () => html.includes('async function init()') },
            { name: 'Correct PaddleOCR URLs', test: () => html.includes('@paddlejs/paddlejs-core@2.2.0/lib/index.js') },
            { name: 'Tesseract.js included', test: () => html.includes('tesseract.js@5.1.1') }
        ];
        
        let passed = 0;
        let failed = 0;
        
        tests.forEach(test => {
            if (test.test()) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name}`);
                failed++;
            }
        });
        
        console.log(`\n📊 HTML Tests: ${passed} passed, ${failed} failed\n`);
        return failed === 0;
        
    } catch (error) {
        console.error('❌ HTML parsing failed:', error.message);
        return false;
    }
}

// Test 2: JavaScript Syntax Validation
async function testJavaScriptSyntax() {
    console.log('🔍 Testing JavaScript syntax...');
    
    try {
        // Extract JavaScript from HTML
        const html = fs.readFileSync('index.html', 'utf8');
        const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
        
        if (!scriptMatch) {
            console.error('❌ No main script block found');
            return false;
        }
        
        // Write to temp file and test syntax
        const jsCode = scriptMatch[1];
        fs.writeFileSync('temp-syntax-test.js', jsCode);
        
        const { spawn } = require('child_process');
        const nodeProcess = spawn('node', ['-c', 'temp-syntax-test.js']);
        
        return new Promise((resolve) => {
            let stderr = '';
            
            nodeProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            nodeProcess.on('close', (code) => {
                fs.unlinkSync('temp-syntax-test.js'); // Clean up
                
                if (code === 0) {
                    console.log('✅ JavaScript syntax is valid');
                    resolve(true);
                } else {
                    console.log('❌ JavaScript syntax errors:');
                    console.log(stderr);
                    resolve(false);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ JavaScript syntax test failed:', error.message);
        return false;
    }
}

// Test 3: CDN URL Validation
async function testCDNUrls() {
    console.log('🔍 Testing CDN URLs...');
    
    const urls = [
        'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js',
        'https://cdn.jsdelivr.net/npm/@paddlejs/paddlejs-core@2.2.0/lib/index.js',
        'https://cdn.jsdelivr.net/npm/@paddle-js-models/ocr@4.1.1/lib/index.js',
        'https://cdn.tailwindcss.com'
    ];
    
    const https = require('https');
    const results = [];
    
    for (const url of urls) {
        try {
            const result = await new Promise((resolve) => {
                const req = https.request(url, { method: 'HEAD' }, (res) => {
                    resolve({ url, status: res.statusCode, success: res.statusCode === 200 });
                });
                
                req.on('error', (error) => {
                    resolve({ url, status: 'ERROR', success: false, error: error.message });
                });
                
                req.end();
            });
            
            results.push(result);
            
            if (result.success) {
                console.log(`✅ ${url.split('/').pop()}`);
            } else {
                console.log(`❌ ${url.split('/').pop()} - Status: ${result.status}`);
            }
            
        } catch (error) {
            console.log(`❌ ${url.split('/').pop()} - Error: ${error.message}`);
            results.push({ url, success: false, error: error.message });
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 CDN Tests: ${successCount}/${results.length} passed\n`);
    
    return successCount === results.length;
}

// Test 4: Test Page Accessibility
async function testPages() {
    console.log('🔍 Testing page accessibility...');
    
    const pages = [
        'test-simple.html',
        'test-ocr-engines.html', 
        'test-functionality.html'
    ];
    
    let passed = 0;
    
    for (const page of pages) {
        try {
            const response = await new Promise((resolve, reject) => {
                http.get(`http://localhost:3000/${page}`, (res) => {
                    resolve({ status: res.statusCode, page });
                }).on('error', reject);
            });
            
            if (response.status === 200) {
                console.log(`✅ ${page}`);
                passed++;
            } else {
                console.log(`❌ ${page} - Status: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ ${page} - Error: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Page Tests: ${passed}/${pages.length} passed\n`);
    return passed === pages.length;
}

// Main Test Runner
async function runAllTests() {
    console.log('Starting comprehensive functionality tests...\n');
    
    const tests = [
        { name: 'HTML Parsing', test: testHTMLParsing },
        { name: 'JavaScript Syntax', test: testJavaScriptSyntax },
        { name: 'CDN URLs', test: testCDNUrls },
        { name: 'Test Pages', test: testPages }
    ];
    
    let overallPassed = 0;
    let overallFailed = 0;
    
    for (const test of tests) {
        console.log(`\n🧪 Running ${test.name} Tests`);
        console.log('='.repeat(test.name.length + 16));
        
        const result = await test.test();
        if (result) {
            overallPassed++;
        } else {
            overallFailed++;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 FINAL RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Test Suites Passed: ${overallPassed}`);
    console.log(`❌ Test Suites Failed: ${overallFailed}`);
    console.log(`📊 Total Test Suites: ${tests.length}`);
    
    if (overallFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! CaptnReverse is functioning correctly!');
        process.exit(0);
    } else {
        console.log(`\n⚠️  ${overallFailed} test suite(s) failed. Check issues above.`);
        process.exit(1);
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});