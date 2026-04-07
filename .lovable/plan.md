

## Inline Follow-up Edit in ContactFollowupCard.tsx

### File changed: 1 — `src/components/ContactFollowupCard.tsx`

### New imports
Add: `useState` from React, `supabase` from `@/integrations/supabase/client`, `useQueryClient` from `@tanstack/react-query`, `Calendar` from `@/components/ui/calendar`, `Popover`/`PopoverContent`/`PopoverTrigger` from `@/components/ui/popover`, `cn` from `@/lib/utils`.

### New state
Inside the component, add:
```ts
const queryClient = useQueryClient();
const [isEditing, setIsEditing] = useState(false);
const [editDate, setEditDate] = useState("");
const [editType, setEditType] = useState<string | null>(null);
const [editReminder, setEditReminder] = useState("");
const [showDatePicker, setShowDatePicker] = useState(false);
```

### Dropdown change
Replace the `onEdit()` call in the "Edit follow-up" `DropdownMenuItem` (line 201) with:
```ts
setEditDate(taskRecord.planned_date);
setEditType(taskRecord.planned_type);
setEditReminder(taskRecord.reminder_note ?? "");
setIsEditing(true);
```

### Edit panel
When `isEditing` is true, replace the action subframe div (lines 109-243, the `width: calc(100% - 24px)` container) with an inline edit panel. The panel reuses the same outer wrapper and mirrors the `FollowupCard.tsx` `renderEditPanel()` structure exactly:

**Top section** — `background: tokens.subframeBg`, top border-radius `5px`, `padding: "10px 8px"`, flex column, `gap: 16px`:
- **DATE row**: "DATE" label (600 weight, 12px, uppercase, `tokens.color`). Below: `Popover` with pill button showing `CalendarIcon` 14px + formatted date. `PopoverContent` with `Calendar` (mode single, disable past dates, `pointer-events-auto`). `onClick stopPropagation` on content.
- **TYPE row**: "TYPE" label same style. Flex-wrap row of pill buttons for each `typeVerb` key using `typeIconMap` at 14px (matching FollowupCard icon size). Selected: `background: ${tokens.color}26`, `border: 1px solid ${tokens.color}`. Unselected: white bg, `border: tokens.doneBorder`. Tapping selected deselects to null.

**Bottom section** — `background: tokens.reminderBg`, `borderTop: 1px dashed ${tokens.reminderBorderColor}`, bottom border-radius `5px`, `padding: "10px 18px"`:
- **Reminder row**: `CornerDownRight` 16px + borderless transparent `<input>` (12px, 400 weight, `tokens.color`), `maxLength={44}`, placeholder "Add a reminder note...". Right-aligned counter `{len}/44`.
- **Button row**: right-aligned "Cancel" text button + "Save" filled pill button — styles copied from FollowupCard exactly.

### Cancel handler
Sets `isEditing: false`.

### Save handler
```ts
const handleSave = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("follow_ups").update({
    planned_date: editDate,
    planned_type: editType,
    reminder_note: editReminder.trim() || null,
  }).eq("id", taskRecord.id);

  if (error) { console.log("[ContactFollowupCard] inline edit error:", error); return; }

  if (editDate !== taskRecord.planned_date) {
    await supabase.from("follow_up_edits").insert({
      follow_up_id: taskRecord.id,
      user_id: user.id,
      previous_due_date: taskRecord.planned_date,
      previous_type: taskRecord.planned_type,
      changed_at: new Date().toISOString(),
    });
  }

  console.log("[ContactFollowupCard] inline edit saved:", { id: taskRecord.id, editDate, editType, editReminder });
  queryClient.invalidateQueries({ queryKey: ["follow-ups-today"] });
  queryClient.invalidateQueries({ queryKey: ["follow-ups-upcoming"] });
  queryClient.invalidateQueries({ queryKey: ["follow-ups-active"] });
  setIsEditing(false);
};
```

### What stays unchanged
- `onEdit` remains in the props interface (unused when inline edit is active)
- All existing `console.log` statements preserved
- All existing styles, tokens, colors unchanged
- Reschedule nudge section unchanged
- No other files touched

