# User Flows: Grocery Price Comparison App

## Overview

This document describes all user flows the product supports. The app allows users to enter a shopping list and compare prices across four Australian supermarkets: Woolworths, Coles, Aldi, and Harris Farm.

---

## Flow 1: Build a Shopping List

**Goal**: The user creates a structured shopping list before comparing prices.

### 1.1 Add the First Item
1. User lands on the home page and sees an empty shopping list form with one blank item row.
2. User types an item name into the text field (e.g., "milk 2L").
3. User sets the quantity (defaults to 1; user can increase/decrease).
4. User optionally toggles the "brand-specific" checkbox if they want an exact brand match (e.g., "Vegemite 380g").

### 1.2 Add More Items
1. User clicks the "Add Item" button.
2. A new blank item row appears below the existing items.
3. User fills in the item name, quantity, and brand-specific toggle.
4. User can repeat this as many times as needed.

### 1.3 Remove an Item
1. User clicks the remove/delete button on any item row.
2. That item is removed from the list.
3. At least one item must remain — the last item row cannot be removed.

### 1.4 Edit an Existing Item
1. User changes the item name text, quantity, or brand-specific toggle of any existing row.
2. Changes take effect immediately (no save button required).

### 1.5 Duplicate Items
- The user is allowed to add duplicate items (e.g., two separate entries for "milk" — perhaps different sizes or brands).
- No deduplication or warning is shown.

---

## Flow 2: Compare Prices (Happy Path)

**Goal**: The user submits their shopping list and sees price comparisons across all stores.

### 2.1 Submit the Shopping List
1. User has at least one item in their shopping list.
2. User clicks the "Compare Prices" / search button.
3. A loading state appears (spinner/skeleton) while results are fetched.
4. The frontend sends a single POST request to the backend with the full shopping list.

### 2.2 View Results — Desktop
1. Results appear as side-by-side columns: one per store (Woolworths, Coles, Aldi, Harris Farm) plus a "Mix & Match" column.
2. Stores are sorted by total cost (cheapest first).
3. The cheapest single store is visually highlighted.
4. Each column shows:
   - Store name and brand colour in the header.
   - Item-by-item breakdown: product name, package size, line total (price x quantity), and per-unit cost (e.g., "$1.55 / L").
   - A total at the bottom reflecting only available items.
   - An unavailable count if any items are missing.

### 2.3 View Results — Mobile
1. Results appear as a tabbed interface (one tab per store + Mix & Match).
2. User taps tabs to switch between stores.
3. Each tab shows the same item-by-item breakdown as the desktop columns.
4. No horizontal scrolling is needed.

### 2.4 Mix & Match Column
1. The "Mix & Match" column/tab shows the cheapest price for each item across all stores.
2. Each row indicates which store the cheapest price came from.
3. The total represents the theoretical minimum spend by shopping across multiple stores.

---

## Flow 3: Brand-Agnostic Item Search

**Goal**: The user searches for a generic item (e.g., "milk 2L") and the app finds the cheapest matching product at each store.

1. User enters a generic item name without a specific brand (e.g., "milk 2L").
2. User leaves the "brand-specific" toggle OFF.
3. On search, the backend queries each store's API with the search term.
4. For each store, the cheapest available product matching the query is selected.
5. If the exact size isn't available (e.g., no 2L milk), the closest available size may be shown instead.
6. Results display the matched product name, brand, and package size so the user knows exactly what was found.

---

## Flow 4: Brand-Specific Item Search

**Goal**: The user searches for a specific branded product (e.g., "Vegemite 380g") and the app finds that exact product.

1. User enters a branded item name (e.g., "Vegemite 380g").
2. User turns the "brand-specific" toggle ON.
3. On search, the backend queries each store's API with the search term.
4. For each store, the most relevant match is returned (APIs return relevance-sorted results).
5. If the specific product is not found at a store, it is marked as "unavailable" — no substitution is made.

---

## Flow 5: Mixed List (Brand-Agnostic + Brand-Specific Together)

**Goal**: The user has a list with both generic and branded items.

1. User creates a shopping list with a mix:
   - "milk 2L" (brand-agnostic, toggle OFF)
   - "Vegemite 380g" (brand-specific, toggle ON)
   - "bread" (brand-agnostic, toggle OFF)
   - "Lurpak butter 250g" (brand-specific, toggle ON)
2. User clicks search.
3. Each item is handled according to its brand-specific setting:
   - Brand-agnostic items → cheapest match at each store.
   - Brand-specific items → exact match or "unavailable".
4. Results display all items together per store, regardless of match type.

---

## Flow 6: Handle Unavailable Items

**Goal**: The user sees clear feedback when items aren't found at certain stores.

### 6.1 Item Unavailable at One or More Stores
1. When a product cannot be found at a store, the item row for that store shows an "unavailable" marker.
2. The unavailable item is excluded from that store's total (the total only reflects items that have a price).
3. The store column shows an "unavailable count" (e.g., "2 items unavailable").
4. Other stores that do have the item show their results normally.

### 6.2 Item Unavailable at All Stores
1. If an item cannot be found at any store, every column shows "unavailable" for that item.
2. The Mix & Match column also shows "unavailable" for that item.
3. The item contributes $0 to all totals.

### 6.3 Item with Null/Missing Price
1. If a store returns a product match but the price is null or missing, the item is treated as unavailable at that store.

---

## Flow 7: Handle Store Errors (Partial Degradation)

**Goal**: The app continues working even when some stores fail.

### 7.1 One Store's API Fails or Times Out
1. User submits their shopping list.
2. One store's API returns an error, times out (10-second limit), or is rate-limited.
3. The backend retries once with exponential backoff for transient errors (5xx, network errors).
4. If the store still fails, that store's entire column is marked as "temporarily unavailable."
5. Results from the remaining stores display normally.
6. The Mix & Match column only considers available stores.

### 7.2 Coles Session / Build ID Becomes Stale
1. The Coles Next.js build ID has expired (returns a 404).
2. The backend automatically re-fetches the Coles homepage to get a new build ID and retries once.
3. If the retry also fails, Coles is marked as temporarily unavailable.

### 7.3 All Stores Fail
1. If all four store APIs fail, the user sees a full-page error message explaining that no prices could be fetched.
2. The user can try again.

---

## Flow 8: Empty / Invalid Shopping List

**Goal**: Prevent the user from submitting an invalid search.

### 8.1 Empty List
1. If the shopping list has no items (or all item names are blank), the search button is disabled.
2. A validation message prompts the user to add at least one item.

### 8.2 Blank Item Name
1. If an item row has a quantity but no name, it is considered incomplete.
2. The form prevents submission until all items have names.

---

## Flow 9: Modify List and Re-Search

**Goal**: The user adjusts their shopping list and searches again.

1. After viewing results, the user scrolls back up to the shopping list form (which remains visible above the results).
2. User adds, removes, or edits items.
3. User clicks the search button again.
4. New loading state appears and fresh results replace the previous ones.
5. No previous results are cached on the client — each search is a fresh request.

---

## Flow 10: Use on Mobile While Shopping

**Goal**: The user compares prices on their phone while physically in a store.

1. User opens the app on a mobile browser (320px+ screen width).
2. User enters their shopping list using the touch-friendly form (large tap targets, mobile keyboard support).
3. User taps "Compare Prices."
4. Results appear in a tabbed layout (one store per tab).
5. User switches between store tabs to compare.
6. All content is readable without horizontal scrolling.
7. User can refer to the results while walking through the store.

---

## Summary: State Diagram

```
                    ┌─────────────┐
                    │  Empty State │
                    │  (Form only) │
                    └──────┬──────┘
                           │ User adds items
                           ▼
                    ┌─────────────┐
                    │  List Ready  │
                    │ (1+ items)   │
                    └──────┬──────┘
                           │ Click "Compare Prices"
                           ▼
                    ┌─────────────┐
                    │   Loading    │
                    │  (Spinner)   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌──────────┐ ┌──────────────┐
       │  Results    │ │ Partial  │ │  Full Error   │
       │ (All stores│ │ Results  │ │ (All stores   │
       │  respond)  │ │ (Some    │ │  failed)      │
       └─────┬──────┘ │ stores   │ └──────┬───────┘
             │        │ failed)  │        │
             │        └────┬─────┘        │
             │             │              │
             └──────┬──────┘              │
                    │ User edits list     │
                    │ and re-searches     │
                    ▼                     │
             ┌─────────────┐              │
             │  List Ready  │◄────────────┘
             │ (modified)   │  User tries again
             └─────────────┘
```

---

## Out of Scope (Not Supported)

The following are explicitly **not** user flows in the current product:

- User account creation, login, or authentication
- Saving or loading shopping lists across sessions
- Viewing price history or price change alerts
- Calculating total savings (difference between single-store and mix-and-match)
- Store location or proximity-based recommendations
- Delivery or pickup integration
- Push notifications
- Product image browsing
