import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { mockComparisonResponse } from '../fixtures/comparison-response';
import { ComparisonResults } from '../../src/components/results/ComparisonResults';
import { StoreColumn } from '../../src/components/results/StoreColumn';
import { ItemRow } from '../../src/components/results/ItemRow';
import { MixAndMatchColumn } from '../../src/components/results/MixAndMatchColumn';
import { StoreHeader } from '../../src/components/results/StoreHeader';
import { ResultColumn } from '../../src/components/results/ResultColumn';
import { formatPrice, formatUnitPrice, findCheapestStore } from '../../src/lib/utils';

describe('ComparisonResults', () => {
  it('renders a column for each store', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    // Both mobile tabs and desktop grid render in jsdom, so use getAllByText
    expect(screen.getAllByText('Coles').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Woolworths').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Harris Farm').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Aldi').length).toBeGreaterThanOrEqual(1);
  });

  it('renders mix-and-match column', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    expect(screen.getAllByText('Mix & Match').length).toBeGreaterThanOrEqual(1);
  });

  it('shows cheapest store in rich banner (C3)', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    expect(screen.getByText('Results found')).toBeInTheDocument();
    expect(screen.getByText(/Cheapest single store[\s\S]*Coles/)).toBeInTheDocument();
  });

  it('shows mix & match total in banner (C3)', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    expect(screen.getByText(/Best mix/)).toBeInTheDocument();
  });

  it('shows savings badge when mix & match is cheaper (C3)', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    // Coles total is $15.60, mix & match is $11.97, savings = $3.63
    expect(screen.getByText(/Save \$3\.63 with mix/)).toBeInTheDocument();
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
    expect(screen.getByText(/Cheapest single store[\s\S]*Aldi/)).toBeInTheDocument();
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
    // The desktop grid has the style attribute with grid-template-columns
    const grids = container.querySelectorAll('[style]');
    const desktopGrid = Array.from(grids).find(
      (el) => el.getAttribute('style')?.includes('grid-template-columns'),
    );
    expect(desktopGrid).toBeTruthy();
    // 2 stores + 1 mix-and-match = 3 columns
    expect(desktopGrid).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' });
  });

  it('hides best store banner when all stores have $0.00 total', () => {
    const allZero = {
      ...mockComparisonResponse,
      storeTotals: mockComparisonResponse.storeTotals.map(st => ({
        ...st,
        total: 0,
        unavailableCount: st.items.length,
        allItemsAvailable: false,
        items: st.items.map(item => ({ ...item, match: null, lineTotal: 0 })),
      })),
    };
    render(<ComparisonResults response={allZero} />);
    expect(screen.queryByText('Results found')).not.toBeInTheDocument();
    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });

  it('renders mobile tab buttons for each store', () => {
    const { container } = render(<ComparisonResults response={mockComparisonResponse} />);
    const mobileTabList = container.querySelector('[data-testid="mobile-store-tabs"]');
    expect(mobileTabList).toBeInTheDocument();
  });

  it('renders mobile tabs with store names', async () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    const tabList = screen.getByTestId('mobile-store-tabs');
    // Tab buttons should have all store names
    expect(tabList).toHaveTextContent('Coles');
    expect(tabList).toHaveTextContent('Woolworths');
    expect(tabList).toHaveTextContent('Aldi');
    expect(tabList).toHaveTextContent('Harris Farm');
    expect(tabList).toHaveTextContent('Mix & Match');
  });

  it('switches visible store on mobile tab click', async () => {
    const user = userEvent.setup();
    render(<ComparisonResults response={mockComparisonResponse} />);
    const tabList = screen.getByTestId('mobile-store-tabs');
    const woolworthsTab = Array.from(tabList.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Woolworths'),
    );
    expect(woolworthsTab).toBeDefined();
    await user.click(woolworthsTab!);
    // After clicking Woolworths tab, the mobile panel should show Woolworths data
    const mobilePanel = screen.getByTestId('mobile-store-panel');
    expect(mobilePanel).toHaveTextContent('Woolworths Full Cream Milk 2L');
  });

  it('defaults mobile tab to cheapest store (F7)', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    const mobilePanel = screen.getByTestId('mobile-store-panel');
    // Coles ($15.60) is cheapest fully-available store, should be default
    expect(mobilePanel).toHaveTextContent('Coles Full Cream Milk 2L');
  });

  it('shows Mix & Match pill on mobile summary bar (F5)', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    const mobileTabs = screen.getByTestId('mobile-store-tabs');
    // Should have a purple Mix pill showing the Mix & Match total
    expect(mobileTabs).toHaveTextContent(/Mix \$/);
  });

  it('clicking Mix pill switches to Mix & Match tab (F5)', async () => {
    const user = userEvent.setup();
    render(<ComparisonResults response={mockComparisonResponse} />);
    const mobileTabs = screen.getByTestId('mobile-store-tabs');
    const mixPill = Array.from(mobileTabs.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Mix $'),
    );
    expect(mixPill).toBeDefined();
    await user.click(mixPill!);
    const mobilePanel = screen.getByTestId('mobile-store-panel');
    // Should show Mix & Match content after clicking
    expect(mobilePanel).toHaveTextContent('Farmdale Milk 2L');
  });

  it('renders SummaryPanel when items and onEditList are provided (C2)', () => {
    const items = [
      { id: '1', name: 'milk 2L', quantity: 1, isBrandSpecific: false },
      { id: '2', name: 'bread', quantity: 2, isBrandSpecific: true },
    ];
    render(
      <ComparisonResults
        response={mockComparisonResponse}
        items={items}
        onEditList={vi.fn()}
      />,
    );
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });
});

describe('ItemRow', () => {
  const availableItem = mockComparisonResponse.storeTotals[1].items[0]; // Coles milk, has unitPrice
  const unavailableItem = mockComparisonResponse.storeTotals[2].items[2]; // Aldi eggs, match null
  const noUnitPriceItem = mockComparisonResponse.storeTotals[1].items[2]; // Coles eggs, unitPrice null

  it('shows shopping list item name as label', () => {
    render(
      <ItemRow
        match={availableItem.match}
        lineTotal={availableItem.lineTotal}
        shoppingListItemName="milk 2L"
      />,
    );
    expect(screen.getByText('milk 2L')).toBeInTheDocument();
  });

  it('shows shopping list item name for unavailable items', () => {
    render(
      <ItemRow
        match={unavailableItem.match}
        lineTotal={unavailableItem.lineTotal}
        shoppingListItemName="eggs"
      />,
    );
    expect(screen.getByText('eggs')).toBeInTheDocument();
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

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
    expect(screen.queryByText(/\/ /)).not.toBeInTheDocument();
  });

  it('shows "Not available" when match is null', () => {
    render(<ItemRow match={unavailableItem.match} lineTotal={unavailableItem.lineTotal} />);
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('shows qty badge when quantity > 1 (M3)', () => {
    render(
      <ItemRow
        match={availableItem.match}
        lineTotal={availableItem.lineTotal}
        quantity={2}
      />,
    );
    expect(screen.getByText('qty 2')).toBeInTheDocument();
  });

  it('shows qty badge even when quantity is 1 (F2)', () => {
    render(
      <ItemRow
        match={availableItem.match}
        lineTotal={availableItem.lineTotal}
        quantity={1}
      />,
    );
    expect(screen.getByText('qty 1')).toBeInTheDocument();
  });

  it('has gap between product name and price (F1)', () => {
    const { container } = render(
      <ItemRow
        match={availableItem.match}
        lineTotal={availableItem.lineTotal}
        quantity={1}
      />,
    );
    // The flex container should have a gap between name and price
    const flexContainer = container.querySelector('.flex.justify-between');
    expect(flexContainer).toBeInTheDocument();
    // Verify it has gap class
    expect(flexContainer?.className).toContain('gap-');
  });

  it('shows store source badge when showStoreSource is true (F8)', () => {
    render(
      <ItemRow
        match={availableItem.match}
        lineTotal={availableItem.lineTotal}
        quantity={1}
        showStoreSource={true}
      />,
    );
    expect(screen.getByText('Coles')).toBeInTheDocument();
  });
});

describe('StoreColumn', () => {
  const colesStore = mockComparisonResponse.storeTotals[1];
  const aldiStore = mockComparisonResponse.storeTotals[2]; // has 1 unavailable item

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

  it('renders store total in header (S5)', () => {
    render(<StoreColumn storeTotal={colesStore} isCheapest={false} />);
    // Total is shown in the header now
    expect(screen.getByText('Total')).toBeInTheDocument();
    // Total should appear (in header and in footer)
    expect(screen.getAllByText('$15.60').length).toBeGreaterThanOrEqual(1);
  });

  it('does not show unavailable count when all items are available', () => {
    render(<StoreColumn storeTotal={colesStore} isCheapest={false} />);
    expect(screen.queryByText(/items? unavailable/)).not.toBeInTheDocument();
  });

  it('shows unavailable count when some items are unavailable', () => {
    render(<StoreColumn storeTotal={aldiStore} isCheapest={false} />);
    expect(screen.getByText('1 item unavailable')).toBeInTheDocument();
  });

  it('does not show unavailable count when all items are available', () => {
    render(<StoreColumn storeTotal={colesStore} isCheapest={false} />);
    expect(screen.queryByText(/items? unavailable/)).not.toBeInTheDocument();
  });

  it('shows unavailable count when some items are unavailable', () => {
    render(<StoreColumn storeTotal={aldiStore} isCheapest={false} />);
    expect(screen.getByText('1 item unavailable')).toBeInTheDocument();
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
    // Total appears in header and footer
    expect(screen.getAllByText('$11.97').length).toBeGreaterThanOrEqual(1);
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

  it('has purple border styling (S6)', () => {
    const { container } = render(<MixAndMatchColumn mixAndMatch={mixAndMatch} />);
    const column = container.firstElementChild;
    expect(column?.className).toContain('border-violet-600');
  });
});

describe('StoreHeader', () => {
  it('renders store name', () => {
    render(<StoreHeader storeName="Coles" store="coles" isCheapest={false} />);
    expect(screen.getByText('Coles')).toBeInTheDocument();
  });

  it('renders full Woolworths name without truncation', () => {
    render(<StoreHeader storeName="Woolworths" store="woolworths" isCheapest={false} />);
    expect(screen.getByText('Woolworths')).toBeInTheDocument();
    // The element should contain the full text, not be truncated via CSS overflow
    const header = screen.getByText('Woolworths');
    expect(header.className).not.toContain('truncate');
  });

  it('applies brand colour as background', () => {
    render(<StoreHeader storeName="Coles" store="coles" isCheapest={false} />);
    const header = screen.getByText('Coles').closest('div');
    expect(header).toHaveStyle({ backgroundColor: '#E2001A' });
  });

  it('shows cheapest store badge when isCheapest is true (S5)', () => {
    render(<StoreHeader storeName="Aldi" store="aldi" isCheapest={true} />);
    expect(screen.getByText('cheapest store')).toBeInTheDocument();
  });

  it('does not show cheapest badge when isCheapest is false', () => {
    render(<StoreHeader storeName="Aldi" store="aldi" isCheapest={false} />);
    expect(screen.queryByText('cheapest store')).not.toBeInTheDocument();
  });

  it('renders total price when provided (S5)', () => {
    render(<StoreHeader storeName="Coles" store="coles" isCheapest={false} total={15.60} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$15.60')).toBeInTheDocument();
  });

  it('does not render total when not provided', () => {
    render(<StoreHeader storeName="Coles" store="coles" isCheapest={false} />);
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
  });
});

describe('ResultColumn', () => {
  it('renders header, children, and formatted total', () => {
    render(
      <ResultColumn header={<div>Test Header</div>} total={12.5}>
        <div>Child Content</div>
      </ResultColumn>
    );
    expect(screen.getByText('Test Header')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });

  it('applies additional className when provided', () => {
    const { container } = render(
      <ResultColumn header={<div>Header</div>} total={0} className="border-violet-600">
        <div>Content</div>
      </ResultColumn>
    );
    expect(container.firstElementChild?.className).toContain('border-violet-600');
  });
});

describe('findCheapestStore', () => {
  const storeTotals = mockComparisonResponse.storeTotals;

  it('returns cheapest fully-available store', () => {
    const result = findCheapestStore(storeTotals);
    // Coles ($15.60) is cheapest among fully-available stores
    expect(result?.store).toBe('coles');
  });

  it('falls back to cheapest overall when none are fully available', () => {
    const allPartial = storeTotals.map(st => ({ ...st, allItemsAvailable: false }));
    const result = findCheapestStore(allPartial);
    expect(result?.store).toBe('aldi');
  });

  it('returns sole store when only one exists', () => {
    const result = findCheapestStore([storeTotals[0]]);
    expect(result?.store).toBe('woolworths');
  });

  it('returns undefined for empty array', () => {
    expect(findCheapestStore([])).toBeUndefined();
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
