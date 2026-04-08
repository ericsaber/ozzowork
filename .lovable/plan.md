

## Plan: Navigate to contact record after save

### Summary
Add `useNavigate` to `LogInteractionSheet.tsx` and `CompleteFollowupSheet.tsx`. After every successful save/complete action, navigate to `/contact/${contactId}`. `OutstandingFollowupStep.tsx` needs no changes — it's purely presentational and delegates all save actions back to `LogInteractionSheet.tsx` via callbacks.

### Changes

**1. `src/components/LogInteractionSheet.tsx`**

- Add `import { useNavigate } from "react-router-dom";` and call `const navigate = useNavigate();` inside the component.
- Replace every `clearAndClose()` that follows a successful save with `clearAndClose(); navigate(\`/contact/\${contactId}\`);` — specifically in:
  - `logMutation.onSuccess` (logOnly path, line ~226) — after `clearAndClose()`
  - `followupMutation.onSuccess` (line ~338) — after `clearAndClose()`
  - `handleSkip` normal path (line ~391) — after `clearAndClose()`
  - `handleSkip` complete path (line ~376) — after `clearAndClose()`
  - `handleOutstandingUpdate` (line ~454) — after `clearAndClose()`
  - `handleOutstandingCancelConfirm` (line ~491) — after `clearAndClose()`
- All existing `toast.*` calls remain untouched — toast fires, then navigate.

**2. `src/components/CompleteFollowupSheet.tsx`**

- Add `import { useNavigate } from "react-router-dom";` and call `const navigate = useNavigate();` inside the component.
- In `followupMutation.onSuccess` (line ~123): after `handleClose()`, add `navigate(\`/contact/\${contactId}\`);`
- In `handleSkip` (line ~161): after `handleClose()`, add `navigate(\`/contact/\${contactId}\`);`
- All existing `toast.*` calls remain untouched.

**3. `src/components/OutstandingFollowupStep.tsx`**

No changes needed. This component only calls `onComplete`, `onUpdate`, and `onCancel` callbacks — the actual saves and navigation happen in `LogInteractionSheet.tsx`.

### Notes
- Navigation fires after `clearAndClose()` / `handleClose()`, which calls `onOpenChange(false)` and resets state in a `setTimeout`. The `navigate` call happens synchronously after, so the drawer closes and navigation begins immediately.
- No UI changes, no toast removal, no file changes outside the two listed files.

