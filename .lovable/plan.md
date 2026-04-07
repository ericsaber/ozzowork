

## Fix timezone-safe connect_date parsing in ContactHistory.tsx

### File: `src/pages/ContactHistory.tsx` — 3 locations

**Line 533** (featured card):
```ts
// From:
{format(parseISO(record.connect_date || record.created_at), "MMM d")}
// To:
{format(record.connect_date ? new Date(record.connect_date + 'T00:00:00') : parseISO(record.created_at), "MMM d")}
```

**Line 641** (completed follow-up row):
```ts
// From:
format(parseISO(fu.connect_date), "MMM d")
// To:
format(new Date(fu.connect_date + 'T00:00:00'), "MMM d")
```

**Line 758** (interaction timeline row):
```ts
// From:
{format(parseISO(record.connect_date || record.created_at), "MMM d")}
// To:
{format(record.connect_date ? new Date(record.connect_date + 'T00:00:00') : parseISO(record.created_at), "MMM d")}
```

Lines 533 and 758 need a ternary because of the `created_at` fallback (which stays as `parseISO`). Line 641 is straightforward since it's already inside a `fu.connect_date` truthiness check. No other changes.

