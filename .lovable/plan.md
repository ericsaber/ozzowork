

## Plan: LogInteractionSheet Celebration + Nudge + Skip Fixes

**File:** `src/components/LogInteractionSheet.tsx` only.

### Fix 1 — Celebration overlay
- Add import: `Check` to existing `lucide-react` import line.
- Add state:
  ```ts
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("Logged.");
  ```
- Add `setShowCelebration(false)` inside `clearAndClose`'s reset block.
- Add helper `triggerCelebration(text, contactIdForNav)` that sets text/visibility and after 1800ms calls `clearAndClose()` + `navigate(\`/contact/${contactIdForNav}\`)`.

**Replace `toast.success + clearAndClose + navigate` patterns with `triggerCelebration(...)`:**
- `logMutation.onSuccess` logOnly path (line ~268–270): `triggerCelebration("Logged.", contactId)`
- `followupMutation.onSuccess` (line ~379–388): drop the toast + close + nav, use `triggerCelebration(result?.completePath && result.hasFollowup ? "Logged & set." : (result?.completePath ? "Logged." : "Logged & set."), contactId)` — per spec: `result.hasFollowup ? "Logged & set." : "Logged."`
- `handleSkip` complete-path (line ~422–425): `triggerCelebration("Logged.", contactId)`
- `handleSkip` normal-path (line ~439–442): `triggerCelebration("Logged.", contactId)`
- `handleSaveLogOnly` (line ~654–657): `triggerCelebration("Logged.", contactId)`
- `handleOutstandingUpdate` (line ~494–497): `triggerCelebration("Logged.", contactId)`
- `handleOutstandingCancelConfirm` (line ~531–535): keep `setShowCancelConfirmDialog(false)` then `triggerCelebration("Logged.", contactId)` (drop toast/close/nav).

**Overlay JSX** added after `</FullscreenTakeover>` (line 1164), before the AlertDialogs, inside the outer `<>`:
- Fixed full-screen, `zIndex: 70`, bg `#f0f7f4`, centered column flex
- `<style>` tag with `celebFadeIn` and `celebCheck` keyframes
- Animated check circle (Lucide `Check`, size 32, stroke `#2d6a4f`, strokeWidth 2.5)
- `celebrationText` in Crimson Pro 32 / `#2d6a4f`
- `contactName` in Outfit 16 / `#888480`

### Fix 2 — Hide nudge when logOnly
Update line 929 condition:
```tsx
{activeFollowup && contactId && !logOnly && (
```

### Fix 3 — `handleSkipToFollowup` checks dirty
Insert at top of `handleSkipToFollowup` (after the `contactId` guard, before the existing console.log on line 603):
```ts
if (isDirty) {
  setShowDiscardDialog(true);
  return;
}
```

### Fix 4 — `handleSkip` early-return when nothing to do
Insert at top of `handleSkip` (after the `user` fetch, before the `existingFollowup` branch on line 398):
```ts
if (!draftId && !existingFollowup) {
  console.log("[handleSkip] no draft, no follow-up — closing");
  clearAndClose();
  return;
}
```

### Preserved
- All `console.log` statements
- All mutations, queries, draft flow, AlertDialog flows
- All other behavior (only save-success bodies, two early returns, one render condition, and added overlay)

### Checklist
- ✅ Only `LogInteractionSheet.tsx` touched
- ✅ `showCelebration` + `celebrationText` state added; reset in `clearAndClose`
- ✅ `triggerCelebration` replaces all `toast.success + clearAndClose + navigate` save paths
- ✅ Celebration overlay at `zIndex: 70` with spring check animation
- ✅ `Check` imported from lucide-react
- ✅ Nudge hidden when `logOnly === true`
- ✅ `handleSkipToFollowup` shows discard dialog if `isDirty`
- ✅ `handleSkip` early-return when no draft and no existing follow-up
- ✅ All `console.log` preserved

