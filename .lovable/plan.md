

## Add debug log for connect_date in interaction timeline row

### Change in `src/pages/ContactHistory.tsx`

**Line 758** — Insert `console.log` immediately before the `format()` call. Since the format call is inline in JSX, wrap both the log and the format in a comma expression or an IIFE.

Add before line 758 (inside the `<span>`), replacing the current format expression with:

```tsx
{(() => {
  console.log('[ContactHistory] raw connect_date:', record.connect_date);
  return format(record.connect_date ? (record.connect_date.length === 10 ? new Date(record.connect_date + 'T00:00:00') : parseISO(record.connect_date)) : parseISO(record.created_at), "MMM d");
})()}
```

No other changes.

