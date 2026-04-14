

## Plan: Apply real-timestamp logic to EditInteractionSheet

**File:** `src/components/EditInteractionSheet.tsx`

`format` from `date-fns` is already imported (line 7). No import changes needed.

**Line 57** — replace:
```ts
connect_date: new Date(date + "T12:00:00").toISOString(),
```
with:
```ts
connect_date: date === format(new Date(), "yyyy-MM-dd")
  ? new Date().toISOString()
  : new Date(date + "T12:00:00").toISOString(),
```

All `console.log` statements preserved. No other files touched.

