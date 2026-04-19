

## Plan: Alert Visibility Condition

**File:** `src/components/LogStep1.tsx`

### Change

Update the `showAlert` computed value on line 199 to use `connectType !== ""` instead of `isContactPrefilled`:

```tsx
// Before (line 199):
const showAlert = !!(activeFollowup && onSaveLogOnly && (isContactPrefilled || alertRevealed));

// After:
const showAlert = !!(activeFollowup && onSaveLogOnly && (connectType !== "" || alertRevealed));
```

### Behavior

| Entry point | `connectType` on mount | Alert shows |
|---|---|---|
| Log it from card (type pre-selected) | non-empty | immediately |
| FAB from contact page (no type pre-selected) | empty | after first action (canNext flips true) |

### Preserved
- All `console.log` statements
- `alertRevealed` state and its `useEffect` trigger
- All other component logic

### Checklist
- ✅ Only `LogStep1.tsx` touched
- ✅ `showAlert` condition uses `connectType !== ""` instead of `isContactPrefilled`
- ✅ No other changes
- ✅ All `console.log` preserved

