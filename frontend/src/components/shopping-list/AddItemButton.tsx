'use client';

import { CirclePlus } from 'lucide-react';

interface AddItemButtonProps {
  onAdd: () => void;
}

export function AddItemButton({ onAdd }: AddItemButtonProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-2 py-2 mt-2 text-sm text-zinc-500 hover:text-green-600 transition-colors"
    >
      <CirclePlus size={16} />
      Add another item
    </button>
  );
}
