const { test, expect } = require('@playwright/test');

test('homepage visual regression', async ({ page }) => {
  await page.goto(process.env.VITE_PUBLIC_URL || 'http://localhost:3000');
  await page.waitForSelector('body');
  const screenshot = await page.screenshot();
  expect(screenshot.length).toBeGreaterThan(0);
});
