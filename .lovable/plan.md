

## Fix: InteractionDetail — standalone logs skip own follow-up tail

### Problem
Standalone logs (`related_task_record_id` is set) now store `planned_follow_up_date` for thread line display, causing InteractionDetail to render a "What's Next" section and action buttons as if this record owns a follow-up.

### Changes — `src/pages/InteractionDetail.tsx`

**1. New query: fetch related coin** (after the `activeFollowup` query, ~line 91)

Add a query that fetches the related coin when `task.related_task_record_id` is set:
```typescript
const { data: relatedCoin } = useQuery({
  queryKey: ["task-record", task?.related_task_record_id],
  queryFn: async () => {
    const { data, error } = await supabase.from("task_records" as any)
      .select("*")
      .eq("id", task!.related_task_record_id!)
      .single();
    if (error) throw error;
    return data as any;
  },
  enabled: !!task?.related_task_record_id,
});
```

**2. Derived state** (after `hasFollowUp` declaration, ~line 148)

Add:
```typescript
const isStandaloneLog = !!task.related_task_record_id;
```
Add console log:
```typescript
if (isStandaloneLog) {
  console.log('[InteractionDetail] standalone log — skipping own follow-up tail:', { related_task_record_id: task.related_task_record_id });
}
```

**3. What's Next section** (~lines 282-322)

- When `isStandaloneLog` is true, render the related coin's follow-up state instead of the record's own fields
- If `relatedCoin` exists and has `planned_follow_up_date` and status is not `completed`/`cancelled`, show the coin's follow-up info (type, date, overdue badge)
- Otherwise render "No follow-up scheduled" (without the "Add one?" button since standalone logs shouldn't create follow-ups)

**4. Bottom action bar** (~line 326)

Change `showBottomBar` to also require `!isStandaloneLog`:
```typescript
const showBottomBar = hasFollowUp && !isCompleted && !isStandaloneLog;
```

**5. Dropdown menu Reschedule item** (~line 202)

Also hide the Reschedule menu item for standalone logs — add `&& !isStandaloneLog` to the condition.

All existing console.logs remain untouched.

