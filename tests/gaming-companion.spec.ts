import { test, expect } from '@playwright/test';

/**
 * Comprehensive Gaming Companion E2E Tests
 * Tests all gaming features including hotkeys, voice commands, and multi-monitor support
 */

test.describe('CaptnReverse Gaming Companion', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Grant camera permissions and setup
    await page.evaluate(() => {
      // Mock getUserMedia for testing
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: () => Promise.resolve({
            getTracks: () => [{
              stop: () => {},
              kind: 'video',
              label: 'Fake Camera'
            }],
            getVideoTracks: () => [{
              stop: () => {},
              getCapabilities: () => ({ zoom: { min: 1, max: 5 } }),
              getSettings: () => ({ zoom: 1 }),
              applyConstraints: () => Promise.resolve()
            }]
          } as MediaStream)
        }
      });
    });

    // Enable camera to reach main app
    await page.click('#request-camera');
    await page.waitForSelector('#main-app', { state: 'visible' });
  });

  test('should load with gaming UI theme', async ({ page }) => {
    // Check for gaming UI elements
    await expect(page.locator('.glass')).toBeVisible();
    await expect(page.locator('.gaming-glow')).toBeVisible();
    await expect(page.locator('.btn-primary')).toBeVisible();

    // Check for gaming title styling
    await expect(page.locator('h1')).toContainText('CaptnReverse');
    await expect(page.locator('.text-gaming-glow')).toBeVisible();
  });

  test('should have functional hotkey system', async ({ page }) => {
    // Wait for application to initialize
    await page.waitForTimeout(2000);

    // Test F12 hotkey for help
    await page.keyboard.press('F12');
    await expect(page.locator('#hotkey-help-overlay')).toBeVisible();

    // Close help with F12 again
    await page.keyboard.press('F12');
    await expect(page.locator('#hotkey-help-overlay')).toBeHidden();

    // Test F1 hotkey for read now
    await page.keyboard.press('F1');
    // Should trigger OCR processing

    // Test F9 for performance report
    await page.keyboard.press('F9');
    await expect(page.locator('#performance-overlay')).toBeVisible();
  });

  test('should open and use settings with gaming features', async ({ page }) => {
    // Open settings
    await page.click('#settings-btn');
    await expect(page.locator('#settings-modal')).toBeVisible();

    // Check for gaming-specific controls
    await expect(page.locator('#auto-calibrate')).toBeVisible();
    await expect(page.locator('#toggle-history')).toBeVisible();
    await expect(page.locator('#performance-report')).toBeVisible();
    await expect(page.locator('#multimonitor-controls')).toBeVisible();
    await expect(page.locator('#voice-command-panel')).toBeVisible();

    // Test auto-calibration button
    await page.click('#auto-calibrate');
    await expect(page.locator('#status-text')).toContainText(/calibrat/i);

    // Test history panel
    await page.click('#toggle-history');
    await expect(page.locator('#history-panel')).toBeVisible();
  });

  test('should handle OCR processing with Web Worker', async ({ page }) => {
    // Monitor console for worker messages
    const workerMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Worker')) {
        workerMessages.push(msg.text());
      }
    });

    // Trigger OCR processing
    await page.click('#read-now-btn');

    // Wait for processing to complete
    await page.waitForTimeout(3000);

    // Check that worker was used
    expect(workerMessages.some(msg =>
      msg.includes('preprocessing') || msg.includes('Worker')
    )).toBeTruthy();
  });

  test('should support voice commands when available', async ({ page }) => {
    // Check if voice commands are available
    const speechRecognitionSupported = await page.evaluate(() => {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    });

    if (speechRecognitionSupported) {
      // Open settings to access voice controls
      await page.click('#settings-btn');
      await expect(page.locator('#voice-command-panel')).toBeVisible();

      // Enable voice commands
      await page.click('#voice-toggle');
      await expect(page.locator('#start-listening')).toBeEnabled();

      // Test voice command help
      await page.evaluate(() => {
        // Simulate voice command help
        if (window.showVoiceCommandHelp) {
          window.showVoiceCommandHelp();
        }
      });
    }
  });

  test('should support multi-monitor gaming features', async ({ page }) => {
    // Open settings
    await page.click('#settings-btn');

    // Check multi-monitor controls
    await expect(page.locator('#multimonitor-controls')).toBeVisible();
    await expect(page.locator('#display-select')).toBeVisible();

    // Test gaming mode selection
    await page.click('#gaming-companion');
    await expect(page.locator('#gaming-companion')).toHaveClass(/bg-gaming-blue/);

    // Test secondary monitor option
    await page.selectOption('#display-select', 'popup');
    // Note: Actual popup testing would require special handling
  });

  test('should track performance metrics in real-time', async ({ page }) => {
    // Wait for performance monitoring to initialize
    await page.waitForTimeout(1000);

    // Trigger some OCR operations
    await page.click('#read-now-btn');
    await page.waitForTimeout(2000);

    // Check performance report
    await page.click('#performance-report');

    // Performance data should be tracked
    const performanceData = await page.evaluate(() => {
      return localStorage.getItem('performanceReport');
    });

    expect(performanceData).toBeTruthy();
  });

  test('should save and load gaming sessions', async ({ page }) => {
    // Trigger some activity to create history
    await page.click('#read-now-btn');
    await page.waitForTimeout(2000);

    // Check that session data is being saved
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('ocrGameSession');
    });

    // History should be tracked
    const historyData = await page.evaluate(() => {
      return localStorage.getItem('ocrHistory');
    });

    expect(historyData).toBeTruthy();
  });

  test('should handle audio feedback without errors', async ({ page }) => {
    // Monitor for audio-related errors
    const audioErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('audio')) {
        audioErrors.push(msg.text());
      }
    });

    // Test audio system
    await page.click('#test-tts-btn');
    await page.waitForTimeout(1000);

    // Trigger OCR which should play recognition sound
    await page.click('#read-now-btn');
    await page.waitForTimeout(3000);

    // Should not have audio errors
    expect(audioErrors.length).toBe(0);
  });

  test('should work with gaming UI interactions', async ({ page }) => {
    // Test gaming UI responsiveness
    await page.hover('.gaming-glow');
    await page.hover('.btn-primary');

    // Test floating animations
    await expect(page.locator('.animate-float')).toBeVisible();

    // Test glassmorphism effects
    await expect(page.locator('.glass')).toHaveCSS('backdrop-filter', /blur/);

    // Test gaming color scheme
    const primaryButton = page.locator('.btn-primary');
    await expect(primaryButton).toHaveCSS('background', /gradient/);
  });

  test('should handle rapid hotkey presses without crashes', async ({ page }) => {
    // Wait for initialization
    await page.waitForTimeout(2000);

    // Rapid hotkey testing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('F1');
      await page.waitForTimeout(200);
    }

    // Application should still be responsive
    await expect(page.locator('#main-app')).toBeVisible();
    await expect(page.locator('#status-text')).toBeVisible();
  });

  test('should maintain performance under gaming load', async ({ page }) => {
    // Enable monitoring for continuous processing
    await page.click('#monitor-toggle');
    await page.waitForTimeout(5000); // Let it process for 5 seconds

    // Check memory usage hasn't exploded
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }
      return 0;
    });

    // Memory should be reasonable (under 200MB)
    expect(memoryUsage).toBeLessThan(200);

    // Stop monitoring
    await page.click('#monitor-toggle');
  });
});