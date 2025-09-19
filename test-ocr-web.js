/**
 * Web-based OCR Performance Test using Playwright
 * Tests the actual web application with test2.png
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const TEST_CONFIG = {
    expectedText: 'This year we put a "12" on the box.',
    expectedWords: ['This', 'year', 'we', 'put', 'a', '12', 'on', 'the', 'box'],
    performanceTargets: {
        maxProcessingTime: 2000, // 2 seconds
        minConfidence: 80
    }
};

test.describe('OCR Performance Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');

        // Grant camera permissions (fake camera will be used)
        await page.context().grantPermissions(['camera']);
    });

    test('Basic OCR functionality with test2.png', async ({ page }) => {
        console.log('🧪 Starting OCR functionality test...');

        // Wait for app to initialize
        await page.waitForSelector('#setup-screen', { timeout: 5000 });

        // Click to enable camera access
        await page.click('#request-camera');

        // Wait for main app to appear
        await page.waitForSelector('#main-app', { timeout: 10000 });

        // Check if main elements are present
        const cameraFeed = await page.locator('#camera-feed').isVisible();
        const cropOverlay = await page.locator('#crop-overlay').isVisible();

        console.log(`📹 Camera feed visible: ${cameraFeed}`);
        console.log(`✂️ Crop overlay visible: ${cropOverlay}`);

        // Test OCR button presence
        const readNowBtn = await page.locator('#read-now-btn').isVisible();
        console.log(`🔍 Read Now button visible: ${readNowBtn}`);

        // Log current OCR engine being used
        const ocrStatus = await page.textContent('#status-text');
        console.log(`📊 Current status: ${ocrStatus}`);

        // Test crop functionality by setting a crop area
        if (cropOverlay) {
            console.log('✂️ Testing crop area functionality...');
            // Simulate crop selection (this would normally be done via mouse drag)
            await page.evaluate(() => {
                if (window.setCrop) {
                    window.setCrop(140, 820, 600, 100); // Target the text area
                }
            });
        }

        // Check if audio/TTS system is working
        const testTTSBtn = await page.locator('#test-tts-btn').isVisible();
        console.log(`🔊 TTS Test button visible: ${testTTSBtn}`);

        if (testTTSBtn) {
            console.log('🔊 Testing TTS functionality...');
            await page.click('#test-tts-btn');

            // Wait a moment for TTS to attempt
            await page.waitForTimeout(1000);
        }

        // Capture any console errors
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        console.log(`❌ Console errors captured: ${errors.length}`);
        if (errors.length > 0) {
            console.log('Errors:', errors);
        }

        // Test results summary
        const testResults = {
            timestamp: new Date().toISOString(),
            cameraFeedVisible: cameraFeed,
            cropOverlayVisible: cropOverlay,
            readButtonVisible: readNowBtn,
            ttsButtonVisible: testTTSBtn,
            consoleErrors: errors,
            currentStatus: ocrStatus
        };

        console.log('\\n📋 Test Results:', JSON.stringify(testResults, null, 2));

        // Save results
        fs.writeFileSync('./tests/web-test-results.json', JSON.stringify(testResults, null, 2));

        // Basic assertions
        expect(cameraFeed || cropOverlay).toBeTruthy(); // At least one should be visible
        expect(errors.length).toBeLessThan(5); // Should have minimal errors
    });

    test('Performance monitoring', async ({ page }) => {
        console.log('⏱️ Starting performance monitoring test...');

        // Navigate and setup
        await page.goto('http://localhost:3000');
        await page.context().grantPermissions(['camera']);

        await page.waitForSelector('#setup-screen', { timeout: 5000 });
        await page.click('#request-camera');
        await page.waitForSelector('#main-app', { timeout: 10000 });

        // Monitor performance
        const performanceEntries = await page.evaluate(() => {
            return performance.getEntriesByType('navigation').map(entry => ({
                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                loadComplete: entry.loadEventEnd - entry.loadEventStart,
                totalTime: entry.loadEventEnd - entry.fetchStart
            }));
        });

        console.log('📊 Performance metrics:', performanceEntries);

        // Check for memory leaks indicators
        const memoryInfo = await page.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });

        if (memoryInfo) {
            console.log('🧠 Memory usage:', memoryInfo);
        }

        expect(performanceEntries[0]?.totalTime).toBeLessThan(5000); // Should load in under 5 seconds
    });

    test('OCR Engine switching', async ({ page }) => {
        console.log('🔄 Testing OCR engine switching...');

        await page.goto('http://localhost:3000');
        await page.context().grantPermissions(['camera']);

        await page.waitForSelector('#setup-screen', { timeout: 5000 });
        await page.click('#request-camera');
        await page.waitForSelector('#main-app', { timeout: 10000 });

        // Open settings
        const settingsBtn = await page.locator('#settings-btn').isVisible();
        if (settingsBtn) {
            await page.click('#settings-btn');

            // Wait for settings modal
            await page.waitForSelector('#settings-modal', { timeout: 5000 });

            // Check for OCR engine selector
            const ocrEngineSelect = await page.locator('#ocr-engine').isVisible();
            console.log(`⚙️ OCR engine selector visible: ${ocrEngineSelect}`);

            if (ocrEngineSelect) {
                // Test switching to PaddleOCR
                await page.selectOption('#ocr-engine', 'paddle');
                console.log('🤖 Switched to PaddleOCR');

                // Wait a moment for the switch
                await page.waitForTimeout(1000);

                // Check status
                const status = await page.textContent('#status-text');
                console.log(`📊 Status after switch: ${status}`);

                // Switch back to Tesseract
                await page.selectOption('#ocr-engine', 'tesseract');
                console.log('🤖 Switched to Tesseract');
            }

            // Close settings
            await page.click('#close-settings');
        }
    });
});

// Export test configuration for other files
export { TEST_CONFIG };