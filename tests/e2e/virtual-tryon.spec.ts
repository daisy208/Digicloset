import { test, expect } from '@playwright/test';

test.describe('Virtual Try-On Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
  });

  test('complete virtual try-on workflow', async ({ page }) => {
    // Upload user photo
    await page.setInputFiles('input[type="file"]', {
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    // Wait for photo to be processed
    await expect(page.locator('[data-testid="user-photo"]')).toBeVisible();

    // Navigate to catalog
    await page.click('[data-testid="catalog-tab"]');

    // Select a clothing item
    await page.click('[data-testid="clothing-item"]:first-child');

    // Verify item is selected
    await expect(page.locator('[data-testid="selected-items"]')).toContainText('1');

    // Navigate back to try-on
    await page.click('[data-testid="tryon-tab"]');

    // Adjust lighting
    await page.click('[data-testid="lighting-tab"]');
    await page.fill('[data-testid="brightness-slider"]', '120');
    await page.fill('[data-testid="warmth-slider"]', '70');

    // Export result
    await page.click('[data-testid="export-button"]');

    // Wait for processing
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeHidden({ timeout: 10000 });

    // Verify export success
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  });

  test('AI analysis workflow', async ({ page }) => {
    // Upload photo
    await page.setInputFiles('input[type="file"]', {
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    // Navigate to AI analysis
    await page.click('[data-testid="ai-analysis-tab"]');

    // Wait for analysis to complete
    await expect(page.locator('[data-testid="analysis-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 15000 });

    // Verify analysis results
    await expect(page.locator('[data-testid="body-shape"]')).toBeVisible();
    await expect(page.locator('[data-testid="skin-tone"]')).toBeVisible();
    await expect(page.locator('[data-testid="body-measurements"]')).toBeVisible();
  });

  test('recommendations workflow', async ({ page }) => {
    // Complete AI analysis first
    await page.setInputFiles('input[type="file"]', {
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await page.click('[data-testid="ai-analysis-tab"]');
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 15000 });

    // Navigate to recommendations
    await page.click('[data-testid="recommendations-tab"]');

    // Wait for recommendations to load
    await expect(page.locator('[data-testid="recommendations-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendation-items"]')).toBeVisible({ timeout: 10000 });

    // Verify recommendations are displayed
    const recommendationItems = page.locator('[data-testid="recommendation-item"]');
    await expect(recommendationItems).toHaveCount(4, { timeout: 5000 });

    // Select a recommended item
    await recommendationItems.first().click();

    // Verify item is added to selection
    await expect(page.locator('[data-testid="selected-items"]')).toContainText('1');
  });

  test('error handling', async ({ page }) => {
    // Test invalid file upload
    await page.setInputFiles('input[type="file"]', {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not-an-image')
    });

    // Verify error message
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('Invalid file type');

    // Test network error simulation
    await page.route('/api/try-on/upload-photo', route => route.abort());
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
  });

  test('responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify tablet layout
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Verify desktop layout
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
  });

  test('performance benchmarks', async ({ page }) => {
    // Start performance monitoring
    await page.addInitScript(() => {
      window.performanceMarks = [];
      const originalMark = performance.mark;
      performance.mark = function(name) {
        window.performanceMarks.push({ name, time: Date.now() });
        return originalMark.call(this, name);
      };
    });

    // Upload photo and measure time
    const startTime = Date.now();
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await expect(page.locator('[data-testid="user-photo"]')).toBeVisible();
    
    const uploadTime = Date.now() - startTime;
    expect(uploadTime).toBeLessThan(5000); // Should complete within 5 seconds

    // Measure AI analysis time
    const analysisStartTime = Date.now();
    
    await page.click('[data-testid="ai-analysis-tab"]');
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 15000 });
    
    const analysisTime = Date.now() - analysisStartTime;
    expect(analysisTime).toBeLessThan(10000); // Should complete within 10 seconds

    // Check for performance marks
    const marks = await page.evaluate(() => window.performanceMarks);
    expect(marks.length).toBeGreaterThan(0);
  });
});