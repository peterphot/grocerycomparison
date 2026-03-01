import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { mockComparisonResponse } from '../fixtures/comparison-response';
import Home from '../../src/app/page';

let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  });
});

describe('Header', () => {
  it('renders GroceryCompare logo text', () => {
    render(<Home />);
    expect(screen.getByText('GroceryCompare')).toBeInTheDocument();
  });

  it('renders tagline', () => {
    render(<Home />);
    expect(
      screen.getByText('Compare prices across Australian supermarkets'),
    ).toBeInTheDocument();
  });

  it('renders Beta badge', () => {
    render(<Home />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('does not render Help link (UX1 - removed)', () => {
    render(<Home />);
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
  });
});

describe('HomePage', () => {
  it('renders shopping list form initially', () => {
    render(<Home />);
    expect(
      screen.getByRole('button', { name: /compare prices/i }),
    ).toBeInTheDocument();
  });

  it('shows empty state with redesigned content (S1)', () => {
    render(<Home />);
    expect(
      screen.getByText('Start comparing prices'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Add items to your shopping list/),
    ).toBeInTheDocument();
    // Should show store badges
    expect(screen.getByText('Woolworths')).toBeInTheDocument();
    expect(screen.getByText('Coles')).toBeInTheDocument();
    expect(screen.getByText('Aldi')).toBeInTheDocument();
    expect(screen.getByText('Harris Farm')).toBeInTheDocument();
  });

  it('renders Header on all states', () => {
    render(<Home />);
    expect(screen.getByText('GroceryCompare')).toBeInTheDocument();
  });

  it('has page background color (M6)', () => {
    const { container } = render(<Home />);
    const main = container.querySelector('main');
    expect(main?.className).toContain('bg-[#F6FAF6]');
  });

  it('shows loading skeleton while search is in-flight', async () => {
    const user = userEvent.setup();

    // Use a delayed response to keep the loading state visible
    server.use(
      http.post('http://localhost:4000/api/search', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(mockComparisonResponse);
      }),
    );

    render(<Home />);

    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'milk');
    await user.click(screen.getByRole('button', { name: /compare prices/i }));

    const columns = document.querySelectorAll('[data-testid="skeleton-column"]');
    expect(columns).toHaveLength(5);
  });

  it('renders comparison results after successful search', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('http://localhost:4000/api/search', () => {
        return HttpResponse.json(mockComparisonResponse);
      }),
    );

    render(<Home />);

    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'milk');
    await user.click(screen.getByRole('button', { name: /compare prices/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Coles').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('Woolworths').length).toBeGreaterThanOrEqual(1);
  });

  it('renders error banner when search fails', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('http://localhost:4000/api/search', () => {
        return new HttpResponse(JSON.stringify({ message: 'Server error' }), {
          status: 500,
        });
      }),
    );

    render(<Home />);

    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'milk');
    await user.click(screen.getByRole('button', { name: /compare prices/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't reach any stores/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('clicking Try Again retries the search', async () => {
    const user = userEvent.setup();
    let callCount = 0;

    server.use(
      http.post('http://localhost:4000/api/search', () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(JSON.stringify({ message: 'Server error' }), {
            status: 500,
          });
        }
        return HttpResponse.json(mockComparisonResponse);
      }),
    );

    render(<Home />);

    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'milk');
    await user.click(screen.getByRole('button', { name: /compare prices/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't reach any stores/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Coles').length).toBeGreaterThanOrEqual(1);
    });
    expect(callCount).toBe(2);
  });

  it('keeps form visible alongside results after search', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('http://localhost:4000/api/search', () => {
        return HttpResponse.json(mockComparisonResponse);
      }),
    );

    render(<Home />);

    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'milk');
    await user.click(screen.getByRole('button', { name: /compare prices/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Coles').length).toBeGreaterThanOrEqual(1);
    });

    // Form should still be visible alongside results
    expect(screen.getByPlaceholderText('e.g. milk 2L')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compare prices/i })).toBeInTheDocument();
  });

  it('clicking Edit list returns to form view', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('http://localhost:4000/api/search', () => {
        return HttpResponse.json(mockComparisonResponse);
      }),
    );

    render(<Home />);

    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'milk');
    await user.click(screen.getByRole('button', { name: /compare prices/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Coles').length).toBeGreaterThanOrEqual(1);
    });

    // Edit list button in the SummaryPanel (desktop) or Header (mobile)
    const editButtons = screen.getAllByRole('button', { name: /edit list/i });
    await user.click(editButtons[0]);

    expect(
      screen.getByRole('button', { name: /compare prices/i }),
    ).toBeInTheDocument();
  });
});
