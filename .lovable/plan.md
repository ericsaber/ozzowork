

## Plan: Keep CompleteFollowupSheet mounted in Today.tsx

**File:** `src/pages/Today.tsx` only.

### Change

Replace the conditional `{completeTarget && (...)}` wrapper (lines ~280-290) with an always-mounted `<CompleteFollowupSheet>` whose visibility is controlled by the `open` prop. Use optional chaining + `??` fallbacks on the four target-derived props so they're safe when `completeTarget` is null during the close animation window.

```tsx
<CompleteFollowupSheet
  open={!!completeTarget}
  onOpenChange={(o) => { if (!o) setCompleteTarget(null); }}
  followUpId={completeTarget?.followUpId ?? ""}
  contactId={completeTarget?.contactId ?? ""}
  contactName={completeTarget?.contactName ?? ""}
  plannedType={completeTarget?.plannedType ?? null}
  userId=""
/>
```

This lets `FullscreenTakeover` play its full 420ms close transition before the parent state is cleared, since the component stays mounted across the open→closed prop change.

### Preserved
- All `console.log` statements
- All other logic, state, mutations, queries
- `LogInteractionSheet` and `LastInteractionSheet` blocks below it (already use the same always-mounted pattern)
- `AlertDialog` for cancel flow

### Checklist
- ✅ Only `Today.tsx` touched
- ✅ Conditional wrapper removed
- ✅ All four target-derived props use `?.` + `??` fallbacks
- ✅ No other logic changed
- ✅ All `console.log` preserved

