

## Plan: LogStep1 Note Card Height in CompleteFollowupSheet

**File:** `src/components/CompleteFollowupSheet.tsx` only.

### Changes

**1. Scrollable content div** — add flex column properties so children can stretch:
```tsx
<div className="px-5 pb-6" style={{
  flex: 1,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
}}>
```

**2. Step 1 padding wrapper** — add flex chain properties:
```tsx
<div style={{
  paddingTop: 20,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
}}>
  <LogStep1 ... />
</div>
```

**3. Step 2 padding wrapper** — apply the same set of properties to keep both branches consistent.

### Preserved
- All `console.log` statements
- All mutations, handlers, state, dialogs, celebration overlay
- All component props and structure outside the three style blocks above

### Checklist
- ✅ Only `CompleteFollowupSheet.tsx` touched
- ✅ Scrollable content div gets `display: flex` + `flexDirection: column` (+ `minHeight: 0`)
- ✅ Step 1 padding wrapper gets `flex: 1` + flex column + `minHeight: 0`
- ✅ Step 2 padding wrapper updated to match
- ✅ No other changes
- ✅ All `console.log` preserved

