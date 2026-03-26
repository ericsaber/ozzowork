

## Fix: Audit and repair all activeFollowup queries

### Problem
Three query locations besides `LogInteractionSheet.tsx` filter for active follow-ups without excluding standalone logs (`related_task_record_id` is set). Now that standalone logs store `planned_follow_up_date`, they appear as false positives.

### All locations found

| # | File | Line | Already fixed? |
|---|------|------|---------------|
| 1 | `LogInteractionSheet.tsx` | ~83 | Yes — has `.is('related_task_record_id', null)` |
| 2 | `InteractionDetail.tsx` | ~77 | **No** |
| 3 | `Today.tsx` | ~31 | **No** |
| 4 | `Upcoming.tsx` | ~17 | **No** |

### Changes

**1. `src/pages/InteractionDetail.tsx`** (line ~78, after `.not("planned_follow_up_date", "is", null)`)
- Add `.is('related_task_record_id', null)` before `.neq("id", id!)`
- Update the console.log after query result to include:
```typescript
console.log('[InteractionDetail] activeFollowup after fix:', { 
  activeFollowupId: (data as any)?.id, 
  related_task_record_id: (data as any)?.related_task_record_id 
});
```

**2. `src/pages/Today.tsx`** (line ~31, after `.not("planned_follow_up_date", "is", null)`)
- Add `.is('related_task_record_id', null)` before `.lte(…)`

**3. `src/pages/Upcoming.tsx`** (line ~17, after `.not("planned_follow_up_date", "is", null)`)
- Add `.is('related_task_record_id', null)` before `.gt(…)`

**4. `src/components/LogInteractionSheet.tsx`** (line ~87)
- Update existing console.log to match requested format:
```typescript
console.log('[activeFollowups] query result after fix:', data ? { id: (data as any).id, related: (data as any).related_task_record_id, date: (data as any).planned_follow_up_date } : null);
```

All existing console.logs remain untouched. No other files affected.

