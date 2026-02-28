'use client';

import { X } from 'lucide-react';
import type { ShoppingListItem as ShoppingListItemType } from '../../hooks/useShoppingList';

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onChange: (id: string, changes: Partial<Pick<ShoppingListItemType, 'name' | 'quantity' | 'isBrandSpecific'>>) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
}

export function ShoppingListItem({ item, onChange, onRemove, showRemove }: ShoppingListItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <input
        type="text"
        value={item.name}
        onChange={(e) => onChange(item.id, { name: e.target.value })}
        placeholder="e.g. milk 2L"
        className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
      />
      <input
        type="number"
        value={item.quantity}
        onChange={(e) => onChange(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
        min={1}
        className="w-16 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-center outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
      />
      <label className="flex items-center gap-1.5 text-sm text-zinc-500 cursor-pointer">
        <input
          type="checkbox"
          checked={item.isBrandSpecific}
          onChange={(e) => onChange(item.id, { isBrandSpecific: e.target.checked })}
          className="rounded border-zinc-300 text-green-600 focus:ring-green-500"
        />
        <span className="hidden sm:inline">Brand matters</span>
      </label>
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label="Remove"
          className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
