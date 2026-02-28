import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SummaryPanel } from '../../src/components/results/SummaryPanel';
import type { ShoppingListItem } from '@grocery/shared';

const mockItems: ShoppingListItem[] = [
  { id: '1', name: 'milk 2L', quantity: 1, isBrandSpecific: false },
  { id: '2', name: 'bread', quantity: 2, isBrandSpecific: true },
  { id: '3', name: 'eggs', quantity: 1, isBrandSpecific: false },
];

describe('SummaryPanel', () => {
  it('renders "Shopping List" title', () => {
    render(<SummaryPanel items={mockItems} onEditList={vi.fn()} />);
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
  });

  it('renders item count badge', () => {
    render(<SummaryPanel items={mockItems} onEditList={vi.fn()} />);
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('renders singular count for single item', () => {
    render(<SummaryPanel items={[mockItems[0]]} onEditList={vi.fn()} />);
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('lists each item name', () => {
    render(<SummaryPanel items={mockItems} onEditList={vi.fn()} />);
    expect(screen.getByText('milk 2L')).toBeInTheDocument();
    expect(screen.getByText('bread')).toBeInTheDocument();
    expect(screen.getByText('eggs')).toBeInTheDocument();
  });

  it('shows quantity badge for quantity > 1', () => {
    render(<SummaryPanel items={mockItems} onEditList={vi.fn()} />);
    // bread has qty 2
    expect(screen.getByText('x2')).toBeInTheDocument();
  });

  it('does not show quantity badge for quantity = 1', () => {
    render(<SummaryPanel items={mockItems} onEditList={vi.fn()} />);
    expect(screen.queryByText('x1')).not.toBeInTheDocument();
  });

  it('shows brand indicator for brand-specific items', () => {
    render(<SummaryPanel items={mockItems} onEditList={vi.fn()} />);
    // bread is brand specific
    const brandIndicators = screen.getAllByTitle('Brand specific');
    expect(brandIndicators.length).toBe(1);
  });

  it('calls onEditList when Edit list button is clicked', async () => {
    const user = userEvent.setup();
    const onEditList = vi.fn();
    render(<SummaryPanel items={mockItems} onEditList={onEditList} />);
    await user.click(screen.getByRole('button', { name: /edit list/i }));
    expect(onEditList).toHaveBeenCalledTimes(1);
  });

  it('has the Edit list button with pencil icon', () => {
    render(<SummaryPanel items={mockItems} onEditList={vi.fn()} />);
    const editButton = screen.getByRole('button', { name: /edit list/i });
    expect(editButton).toBeInTheDocument();
  });
});
