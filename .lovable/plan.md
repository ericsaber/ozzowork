

## Fix: Use `parseDate` in `allInteractionDates` calculation

### Change

**`src/pages/ContactHistory.tsx`** — in the `allInteractionDates` mapping, replace `new Date(r.connect_date || r.created_at)` with `parseDate(r.connect_date || r.created_at)`.

```ts
// From:
.map(r => new Date(r.connect_date || r.created_at).getTime())

// To:
.map(r => parseDate(r.connect_date || r.created_at).getTime())
```

No other changes.

