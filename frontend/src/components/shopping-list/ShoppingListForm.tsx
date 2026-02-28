'use client';

import { useShoppingList } from '../../hooks/useShoppingList';
import { ShoppingListItem } from './ShoppingListItem';
import { AddItemButton } from './AddItemButton';
import type { ShoppingListItem as ShoppingListItemType } from '../../hooks/useShoppingList';

interface ShoppingListFormProps {
  onSubmit: (items: ShoppingListItemType[]) => void;
}

export function ShoppingListForm({ onSubmit }: ShoppingListFormProps) {
  const { items, addItem, removeItem, updateItem, canSearch } = useShoppingList();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSearch) {
      onSubmit(items);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6">
      {/* Column headers */}
      <div className="flex items-center gap-3 pb-2 mb-2 border-b border-zinc-100">
        <span className="flex-1 text-xs font-medium text-zinc-500 uppercase tracking-wide">Item</span>
        <span className="w-16 text-xs font-medium text-zinc-500 uppercase tracking-wide text-center">Qty</span>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Brand?</span>
        {items.length > 1 && <span className="w-[26px]" />}
      </div>

      {/* Item rows */}
      {items.map((item) => (
        <ShoppingListItem
          key={item.id}
          item={item}
          onChange={updateItem}
          onRemove={removeItem}
          showRemove={items.length > 1}
        />
      ))}

      {/* Add item button */}
      <AddItemButton onAdd={addItem} />

      {/* Compare button */}
      <button
        type="submit"
        disabled={!canSearch}
        className="w-full h-[52px] mt-4 bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        Compare Prices
      </button>
    </form>
  );
}
