import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  // Add any cleanup tasks here
  // e.g., cleanup test data, close connections, etc.
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
