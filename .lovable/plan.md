

## Plan: Save Log Only Nav, Skip Link, Outstanding Heading

**Files:** `src/components/LogInteractionSheet.tsx` and `src/components/OutstandingFollowupStep.tsx`.

### Fix 1 — `handleSaveLogOnly` navigates to contact record
In `LogInteractionSheet.tsx`, after the existing `clearAndClose()` call at the end of `handleSaveLogOnly`, add:
```ts
navigate(`/contact/${contactId}`);
```
This matches the pattern used by other save paths.

### Fix 2 — Hide skip link when active follow-up exists
In the step 1 bottom action area, change the skip-link condition from rendered-but-disabled to fully hidden:
```tsx
{!logOnly && !activeFollowup && (
  <button
    onClick={handleSkipToFollowup}
    style={{ fontSize: 13, color: "#888480", fontFamily: "Outfit, sans-serif",
      background: "none", border: "none", cursor: "pointer",
      textDecoration: "underline", textUnderlineOffset: "3px",
      textAlign: "center", padding: "4px" }}
  >
    Set a follow-up without logging
  </button>
)}
```
Removes the `disabled` prop and the conditional `#ccc` color — link is simply absent when an active follow-up is present.

### Fix 3 — Heading clears × close button
In `OutstandingFollowupStep.tsx`, add `paddingRight: 44` to the `<h2>` style so the heading wraps before colliding with the FullscreenTakeover's top-right close button.

### Preserved
- All `console.log` statements
- `handleSaveLogOnly` logic (draft publish vs. fresh insert vs. close)
- All other state, mutations, and rendering

### Checklist
- ✅ Only `LogInteractionSheet.tsx` and `OutstandingFollowupStep.tsx` touched
- ✅ `navigate(\`/contact/${contactId}\`)` added after `clearAndClose()` in `handleSaveLogOnly`
- ✅ Skip link hidden entirely with `!activeFollowup` (no disabled state)
- ✅ Heading has `paddingRight: 44`
- ✅ All `console.log` preserved

