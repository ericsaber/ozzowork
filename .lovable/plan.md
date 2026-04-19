

## Plan: Accordion Label When Unselected

**File:** `src/components/LogStep1.tsx`

### Change

Update the unselected state label in the Log Type affordance trigger row from "Log Type" to "How did you connect?":

```tsx
// Line ~406-408
) : (
  <span style={{ fontSize: 14, fontWeight: 500, color: "#888480", fontFamily: "Outfit, sans-serif" }}>
    How did you connect?
  </span>
)}
```

When a type IS selected, the label continues to show the selected type name in sienna — no change there.

### Preserved
- All `console.log` statements
- Selected state styling (sienna color, type name)
- All other component logic

### Checklist
- ✅ Only `LogStep1.tsx` touched
- ✅ Unselected state label: "How did you connect?"
- ✅ Selected state label: unchanged (type name in sienna)
- ✅ All `console.log` preserved

