export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  isBrandSpecific: boolean;
}

export interface ShoppingList {
  items: ShoppingListItem[];
}
