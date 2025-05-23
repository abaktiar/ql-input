import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the dev server to be ready
    console.log('⏳ Waiting for dev server...');
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="ql-input"]', { timeout: 30000 });
    console.log('✅ Dev server is ready');

    // You can add more global setup tasks here
    // e.g., authentication, database seeding, etc.

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;
