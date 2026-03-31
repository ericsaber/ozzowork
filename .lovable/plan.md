

## Fix: Skip Step 1 should not create an interaction draft

Single file change: `src/components/LogInteractionSheet.tsx`

### Change 1 — `onSkipToFollowup` prop (line 566)

Replace the current `() => logMutation.mutate()` with an async handler that:
- Logs the skip
- Deletes any existing draft (if user previously hit Next then came back)
- Clears connectType/note, sets skippedInteraction true, routes to Step 2
- Does NOT call logMutation

### Change 2 — `followupMutation` guard (line 237)

Replace `if (!draftId) throw new Error("No draft interaction")` with a soft log when no draft and no existing follow-up, allowing the follow-up-only path to proceed.

### Change 3 — `followupMutation` normal path (lines 290-310)

Wrap the publish step in `if (draftId)` so it's skipped when Step 1 was skipped. Add else-branch log.

### Change 4 — `handleSkip` normal path (lines 365-375)

Add an else-branch log when no draftId exists (already conditionally publishes, just needs the log line).

