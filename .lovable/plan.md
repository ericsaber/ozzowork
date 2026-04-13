

## Plan: Extract `getConnectDateISO` helper in LogInteractionSheet

### What changes

**File:** `src/components/LogInteractionSheet.tsx`

1. **Add helper** after line 52 (the `connectDate` state declaration):
```ts
const getConnectDateISO = () =>
  connectDate === format(new Date(), "yyyy-MM-dd")
    ? new Date().toISOString()
    : new Date(connectDate + "T12:00:00").toISOString();
```

2. **Remove lines 179-181** (the `computedConnectDate` variable inside `logMutation`'s `mutationFn`) and replace all references to it (lines 190, 194, 206) with `getConnectDateISO()`.

3. **Lines 260 and 356 are NOT touched** — those are `completed_at` timestamps using `new Date().toISOString()`, unrelated to `connectDate`. They happen to share the variable name but serve a different purpose.

### No other files touched. All `console.log` statements preserved.

