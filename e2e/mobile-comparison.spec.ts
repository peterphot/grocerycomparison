import { test, expect } from '@playwright/test';
import { fillItem, clickCompare, waitForResults } from './helpers/shopping';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Mobile Comparison', () => {
  test('Journey 3: form stacks vertically and results appear', async ({ page }) => {
    await page.goto('/');

    // The form should be visible
    await expect(page.getByPlaceholder('e.g. milk 2L').first()).toBeVisible();

    // Fill an item
    await fillItem(page, 0, 'milk');

    // Add second item
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    // Compare
    await clickCompare(page);
    await waitForResults(page);

    // Results should show store names
    await expect(page.getByText('Woolworths')).toBeVisible();
    await expect(page.getByText('Coles')).toBeVisible();
    await expect(page.getByText('Best single store:')).toBeVisible();
  });
});
