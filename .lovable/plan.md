

## Plan: LogStep2 Via Icons, Spacing, Calendar Gap

**File:** `src/components/LogStep2.tsx`

### Fix 1 — Via icon background (line 412)

Change unselected via icon circle background from `#f0ede8` to `white`:

```tsx
background: selected ? "#c8622a" : "white",
border: selected ? "none" : "1px solid #e8e4de",
```

### Fix 2 — Via + reminder section spacing (line 379)

Change `marginTop: 16` → `marginTop: 24` on the `{selectedDate && (...)}` wrapper for more breathing room between date chips and the via/reminder section.

### Fix 3 — Calendar right gap (lines 349–373)

Add `width: "100%"` to the calendar wrapper div and add `w-full` to the Calendar's className (keeping existing `pointer-events-auto`, removing `p-3` so the wrapper controls spacing):

```tsx
<div
  style={{
    marginTop: 8,
    background: "#faf8f5",
    border: "1px solid #e8e4de",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  }}
>
  <Calendar
    ...
    className="pointer-events-auto w-full"
  />
</div>
```

### Preserved
- All `console.log` statements
- All other styling and logic

### Checklist
- ✅ Only `LogStep2.tsx` touched
- ✅ Via icon unselected background changed from `#f0ede8` to `white`
- ✅ Via + reminder section `marginTop` increased from 16 to 24
- ✅ Calendar wrapper gets `width: "100%"`
- ✅ Calendar className gets `w-full` added, `p-3` removed
- ✅ All `console.log` preserved

