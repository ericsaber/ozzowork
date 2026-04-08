

## Plan: Add stable sort to Upcoming.tsx

**File:** `src/pages/Upcoming.tsx`

**Change 1** (around line 108, before the JSX return): Add the `sortedItems` const:

```tsx
const sortedItems = [...(items || [])].sort((a, b) => {
  const dateA = a.planned_date.slice(0, 10);
  const dateB = b.planned_date.slice(0, 10);
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  const nameA = a.contacts?.first_name || '';
  const nameB = b.contacts?.first_name || '';
  return nameA.localeCompare(nameB);
});
```

**Change 2** (in render): Replace `items.map((item: any) => {` with `sortedItems.map((item: any) => {` and update the length check from `items.length > 0` to `sortedItems.length > 0`.

No other changes.

