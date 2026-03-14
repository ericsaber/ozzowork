

## Bug: Completion flow overwrites original record's interaction data

### Root Cause

In `CompleteFollowupSheet.tsx`, the `logMutation` (lines 49-67) runs an UPDATE on the existing task record that overwrites `connect_type`, `connect_date`, and `note` with the NEW interaction data. This destroys the original interaction history.

### Fix

**`src/components/CompleteFollowupSheet.tsx`** — Change `logMutation` (Step 1) to do two things:
1. **Only** update `status` and `completed_at` on the existing record (preserve all other fields)
2. Store the new interaction data in component state only (it's already in `connectType`, `note`)

Then in Step 2:
- **followupMutation** (with follow-up): Creates a new record with the new interaction data + follow-up — already correct
- **handleSkip** (no follow-up): Must now also create a new heads-only record with the interaction data, since the logMutation no longer writes it anywhere

Concrete changes:

**logMutation** — replace the update payload:
```typescript
// Before: overwrites connect_type, connect_date, note
.update({
  status: "completed",
  completed_at: new Date().toISOString(),
  connect_type: connectType || null,
  connect_date: new Date().toISOString(),
  note: note || null,
})

// After: only marks complete
.update({
  status: "completed",
  completed_at: new Date().toISOString(),
})
```

**handleSkip** — create a heads-only record instead of just closing:
```typescript
const handleSkip = async () => {
  const { error } = await supabase.from("task_records" as any)
    .insert({
      contact_id: contactId,
      user_id: userId,
      connect_type: connectType || null,
      connect_date: new Date().toISOString(),
      note: note || null,
      status: "active",
    });
  if (error) { toast.error(error.message); return; }
  invalidateAll();
  toast.success("Interaction logged");
  handleClose();
};
```

**followupMutation** — already correct (creates new record with interaction data + follow-up fields).

