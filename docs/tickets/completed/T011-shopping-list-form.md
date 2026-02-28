# T011 — Shopping List Form Components

## Status
- [ ] Backlog
- [ ] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T001 (only needs project scaffolding — no shared types required)
- **Blocks**: T013
- **Parallel with**: T003, T004, T005, T006, T007, T008, T009, T010, T012

---

## Summary

Build the shopping list input UI: the `useShoppingList` hook managing list state, and all form
components (`ShoppingListForm`, `ShoppingListItem`, `AddItemButton`). This is a self-contained
frontend ticket with no backend dependency.

## Source
- `plan.md` → T020, T021, Section 6.2 (Component Tree), Section 6.3 (Component Details)
- `designs.pen` → Desktop Input State (nsAxf), Mobile Input State (J0F1G)

---

## Acceptance Criteria

### useShoppingList hook
- [ ] Initialises with one empty item
- [ ] `addItem()` appends a new blank item
- [ ] `removeItem(id)` removes item by id (minimum 1 item always enforced — cannot remove last)
- [ ] `updateItem(id, changes)` updates name, quantity, or isBrandSpecific
- [ ] Each item has a stable client-generated UUID (`crypto.randomUUID()`)
- [ ] Returns `{ items, addItem, removeItem, updateItem, canSearch }` where `canSearch` is true when at least one item has a non-empty name

### ShoppingListItem component
- [ ] Text input for item name (placeholder: "e.g. milk 2L")
- [ ] Number input for quantity (min: 1, default: 1)
- [ ] Toggle/checkbox for brand-specific (label: "Brand matters")
- [ ] Remove button (hidden when only 1 item remains)
- [ ] Visually matches design: white card, green accents (#16A34A), Inter + Plus Jakarta Sans fonts

### ShoppingListForm component
- [ ] Renders list of `ShoppingListItem` components
- [ ] Renders column headers ("Item", "Qty", "Brand?")
- [ ] Renders `AddItemButton` at the bottom of the list
- [ ] Renders "Compare Prices" button (disabled when `!canSearch`)
- [ ] On submit, calls `onSubmit(items)` prop

### AddItemButton component
- [ ] Renders as a subtle row with "+" icon and "Add item" text
- [ ] Calls `addItem` on click

### Brand preference tip (mobile only)
- [ ] Below the form, on mobile screens only (hidden on desktop): an info icon + text "Toggle brand preference on each item"
- [ ] Styled in muted grey (#A1A1AA), Inter 12px
- [ ] Uses Lucide `Info` icon at 14px

---

## TDD Requirements

- [ ] Write `useShoppingList.test.ts` FIRST — test all hook behaviour with `renderHook`
- [ ] Write component tests SECOND — use `@testing-library/user-event` for interactions
- [ ] No snapshot tests — assert on visible text and ARIA roles
- [ ] All tests pass before moving to implementation

---

## Test Plan

```typescript
// frontend/tests/hooks/useShoppingList.test.ts
describe('useShoppingList', () => {
  it('initialises with one item')
  it('addItem appends a blank item')
  it('removeItem removes item by id')
  it('cannot remove last item (minimum 1 enforced)')
  it('updateItem changes item name')
  it('updateItem changes quantity')
  it('updateItem toggles isBrandSpecific')
  it('canSearch is false when all items have empty names')
  it('canSearch is true when at least one item has a name')
})

// frontend/tests/components/ShoppingListForm.test.tsx
describe('ShoppingListForm', () => {
  it('renders initial item row')
  it('renders column headers')
  it('typing in name field updates item')
  it('clicking Add Item adds a new row')
  it('clicking remove button removes that item')
  it('compare button is disabled when no item has a name')
  it('compare button calls onSubmit with current items')
  it('remove button hidden on last remaining item')
  it('shows tip text on mobile viewport (390px width)')
  it('hides tip text on desktop viewport (1440px width)')
})
```

---

## Implementation Notes

### Design reference
- Left panel card: white bg, 16px rounded corners, shadow-md
- Compare button: full-width, 52px height, bg-green-600 (#16A34A), rounded-xl
- Mobile compare button: 56px height, bg-green-600, rounded-[14px]
- "Add item" row: subtle, icon + text, no filled background
- Column header labels: small, muted text (#71717A), Inter 12-13px
- Tip text below form (mobile): info icon + "Toggle brand preference on each item"

### shadcn/ui components to use
- `Input` for text + number fields
- `Button` for compare + add + remove
- `Switch` or `Checkbox` for brand toggle
- `Card` for the form container

---

## Files to Create

| File | Description |
|------|-------------|
| `frontend/src/hooks/useShoppingList.ts` | Shopping list state hook |
| `frontend/src/components/shopping-list/ShoppingListForm.tsx` | Form container |
| `frontend/src/components/shopping-list/ShoppingListItem.tsx` | Single item row |
| `frontend/src/components/shopping-list/AddItemButton.tsx` | Add row button |
| `frontend/tests/hooks/useShoppingList.test.ts` | Hook tests |
| `frontend/tests/components/ShoppingListForm.test.tsx` | Form component tests |
