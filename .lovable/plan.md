

## Plan: Undo Cancel + Active Follow-up Gate

**Single file change:** `src/pages/InteractionDetail.tsx`

### Changes

1. **Add `toast` import** from sonner (needed for success/error feedback on undo cancel).

2. **Add `activeFollowup` query** — fires when `task?.contact_id` is available, checks for any other active task record with a planned follow-up date on the same contact (excluding current record). Derives `hasOtherActiveFollowup` boolean.

3. **Add `undoCancelMutation`** — sets status back to `"active"`, clears `completed_at`, invalidates all relevant query keys including `active-followup-check`, shows toast on success/error.

4. **Gate "Undo complete"** — add `&& !hasOtherActiveFollowup` to the existing `isCompleted` condition.

5. **Add "Undo cancel" menu item** — after the undo-complete item, render a new item when `task?.status === "cancelled" && !hasOtherActiveFollowup`.

All existing `console.log` statements preserved. No other files touched.

### Technical Details

- Query uses `.maybeSingle()` with `.limit(1)` so it returns `null` when no active follow-up exists, avoiding errors on zero rows.
- The `.neq("id", id!)` filter excludes the current record from the check, so undoing a cancel on a record that *is* the only follow-up works correctly.
- Both undo mutations invalidate `active-followup-check` so the gate re-evaluates after state changes.

