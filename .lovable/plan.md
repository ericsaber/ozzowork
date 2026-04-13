

## Plan: Fix timeline sort to preserve full timestamps

**File:** `src/pages/ContactHistory.tsx` (line 179)

Replace the current sort with a version that checks for `T` in the date string — if present, parse the full timestamp to preserve time-of-day ordering; otherwise, use the safe date-only parse.

**Before:**
```ts
timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
```

**After:**
```ts
timelineItems.sort((a, b) => {
  const dateA = a.date?.includes('T') ? new Date(a.date).getTime() : new Date(a.date.slice(0, 10) + 'T00:00:00').getTime();
  const dateB = b.date?.includes('T') ? new Date(b.date).getTime() : new Date(b.date.slice(0, 10) + 'T00:00:00').getTime();
  return dateB - dateA;
});
```

No other files touched. All `console.log` statements preserved.

