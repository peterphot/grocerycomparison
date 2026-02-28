import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShoppingList } from '../../src/hooks/useShoppingList';

// Mock crypto.randomUUID for deterministic tests
let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  });
});

describe('useShoppingList', () => {
  it('initialises with one item', () => {
    const { result } = renderHook(() => useShoppingList());
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      name: '',
      quantity: 1,
      isBrandSpecific: false,
    });
    expect(result.current.items[0].id).toBeDefined();
  });

  it('addItem appends a blank item', () => {
    const { result } = renderHook(() => useShoppingList());
    act(() => {
      result.current.addItem();
    });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[1]).toMatchObject({
      name: '',
      quantity: 1,
      isBrandSpecific: false,
    });
  });

  it('removeItem removes item by id', () => {
    const { result } = renderHook(() => useShoppingList());
    act(() => {
      result.current.addItem();
    });
    expect(result.current.items).toHaveLength(2);
    const idToRemove = result.current.items[0].id;
    act(() => {
      result.current.removeItem(idToRemove);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).not.toBe(idToRemove);
  });

  it('cannot remove last item (minimum 1 enforced)', () => {
    const { result } = renderHook(() => useShoppingList());
    expect(result.current.items).toHaveLength(1);
    const onlyId = result.current.items[0].id;
    act(() => {
      result.current.removeItem(onlyId);
    });
    expect(result.current.items).toHaveLength(1);
  });

  it('updateItem changes item name', () => {
    const { result } = renderHook(() => useShoppingList());
    const id = result.current.items[0].id;
    act(() => {
      result.current.updateItem(id, { name: 'milk 2L' });
    });
    expect(result.current.items[0].name).toBe('milk 2L');
  });

  it('updateItem changes quantity', () => {
    const { result } = renderHook(() => useShoppingList());
    const id = result.current.items[0].id;
    act(() => {
      result.current.updateItem(id, { quantity: 3 });
    });
    expect(result.current.items[0].quantity).toBe(3);
  });

  it('updateItem toggles isBrandSpecific', () => {
    const { result } = renderHook(() => useShoppingList());
    const id = result.current.items[0].id;
    expect(result.current.items[0].isBrandSpecific).toBe(false);
    act(() => {
      result.current.updateItem(id, { isBrandSpecific: true });
    });
    expect(result.current.items[0].isBrandSpecific).toBe(true);
  });

  it('canSearch is false when all items have empty names', () => {
    const { result } = renderHook(() => useShoppingList());
    expect(result.current.canSearch).toBe(false);
  });

  it('canSearch is false when names are only whitespace', () => {
    const { result } = renderHook(() => useShoppingList());
    const id = result.current.items[0].id;
    act(() => {
      result.current.updateItem(id, { name: '   ' });
    });
    expect(result.current.canSearch).toBe(false);
  });

  it('canSearch is true when at least one item has a name', () => {
    const { result } = renderHook(() => useShoppingList());
    const id = result.current.items[0].id;
    act(() => {
      result.current.updateItem(id, { name: 'bread' });
    });
    expect(result.current.canSearch).toBe(true);
  });
});
