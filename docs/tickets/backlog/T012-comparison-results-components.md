# T012 — Comparison Results Components

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T002 (needs shared types for mock data shape)
- **Blocks**: T013
- **Parallel with**: T003, T004, T005, T006, T007, T008, T009, T010, T011

---

## Summary

Build all the results display components: the responsive layout (5-column grid on desktop,
tab-per-store on mobile), store columns, item rows, and mix-and-match column.
Uses mock `ComparisonResponse` data in tests — no backend required.

## Source
- `plan.md` → T022, T023, Section 6.2 (Component Tree), Section 6.3 (Component Details)
- `designs.pen` → Desktop Results State (Nhqcs), Mobile Results State (xOuKy)

---

## Acceptance Criteria

### ComparisonResults component
- [ ] Receives `ComparisonResponse` as prop
- [ ] Renders `ResultsLayout` with store data
- [ ] Shows "Best single store" summary banner (e.g., "Best single store: Coles $16.80")
- [ ] Highlights the cheapest store column visually (green accent border/background)

### ResultsLayout component
- [ ] Desktop (≥ 768px): renders 5 columns side-by-side (4 stores + mix-and-match)
- [ ] Mobile (< 768px): renders horizontal tab bar with one store visible at a time
- [ ] Active store tab is highlighted with store brand colour
- [ ] Mix & Match tab has purple accent (#7C3AED)
- [ ] "Save $X.XX more with Mix & Match" savings tip shown on mobile when mix total < best store total

### StoreColumn component
- [ ] Renders `StoreHeader` with store name and brand colour
- [ ] Renders one `ItemRow` per shopping list item
- [ ] Renders store total at the bottom
- [ ] Mix-and-match column shows which store each item comes from

### StoreHeader component
- [ ] Store name rendered in brand colour
- [ ] Store brand colours: Woolworths #00A347, Coles #E2001A, Aldi #003087, Harris Farm #2D5E2A, Mix & Match #7C3AED

### ItemRow component
- [ ] Shows product name and package size
- [ ] Shows line total (`price × quantity`) in dollars
- [ ] Shows unit price label (e.g., "$1.55 / L") when `unitPrice` is not null
- [ ] Shows "Not available" marker (grey, italic) when match is null

---

## TDD Requirements

- [ ] Build a `mockComparisonResponse` test fixture matching the full `ComparisonResponse` type
- [ ] Write component tests against this fixture before implementing any component
- [ ] Test responsive behaviour using `window.innerWidth` overrides or `@testing-library` resize utilities
- [ ] Test all "unavailable" states explicitly
- [ ] No snapshot tests

---

## Test Plan

```typescript
// frontend/tests/components/ComparisonResults.test.tsx
describe('ComparisonResults', () => {
  it('renders a column for each store')
  it('renders mix-and-match column')
  it('highlights cheapest store')
  it('shows best store summary banner')
})

describe('StoreColumn', () => {
  it('renders store name in header')
  it('renders an ItemRow for each shopping list item')
  it('renders store total')
})

describe('ItemRow', () => {
  it('shows product name and package size for available item')
  it('shows line total as price × quantity')
  it('shows unit price label when unitPrice is present')
  it('shows "Not available" when match is null')
  it('omits unit price label when unitPrice is null')
})

describe('ResultsLayout (mobile)', () => {
  it('renders tab bar with store names at mobile width')
  it('clicking a tab shows that store column')
  it('active tab has brand colour background')
  it('shows savings tip when mix total is less than best store total')
})
```

---

## Implementation Notes

### Design reference — Desktop
- 5-column grid with `gap-3` (12px), white store card backgrounds
- Store header: 16-20px padding, store brand colour background, white text
- Item rows: stacked vertically, subtle dividers
- Cheapest store: green border highlight

### Design reference — Mobile
- Horizontal scrollable tab bar, 8px gap between tabs
- Active tab: brand colour background + white text + dot indicator
- Inactive tabs: `bg-[#F4F4F5]` + grey text
- Mix & Match tab: `bg-[#EDE9FE]` + purple text + star icon
- Savings tip: purple bg `#EDE9FE`, `text-[#7C3AED]`, star icon

### shadcn/ui components to use
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` for mobile tabs
- `Badge` for store indicators
- `Skeleton` (placeholder for T015 polish)

### Test mock data
Create `frontend/tests/fixtures/comparison-response.ts` exporting a complete `ComparisonResponse`
with all 4 stores, at least 3 items, including one unavailable item.

---

## Files to Create

| File | Description |
|------|-------------|
| `frontend/src/components/results/ComparisonResults.tsx` | Top-level results container |
| `frontend/src/components/results/ResultsLayout.tsx` | Desktop/mobile responsive layout |
| `frontend/src/components/results/StoreColumn.tsx` | Per-store column |
| `frontend/src/components/results/StoreHeader.tsx` | Store name + colour header |
| `frontend/src/components/results/ItemRow.tsx` | Single item price row |
| `frontend/src/lib/store-colors.ts` | Store brand colour constants |
| `frontend/tests/components/ComparisonResults.test.tsx` | Results component tests |
| `frontend/tests/fixtures/comparison-response.ts` | Full mock response for tests |
