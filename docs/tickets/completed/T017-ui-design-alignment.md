# T017 — UI Design Alignment

## Status
- [x] Backlog
- [x] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T016 Phase 0 (adapter bug fix)
- **Blocks**: Nothing
- **Parallel with**: T016 Phases 1–7

---

## Summary

Side-by-side comparison of the live app (localhost:3000) against the Pencil designs (`designs.pen`, screens `nsAxf`, `Nhqcs`, `J0F1G`, `xOuKy`) reveals 20+ discrepancies ranging from structural layout issues (mobile results layout is completely wrong) to missing components (empty state icon, shopping list summary, brand toggle) and polish gaps (missing icons, text differences, button states).

This ticket catalogs every discrepancy, grouped by severity, with specific design node references for each fix.

---

## Critical — Layout/Structure Wrong

### C1: Mobile results uses 5-column grid instead of tab-per-store layout
**Design** (`xOuKy`): Horizontal scrollable tab bar (node `m8kVX`) with pill-shaped tabs (Woolworths | Coles | Aldi | Harris Farm | Mix & Match). Only ONE store card visible at a time (node `0CYUO`), showing store header + item list.
**Live**: All 5 store columns crammed side-by-side at 390px width. "Woolworths" truncates to "Woolwor". Completely unusable on mobile.
**Fix**: Implement tab component for `< md` breakpoint. Active tab shows a single `StoreResultCard`. Tab styles: inactive = `bg-zinc-100 rounded-full px-3.5 py-2`, active = store color background + white text. Mix & Match tab gets star icon + purple styling (`bg-violet-100 text-violet-600`).

### C2: Desktop results missing shopping list summary sidebar
**Design** (`Nhqcs`, node `cJUE6`): 280px left sidebar with:
- "Shopping List" title + "3 items" count badge (`bg-zinc-100 rounded-lg px-2`)
- Each item listed: qty badge + item name + brand indicator (green = brand matched, grey = any brand)
- "Edit list" button at bottom (`bg-zinc-100 rounded-lg` full-width, pencil icon + text)
**Live**: Bare "Edit List" button floating at top left with no context. No item summary, no count, no brand indicators.
**Fix**: Create `SummaryPanel` component (280px, white card, rounded-2xl, shadow). Move "Edit List" button inside it. List submitted items with qty badges and brand status.

### C3: Results banner missing rich content
**Design** (`Nhqcs`, node `igJex`): White card with shadow showing:
- Green check icon (circle-check, 20px)
- "Results found · Cheapest single store: Coles $16.80 · Best mix & match: $15.17"
- Right-aligned chip: "Save $2.03 with mix & match" in green badge (`bg-green-100`)
**Live**: Plain green banner with only "Best single store: Woolworths $0.00". No check icon, no mix & match total, no savings chip.
**Fix**: Redesign banner as white card. Add check icon, include mix & match price, calculate and show savings amount in a chip.

---

## Significant — Missing Design Elements

### S1: Empty state missing icon, description, store badges, and card wrapper
**Design** (`nsAxf`, node `Jrb2o`): White card (480px, 48px padding, rounded-[20px], shadow) containing:
- Green circle (80×80, `bg-green-100`) with shopping-cart icon (36px, green)
- Heading: "Start comparing prices" (Plus Jakarta Sans, 24px, bold)
- Description: "Add items to your shopping list and click Compare Prices to see the cheapest options across Woolworths, Coles, Aldi, and Harris Farm." (Inter, 14px, grey, line-height 1.6)
- 4 store badges: colored pills (Woolworths #00A347, Coles #E2001A, Aldi #003087, Harris Farm #2D5E2A) with white text
**Live**: Plain text "Compare prices in seconds" + "Add items to your list and click Compare Prices". No icon, no badges, no card, wrong heading text.
**Fix**: Rebuild `EmptyState` component with card wrapper, icon circle, correct heading text, full description, and store badge row.

### S2: Form missing title and subtitle
**Design** (`nsAxf`, node `HAgSY`): Panel header with:
- "My Shopping List" (Plus Jakarta Sans, 20px, bold, #18181B)
- "Enter items to compare prices across stores" (Inter, 13px, #71717A)
**Live**: Jumps straight to column headers (ITEM / QTY / BRAND?). No title or subtitle.
**Fix**: Add title/subtitle above column headers in `ShoppingListForm`.

### S3: Brand preference is checkbox instead of toggle button pair
**Design** (`nsAxf`, nodes `HQvRc`, `Inccb`, `tGEwb`): Segmented control with two options:
- "Any brand" — green text (#16A34A) + white background when active
- "Brand only" — grey text when inactive, white background when active
- Container: grey background (#F4F4F5), rounded-lg, 2px padding
- Sits BELOW the item/qty row as its own row within the item card
**Live**: Small checkbox with "Brand matters" text inline with the item row.
**Fix**: Replace checkbox with `BrandToggle` segmented control component. Each item row becomes a card (see S4) with fields row on top, toggle row below.

### S4: Form item rows missing card styling
**Design** (`nsAxf`, nodes `cml1o`, `Yyipa`, `bVSzm`): Each item is a card:
- Background: #F9FAFB (very light grey)
- Rounded: 10px
- Padding: 14px horizontal, 16px vertical
- Vertical layout: fields row (item + qty + drag handle) on top, brand toggle below
- 20px gap between items
**Live**: Flat rows with minimal styling, no card backgrounds, items separated by divider lines.
**Fix**: Wrap each `ShoppingListItem` in a card container with the design's background and padding.

### S5: Store column headers missing "Total" label and large price
**Design** (`Nhqcs`, e.g. node `mDhmm` for Woolworths): Store header card with:
- Store name (white, bold)
- "Total" label (white, 50% opacity, small)
- Large price (e.g. "$17.30", Plus Jakarta Sans, ~24px, bold, white)
- "cheapest store" badge when applicable
**Live**: Store name only in colored header bar. No total displayed in header. Total is shown at the bottom of the column as plain text.
**Fix**: Update `StoreHeader` to accept and display the total. Add "cheapest" badge when applicable.

### S6: Mix & Match column missing purple border/glow
**Design** (`Nhqcs`, node `lG0KQ`): Mix & Match column has:
- Purple border: 2px stroke #7C3AED
- Purple shadow: `box-shadow: 0 4px 16px #7C3AED20`
**Live**: Same border/shadow as other columns. Doesn't stand out visually.
**Fix**: Add `border-2 border-violet-600 shadow-[0_4px_16px_rgba(124,58,237,0.12)]` to Mix & Match column.

### S7: Mobile results missing "Save with Mix & Match" bottom CTA
**Design** (`xOuKy`, node `0waX5`): Purple card at bottom:
- Background: #EDE9FE (light violet)
- Star icon + "Save $1.63 more with Mix & Match →"
- Rounded-xl, 12px/16px padding
**Live**: Nothing. No savings CTA on mobile.
**Fix**: Add `SavingsTip` component below the store result card on mobile. Calculate savings as difference between current store total and mix & match total.

### S8: Mobile results header missing "Edit" button
**Design** (`xOuKy`, node `MMyvq`): Compact "Edit" button in the header bar:
- Grey background (#F4F4F5), rounded-lg
- Pencil icon + "Edit" text
**Live**: "Edit List" is a separate standalone button below header. On mobile results the button is small and disconnected from context.
**Fix**: Move edit action into the mobile header during results state.

### S9: Compare Prices button missing arrow icon
**Design** (`nsAxf`, node `ta1KO`): Button contains:
- "Compare Prices" text (Plus Jakarta Sans, 16px, bold, white)
- Arrow-right icon (18px, white)
- Gap: 8px between text and icon
**Live**: Text only, no arrow icon.
**Fix**: Add `ArrowRight` lucide icon after button text.

### S10: Compare Prices button disabled state too washed out
**Design**: Button is green (#16A34A) when active. Disabled state should be a muted green, not grey.
**Live**: Disabled button is grey/lavender — loses all brand identity.
**Fix**: Change disabled state from `disabled:bg-zinc-300` to `disabled:bg-green-300 disabled:text-green-100` or similar muted green.

---

## Minor — Polish & Text

### M1: "Add item" should be "Add another item"
**Design** (`nsAxf`, node `1sUpD`): "Add another item" with circle-plus icon.
**Live**: "+ Add item" with text plus sign.
**Fix**: Change text to "Add another item". Use `CirclePlus` lucide icon instead of text "+".

### M2: Column header text differs
**Design**: "Item" | "Qty" | [spacer] | "Preference"
**Live**: "ITEM" | "QTY" | "BRAND?"
**Fix**: Change to sentence case. Consider "Preference" instead of "BRAND?" to match design.

### M3: Desktop results item rows missing qty badge
**Design** (`Nhqcs`): Each item price has a small qty badge (e.g. "qty 2") in a grey pill next to the price when quantity > 1.
**Live**: Shows line total but no qty indicator.
**Fix**: Add qty badge (`bg-zinc-100 text-xs rounded px-1`) next to price when quantity > 1.

### M4: Mobile input missing hint text below Compare button
**Design** (`J0F1G`, node `hiIyh`): Info icon + "Toggle brand preference on each item" hint text below the Compare Prices button.
**Live**: Nothing below the button.
**Fix**: Add hint text row with info circle icon.

### M5: Header missing "Help" link
**Design** (`nsAxf`): "Help" link at far right of header bar.
**Live**: Nothing. Header ends after "Beta" badge.
**Fix**: Add "Help" link to `Header` component, right-aligned.

### M6: Background color
**Design**: All screens use #F6FAF6 (very subtle green tint) as page background.
**Live**: Appears to be plain white or very similar.
**Fix**: Set body/page background to `bg-[#F6FAF6]`.

### M7: Store column cards missing rounded corners and shadow
**Design** (`Nhqcs`, e.g. node `2S4Rx`): Each store column is a card with:
- `border-radius: 12px`
- `box-shadow: 0 2px 8px rgba(0,0,0,0.03)`
**Live**: Columns have borders but minimal rounding/shadow.
**Fix**: Add `rounded-xl shadow-sm` to each store column card.

---

## Implementation Priority

| Priority | Items | Effort |
|----------|-------|--------|
| **P0 — Fix broken layout** | C1 (mobile tabs) | Large — new component + responsive switch |
| **P1 — Missing structure** | C2 (summary sidebar), C3 (rich banner) | Medium each |
| **P2 — Missing components** | S1 (empty state), S2 (form title), S3 (brand toggle), S4 (item cards) | S1+S3 are medium, S2+S4 are small |
| **P3 — Results polish** | S5 (header totals), S6 (M&M border), S7 (savings CTA), S8 (mobile edit), S9+S10 (button) | Small each |
| **P4 — Minor text/icons** | M1–M7 | Small each |

Estimated total: ~15–20 component changes across frontend.

---

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/app/page.tsx` | Background color, layout adjustments for summary sidebar |
| `frontend/src/components/common/Header.tsx` | Add Help link, Edit button in mobile results |
| `frontend/src/components/common/EmptyState.tsx` | Complete redesign: add icon, card, store badges, fix text |
| `frontend/src/components/shopping-list/ShoppingListForm.tsx` | Add title/subtitle, fix button icon/disabled state |
| `frontend/src/components/shopping-list/ShoppingListItem.tsx` | Card wrapper, replace checkbox with toggle |
| `frontend/src/components/shopping-list/AddItemButton.tsx` | Change text, use CirclePlus icon |
| `frontend/src/components/results/ComparisonResults.tsx` | Responsive: tabs on mobile, grid on desktop. Rich banner. |
| `frontend/src/components/results/StoreHeader.tsx` | Add total price, cheapest badge |
| `frontend/src/components/results/StoreColumn.tsx` | Rounded corners, shadow |
| `frontend/src/components/results/MixAndMatchColumn.tsx` | Purple border/glow |
| `frontend/src/components/results/ItemRow.tsx` | Add qty badge |

### New Components to Create
| File | Description |
|------|-------------|
| `frontend/src/components/shopping-list/BrandToggle.tsx` | Segmented "Any brand" / "Brand only" control |
| `frontend/src/components/results/SummaryPanel.tsx` | Left sidebar: shopping list summary + edit button |
| `frontend/src/components/results/StoreTabs.tsx` | Mobile tab bar for store switching |
| `frontend/src/components/results/SavingsTip.tsx` | Mobile "Save $X with Mix & Match" CTA |

---

## Design Reference

| Screen | Node ID | Description |
|--------|---------|-------------|
| Desktop Input | `nsAxf` | Form + empty state |
| Desktop Results | `Nhqcs` | Summary sidebar + 5 store columns |
| Mobile Input | `J0F1G` | Stacked form |
| Mobile Results | `xOuKy` | Tab bar + single store card |
