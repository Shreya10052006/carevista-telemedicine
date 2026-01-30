import { defineConfig, devices } from '@playwright/test';

/**
 * CareVista E2E Test Configuration
 * ================================
 * Playwright configuration for end-to-end testing.
 */

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile',
            use: { ...devices['Pixel 5'] },
        },
    ],

    /* Run local dev server before tests */
    webServer: [
        {
            command: 'cd ../frontend && npm run dev',
            url: 'http://localhost:3000',
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
        },
    ],
});
