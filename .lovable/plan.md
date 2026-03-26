

## Fix: Completion flow — separate tails-only coin for new follow-ups

### Problem
`insertCompletionRecord` stores `planned_follow_up_date` and `planned_follow_up_type` on op2, which also has `related_task_record_id` set. Dashboard queries filter out records with `related_task_record_id`, making the new follow-up invisible.

### Change — `src/components/CompleteFollowupSheet.tsx`

**`insertCompletionRecord` function (lines 72-107):**

1. Remove `planned_follow_up_type` and `planned_follow_up_date` from the op2 INSERT payload. Op2 always gets `status: "completed"` (it's just the interaction log).

2. After op2 insert, if `plannedFollowUpDate` is truthy, insert op3 — a clean tails-only coin with no `related_task_record_id`:

```typescript
// op2 INSERT — interaction record only
const { error } = await supabase.from("task_records" as any).insert({
  contact_id: contactId,
  user_id: userId,
  connect_type: connectType || null,
  note: note || null,
  connect_date: connectDate,
  status: "completed",
  related_task_record_id: taskRecordId,
});
if (error) throw error;

// op3 — new follow-up coin if date is set
if (plannedFollowUpDate) {
  console.log('[completion] op3 new follow-up coin:', { planned_follow_up_date: plannedFollowUpDate });
  const { error: op3Error } = await supabase.from("task_records" as any).insert({
    contact_id: contactId,
    user_id: userId,
    status: "active",
    planned_follow_up_type: plannedFollowUpType || null,
    planned_follow_up_date: plannedFollowUpDate,
  });
  if (op3Error) throw op3Error;
}
```

All existing console.logs remain. No other files change.

