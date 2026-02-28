'use client';

import { ArrowRight, Info } from 'lucide-react';
import { useShoppingList } from '../../hooks/useShoppingList';
import { ShoppingListItem } from './ShoppingListItem';
import { AddItemButton } from './AddItemButton';
import type { ShoppingListItem as ShoppingListItemType } from '../../hooks/useShoppingList';

interface ShoppingListFormProps {
  onSubmit: (items: ShoppingListItemType[]) => void;
  initialItems?: ShoppingListItemType[];
}

export function ShoppingListForm({ onSubmit, initialItems }: ShoppingListFormProps) {
  const { items, addItem, removeItem, updateItem, canSearch } = useShoppingList(initialItems);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSearch) {
      const nonEmptyItems = items.filter((item) => item.name.trim().length > 0);
      onSubmit(nonEmptyItems);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6">
      {/* Title and subtitle (S2) */}
      <h2 className="text-xl font-bold text-zinc-900 font-[family-name:var(--font-plus-jakarta)]">
        My Shopping List
      </h2>
      <p className="text-sm text-zinc-500 mt-1 mb-4">
        Enter items to compare prices across stores
      </p>

      {/* Column headers (M2 - sentence case) */}
      <div className="flex items-center gap-3 pb-2 mb-2 border-b border-zinc-100">
        <span className="flex-1 text-xs font-medium text-zinc-500 tracking-wide">Item</span>
        <span className="w-16 text-xs font-medium text-zinc-500 tracking-wide text-center">Qty</span>
        <span className="text-xs font-medium text-zinc-500 tracking-wide">Preference</span>
        {items.length > 1 && <span className="w-[26px]" />}
      </div>

      {/* Item rows (S4 - card styling with gap) */}
      <div className="flex flex-col gap-5 mt-2">
        {items.map((item) => (
          <ShoppingListItem
            key={item.id}
            item={item}
            onChange={updateItem}
            onRemove={removeItem}
            showRemove={items.length > 1}
          />
        ))}
      </div>

      {/* Add item button (M1) */}
      <AddItemButton onAdd={addItem} />

      {/* Compare button (S9 - arrow icon, S10 - muted green disabled) */}
      <button
        type="submit"
        disabled={!canSearch}
        className="w-full h-[52px] mt-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:text-green-100 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        Compare Prices
        <ArrowRight size={18} />
      </button>

      {/* Hint text (M4) */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-400 justify-center">
        <Info size={14} />
        <span>Toggle brand preference on each item</span>
      </div>
    </form>
  );
}
