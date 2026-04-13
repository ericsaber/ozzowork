

## Plan: Use real timestamp for today's interactions

**File:** `src/components/LogInteractionSheet.tsx` (line 179)

Replace the noon-anchored date construction with a conditional that uses `new Date().toISOString()` (real current timestamp) when logging today's date, and keeps the noon anchor for backdated entries.

**Before:**
```ts
const computedConnectDate = new Date(connectDate + "T12:00:00").toISOString();
```

**After:**
```ts
const computedConnectDate = connectDate === format(new Date(), "yyyy-MM-dd")
  ? new Date().toISOString()
  : new Date(connectDate + "T12:00:00").toISOString();
```

`format` from `date-fns` is already imported. No other files touched. All `console.log` statements preserved.

