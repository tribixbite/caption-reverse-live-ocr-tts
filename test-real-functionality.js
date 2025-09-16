#!/usr/bin/env node

/**
 * Real Functionality Test - Find actual issues in the app
 */

const puppeteer = require('puppeteer');

async function testRealFunctionality() {
    console.log('🧪 Testing REAL App Functionality');
    console.log('==================================');

    let browser;
    try {
        // Launch browser for testing
        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream'
            ]
        });

        const page = await browser.newPage();

        // Enable console logging
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error') {
                console.log(`❌ Browser Error: ${msg.text()}`);
            } else if (type === 'warn') {
                console.log(`⚠️ Browser Warning: ${msg.text()}`);
            } else if (msg.text().includes('✅') || msg.text().includes('❌')) {
                console.log(`📋 ${msg.text()}`);
            }
        });

        // Enable error catching
        page.on('pageerror', error => {
            console.log(`💥 Page Error: ${error.message}`);
        });

        // Go to the app
        console.log('🌐 Loading CaptnReverse app...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Wait for app to initialize
        await page.waitForTimeout(3000);

        console.log('\n🔍 Testing Core Components...\n');

        // Test 1: Basic app loading
        const title = await page.title();
        console.log(`📄 Page title: "${title}"`);

        // Test 2: Check for JavaScript errors
        const errors = await page.evaluate(() => {
            return window.jsErrors || [];
        });

        if (errors.length > 0) {
            console.log('❌ JavaScript errors found:', errors);
        } else {
            console.log('✅ No immediate JavaScript errors');
        }

        // Test 3: Camera request button
        const cameraBtn = await page.$('#request-camera');
        if (cameraBtn) {
            console.log('✅ Camera request button found');
            await cameraBtn.click();
            await page.waitForTimeout(2000);

            // Check if main app is visible
            const mainApp = await page.$('#main-app:not(.hidden)');
            if (mainApp) {
                console.log('✅ Main app UI loaded after camera request');
            } else {
                console.log('❌ Main app UI not visible after camera request');
            }
        } else {
            console.log('❌ Camera request button not found');
        }

        // Test 4: Settings button
        const settingsBtn = await page.$('#settings-btn');
        if (settingsBtn) {
            console.log('✅ Settings button found');
            await settingsBtn.click();
            await page.waitForTimeout(1000);

            const settingsModal = await page.$('#settings-modal:not(.hidden)');
            if (settingsModal) {
                console.log('✅ Settings modal opens');

                // Test auto-calibrate button
                const calibrateBtn = await page.$('#auto-calibrate');
                if (calibrateBtn) {
                    console.log('✅ Auto-calibrate button found');
                } else {
                    console.log('❌ Auto-calibrate button missing');
                }

                // Test history button
                const historyBtn = await page.$('#toggle-history');
                if (historyBtn) {
                    console.log('✅ History toggle button found');
                } else {
                    console.log('❌ History toggle button missing');
                }

            } else {
                console.log('❌ Settings modal does not open');
            }
        } else {
            console.log('❌ Settings button not found');
        }

        // Test 5: Check for Web Worker loading
        await page.evaluate(() => {
            // Try to create a worker
            try {
                const worker = new Worker('./js/preprocessing.worker.js');
                console.log('✅ Preprocessing Web Worker can be created');
                worker.terminate();
            } catch (error) {
                console.log('❌ Preprocessing Web Worker failed:', error.message);
            }
        });

        // Test 6: Check module imports
        const moduleTest = await page.evaluate(async () => {
            const results = {};

            try {
                const config = await import('./js/config.js');
                results.config = !!config.AppState;
            } catch (e) {
                results.config = false;
                console.log('❌ Config module import failed:', e.message);
            }

            try {
                const ocr = await import('./js/ocr.js');
                results.ocr = !!ocr.readNow;
            } catch (e) {
                results.ocr = false;
                console.log('❌ OCR module import failed:', e.message);
            }

            try {
                const hotkeys = await import('./js/hotkeys.js');
                results.hotkeys = !!hotkeys.initHotkeySystem;
            } catch (e) {
                results.hotkeys = false;
                console.log('❌ Hotkeys module import failed:', e.message);
            }

            return results;
        });

        console.log('\n📊 Module Import Results:');
        console.log(`   Config: ${moduleTest.config ? '✅' : '❌'}`);
        console.log(`   OCR: ${moduleTest.ocr ? '✅' : '❌'}`);
        console.log(`   Hotkeys: ${moduleTest.hotkeys ? '✅' : '❌'}`);

        console.log('\n🎮 Testing Gaming Features...\n');

        // Test 7: Hotkey system
        await page.keyboard.press('F12');
        await page.waitForTimeout(1000);

        const hotkeyHelp = await page.$('#hotkey-help-overlay:not(.hidden)');
        if (hotkeyHelp) {
            console.log('✅ F12 hotkey shows help overlay');
        } else {
            console.log('❌ F12 hotkey does not work');
        }

        // Close help if it opened
        await page.keyboard.press('F12');

        console.log('\n🏁 Real Functionality Test Complete');

    } catch (error) {
        console.error('💥 Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    testRealFunctionality();
} catch (error) {
    console.log('⚠️ Puppeteer not available, running basic checks...');

    // Basic file existence checks
    const fs = require('fs');
    const files = [
        './index.html',
        './js/app.js',
        './js/config.js',
        './js/ocr.js',
        './js/hotkeys.js',
        './js/preprocessing.worker.js'
    ];

    console.log('\n📁 File Existence Check:');
    files.forEach(file => {
        const exists = fs.existsSync(file);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
}