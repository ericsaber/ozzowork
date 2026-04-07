

## Remove debug console.log from ContactHistory.tsx

### Change

**`src/pages/ContactHistory.tsx` lines 763-766** — Remove the IIFE wrapper and console.log, replacing with the plain `format()` call:

```tsx
// From:
{(() => {
  console.log('[ContactHistory] raw connect_date:', record.connect_date);
  return format(parseDate(record.connect_date || record.created_at), "MMM d");
})()}

// To:
{format(parseDate(record.connect_date || record.created_at), "MMM d")}
```

No other changes.

