'use client';

import { X } from 'lucide-react';
import { BrandToggle } from './BrandToggle';
import type { ShoppingListItem as ShoppingListItemType } from '../../hooks/useShoppingList';

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onChange: (id: string, changes: Partial<Pick<ShoppingListItemType, 'name' | 'quantity' | 'isBrandSpecific'>>) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
}

export function ShoppingListItem({ item, onChange, onRemove, showRemove }: ShoppingListItemProps) {
  return (
    <div className="bg-[#F9FAFB] rounded-[10px] px-3.5 py-4">
      {/* Fields row */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={item.name}
          onChange={(e) => onChange(item.id, { name: e.target.value })}
          placeholder="e.g. milk 2L"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
        />
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onChange(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          min={1}
          aria-label="Quantity"
          className="w-16 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-center outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
        />
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
      {/* Brand toggle row (S3) */}
      <div className="mt-2.5">
        <BrandToggle
          isBrandSpecific={item.isBrandSpecific}
          onChange={(value) => onChange(item.id, { isBrandSpecific: value })}
        />
      </div>
    </div>
  );
}
