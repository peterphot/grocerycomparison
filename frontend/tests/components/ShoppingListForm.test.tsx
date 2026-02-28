import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShoppingListForm } from '../../src/components/shopping-list/ShoppingListForm';

let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  });
});

describe('ShoppingListForm', () => {
  it('renders initial item row', () => {
    render(<ShoppingListForm onSubmit={vi.fn()} />);
    const nameInputs = screen.getAllByPlaceholderText('e.g. milk 2L');
    expect(nameInputs).toHaveLength(1);
  });

  it('renders column headers', () => {
    render(<ShoppingListForm onSubmit={vi.fn()} />);
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Qty')).toBeInTheDocument();
    expect(screen.getByText('Brand?')).toBeInTheDocument();
  });

  it('typing in name field updates item', async () => {
    const user = userEvent.setup();
    render(<ShoppingListForm onSubmit={vi.fn()} />);
    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'milk 2L');
    expect(nameInput).toHaveValue('milk 2L');
  });

  it('clicking Add Item adds a new row', async () => {
    const user = userEvent.setup();
    render(<ShoppingListForm onSubmit={vi.fn()} />);
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);
    const nameInputs = screen.getAllByPlaceholderText('e.g. milk 2L');
    expect(nameInputs).toHaveLength(2);
  });

  it('clicking remove button removes that item', async () => {
    const user = userEvent.setup();
    render(<ShoppingListForm onSubmit={vi.fn()} />);
    // Add a second item
    await user.click(screen.getByRole('button', { name: /add item/i }));
    expect(screen.getAllByPlaceholderText('e.g. milk 2L')).toHaveLength(2);
    // Remove the first item
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText('e.g. milk 2L')).toHaveLength(1);
  });

  it('compare button is disabled when no item has a name', () => {
    render(<ShoppingListForm onSubmit={vi.fn()} />);
    const compareButton = screen.getByRole('button', { name: /compare prices/i });
    expect(compareButton).toBeDisabled();
  });

  it('compare button calls onSubmit with current items', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ShoppingListForm onSubmit={onSubmit} />);
    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'bread');
    const compareButton = screen.getByRole('button', { name: /compare prices/i });
    await user.click(compareButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'bread', quantity: 1, isBrandSpecific: false }),
      ])
    );
  });

  it('remove button hidden on last remaining item', () => {
    render(<ShoppingListForm onSubmit={vi.fn()} />);
    const removeButtons = screen.queryAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(0);
  });

  it('filters out empty-name items before calling onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ShoppingListForm onSubmit={onSubmit} />);
    // Add a second item
    await user.click(screen.getByRole('button', { name: /add item/i }));
    const nameInputs = screen.getAllByPlaceholderText('e.g. milk 2L');
    // Fill only the first item
    await user.type(nameInputs[0], 'milk');
    // Leave the second item empty
    await user.click(screen.getByRole('button', { name: /compare prices/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submittedItems = onSubmit.mock.calls[0][0];
    // Only the non-empty item should be submitted
    expect(submittedItems).toHaveLength(1);
    expect(submittedItems[0]).toMatchObject({ name: 'milk' });
  });

  it('toggling brand checkbox updates item', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ShoppingListForm onSubmit={onSubmit} />);
    const nameInput = screen.getByPlaceholderText('e.g. milk 2L');
    await user.type(nameInput, 'oat milk');
    const brandCheckbox = screen.getByRole('checkbox', { name: /brand matters/i });
    expect(brandCheckbox).not.toBeChecked();
    await user.click(brandCheckbox);
    expect(brandCheckbox).toBeChecked();
    // Verify the toggled state is included in submit
    await user.click(screen.getByRole('button', { name: /compare prices/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'oat milk', isBrandSpecific: true }),
      ])
    );
  });
});
