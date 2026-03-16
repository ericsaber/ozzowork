

## Log Flow Fixes (Round 1) — Implementation Plan

### Fix 1: All flows render as bottom sheets

**Current state**: FAB (`/log` route) renders `LogInteraction` as a full-screen page. CompleteFollowupSheet already uses `<Drawer>`.

**Change**:
- Convert `LogInteraction` from a routed page into a bottom-sheet `<Drawer>` triggered from `BottomNav`
- `BottomNav.tsx`: Instead of `navigate("/log")`, open a local `<Drawer>` state. Render a new `LogInteractionSheet` component inside the drawer.
- Extract the logic from `LogInteraction.tsx` into a new `src/components/LogInteractionSheet.tsx` that accepts `open`, `onOpenChange`, and optional `preselectedContactId` props — same pattern as `CompleteFollowupSheet`
- Drawer styling: `max-h-[90vh]`, border-radius handled by DrawerContent, drag handle already built into DrawerContent component (36px wide bar)
- Sheet content scrollable via `overflow-y-auto` on inner div
- Keep `/log` route working as a redirect or remove it; the FAB no longer navigates
- For contact record Log button: also trigger `LogInteractionSheet` with `preselectedContactId` instead of navigating to `/log?contact=X`

**Files**: `src/components/BottomNav.tsx`, new `src/components/LogInteractionSheet.tsx` (extracted from `LogInteraction.tsx`), update contact record page to use the sheet, possibly remove/simplify `src/pages/LogInteraction.tsx`

---

### Fix 2: Toast — wrong checkmark, fix animations

**File**: `src/components/CelebrationHeader.tsx`

"Done." variant fixes:
- Line 112: change `gap-1.5` → `gap-[8px]`
- Line 113-121: "Done." text — change fontFamily to `var(--font-heading)` (Crimson Pro), fontSize `20px`, color `#c8622a` (currently uses `--font-body` and `--foreground`)
- Line 124-131: "✓" — change fontSize to `17px`, color to `#c8622a` (currently uses `hsl(var(--success))` which is green), keep as plain text character (already is ✓ text)
- Animation on ✓: already has `toast-check-pop` but the keyframes show scale going 0→1.2→1. Fix to match spec: `0%: opacity 0, scale(0.3)` → `100%: opacity 1, scale(1)` with `cubic-bezier(.34,1.56,.64,1)` over 220ms delay 100ms

"Nice work." variant:
- Already uses `var(--font-heading)`, 20px, `hsl(var(--primary))` — looks correct
- Verify animation delays match spec (280ms for bar, then text at 280ms delay, subline at 400ms delay — currently 80ms and 180ms, need to update)

---

### Fix 3: Stepper active label styling

**File**: `src/components/StepIndicator.tsx`

- Line 37-44 `labelStyle`: When active, change weight to `600` and color to `#c8622a`. Currently active label is `#1c1812` weight 500.

---

### Fix 4: Contact combobox — cap results, always show add button

**File**: `src/components/LogStep1.tsx`

- Lines 76-84 `filteredContacts`: Cap to 3 when no search query, cap to 5 when searching
- Line 259 `max-h-[180px]`: Remove this or adjust — dropdown should fit 3 results + add row without scrolling, then cap at that height
- Ensure "Add" row is always visible (it's in a separate `border-t` div outside the scrollable area — already looks correct structurally, just need to constrain the scrollable list)

---

### Fix 5: Global 118% font scale in log flow sheet

Apply a CSS scale wrapper on the sheet content for both `LogInteractionSheet` and `CompleteFollowupSheet`:
- Wrap sheet inner content in a div with `style={{ fontSize: "118%" }}` — but since sizes are in px throughout, need to multiply each px value by 1.18
- Systematically update all `text-[Xpx]` and `fontSize` values in `LogStep1.tsx`, `LogStep2.tsx`, `StepIndicator.tsx` (but NOT `CelebrationHeader.tsx`)
- Key size changes: 10px→12px, 11px→13px, 12px→14px, 13px→15.5px, 14px→16.5px, 9px→10.5px, 7px→8px

---

### Fix 6: Green card — always show "Tap to edit"

**File**: `src/components/LogStep2.tsx`

- Line 74: Currently wrapped in `{connectType && (` — the card should show even without connectType if we want "Tap to edit" always
- Line 112: Currently wrapped in `{onUpdateLog && (` — good, but also needs to show when `!note` so user can add a note after the fact
- Change: Always show "Tap to edit" regardless of whether note exists. The link should appear even when note is empty.

---

### Fix 7: AI transcription — verify wiring

**Current state**: The edge function uses OpenAI Whisper + Lovable AI gateway for summarization. Both API keys exist in secrets. The client-side flow in `LogStep1.tsx`:
1. `startRecording()` → sets `isRecording`, starts MediaRecorder
2. `handleMainCTA()` when recording → calls `stopRecording()` which fires `mediaRecorder.stop()`
3. `mediaRecorder.onstop` → calls `transcribeAudio(blob)` which sets `isTranscribing`, fetches edge function, sets note, then calls `onRecordingComplete`

**Potential issue**: `stopRecording()` sets `isRecording = false` immediately (line 136), but transcription hasn't started yet. The `onstop` callback is async. The `onRecordingComplete` in `transcribeAudio` fires in the `finally` block — but `onRecordingComplete` is only passed from `LogInteraction.tsx` if it exists.

**Check**: In `LogInteraction.tsx`, `onRecordingComplete` is NOT passed to `LogStep1`. So after transcription, the flow never auto-advances to step 2. Need to pass `onRecordingComplete={() => logMutation.mutate()}` or similar.

Also in `CompleteFollowupSheet.tsx` line 129-139, `onRecordingComplete` is not passed either.

**Fix**: Wire `onRecordingComplete` in both `LogInteractionSheet` and `CompleteFollowupSheet` to trigger the log mutation after transcription completes.

Additionally, the `supabase.auth.getClaims` method (line 31 of edge function) may not exist in the Supabase JS client version used. This could cause 401 errors. Should replace with `supabase.auth.getUser(token)`.

---

### Implementation Order

1. Fix 2 (Toast) — isolated component, no dependencies
2. Fix 3 (Stepper labels) — one-line change
3. Fix 6 (Tap to edit) — small LogStep2 change
4. Fix 4 (Contact combobox caps) — LogStep1 change
5. Fix 5 (Font scaling) — systematic px updates across LogStep1, LogStep2, StepIndicator
6. Fix 7 (Transcription wiring) — wire onRecordingComplete, fix edge function auth
7. Fix 1 (Bottom sheet conversion) — largest change, extract LogInteraction into sheet component

### Files Changed

1. `src/components/CelebrationHeader.tsx` — toast fixes
2. `src/components/StepIndicator.tsx` — active label weight/color
3. `src/components/LogStep2.tsx` — always show tap to edit, font scaling
4. `src/components/LogStep1.tsx` — contact cap, font scaling, recording wiring
5. `src/components/BottomNav.tsx` — trigger sheet instead of navigate
6. New `src/components/LogInteractionSheet.tsx` — extracted from LogInteraction
7. `src/pages/LogInteraction.tsx` — simplified or removed
8. `src/components/CompleteFollowupSheet.tsx` — font scaling, recording wiring
9. `supabase/functions/transcribe-audio/index.ts` — fix auth (getClaims → getUser)
10. Contact record page — use sheet instead of navigate

