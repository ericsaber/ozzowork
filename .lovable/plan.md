

## Step 9: Fix EditFollowupSheet for new schema

Single file: `EditFollowupSheet.tsx`

### Changes

1. **Props**: Replace `follow_up_type`/`due_date` with `planned_type`/`planned_date`, add `reminder_note`. Make `planned_type` nullable.

2. **State**: Initialize from new field names. Add `reminderNote` state.

3. **Original type derivation**: Handle null `planned_type` gracefully. Update subtitle to conditionally show type.

4. **Mutation rewrite**:
   - Only insert into `follow_up_edits` when `planned_date` actually changed (per schema rules — type/reminder changes don't create edit rows).
   - Add `reminder_note` to the update payload.
   - Add console.log statements for both edit insert and follow-up update.
   - Fix query invalidation keys: `follow-ups`, `follow-ups-active`, `follow-ups-today`, `follow-ups-upcoming`, `interactions`.

5. **handleClose**: Reset all three state values using new field names.

6. **Type pills**: Allow deselecting (toggle off) via `followUpType === t.value ? "" : t.value`.

7. **Reminder note field**: Add between due date section and Save button — text input with 55-char hard limit, character counter, styled consistently.

