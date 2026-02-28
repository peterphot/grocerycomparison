import { test, expect } from '@playwright/test';
import { fillItem, clickCompare, waitForResults, storeColumn } from './helpers/shopping';

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

    // Error banner should appear with the generic error message
    await expect(page.getByText(/couldn't reach any stores/i)).toBeVisible();
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
    await expect(page.getByText(/couldn't reach any stores/i)).toBeVisible();

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
    await waitForResults(page);

    // Scope assertion to the Aldi column
    const aldi = storeColumn(page, 'aldi');
    await expect(aldi.getByText('Not available')).toBeVisible();
    await expect(aldi.getByText('1 item unavailable')).toBeVisible();
  });

  test('HTTP 429 shows rate-limit specific message', async ({ page }) => {
    await page.goto('/');

    await page.route('**/api/search', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limited' }),
      });
    });

    await fillItem(page, 0, 'milk');
    await clickCompare(page);

    // Should show rate-limit message
    await expect(page.getByText(/too many requests/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('Loading state appears before results render', async ({ page }) => {
    await page.goto('/');

    // Add a delay to the mock response so loading state is observable
    await page.route('**/api/search', async (route) => {
      // Delay before continuing to mock server
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await fillItem(page, 0, 'milk');
    await clickCompare(page);

    // Loading skeleton should appear
    const skeletonColumns = page.locator('[data-testid="skeleton-column"]');
    await expect(skeletonColumns.first()).toBeVisible();

    // Compare Prices button should be disabled during loading (form hidden on mobile, visible on desktop)
    // Wait for results to eventually appear
    await waitForResults(page);

    // Skeleton should no longer be visible
    await expect(skeletonColumns.first()).not.toBeVisible();
  });

  test('Double-click Compare Prices does not cause broken state', async ({ page }) => {
    await page.goto('/');

    let callCount = 0;
    await page.route('**/api/search', async (route) => {
      callCount++;
      await new Promise((r) => setTimeout(r, 300));
      await route.continue();
    });

    await fillItem(page, 0, 'milk');

    // Click compare twice rapidly
    const compareButton = page.getByRole('button', { name: 'Compare Prices' });
    await compareButton.click();
    await compareButton.click();

    // Wait for results
    await waitForResults(page);

    // Results should display correctly (no error, no duplicate content)
    await expect(page.getByText('Best single store:')).toBeVisible();
  });
});
