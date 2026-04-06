

## Wire "Cancel and log" to open LogInteractionSheet after cancelling

### Summary
In all three cancel dialogs, the "Cancel and log what happened" button will cancel the follow-up **and then** open `LogInteractionSheet` with the contact pre-selected. The contact ID is captured **in the onClick handler** (while `cancelTarget` is still in state), not in the mutation's `onSuccess` callback.

### 1. Today.tsx

- **Add import**: `LogInteractionSheet` (not currently imported).
- **Add state**: `const [cancelLogContactId, setCancelLogContactId] = useState<string | null>(null);`
- **Update "Cancel and log" onClick** (line 265–268): Capture contact ID first, then mutate:
  ```tsx
  onClick={() => {
    if (cancelTarget) {
      setCancelLogContactId(cancelTarget.contact_id);
      cancelFollowUpMutation.mutate();
    }
  }}
  ```
- **Render LogInteractionSheet** after the AlertDialog:
  ```tsx
  <LogInteractionSheet
    open={!!cancelLogContactId}
    onOpenChange={(o) => { if (!o) setCancelLogContactId(null); }}
    preselectedContactId={cancelLogContactId}
    startStep={1}
    logOnly={false}
  />
  ```

### 2. Upcoming.tsx

- **Add import**: `LogInteractionSheet` (not currently imported).
- **Add state**: `const [cancelLogContactId, setCancelLogContactId] = useState<string | null>(null);`
- **Update "Cancel and log" onClick** (line 186): Capture contact ID first, then mutate:
  ```tsx
  onClick={() => {
    if (cancelTarget) {
      setCancelLogContactId(cancelTarget.contact_id);
      cancelFollowUpMutation.mutate(cancelTarget.id);
    }
  }}
  ```
  "Yes, cancel" button (line 193) stays unchanged — no `setCancelLogContactId`.
- **Render LogInteractionSheet** after the AlertDialog, same pattern as Today.tsx.

### 3. ContactHistory.tsx

- LogInteractionSheet is **already imported and rendered** with existing `logSheetMode` state.
- **Update "Cancel and log" onClick** (line 780–783): Add `setLogSheetMode` call:
  ```tsx
  onClick={() => {
    if (cancelTarget) {
      cancelFollowUpMutation.mutate(cancelTarget.id);
      setLogSheetMode({ startStep: 1, logOnly: false });
    }
  }}
  ```
  The existing `LogInteractionSheet` already has `preselectedContactId={id}` (route param), so no additional wiring needed.

### 4. No other files touched.

All existing `console.log` statements preserved. No query invalidation additions needed — `LogInteractionSheet` already invalidates follow-up queries on save.

