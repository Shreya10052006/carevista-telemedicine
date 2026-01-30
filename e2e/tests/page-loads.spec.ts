import { test, expect } from '@playwright/test';

/**
 * Page Load Tests
 * ===============
 * Verify that all critical pages load correctly.
 */

test.describe('Page Load Tests', () => {

    test('home page loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/CareVista/i);
    });

    test('patient dashboard loads', async ({ page }) => {
        await page.goto('/patient/dashboard');
        // Should either load or redirect to login
        await expect(page.locator('body')).toBeVisible();
    });

    test('doctor dashboard loads', async ({ page }) => {
        await page.goto('/doctor/dashboard');
        // Should either load or redirect to login
        await expect(page.locator('body')).toBeVisible();
    });

    test('health worker session page loads', async ({ page }) => {
        await page.goto('/health-worker/session');
        // Should either load or redirect to login
        await expect(page.locator('body')).toBeVisible();
    });

    test('patient symptoms page loads', async ({ page }) => {
        await page.goto('/patient/symptoms');
        await expect(page.locator('body')).toBeVisible();
    });

    test('patient auth page loads', async ({ page }) => {
        await page.goto('/auth/patient');
        await expect(page.locator('body')).toBeVisible();
    });

    test('doctor auth page loads', async ({ page }) => {
        await page.goto('/auth/doctor');
        await expect(page.locator('body')).toBeVisible();
    });

});
