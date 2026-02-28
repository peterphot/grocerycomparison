import { test, expect } from '@playwright/test';
import { fillItem, clickCompare, waitForResults } from './helpers/shopping';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Mobile Comparison', () => {
  test('Journey 3: form stacks vertically and results use tabs', async ({ page }) => {
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

    // Mobile tabs should be visible
    const tabList = page.getByTestId('mobile-store-tabs');
    await expect(tabList).toBeVisible();

    // Tab buttons for each store should exist
    await expect(tabList.getByRole('tab', { name: 'Coles' })).toBeVisible();
    await expect(tabList.getByRole('tab', { name: 'Woolworths' })).toBeVisible();
    await expect(tabList.getByRole('tab', { name: 'Aldi' })).toBeVisible();
    await expect(tabList.getByRole('tab', { name: 'Harris Farm' })).toBeVisible();
    await expect(tabList.getByRole('tab', { name: 'Mix & Match' })).toBeVisible();
  });

  test('Journey 3a: tapping store tabs switches content', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    await clickCompare(page);
    await waitForResults(page);

    const tabList = page.getByTestId('mobile-store-tabs');
    const panel = page.getByTestId('mobile-store-panel');

    // Default should show first store (Woolworths based on fixture order)
    // Click Coles tab
    await tabList.getByRole('tab', { name: 'Coles' }).click();
    await expect(panel.getByText('Coles Full Cream Milk 2L')).toBeVisible();

    // Click Woolworths tab
    await tabList.getByRole('tab', { name: 'Woolworths' }).click();
    await expect(panel.getByText('Woolworths Full Cream Milk 2L')).toBeVisible();

    // Click Aldi tab
    await tabList.getByRole('tab', { name: 'Aldi' }).click();
    await expect(panel.getByText('Farmdale Full Cream Milk 2L')).toBeVisible();
    await expect(panel.getByText('Not available')).toBeVisible();
  });

  test('Journey 3b: Mix & Match tab is accessible', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    await clickCompare(page);
    await waitForResults(page);

    const tabList = page.getByTestId('mobile-store-tabs');

    // Click Mix & Match tab
    await tabList.getByRole('tab', { name: 'Mix & Match' }).click();

    const panel = page.getByTestId('mobile-store-panel');
    // Should show cheapest items
    await expect(panel.getByText('Farmdale Full Cream Milk 2L')).toBeVisible();
    await expect(panel.getByText('Coles White Bread 700g')).toBeVisible();
  });

  test('Journey 3c: Edit List button visible on mobile', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await clickCompare(page);
    await waitForResults(page);

    // Edit List button should be visible on mobile
    await expect(page.getByRole('button', { name: 'Edit List' })).toBeVisible();
  });

  test('Mobile form: add and remove items works at mobile viewport', async ({ page }) => {
    await page.goto('/');

    const nameInputs = page.getByPlaceholder('e.g. milk 2L');

    // Start with 1 item
    await expect(nameInputs).toHaveCount(1);

    // Add items
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(nameInputs).toHaveCount(2);

    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(nameInputs).toHaveCount(3);

    // Remove middle item
    await page.getByRole('button', { name: 'Remove' }).nth(1).click();
    await expect(nameInputs).toHaveCount(2);
  });

  test('Mobile error state: error banner renders correctly on small viewport', async ({ page }) => {
    await page.goto('/');

    await page.route('**/api/search', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await fillItem(page, 0, 'milk');
    await clickCompare(page);

    await expect(page.getByText(/couldn't reach any stores/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });
});
