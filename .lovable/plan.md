

## Remove cross-mode links in LogInteractionSheet

Two surgical deletions — no other files touched.

### 1. LogStep1.tsx — Remove "Set a follow-up without logging" link

Delete lines 704–713 (the `{onSkipToFollowup && ...}` block). The `onSkipToFollowup` prop can stay in the interface for now — it simply won't render anything.

### 2. LogStep2.tsx — Remove "Want to add one?" nudge

Delete lines 89–111 (the entire `{skippedInteraction && !isEditing && ...}` block that renders the orange nudge card with "No interaction logged. Want to add one?").

The `onAddInteraction` prop and the `handleAddInteraction` callback in `LogInteractionSheet.tsx` become dead code but are left untouched to keep the change minimal. All existing `console.log` statements preserved.

