import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { mockComparisonResponse } from '../fixtures/comparison-response';
import { ComparisonResults } from '../../src/components/results/ComparisonResults';
import { StoreColumn } from '../../src/components/results/StoreColumn';
import { ItemRow } from '../../src/components/results/ItemRow';

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

  it('shows best store summary banner', () => {
    render(<ComparisonResults response={mockComparisonResponse} />);
    expect(screen.getByText(/Best single store[\s\S]*Aldi/)).toBeInTheDocument();
  });
});

describe('ItemRow', () => {
  const availableItem = mockComparisonResponse.storeTotals[0].items[0]; // Coles milk, has unitPrice
  const noUnitPriceItem = mockComparisonResponse.storeTotals[0].items[2]; // Coles eggs, unitPrice null
  const unavailableItem = mockComparisonResponse.storeTotals[3].items[2]; // Aldi eggs, match null

  it('shows product name for available item', () => {
    render(<ItemRow item={availableItem} />);
    expect(screen.getByText('Coles Full Cream Milk 2L')).toBeInTheDocument();
  });

  it('shows line total as formatted price', () => {
    render(<ItemRow item={availableItem} />);
    expect(screen.getByText('$3.10')).toBeInTheDocument();
  });

  it('shows unit price label when unitPrice is present', () => {
    render(<ItemRow item={availableItem} />);
    expect(screen.getByText('$1.55 / L')).toBeInTheDocument();
  });

  it('shows "Not available" when match is null', () => {
    render(<ItemRow item={unavailableItem} />);
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
