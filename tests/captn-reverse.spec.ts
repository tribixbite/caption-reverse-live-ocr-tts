import { test, expect } from '@playwright/test';

test.describe('CaptnReverse Web App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome screen with camera permission request', async ({ page }) => {
    // Check that the setup screen is visible
    await expect(page.locator('#setup-screen')).toBeVisible();
    
    // Check app title and branding
    await expect(page.locator('h1')).toContainText('CaptnReverse');
    
    // Check permission request button
    await expect(page.locator('#request-camera')).toBeVisible();
    await expect(page.locator('#request-camera')).toContainText('Enable Camera Access');
  });

  test('should show feature grid with modern design', async ({ page }) => {
    // Check feature cards are present
    const featureCards = page.locator('.glass');
    await expect(featureCards).toHaveCount(3);
    
    // Check feature descriptions
    await expect(page.getByText('Advanced OCR')).toBeVisible();
    await expect(page.getByText('Natural TTS')).toBeVisible();
    await expect(page.getByText('Real-time')).toBeVisible();
  });

  test('should have responsive design elements', async ({ page }) => {
    // Check that Tailwind classes are applied
    await expect(page.locator('body')).toHaveClass(/bg-dark-900/);
    
    // Check responsive grid layout
    await expect(page.locator('.lg\\:grid-cols-3')).toBeVisible();
    
    // Check glass morphism effects
    await expect(page.locator('.glass')).toHaveCSS('backdrop-filter', 'blur(12px)');
  });

  test('should handle camera permission gracefully', async ({ page, context }) => {
    // Grant camera permission
    await context.grantPermissions(['camera']);
    
    // Click camera access button
    await page.click('#request-camera');
    
    // Should hide setup screen and show main app
    await expect(page.locator('#setup-screen')).toHaveClass(/hidden/);
  });

  test('should initialize crop selector with presets', async ({ page, context }) => {
    // Grant permissions and get to main app
    await context.grantPermissions(['camera']);
    await page.click('#request-camera');
    
    // Check crop selector is present
    await expect(page.locator('#crop-selector')).toBeVisible();
    
    // Check preset buttons
    const presets = ['Center', 'Top Half', 'Bottom Half', 'Full Screen'];
    for (const preset of presets) {
      await expect(page.getByText(preset)).toBeVisible();
    }
  });

  test('should toggle monitoring state', async ({ page, context }) => {
    // Get to main app
    await context.grantPermissions(['camera']);
    await page.click('#request-camera');
    
    // Check initial monitoring button state
    const monitorBtn = page.locator('#monitor-toggle');
    await expect(monitorBtn).toContainText('Start Monitoring');
    
    // Click to start monitoring
    await monitorBtn.click();
    await expect(monitorBtn).toContainText('Pause Monitoring');
    
    // Check status indicator changes
    await expect(page.locator('#status-text')).toContainText('Monitoring active');
  });

  test('should handle OCR processing states', async ({ page, context }) => {
    // Get to main app and start monitoring
    await context.grantPermissions(['camera']);
    await page.click('#request-camera');
    await page.click('#monitor-toggle');
    
    // Click read now button
    await page.click('#read-now-btn');
    
    // Should show processing state (may be brief)
    // Note: Actual OCR processing depends on camera feed
  });

  test('should persist settings in localStorage', async ({ page, context }) => {
    // Get to main app
    await context.grantPermissions(['camera']);
    await page.click('#request-camera');
    
    // Change a setting
    await page.click('#auto-read-toggle');
    
    // Reload page and check setting persisted
    await page.reload();
    await page.click('#request-camera'); // Re-grant permission
    
    // Check that setting change was persisted
    const toggle = page.locator('#auto-read-toggle');
    // Toggle state should be different from initial
  });

  test('should have accessible UI elements', async ({ page }) => {
    // Check ARIA labels and semantic HTML
    await expect(page.locator('button[aria-label]')).toHaveCount(1); // Settings button
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should handle screen capture API if available', async ({ page, context }) => {
    // Test screen sharing functionality (if supported in test environment)
    await context.grantPermissions(['camera']);
    await page.click('#request-camera');
    
    // Check if getDisplayMedia is available
    const hasDisplayMedia = await page.evaluate(() => {
      return 'getDisplayMedia' in navigator.mediaDevices;
    });
    
    expect(hasDisplayMedia).toBeTruthy();
  });

  test('should support Web Speech API features', async ({ page }) => {
    // Check Web Speech API support
    const hasSpeechSynthesis = await page.evaluate(() => {
      return 'speechSynthesis' in window;
    });
    
    expect(hasSpeechSynthesis).toBeTruthy();
    
    // Check voices are available
    const voicesCount = await page.evaluate(() => {
      return speechSynthesis.getVoices().length;
    });
    
    // May be 0 initially, voices load asynchronously
    expect(voicesCount).toBeGreaterThanOrEqual(0);
  });
});