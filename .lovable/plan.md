

## Finding: Publish step is clean — root cause is in draft creation

The publish UPDATE across all files only sets `{ status: "published" }` — `connect_date` is never touched during publish. So the bug isn't there.

**However**, I found the actual root cause of the "tomorrow" date bug in two places:

### Root cause: `new Date().toISOString()` produces UTC

When it's evening in a Western Hemisphere timezone (e.g. 8 PM EDT = midnight UTC), `new Date().toISOString()` returns a string like `2026-04-09T00:00:00.000Z` — which is **tomorrow's date** when sliced to 10 chars.

### Fix 1: `LogInteractionSheet.tsx` line 177-180

Current code:
```ts
const computedConnectDate =
  connectDate === format(new Date(), "yyyy-MM-dd")
    ? new Date().toISOString()
    : new Date(connectDate + "T12:00:00").toISOString();
```

The "today" branch uses `new Date().toISOString()` which drifts to tomorrow in negative UTC offsets. **Fix**: use the same safe construction for both branches:

```ts
const computedConnectDate = new Date(connectDate + "T12:00:00").toISOString();
```

The special-case for "today" is unnecessary — `connectDate` is already `"yyyy-MM-dd"` format, and `T12:00:00` noon anchoring prevents any timezone from shifting the date.

### Fix 2: `CompleteFollowupSheet.tsx` line 54

Current code:
```ts
const connectDate = new Date().toISOString();
```

Same UTC drift problem. **Fix**: use today's local date with noon anchoring:

```ts
const connectDate = new Date(format(new Date(), "yyyy-MM-dd") + "T12:00:00").toISOString();
```

This requires adding `format` to the existing `date-fns` import.

### Files touched
- `src/components/LogInteractionSheet.tsx` — simplify `computedConnectDate` to always use noon-anchored construction (1 line change)
- `src/components/CompleteFollowupSheet.tsx` — replace `new Date().toISOString()` with noon-anchored local date (1 line change + add `format` import)

### No other changes
All existing `console.log` statements preserved. Publish logic untouched (it's already correct).

