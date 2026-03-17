

## Log Flow Bug Fixes — Implementation Plan

### Bug 1: FAB context-awareness from contact record

**File: `src/components/BottomNav.tsx`**

- Use `useLocation()` + `useParams()` pattern to detect if current route matches `/contact/:id`
- Extract contact ID from the route path via regex or `matchPath`
- Pass it as `preselectedContactId` to `LogInteractionSheet`

```
// In BottomNav:
const contactMatch = location.pathname.match(/^\/contact\/(.+)$/);
const contextContactId = contactMatch ? contactMatch[1] : undefined;
// Pass to LogInteractionSheet as preselectedContactId={contextContactId}
```

No other files need changes — `LogInteractionSheet` already handles `preselectedContactId`.

---

### Bug 2: "Nice work." trigger — change from count 1 to count 2

**File: `src/components/CelebrationHeader.tsx`**

- Line 38-39: `displayCount` is currently `(interactionCount ?? 0) + 1`, and `isFirst` checks `displayCount <= 1`
- Change: `isFirst = displayCount === 2` (the second interaction = first real follow-up completion)
- "Done." fires when `displayCount > 2`
- When `displayCount === 1`: show "Done." (not "Nice work." — first interaction isn't celebratory)

---

### Bug 3: No auto-advance after transcription without connect type

**File: `src/components/LogStep1.tsx`**

- Lines 170-174: The `finally` block in `transcribeAudio` calls `onRecordingComplete()` unconditionally
- Remove `onRecordingComplete()` from the `finally` block entirely
- After transcription, just populate the note and stay on step 1
- The user must select a connect type chip, then tap "Next →" to advance normally

**File: `src/components/LogInteractionSheet.tsx`** and **`CompleteFollowupSheet.tsx`**:
- Remove `onRecordingComplete` prop from `LogStep1` usage (lines 189, 144) since it's no longer needed for auto-advance

---

### Bug 4: Transcription speed — fire API call earlier

**File: `src/components/LogStep1.tsx`**

- Currently: `stopRecording()` calls `mediaRecorder.stop()` which triggers `onstop` callback asynchronously, which then calls `transcribeAudio`
- Optimization: In `stopRecording`, immediately set `isTranscribing(true)` so the UI shows the transcribing state instantly (no frozen UI)
- The actual flow can't start the API call before the blob is assembled (MediaRecorder needs to fire `onstop`), but showing the loading state immediately removes perceived latency
- Move `setIsRecording(false)` and `setIsTranscribing(true)` into `stopRecording` so the UI transitions instantly

---

### Bug 5: Keyboard causes bottom sheet to jump

**File: `src/components/ui/drawer.tsx`** (or a wrapper approach)

- The issue is the Vaul drawer repositioning when the virtual keyboard opens
- Add to the `DrawerContent` component: listen to `window.visualViewport` resize events
- When keyboard appears, prevent the sheet from reflowing by using a fixed height based on `visualViewport.height`
- Alternative simpler approach: on the search input in `LogStep1.tsx`, add `onFocus` handler that scrolls the input into view within the sheet's scroll container rather than letting the browser push the sheet up
- Add CSS to the drawer: `position: fixed; bottom: 0` is already set by Vaul. The fix is to prevent the height from changing — set `max-height` based on `visualViewport.height` instead of `100vh`

Implementation: Add a `useEffect` in `DrawerContent` that listens to `visualViewport.resize` and sets a CSS custom property `--visual-vh` on the content element. Use that for `max-height` instead of `90vh`.

---

### Bug 6: Recording UI — stop button size and mic size

**File: `src/components/LogStep1.tsx`**

- Lines 336-347 (default mic): Change width/height from 44 to 48px
- Lines 363-372 (recording mode): Replace the small pulsing red circle with a 48px circle (same position/size as the mic) with a red background and a white square stop icon
- The stop button must be tappable — ensure no overlapping elements or pointer-events issues
- The "Done recording →" CTA at the bottom should also work (it already calls `handleMainCTA` which calls `stopRecording`)
- After transcription: note populates, mic returns to default 48px state (already happens via state reset)

---

### Bug 7: "Set follow-up only" nudge on step 2

**Files: `src/components/LogStep2.tsx`, `src/components/LogInteractionSheet.tsx`, `src/components/CompleteFollowupSheet.tsx`**

- Add a `skippedInteraction` boolean prop to `LogStep2`
- In `LogInteractionSheet`: track whether user arrived at step 2 via the skip path. Currently `onSkipToFollowup` calls `logMutation.mutate()` which creates a task_record without connect_type — detect this by checking if `connectType` is empty when entering step 2
- In `LogStep2`: when `skippedInteraction` is true, replace/augment the green card with a nudge: "No interaction logged. Want to add one?" as a tappable link
- The link should call `onBack?.()` to go back to step 1
- Pass `onBack={() => setStep(1)}` when `skippedInteraction` is true

---

### Bug 8: Today screen refresh after saving follow-up

**Files: `src/components/LogInteractionSheet.tsx`, `src/components/CompleteFollowupSheet.tsx`**

- Both already call `invalidateAll()` which invalidates `task-records-today` — check if the query key matches what the Today page uses
- Read the Today page to verify the query key

**File: `src/pages/Today.tsx`** — verify query key matches `task-records-today`

This may already work. If the query key matches, the issue might be that `invalidateAll` runs but the Today page component is unmounted (sheet is open over it). React Query should still refetch on remount if stale. Verify `staleTime` isn't set too high.

---

### Bug 9: Cannot skip both interaction and follow-up

**File: `src/components/LogStep2.tsx`**

- Add `skippedInteraction` prop (same as Bug 7)
- When `skippedInteraction` is true: hide or disable the "Skip follow-up" button (line 314-321)
- The user must save a follow-up if they skipped the interaction

---

### Bug 10: Sheet dismissal — preserve draft state

**File: `src/components/LogInteractionSheet.tsx`**

- Add `isDirty` computed boolean: `!!note || !!connectType || (!!contactId && !preselectedContactId)`
- In `handleOpen(false)`: if `isDirty`, show a confirmation dialog instead of closing
- Use `AlertDialog` component (already imported in the project)
- "Discard" → clears state and closes
- "Keep editing" → dismisses dialog, keeps sheet open
- Draft persistence: store draft in a module-level variable (outside component) or use `useRef` that persists across sheet open/close. On FAB tap, if draft exists, restore it.

Implementation:
- Create a module-level `let savedDraft: { contactId, connectType, note } | null = null`
- On "Discard": `savedDraft = null`, close sheet
- On dismiss with dirty: save to `savedDraft`, show dialog
- On open: if `savedDraft` exists, restore values

---

### Implementation Order

1. Bug 3 (remove auto-advance) — small, critical fix
2. Bug 1 (FAB context) — small BottomNav change
3. Bug 2 (Nice work trigger) — CelebrationHeader condition change
4. Bug 6 (mic size / stop button) — LogStep1 UI
5. Bug 4 (transcription speed) — LogStep1 timing
6. Bug 7 + 9 (skip interaction nudge + prevent double skip) — LogStep2 props
7. Bug 8 (Today refresh) — verify query keys
8. Bug 5 (keyboard jump) — drawer viewport fix
9. Bug 10 (draft preservation) — LogInteractionSheet state management

### Files Changed

1. `src/components/BottomNav.tsx` — extract contact ID from route
2. `src/components/CelebrationHeader.tsx` — change trigger condition
3. `src/components/LogStep1.tsx` — remove auto-advance, mic sizing, transcription timing
4. `src/components/LogStep2.tsx` — add skippedInteraction prop, nudge, hide skip
5. `src/components/LogInteractionSheet.tsx` — track skip state, draft persistence, discard dialog
6. `src/components/CompleteFollowupSheet.tsx` — remove onRecordingComplete from LogStep1
7. `src/components/ui/drawer.tsx` — visualViewport keyboard fix

