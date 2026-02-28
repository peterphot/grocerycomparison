import type { Page, Locator } from '@playwright/test';

/**
 * Fill an item row in the shopping list form.
 * @param page - Playwright page
 * @param index - 0-based index of the item row
 * @param name - Item name to type
 * @param quantity - Optional quantity (defaults to leaving as-is)
 */
export async function fillItem(
  page: Page,
  index: number,
  name: string,
  quantity?: number,
): Promise<void> {
  const nameInputs = page.getByPlaceholder('e.g. milk 2L');
  await nameInputs.nth(index).fill(name);

  if (quantity !== undefined) {
    const qtyInputs = page.getByLabel('Quantity');
    await qtyInputs.nth(index).fill(String(quantity));
  }
}

/**
 * Click the Compare Prices button.
 */
export async function clickCompare(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Compare Prices' }).click();
}

/**
 * Wait for comparison results to appear (store columns rendered).
 */
export async function waitForResults(page: Page): Promise<void> {
  await page.getByText('Best single store:').waitFor({ state: 'visible' });
}

/**
 * Get a locator scoped to a specific store's result column by test ID.
 */
export function storeColumn(page: Page, storeKey: string): Locator {
  return page.getByTestId(`store-column-${storeKey}`);
}
