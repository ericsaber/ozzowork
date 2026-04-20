

## Plan: Calendar Component Width

**Files:** `src/components/ui/calendar.tsx`, `src/components/LogStep2.tsx`

### Fix 1 — Remove hardcoded p-3 from calendar.tsx (line 14)

Change:
```tsx
className={cn("p-3", className)}
```
To:
```tsx
className={cn(className)}
```

### Fix 2 — Distribute cells evenly (lines 28, 30)

Change `head_row` and `row` classNames to use `justify-between`:

```tsx
head_row: "flex justify-between",
row: "flex w-full mt-2 justify-between",
```

### Fix 3 — Add padding via wrapper in LogStep2.tsx (lines 350-358)

Add `padding: "12px 12px 8px"` to the calendar wrapper div:

```tsx
<div
  style={{
    marginTop: 8,
    background: "#faf8f5",
    border: "1px solid #e8e4de",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
    padding: "12px 12px 8px",
  }}
>
```

### Preserved
- All `console.log` statements
- All other styling and logic

### Checklist
- ✅ Only `calendar.tsx` and `LogStep2.tsx` touched
- ✅ Hardcoded `p-3` removed from calendar component
- ✅ `head_row` and `row` use `justify-between`
- ✅ LogStep2 wrapper gets padding
- ✅ All `console.log` preserved

