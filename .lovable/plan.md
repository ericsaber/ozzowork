

## Three Bug Fixes

Three files modified. All existing console.log statements preserved.

### Bug 1 — `src/components/LogInteractionSheet.tsx`
- Line 412: Change `previous_type: existingFollowup.planned_follow_up_type` to `previous_type: existingFollowup.planned_follow_up_type || ''`
- Add console.log after the insert (line 416) logging the inserted values

### Bug 2 — `src/components/CompleteFollowupSheet.tsx`
- Lines 53-61: Update the op1 UPDATE to include `planned_follow_up_type: null` and `planned_follow_up_date: null` in both the console.log and the `.update()` call

### Bug 3 — `src/components/CompleteFollowupSheet.tsx` + `src/components/LogStep2.tsx`
- Line 104 in CompleteFollowupSheet: Add `console.log("[completion] followupMutation received:", { type, date })` before the `insertCompletionRecord` call
- Line 377 in LogStep2: Change the CTA onClick to log `{ followUpType, selectedDate }` before calling `onSaveWithFollowup`

