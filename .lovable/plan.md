

## Step 8: Fix EditInteractionSheet for new schema

Single file: `EditInteractionSheet.tsx`

### Changes

1. **Imports**: Add `Trash2` to lucide imports. Add `AlertDialog` components from `@/components/ui/alert-dialog`.

2. **Props** (lines 20-36): Remove `followUp` prop. Change `interaction.date` → `interaction.connect_date`. Remove `followUp` from destructured params (line 38).

3. **State** (lines 40-48): Fix `interaction.date` → `interaction.connect_date`. Remove follow-up state variables (`followUpType`, `followUpDate`, `showFollowUpDatePicker`). Add `showDeleteConfirm` state.

4. **Save mutation** (lines 50-97): Fix `date:` → `connect_date:` with `T12:00:00` timezone guard. Remove entire follow-up update block (lines 66-86). Fix `onSuccess` invalidations — remove `follow-ups`/`followups-today`/`followups-upcoming`, add generic `["interactions"]`.

5. **Delete mutation**: Add new `deleteMutation` after save mutation with delete from `interactions`, console.log, invalidation of `["interactions", contactId]` and `["interactions"]`.

6. **Date picker** (line 152-163): Add `disabled={(d) => d > new Date()}` to prevent future dates.

7. **Remove follow-up JSX** (lines 182-253): Delete entire follow-up section (divider, type picker, date picker).

8. **Add delete button**: Below save button, add trash icon button that triggers `setShowDeleteConfirm(true)`.

9. **Add AlertDialog**: After the Drawer, render confirmation dialog with Cancel/Delete actions.

