

## Fix: activeFollowups query picking up standalone logs

### Problem
The `activeFollowup` query in `LogInteractionSheet.tsx` (line 78-85) returns any active record with a `planned_follow_up_date`, including standalone logs that now store dates. This causes `OutstandingFollowupStep` to appear incorrectly.

### Changes

**`src/components/LogInteractionSheet.tsx`** — Two edits to the active follow-up query (lines 78-87):

1. Add `.is('related_task_record_id', null)` filter after the `.not("planned_follow_up_date", "is", null)` line
2. Add console.log after the query result:
```typescript
console.log('[activeFollowups] query result:', data ? [{ id: data.id, related: data.related_task_record_id, date: data.planned_follow_up_date }] : null);
```

No other files or logic affected.

