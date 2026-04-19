

## Plan: Celebration Text, Cancel Toast, Discard/Skip Logic Fixes

**Files:** `src/components/LogInteractionSheet.tsx` and `src/components/CompleteFollowupSheet.tsx`.

### Fix 1 — Reschedule celebration text (LogInteractionSheet)
In `handleOutstandingUpdate`, replace the static `triggerCelebration("Logged.", contactId)` with:
```ts
const text = !isKeep ? "Logged & set." : "Logged.";
triggerCelebration(text, contactId);
```
`isKeep` is already defined in scope.

### Fix 2 — Cancel from outstanding uses toast (LogInteractionSheet)
In `handleOutstandingCancelConfirm`, replace `triggerCelebration("Logged.", contactId)` with:
```ts
toast.success("Log saved. Follow-up cancelled.");
clearAndClose();
navigate(`/contact/${contactId}`);
```
Keep the existing `setShowCancelConfirmDialog(false)` call.

### Fix 3 — Separate discard dialog for skip-to-step-2
- Add state: `const [showSkipDiscardDialog, setShowSkipDiscardDialog] = useState(false);`
- Reset in `clearAndClose`: `setShowSkipDiscardDialog(false);`
- In `handleSkipToFollowup`, change `setShowDiscardDialog(true)` → `setShowSkipDiscardDialog(true)`.
- Add a new `<AlertDialog>` (sibling, after the existing discard dialog) with title "Discard your note?", body "Your note won't be saved if you skip logging.", actions "Keep editing" / "Discard and skip". The Discard action:
  - Closes dialog
  - Deletes draft if present (`supabase.from("interactions").delete().eq("id", draftId)`)
  - Clears `connectType`, `note`, sets `draftId` to null
  - Sets `logSkipped` to true (Fix 4)
  - Calls `setStep(2)`

### Fix 4 — Hide "Skip follow-up" on step 2 when log was skipped
- Add state: `const [logSkipped, setLogSkipped] = useState(false);`
- Reset in `clearAndClose`: `setLogSkipped(false);`
- In `handleSkipToFollowup`, after `setNote("")` and before `setStep(2)`, add `setLogSkipped(true);`
- In the new skip-discard AlertDialog Discard action (Fix 3), set `setLogSkipped(true)` before `setStep(2)`.
- Update the step 2 / step 3 bottom area Skip follow-up button condition from `{startStep !== 2 && (...)}` to `{startStep !== 2 && !logSkipped && (...)}`.

### Fix 5 — Hide "Set a follow-up without logging" on Log-it path
Update step 1 bottom area condition from `{!logOnly && !activeFollowup && (...)}` to `{!logOnly && !activeFollowup && !isContactPrefilled && (...)}`.

### Fix 6 — Remove "Skip follow-up" from step 1 in CompleteFollowupSheet
In the `step === 1` bottom action area in `CompleteFollowupSheet.tsx`, remove the "Skip follow-up" `<button>` element entirely. The step 2 bottom area skip link is unchanged.

### Rename
In `LogInteractionSheet.tsx`, rename the button label "Set a follow-up without logging" → "Skip log" everywhere it appears.

### Preserved
- All `console.log` statements
- All mutations, queries, state, other handlers
- Existing discard dialog (× / outstanding flow) untouched in behavior — only the skip-link path is rerouted to the new dialog

### Checklist
- ✅ Only `LogInteractionSheet.tsx` and `CompleteFollowupSheet.tsx` touched
- ✅ `handleOutstandingUpdate`: text toggles by `isKeep`
- ✅ `handleOutstandingCancelConfirm`: toast + close + nav (no overlay)
- ✅ `showSkipDiscardDialog` state added, reset in `clearAndClose`
- ✅ `handleSkipToFollowup` uses new dialog
- ✅ New AlertDialog with "Discard and skip" action → clears + setStep(2)
- ✅ `logSkipped` state added, set in skip paths, reset in `clearAndClose`
- ✅ Step 2 skip link hidden when `logSkipped`
- ✅ Step 1 skip link hidden when `isContactPrefilled`
- ✅ Step 1 "Skip follow-up" removed from CompleteFollowupSheet
- ✅ Skip link label renamed to "Skip log"
- ✅ All `console.log` preserved

