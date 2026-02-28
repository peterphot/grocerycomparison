import { test, expect } from '@playwright/test';

test.describe('Form Interactions', () => {
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
    await page.getByPlaceholder('e.g. milk 2L').first().fill('milk');
    await expect(compareButton).toBeEnabled();

    // Clear the name
    await page.getByPlaceholder('e.g. milk 2L').first().fill('');
    await expect(compareButton).toBeDisabled();
  });
});
