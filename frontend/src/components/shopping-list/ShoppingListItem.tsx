'use client';

import { memo, useCallback, useId } from 'react';
import { X } from 'lucide-react';
import { BrandToggle } from './BrandToggle';
import type { ShoppingListItem as ShoppingListItemType } from '../../hooks/useShoppingList';

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onChange: (id: string, changes: Partial<Pick<ShoppingListItemType, 'name' | 'quantity' | 'isBrandSpecific'>>) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
}

export const ShoppingListItem = memo(function ShoppingListItem({ item, onChange, onRemove, showRemove }: ShoppingListItemProps) {
  const reactId = useId();

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(item.id, { name: e.target.value }),
    [item.id, onChange],
  );

  const handleQtyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) }),
    [item.id, onChange],
  );

  const handleBrandChange = useCallback(
    (value: boolean) => onChange(item.id, { isBrandSpecific: value }),
    [item.id, onChange],
  );

  const handleRemove = useCallback(
    () => onRemove(item.id),
    [item.id, onRemove],
  );

  return (
    <div className="bg-[#F9FAFB] rounded-[10px] px-3.5 py-4">
      {/* Fields row */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          id={`item-name-${reactId}`}
          name={`item-name-${reactId}`}
          value={item.name}
          onChange={handleNameChange}
          placeholder="e.g. milk 2L"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
        />
        <input
          type="number"
          id={`item-qty-${reactId}`}
          name={`item-qty-${reactId}`}
          value={item.quantity}
          onChange={handleQtyChange}
          min={1}
          aria-label="Quantity"
          className="w-16 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-center outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
        />
        {showRemove && (
          <button
            type="button"
            onClick={handleRemove}
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
          onChange={handleBrandChange}
        />
      </div>
    </div>
  );
});
