

## Two Issues to Fix

### 1. Edit record toggle memory (EditTaskRecord.tsx)

**Problem**: When the user toggles off "Interaction logged" or "Follow-up planned", the form fields (connect type, note, follow-up type, date) are visually hidden. But the values are also being used as-is from state — so if someone toggles off and back on, the state is still intact. However, the **save mutation** (lines 75-93) nulls out those fields when the toggle is off. The real issue is that toggling off doesn't reset the UI state, but re-opening the form after a save *does* lose the data because it was saved as null.

The fix is simpler: **the toggles should only control visibility, not data**. The save mutation already handles nulling fields when toggles are off. But the user wants the *UI state* preserved during toggle on/off within the same edit session.

Looking at the code: the state variables (`connectType`, `note`, `connectDate`, `followUpType`, `followUpDate`) are independent of `interactionOn`/`followUpOn`. The toggle only controls rendering via `{interactionOn && (...)}`. So the values *should* persist when toggling off and on.

Wait — let me re-read. The user says "if I turn off the log interaction and I had a text note there previously, it erases it when I toggle it back on." This means something IS clearing the state. Looking at the code... the `useEffect` on line 58-68 runs when `task` changes. But `task` shouldn't change from a toggle. Unless the query re-fetches.

Actually, the state is initialized from `task` in the `useEffect`. The toggle itself doesn't clear state. But `setInteractionOn(false)` only hides the section — state persists. So the values should survive a toggle cycle within the same session. Unless there's a re-render trigger.

Let me reconsider: the `useEffect` dependency is `[task]`. If `task` reference changes (e.g., from a background refetch), the effect re-runs and resets all state from the DB values. This could happen if react-query refetches (e.g., window focus). That would wipe local edits.

**Fix**: Track whether the form has been initialized and skip re-initialization on subsequent `task` changes. Use a ref to prevent re-initialization.

### 2. History reverse chronological order

The ContactHistory page already sorts by `connect_date` descending (line 82). The query also uses `order("created_at", { ascending: false })`. This should already be reverse chronological. But the user says it's not — perhaps some records have null `connect_date` and the fallback to `created_at` is causing incorrect ordering, or the sort is somehow broken.

Actually, looking more carefully: records without `connect_type` are filtered out of `historyRecords` (line 81). The sort on line 82 uses `connect_date || created_at`. This should work. The issue might be that `connect_date` is stored as a full ISO timestamp while the sort comparison works with `new Date().getTime()` which should be fine.

I'll ensure the sort is robust by making it explicit and correct.

## Plan

### File: `src/pages/EditTaskRecord.tsx`
- Add a `useRef(false)` flag (`initialized`) to track first initialization
- In the `useEffect`, only set state when `initialized.current` is false, then set it to true
- This prevents react-query background refetches from wiping local form edits

### File: `src/pages/ContactHistory.tsx`  
- Verify the history sort is correct (it appears to be). Ensure the `.sort()` on line 82 properly handles null `connect_date` values and sorts newest first.

