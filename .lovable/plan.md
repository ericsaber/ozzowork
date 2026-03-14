

# Fix: New follow-up record must include interaction data

## Problem

When completing a follow-up task, the flow works in two steps:
1. **Step 1** (logMutation): Marks the existing task record as completed AND writes interaction data (connect_type, connect_date, note) onto it
2. **Step 2** (followupMutation): Creates a **new** task record but only includes follow-up fields (planned_follow_up_type, planned_follow_up_date)

The new record is missing the interaction data from step 1. Per the unified task_records model, each record should be a combined heads+tails item: "what happened" (the interaction just logged) + "what's next" (the planned follow-up). The current code creates a tails-only record, so when you tap into the new follow-up task, the interaction section is empty.

## Fix

### `src/components/CompleteFollowupSheet.tsx`

**followupMutation** (line 70-88): Include the interaction data from step 1 state in the new record's insert payload:

```typescript
// Current (tails-only):
.insert({
  contact_id: contactId,
  user_id: userId,
  planned_follow_up_type: type,
  planned_follow_up_date: date,
  status: "active",
})

// Fixed (combined heads+tails):
.insert({
  contact_id: contactId,
  user_id: userId,
  connect_type: connectType || null,
  connect_date: new Date().toISOString(),
  note: note || null,
  planned_follow_up_type: type,
  planned_follow_up_date: date,
  status: "active",
})
```

Similarly, **handleSkip** (line 100-104) currently just closes with "Marked complete" — the logMutation in step 1 already saved the interaction data on the *old* record before advancing to step 2. Skip means no new record is created, which is correct. No change needed there.

This single change ensures the new task record mirrors the original logging pattern: interaction + follow-up on one record.

