

## Plan: Add debug log before draft insert/update

**File:** `src/components/LogInteractionSheet.tsx`

Add `console.log("[debug] getConnectDateISO:", getConnectDateISO(), "connectDate:", connectDate);` in the `logMutation` `mutationFn`, immediately before the draft insert call and immediately before the draft update call — two insertions total.

No other files touched. All existing `console.log` statements preserved.

