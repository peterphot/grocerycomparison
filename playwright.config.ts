import { defineConfig } from '@playwright/test';
import { MOCK_PORT } from './e2e/e2e.config';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev --workspace=frontend',
      url: 'http://localhost:3000',
      env: { NEXT_PUBLIC_API_URL: `http://localhost:${MOCK_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npx tsx e2e/fixtures/mock-server.ts',
      url: `http://localhost:${MOCK_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
