

## Inline Follow-up Edit in FollowupCard.tsx

### Overview
Replace the external edit sheet with an inline edit panel inside the card. When "Edit follow-up" is tapped, the action subframe transforms into date/type/reminder fields with Cancel/Save.

### Save handler — exact code block

```tsx
const handleSave = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("follow_ups")
    .update({
      planned_date: editDate,
      planned_type: editType,
      reminder_note: editReminder.trim() || null,
    })
    .eq("id", taskRecordId);

  if (error) {
    console.log("[FollowupCard] inline edit error:", error);
    return;
  }

  if (editDate !== dueDate) {
    await supabase.from("follow_up_edits").insert({
      follow_up_id: taskRecordId,
      user_id: user.id,
      previous_due_date: dueDate,
      previous_type: plannedType,
      changed_at: new Date().toISOString(),
    });
  }

  console.log("[FollowupCard] inline edit saved:", {
    taskRecordId, editDate, editType, editReminder,
  });

  queryClient.invalidateQueries({ queryKey: ["follow-ups-today"] });
  queryClient.invalidateQueries({ queryKey: ["follow-ups-upcoming"] });
  queryClient.invalidateQueries({ queryKey: ["follow-ups-active"] });
  setIsEditing(false);
};
```

Key points:
- `supabase.auth.getUser()` is awaited and destructured before any DB write
- `user.id` is used only after the null guard (`if (!user) return`)
- The `follow_up_edits` insert only fires when the date actually changed, per the data model (date changes only)
- `previous_type` captures the original type at time of edit, matching the schema

### All other plan details
Unchanged from the previously approved plan — state management, edit panel UI (date pill, type pills, reminder input), cancel handler, and render logic remain as specified.

