import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { mockComparisonResponse } from '../fixtures/comparison-response';
import { ComparisonResults } from '../../src/components/results/ComparisonResults';
import { StoreColumn } from '../../src/components/results/StoreColumn';
import { ItemRow } from '../../src/components/results/ItemRow';
import { MixAndMatchColumn } from '../../src/components/results/MixAndMatchColumn';
import { StoreHeader } from '../../src/components/results/StoreHeader';
import { formatPrice, formatUnitPrice } from '../../src/lib/utils';

describe('ComparisonResults', () => {
  it('renders a column for each store', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    expect(screen.getByText('Coles')).toBeInTheDocument();
    expect(screen.getByText('Woolworths')).toBeInTheDocument();
    expect(screen.getByText('Harris Farm')).toBeInTheDocument();
    expect(screen.getByText('Aldi')).toBeInTheDocument();
  });

  it('renders mix-and-match column', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    expect(screen.getByText('Mix & Match')).toBeInTheDocument();
  });

  it('shows cheapest fully-available store in banner', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    // Coles ($15.60) is cheapest among stores with allItemsAvailable=true
    // Aldi ($6.47) is excluded because it has unavailable items
    expect(screen.getByText(/Best single store[\s\S]*Coles/)).toBeInTheDocument();
  });

  it('falls back to cheapest overall when no store has all items', () => {
    const allPartial = {
      ...mockComparisonResponse,
      storeTotals: mockComparisonResponse.storeTotals.map(st => ({
        ...st,
        allItemsAvailable: false,
      })),
    };
    render(<ComparisonResults response={allPartial} />);
    // Aldi ($6.47) is cheapest when no store is fully available
    expect(screen.getByText(/Best single store[\s\S]*Aldi/)).toBeInTheDocument();
  });

  it('returns null when storeTotals is empty', () => {
    const emptyResponse = { ...mockComparisonResponse, storeTotals: [] };
    const { container } = render(<ComparisonResults response={emptyResponse} />);
    expect(container.innerHTML).toBe('');
  });

  it('derives grid columns dynamically from store count', () => {
    const twoStores = {
      ...mockComparisonResponse,
      storeTotals: mockComparisonResponse.storeTotals.slice(0, 2),
    };
    const { container } = render(<ComparisonResults response={twoStores} />);
    const grid = container.querySelector('[style]');
    // 2 stores + 1 mix-and-match = 3 columns
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' });
  });
});

describe('ItemRow', () => {
  const availableItem = mockComparisonResponse.storeTotals[0].items[0]; // Coles milk, has unitPrice
  const unavailableItem = mockComparisonResponse.storeTotals[3].items[2]; // Aldi eggs, match null
  const noUnitPriceItem = mockComparisonResponse.storeTotals[0].items[2]; // Coles eggs, unitPrice null

  it('shows product name for available item', () => {
    render(<ItemRow match={availableItem.match} lineTotal={availableItem.lineTotal} />);
    expect(screen.getByText('Coles Full Cream Milk 2L')).toBeInTheDocument();
  });

  it('shows line total as formatted price', () => {
    render(<ItemRow match={availableItem.match} lineTotal={availableItem.lineTotal} />);
    expect(screen.getByText('$3.10')).toBeInTheDocument();
  });

  it('shows unit price label when unitPrice is present', () => {
    render(<ItemRow match={availableItem.match} lineTotal={availableItem.lineTotal} />);
    expect(screen.getByText('$1.55 / L')).toBeInTheDocument();
  });

  it('does not show unit price when unitPrice is null', () => {
    render(<ItemRow match={noUnitPriceItem.match} lineTotal={noUnitPriceItem.lineTotal} />);
    expect(screen.getByText('Coles Free Range Eggs 12pk')).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toHaveTextContent('/ ');
  });

  it('shows "Not available" when match is null', () => {
    render(<ItemRow match={unavailableItem.match} lineTotal={unavailableItem.lineTotal} />);
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });
});

describe('StoreColumn', () => {
  const colesStore = mockComparisonResponse.storeTotals[0];

  it('renders store name in header', () => {
    render(<StoreColumn storeTotal={colesStore} isCheapest={false} />);
    expect(screen.getByText('Coles')).toBeInTheDocument();
  });

  it('renders an ItemRow for each item', () => {
    render(<StoreColumn storeTotal={colesStore} isCheapest={false} />);
    expect(screen.getByText('Coles Full Cream Milk 2L')).toBeInTheDocument();
    expect(screen.getByText('Coles White Bread 700g')).toBeInTheDocument();
    expect(screen.getByText('Coles Free Range Eggs 12pk')).toBeInTheDocument();
  });

  it('renders store total', () => {
    render(<StoreColumn storeTotal={colesStore} isCheapest={false} />);
    expect(screen.getByText('$15.60')).toBeInTheDocument();
  });
});

describe('MixAndMatchColumn', () => {
  const mixAndMatch = mockComparisonResponse.mixAndMatch;

  it('renders Mix & Match header', () => {
    render(<MixAndMatchColumn mixAndMatch={mixAndMatch} />);
    expect(screen.getByText('Mix & Match')).toBeInTheDocument();
  });

  it('renders cheapest item from each store', () => {
    render(<MixAndMatchColumn mixAndMatch={mixAndMatch} />);
    expect(screen.getByText('Farmdale Milk 2L')).toBeInTheDocument();
    expect(screen.getByText('Baker Life White Bread 700g')).toBeInTheDocument();
    expect(screen.getByText('Coles Free Range Eggs 12pk')).toBeInTheDocument();
  });

  it('renders mix-and-match total', () => {
    render(<MixAndMatchColumn mixAndMatch={mixAndMatch} />);
    expect(screen.getByText('$11.97')).toBeInTheDocument();
  });

  it('shows "Not available" for items without a cheapest match', () => {
    const withUnavailable = {
      ...mixAndMatch,
      items: [
        ...mixAndMatch.items,
        { shoppingListItemId: 'item-4', shoppingListItemName: 'caviar', quantity: 1, cheapestMatch: null, lineTotal: 0 },
      ],
    };
    render(<MixAndMatchColumn mixAndMatch={withUnavailable} />);
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });
});

describe('StoreHeader', () => {
  it('renders store name', () => {
    render(<StoreHeader storeName="Coles" store="coles" isCheapest={false} />);
    expect(screen.getByText('Coles')).toBeInTheDocument();
  });

  it('applies brand colour as background', () => {
    render(<StoreHeader storeName="Coles" store="coles" isCheapest={false} />);
    const header = screen.getByText('Coles');
    expect(header).toHaveStyle({ backgroundColor: '#E2001A' });
  });

  it('applies ring class when isCheapest is true', () => {
    render(<StoreHeader storeName="Aldi" store="aldi" isCheapest={true} />);
    const header = screen.getByText('Aldi');
    expect(header.className).toContain('ring-2');
    expect(header.className).toContain('ring-green-400');
  });

  it('does not apply ring class when isCheapest is false', () => {
    render(<StoreHeader storeName="Aldi" store="aldi" isCheapest={false} />);
    const header = screen.getByText('Aldi');
    expect(header.className).not.toContain('ring-2');
  });
});

describe('formatPrice', () => {
  it('formats a standard price', () => {
    expect(formatPrice(3.10)).toBe('$3.10');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('pads single decimal place', () => {
    expect(formatPrice(0.1)).toBe('$0.10');
  });

  it('rounds floating-point correctly', () => {
    expect(formatPrice(1.005)).toBe('$1.01');
  });
});

describe('formatUnitPrice', () => {
  it('formats unit price with measure', () => {
    expect(formatUnitPrice(1.55, 'L')).toBe('$1.55 / L');
  });

  it('formats unit price per 100g', () => {
    expect(formatUnitPrice(0.50, '100g')).toBe('$0.50 / 100g');
  });
});
