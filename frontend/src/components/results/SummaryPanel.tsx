import { memo } from 'react';
import { Pencil } from 'lucide-react';
import type { ShoppingListItem } from '@grocery/shared';

interface SummaryPanelProps {
  items: ShoppingListItem[];
  onEditList: () => void;
}

export const SummaryPanel = memo(function SummaryPanel({ items, onEditList }: SummaryPanelProps) {
  const itemCount = items.length;

  return (
    <div className="w-[280px] bg-white rounded-2xl shadow p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900">Shopping List</h3>
        <span className="bg-zinc-100 rounded-lg px-2 py-0.5 text-xs font-medium text-zinc-600">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm text-zinc-700">
            {item.quantity > 1 && (
              <span className="bg-zinc-100 rounded px-1.5 py-0.5 text-xs font-medium text-zinc-600">
                x{item.quantity}
              </span>
            )}
            <span className="flex-1">{item.name}</span>
            {item.isBrandSpecific && (
              <span
                title="Brand specific"
                className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
              />
            )}
            {!item.isBrandSpecific && (
              <span className="w-2 h-2 rounded-full bg-zinc-300 flex-shrink-0" />
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onEditList}
        className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg px-3 py-2 transition-colors"
      >
        <Pencil size={14} />
        Edit list
      </button>
    </div>
  );
});
