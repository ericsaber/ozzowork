

## Log Flow Bug Fixes Round 2 — Implementation Plan

### Bug 1: FAB avatar renders before data loads

**File: `src/components/LogStep1.tsx`**

- Lines 316-327 (prefilled contact branch) and lines 219-224 (searchable selected state): Guard avatar rendering — only show the filled avatar circle when `initials` and `contactName` are non-empty strings
- If either is empty, render the dashed placeholder state ("Who did you talk to?") instead
- Same guard in the searchable branch (line 219-237)

### Bug 2: FAB retains stale contact context

**File: `src/components/BottomNav.tsx`**

- Line 14-15: `contextContactId` is derived from `location.pathname` which already updates on navigation. The issue is that `LogInteractionSheet` receives `contextContactId` as a prop but only reads `preselectedContactId` on initial mount (line 36 of LogInteractionSheet: `useState(preselectedContactId || "")`)
- Fix: In `LogInteractionSheet.tsx`, add a `useEffect` that syncs `contactId` state when `preselectedContactId` changes AND the sheet is not open (or when it opens fresh). Currently the effect on line 47-54 only restores drafts — add logic to reset `contactId` to `preselectedContactId || ""` when the sheet opens and there's no draft.

### Bug 3: "Change" link always visible when contact selected

**File: `src/components/LogStep1.tsx`**

- Line 229: Currently `{hasSelectedOnce && (` gates the "Change" link. Remove this condition — show "Change" whenever `contactSelected && !searchOpen`
- Line 314-327 (prefilled/non-searchable branch): Add a "Change" link here too. When tapped, switch to searchable mode by calling a new `onChangeContact` callback that clears the prefilled state
- In `LogInteractionSheet.tsx`: Add handler that clears `preselectedContactId` locally (set a `contactCleared` state) so `isContactPrefilled` becomes false, enabling search mode

### Bug 4: "Nice work." subline text

**File: `src/components/CelebrationHeader.tsx`**

- Line 106: Change `" · First interaction"` to `" · First follow-up"`

### Bug 5: AI transcription speed optimizations

**File: `src/components/LogStep1.tsx`**

- Lines 113-131 (startRecording): Configure MediaRecorder with lower quality — `{ mimeType: "audio/webm", audioBitsPerSecond: 32000 }` for smaller files
- Lines 134-141 (stopRecording): Already sets `isTranscribing(true)` immediately — good
- Lines 143-175 (transcribeAudio): Fire the fetch call before any state updates. Currently `setIsTranscribing(true)` on line 145 is redundant (already set in stopRecording). Remove the redundant set.
- Lines 380-386 (transcribing UI): Enhance with animated ellipsis/pulse placeholder in the note area instead of a simple spinner
- Line 164: Remove `toast.success("Recording transcribed")` — this is Bug 11's snackbar issue, handle it there
- Do NOT implement Web Speech API fallback — note it as a future consideration

### Bug 6: Today screen entry ordering

**File: `src/pages/Today.tsx`**

- Lines 37-52: After categorizing into overdue/dueToday/comingUp, add explicit sorts:
  - `overdue.sort((a, b) => a.planned_follow_up_date.localeCompare(b.planned_follow_up_date))` — ascending (oldest first)
  - `dueToday.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())` — descending (newest first)
  - `comingUp` already sorted ascending by the query's `.order()` — verify this is correct
- Line 51: Remove `overdue.reverse()` — it currently reverses ascending to descending, which is wrong per spec

### Bug 7: Save button disappears after Keep Editing

**File: `src/components/LogInteractionSheet.tsx`**

- Lines 74-86 (handleOpen): When user dismisses and `isDirty`, `savedDraft` is set and `showDiscardDialog` is shown. The sheet itself closes via `onOpenChange(false)` being prevented. But the `return` on line 80 prevents `onOpenChange(false)` from firing — the Drawer's internal state may still close.
- Fix: When "Keep editing" is tapped (line 271), explicitly call `onOpenChange(true)` to ensure the drawer stays open. Also ensure no state is reset during the dismiss intercept — the `handleOpen` function should NOT close the drawer when showing the dialog.
- Audit: The CTA button (LogStep1 line 452-467) renders based on `isRecording`, `canSubmit`, `isTranscribing` — none of these should be affected by the dismiss/reopen cycle. The issue is likely the Drawer itself closing briefly. Fix by keeping Drawer open while dialog is shown.

### Bug 8: Contact record scroll on minimal content

**File: `src/pages/ContactHistory.tsx`**

- Line 141: Change `min-h-screen` to `min-h-full` or remove it, and add `overflow-y-auto` only when content overflows
- Better approach: keep `min-h-screen` (needed for layout) but remove any forced scrollability. The issue may be `pb-24` (padding for bottom nav) creating scroll space. This is correct behavior — keep as-is but ensure no extra height is added beyond content + bottom padding.
- Actually check if there's a parent with `overflow: scroll` set unconditionally. If the page just has normal document flow with `min-h-screen`, scroll should only happen when content exceeds viewport. The `pb-24` accounts for the fixed bottom nav. This may be a non-issue in the current code — verify and only change if there's an explicit `overflow-y: scroll` somewhere.

### Bug 9: Recording without contact — soft flag after transcription

**File: `src/components/LogStep1.tsx`**

- Add state: `const [showContactFlag, setShowContactFlag] = useState(false)`
- In `transcribeAudio` success handler (line 162-164): After setting note, check if `!contactId` — if so, `setShowContactFlag(true)`
- In `handleContactSelect` (line 99-104): Add `setShowContactFlag(false)`
- In contact header row (line 209): When `showContactFlag` is true, add a warm border `1.5px solid rgba(200,98,42,0.4)` to the header row and show "Select a contact to continue" message below it in 13px (11px × 1.18) muted sienna

### Bug 10: Recording layout stability

**File: `src/components/LogStep1.tsx`**

- Lines 331-410 (note/mic area): Set a `min-height` on the container div (line 331) that matches the default state height — approximately `min-h-[180px]` to prevent collapse
- Lines 362-379 (recording mode): Keep the structure identical to default — show "Recording… tap to stop" where "Speak a few sentences" was, and keep "or tap here to type…" visible below the divider
- Lines 380-386 (transcribing): Show pulsing placeholder text in the note area position rather than a simple spinner. Keep mic in default state, show "Transcribing..." as animated italic text where the note would appear

### Bug 11: Remove "Recording transcribed" snackbar

**File: `src/components/LogStep1.tsx`**

- Line 164: Remove `toast.success("Recording transcribed")` — the populated note is confirmation enough
- Audit other `toast()` calls in the log flow files. The only ones that should remain are error toasts and save confirmations. Any success toast within the sheet should auto-dismiss in 2.5s max (sonner default is fine).

### Files Changed

1. `src/components/LogStep1.tsx` — Bugs 1, 3, 5, 9, 10, 11
2. `src/components/LogInteractionSheet.tsx` — Bugs 2, 3, 7
3. `src/components/CelebrationHeader.tsx` — Bug 4
4. `src/pages/Today.tsx` — Bug 6
5. `src/pages/ContactHistory.tsx` — Bug 8
6. `src/components/CompleteFollowupSheet.tsx` — Bug 3 (Change link support)

