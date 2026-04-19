

## Plan: Skip Log Link Condition Fix

**File:** `src/components/LogInteractionSheet.tsx` only.

### Change
In the step 1 bottom action area, swap the condition on the "Skip log" button:

```tsx
// Before:
{!logOnly && !activeFollowup && !isContactPrefilled && (

// After:
{!logOnly && !activeFollowup && !preselectedContactId && (
```

### Preserved
- All `console.log` statements
- Every other state, handler, mutation, and render

### Checklist
- ✅ Only `LogInteractionSheet.tsx` touched
- ✅ Single condition swap: `!isContactPrefilled` → `!preselectedContactId`
- ✅ No other changes
- ✅ All `console.log` preserved

