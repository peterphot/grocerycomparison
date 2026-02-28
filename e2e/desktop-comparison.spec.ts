import { test, expect } from '@playwright/test';
import { fillItem, clickCompare, waitForResults } from './helpers/shopping';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('Desktop Comparison', () => {
  test('Journey 7: shows empty state before search', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Compare prices in seconds')).toBeVisible();
    await expect(page.getByText('Add items to your list and click Compare Prices')).toBeVisible();
  });

  test('Journey 1: type items and see results with 5 columns', async ({ page }) => {
    await page.goto('/');

    // Fill first item
    await fillItem(page, 0, 'milk');

    // Add a second item
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    // Click compare
    await clickCompare(page);

    // Wait for results
    await waitForResults(page);

    // Verify all 4 store columns + Mix & Match = 5 columns
    await expect(page.getByText('Woolworths')).toBeVisible();
    await expect(page.getByText('Coles')).toBeVisible();
    await expect(page.getByText('Aldi')).toBeVisible();
    await expect(page.getByText('Harris Farm')).toBeVisible();
    await expect(page.getByText('Mix & Match')).toBeVisible();

    // Verify best single store banner is shown
    await expect(page.getByText('Best single store:')).toBeVisible();
  });

  test('Journey 2: brand-specific item shows matched product', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');

    // Check the brand checkbox
    const brandCheckbox = page.getByRole('checkbox');
    await brandCheckbox.first().check();

    await clickCompare(page);
    await waitForResults(page);

    // Verify a product name appears in results
    await expect(page.getByText('Woolworths Full Cream Milk 2L')).toBeVisible();
  });

  test('Journey 8: Edit List returns to form and allows re-compare', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await clickCompare(page);
    await waitForResults(page);

    // Click Edit List
    await page.getByRole('button', { name: 'Edit List' }).click();

    // Should be back to form with empty state
    await expect(page.getByText('Compare prices in seconds')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. milk 2L').first()).toBeVisible();

    // Re-compare
    await clickCompare(page);
    await waitForResults(page);

    // Results should show again
    await expect(page.getByText('Best single store:')).toBeVisible();
  });

  test('Journey 9: quantity 3 shows line total as price x 3', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk', 3);
    await clickCompare(page);
    await waitForResults(page);

    // The mock returns Woolworths milk at $3.50 * 3 = $10.50
    await expect(page.getByText('$10.50')).toBeVisible();
  });
});
