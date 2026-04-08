

## Plan: Stable secondary sort in renderComingUp

**File:** `src/pages/Today.tsx`, line 182

**Change:** Replace the single-key sort with a two-key sort (date then first name):

```tsx
// Before (line 182)
const sorted = [...comingUp].sort((a, b) => a.planned_date.localeCompare(b.planned_date));

// After
const sorted = [...comingUp].sort((a, b) => {
  const dateA = a.planned_date.slice(0, 10);
  const dateB = b.planned_date.slice(0, 10);
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  const nameA = a.contacts?.first_name || '';
  const nameB = b.contacts?.first_name || '';
  return nameA.localeCompare(nameB);
});
```

No other changes. The debug log line was already removed previously.

