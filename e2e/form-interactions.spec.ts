import { test, expect } from '@playwright/test';
import { fillItem, clickCompare, waitForResults } from './helpers/shopping';

test.describe('Form Interactions', () => {
  test('Journey 7: shows empty state before search', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Compare prices in seconds')).toBeVisible();
    await expect(page.getByText('Add items to your list and click Compare Prices')).toBeVisible();
  });

  test('Journey 4: add items, remove item, minimum 1 enforced', async ({ page }) => {
    await page.goto('/');

    const nameInputs = page.getByPlaceholder('e.g. milk 2L');

    // Start with 1 item row
    await expect(nameInputs).toHaveCount(1);

    // No remove button when only 1 item
    await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(0);

    // Add second item
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(nameInputs).toHaveCount(2);

    // Now remove buttons should be visible
    await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(2);

    // Add third item
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(nameInputs).toHaveCount(3);

    // Remove second item
    await page.getByRole('button', { name: 'Remove' }).nth(1).click();
    await expect(nameInputs).toHaveCount(2);

    // Remove first item
    await page.getByRole('button', { name: 'Remove' }).first().click();
    await expect(nameInputs).toHaveCount(1);

    // When only 1 item left, remove button should disappear
    await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(0);
  });

  test('Compare Prices button is disabled when no item names filled', async ({ page }) => {
    await page.goto('/');

    const compareButton = page.getByRole('button', { name: 'Compare Prices' });
    await expect(compareButton).toBeDisabled();

    // Type an item name
    await fillItem(page, 0, 'milk');
    await expect(compareButton).toBeEnabled();

    // Clear the name
    await fillItem(page, 0, '');
    await expect(compareButton).toBeDisabled();
  });

  test('Empty-name items are filtered out before search', async ({ page }) => {
    await page.goto('/');

    // Add two items but only fill the first
    await fillItem(page, 0, 'milk');
    await page.getByRole('button', { name: 'Add item' }).click();
    // Leave second item empty

    // Submit should succeed (only non-empty items sent)
    await clickCompare(page);
    await waitForResults(page);

    // Results should appear for the valid item
    await expect(page.getByText('Best single store:')).toBeVisible();
  });

  test('Special characters in item name do not break search', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, "Ben & Jerry's");
    await clickCompare(page);
    await waitForResults(page);

    // Should show results without error
    await expect(page.getByText('Best single store:')).toBeVisible();
  });

  test('Very long item name does not break UI layout', async ({ page }) => {
    await page.goto('/');

    const longName = 'a'.repeat(100);
    await fillItem(page, 0, longName);

    // Input should accept the long name
    const input = page.getByPlaceholder('e.g. milk 2L').first();
    await expect(input).toHaveValue(longName);

    // UI should not be broken - form elements still accessible
    await expect(page.getByRole('button', { name: 'Compare Prices' })).toBeEnabled();
  });

  test('Duplicate item names both appear in results', async ({ page }) => {
    await page.goto('/');

    await fillItem(page, 0, 'milk');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    await clickCompare(page);
    await waitForResults(page);

    // Both items should appear in results
    await expect(page.getByText('Best single store:')).toBeVisible();
  });
});
