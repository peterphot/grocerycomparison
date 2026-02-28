import { test, expect } from '@playwright/test';
import { fillItem, clickCompare, storeColumn } from './helpers/shopping';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('Error States', () => {
  test('Journey 5: backend 500 shows error banner with Try Again', async ({ page }) => {
    await page.goto('/');

    // Intercept the search API call and return 500
    await page.route('**/api/search', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await fillItem(page, 0, 'milk');
    await clickCompare(page);

    // Error banner should appear
    await expect(page.getByText('Something went wrong')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('Journey 5 continued: clicking Try Again retries the request', async ({ page }) => {
    await page.goto('/');

    let callCount = 0;

    // First call returns 500, second returns success
    await page.route('**/api/search', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        // Let it pass through to the mock server
        route.continue();
      }
    });

    await fillItem(page, 0, 'milk');
    await clickCompare(page);

    // Error banner should appear
    await expect(page.getByText('Something went wrong')).toBeVisible();

    // Click Try Again
    await page.getByRole('button', { name: 'Try Again' }).click();

    // Results should now appear
    await expect(page.getByText('Best single store:')).toBeVisible();
  });

  test('Journey 6: unavailable item shows "Not available" in Aldi column', async ({ page }) => {
    await page.goto('/');

    // The default mock response has bread unavailable at Aldi
    await fillItem(page, 0, 'milk');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillItem(page, 1, 'bread');

    await clickCompare(page);
    await expect(page.getByText('Best single store:')).toBeVisible();

    // Scope assertion to the Aldi column
    const aldi = storeColumn(page, 'Aldi');
    await expect(aldi.getByText('Not available')).toBeVisible();
  });
});
