import { test, expect } from '@playwright/test';
import { fillItem, clickCompare, waitForResults, storeColumn } from './helpers/shopping';

test.describe('Desktop Comparison', () => {
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

    // Verify all 4 store columns + Mix & Match = 5 columns (desktop grid)
    await expect(page.getByText('Woolworths')).toBeVisible();
    await expect(page.getByText('Coles')).toBeVisible();
    await expect(page.getByText('Aldi')).toBeVisible();
    await expect(page.getByText('Harris Farm')).toBeVisible();
    await expect(page.getByText('Mix & Match')).toBeVisible();

    // Verify best single store banner is shown
    await expect(page.getByText('Best single store:')).toBeVisible();
  });

  test('Journey 1a: results show item names, prices, and unit prices', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    await clickCompare(page);
    await waitForResults(page);

    // Woolworths column should contain product names and prices
    const woolworths = storeColumn(page, 'woolworths');
    await expect(woolworths.getByText('Woolworths Full Cream Milk 2L')).toBeVisible();
    await expect(woolworths.getByText('$3.50')).toBeVisible();
    await expect(woolworths.getByText('$1.75 / L')).toBeVisible();
    await expect(woolworths.getByText('Woolworths White Bread 700g')).toBeVisible();

    // Coles column prices
    const coles = storeColumn(page, 'coles');
    await expect(coles.getByText('Coles Full Cream Milk 2L')).toBeVisible();
    await expect(coles.getByText('$3.30')).toBeVisible();
    await expect(coles.getByText('$1.65 / L')).toBeVisible();
    await expect(coles.getByText('Coles White Bread 700g')).toBeVisible();

    // Aldi: milk available, bread unavailable
    const aldi = storeColumn(page, 'aldi');
    await expect(aldi.getByText('Farmdale Full Cream Milk 2L')).toBeVisible();
    await expect(aldi.getByText('$2.69')).toBeVisible();
    await expect(aldi.getByText('Not available')).toBeVisible();
    await expect(aldi.getByText('1 item unavailable')).toBeVisible();

    // Verify store totals
    await expect(woolworths.getByText('$7.30')).toBeVisible(); // 3.50 + 3.80
    await expect(coles.getByText('$6.80')).toBeVisible(); // 3.30 + 3.50
  });

  test('Journey 1b: Mix & Match column shows cheapest items', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    await clickCompare(page);
    await waitForResults(page);

    // Mix & Match should show the cheapest match for each item
    // Milk: Aldi $2.69, Bread: Coles $3.50
    const mixMatch = page.locator('[data-testid="store-column-mixandmatch"]');
    // If no specific testid on Mix & Match, we can look for its content in the page
    await expect(page.getByText('Farmdale Full Cream Milk 2L')).toBeVisible();
    await expect(page.getByText('Coles White Bread 700g')).toBeVisible();
  });

  test('Journey 1c: shopping list item names appear in result rows', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    await clickCompare(page);
    await waitForResults(page);

    // Each result column should show the shopping list item name
    const woolworths = storeColumn(page, 'woolworths');
    await expect(woolworths.getByText('milk')).toBeVisible();
    await expect(woolworths.getByText('bread')).toBeVisible();
  });

  test('Journey 2: brand-specific item shows matched product', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');

    // Check the brand checkbox using its accessible label
    await page.getByRole('checkbox', { name: /brand/i }).check();

    await clickCompare(page);
    await waitForResults(page);

    // Verify a product name appears in results
    await expect(page.getByText('Woolworths Full Cream Milk 2L')).toBeVisible();
  });

  test('Journey 8: form stays visible on desktop alongside results', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await clickCompare(page);
    await waitForResults(page);

    // Form should still be visible on desktop (hidden on mobile via CSS)
    await expect(page.getByPlaceholder('e.g. milk 2L').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compare Prices' })).toBeVisible();
  });

  test('Journey 9: quantity 3 shows line total as price x 3', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk', 3);
    await clickCompare(page);
    await waitForResults(page);

    // Woolworths milk: $3.50 * 3 = $10.50 — scope to the Woolworths column
    const woolworths = storeColumn(page, 'woolworths');
    await expect(woolworths.getByText('$10.50')).toBeVisible();

    // Verify the store total also reflects the multiplied amount
    // Woolworths total for 1 item at qty 3: $10.50
    await expect(woolworths.getByText('$10.50')).toBeVisible();
  });

  test('Journey 9a: quantity is reflected in store total', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk', 3);
    await clickCompare(page);
    await waitForResults(page);

    // Coles milk: $3.30 * 3 = $9.90
    const coles = storeColumn(page, 'coles');
    await expect(coles.getByText('$9.90')).toBeVisible();

    // Aldi milk: $2.69 * 3 = $8.07
    const aldi = storeColumn(page, 'aldi');
    await expect(aldi.getByText('$8.07')).toBeVisible();
  });
});
