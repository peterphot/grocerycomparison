'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ShoppingListItem } from '@grocery/shared';

export type { ShoppingListItem };

function createBlankItem(): ShoppingListItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    quantity: 1,
    isBrandSpecific: false,
  };
}

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([createBlankItem()]);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createBlankItem()]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const updateItem = useCallback(
    (id: string, changes: Partial<Pick<ShoppingListItem, 'name' | 'quantity' | 'isBrandSpecific'>>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...changes } : item))
      );
    },
    []
  );

  const canSearch = useMemo(
    () => items.some((item) => item.name.trim().length > 0),
    [items]
  );

  return { items, addItem, removeItem, updateItem, canSearch };
}
