

## Plan: Apply real-timestamp logic to InlineInteractionEdit save

**File:** `src/components/InlineInteractionEdit.tsx`

`format` from `date-fns` is already imported (line 7). No import changes needed.

**Line 51** — replace:
```ts
connect_date: editDate,
```
with:
```ts
connect_date: editDate === format(new Date(), "yyyy-MM-dd")
  ? new Date().toISOString()
  : new Date(editDate + "T12:00:00").toISOString(),
```

All `console.log` statements preserved. No other files touched.

