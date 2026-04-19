

## Plan: Fix `parseDate` Utility for UTC Timestamps

**Files:** `src/components/InteractionItem.tsx` and `src/pages/ContactHistory.tsx` only.

### Problem
`dateStr.slice(0, 10)` on a UTC timestamp like `2026-04-19T01:53:00.000Z` returns the UTC calendar date, not the user's local date. For US users logging in the evening, this shows tomorrow's date.

### Fix
Update both helpers to branch on whether the input contains a `T`:
- **Plain date string** (`yyyy-MM-dd`): append `T00:00:00` so JS interprets as local midnight (avoids UTC shift on date-only fields like `planned_date`).
- **Full ISO timestamp** (contains `T`): parse directly with `new Date(iso)` — JS automatically converts UTC to local time.

### Change 1 — `src/components/InteractionItem.tsx`
Replace the `parseLocalDate` helper:
```ts
const parseLocalDate = (iso: string) => {
  if (!iso) return new Date();
  if (!iso.includes('T')) return new Date(iso + 'T00:00:00');
  return new Date(iso);
};
```
All five existing call sites remain unchanged.

### Change 2 — `src/pages/ContactHistory.tsx`
Replace the `parseDate` helper:
```ts
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (!dateStr.includes('T')) return new Date(dateStr + 'T00:00:00');
  return new Date(dateStr);
};
```
All existing call sites remain unchanged.

### Preserved
- All `console.log` statements
- All call sites (only helper internals change)
- All other logic, imports, and rendering

### Checklist
- ✅ Only `InteractionItem.tsx` and `ContactHistory.tsx` touched
- ✅ `parseLocalDate` updated to detect `T` in string
- ✅ `parseDate` updated to detect `T` in string
- ✅ No call sites changed
- ✅ All `console.log` preserved

