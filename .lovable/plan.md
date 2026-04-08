

## Plan: Add debug log before draft insert

**File:** `src/components/LogInteractionSheet.tsx`

**Change:** Add one line immediately before line 198 (the `const { data, error } = await supabase` draft insert):

```ts
console.log('[LogInteractionSheet] draft connect_date:', connectDate);
```

This logs the raw `connectDate` state value before the draft interaction is inserted, helping trace whether the date is already wrong at this point.

No other changes. All existing `console.log` statements preserved.

