

## Plan: Prompt 2b Fix 2 — Save/Skip to Bottom, Edit Panel, Reminder Wiring

**Files:** `src/components/LogStep2.tsx`, `src/components/LogInteractionSheet.tsx`, `src/components/CompleteFollowupSheet.tsx`

### Fix 1 — LogStep2.tsx: hoist Save/Skip out

- Add prop `onFollowupStateChange?: (date: string, type: string, reminderNote: string) => void` to `LogStep2Props`.
- Add `useEffect(() => { onFollowupStateChange?.(selectedDate, followUpType, reminderNote); }, [selectedDate, followUpType, reminderNote])` to push state up on every change (and once on mount).
- Remove the Section 6 Save button (lines 482–514) and Section 7 Skip link (lines 516–538) from the render entirely. Keep `onSaveWithFollowup`, `onSkip`, `isSaving` in the interface (CompleteFollowupSheet still passes them; just unused in the render).
- Remove now-unused `ArrowRight` import.

### Fix 2 — LogStep2.tsx: edit panel font + pill visibility

- Change the edit-panel textarea (lines 186–206) to `fontFamily: "Outfit, sans-serif"` and remove `fontStyle: "italic"`.
- Restructure the render so the **summary pill always renders when `connectType || note`**, regardless of `isEditing`. Hide only the "·" + "edit" link inside the pill when `isEditing` is true (omit lines 127–151 conditionally).
- Move the heading "Set a follow-up" so it always renders next.
- Wrap the date chips + Pick date + inline calendar + via/reminder reveal in `{!isEditing && (...)}`. Render the edit-panel card in `{isEditing && (...)}` after the heading. Net effect: pill + heading stay visible, edit panel replaces only the date/via section.

### Fix 3 — LogInteractionSheet.tsx: bottom Save/Skip + reminder wiring

- Add state: `pendingDate`, `pendingType`, `pendingReminder` (all `useState("")`).
- Reset all three in `clearAndClose()`.
- Update `followupMutation` mutationFn signature to `{ type, date, reminderNote }: { type: string; date: string; reminderNote: string }`. Add `reminder_note: reminderNote.trim() || null` to BOTH `follow_ups` inserts (the complete-path insert ~line 322 and the normal-path insert ~line 351). Add `console.log` confirming the reminder value at each insert site.
- In both `step === 2` and `step === 3` `<LogStep2>` calls, add `onFollowupStateChange={(date, type, reminder) => { setPendingDate(date); setPendingType(type); setPendingReminder(reminder); }}`. Keep existing `onSaveWithFollowup` / `onSkip` props (now no-op visually but kept for interface stability) — pass `onSaveWithFollowup={() => {}}` and remove `onSkip` since buttons live outside.
  - Actually simpler: keep passing existing callbacks unchanged so types stay valid; the buttons just don't render inside LogStep2.
- Add a new bottom action area block rendered when `step === 2 || step === 3` (mirroring the step 1 bottom block at line 891):
  - `flexShrink: 0`, `padding: "8px 20px 24px"`, flex column, gap 8.
  - Save button wrapper with progressive reveal: `maxHeight: pendingDate ? 60 : 0`, `opacity: pendingDate ? 1 : 0`, `overflow: hidden`, `transition: "max-height 0.3s ease, opacity 0.25s ease"`. Inside: full-width sienna pill button labeled "Save" + ArrowRight 18 (or "Saving…"); onClick calls `followupMutation.mutate({ type: pendingType, date: pendingDate, reminderNote: pendingReminder })` with a `console.log("[LogInteractionSheet] save step2:", ...)`.
  - Skip link ("Skip follow-up", `#888480` 13px underline) rendered when `startStep !== 2`, calls `handleSkip`.

### Fix 4 — CompleteFollowupSheet.tsx: same Save/Skip bottom pattern

- Add `pendingDate`, `pendingType`, `pendingReminder` state; reset in `handleClose`.
- Pass `onFollowupStateChange` to `<LogStep2>`.
- Update `followupMutation` signature to accept `reminderNote`; include `reminder_note: reminderNote.trim() || null` on the new follow-up insert; add `console.log`.
- Wrap the existing scrollable content div so the bottom Save+Skip area sits as a sibling with `flexShrink: 0` (mirror LogInteractionSheet structure). Save button reveal gated by `pendingDate`; Skip calls existing `handleSkip`. The Save button's onClick calls `followupMutation.mutate({ type: pendingType, date: pendingDate, reminderNote: pendingReminder })`.
- Existing `onSaveWithFollowup` / `onSkip` props on `<LogStep2>` remain (no-op for buttons since they no longer render inside LogStep2).

### Preserved
- All `console.log` statements across all three files.
- All draft/publish logic, outstanding follow-up handling, mutations, navigation, state-restoration in `clearAndClose`/`handleClose`.
- All other LogStep2 sections (summary pill, heading, date chips, inline calendar, via row, reminder input).

### Checklist
- ✅ Only `LogStep2.tsx`, `LogInteractionSheet.tsx`, `CompleteFollowupSheet.tsx` touched
- ✅ LogStep2 no longer renders Save/Skip
- ✅ LogStep2 emits `onFollowupStateChange` via `useEffect`
- ✅ LogInteractionSheet has pending state + reset in `clearAndClose`
- ✅ Save button progressively revealed via `maxHeight`/`opacity` when `pendingDate` truthy
- ✅ `followupMutation` accepts `reminderNote`, writes to both insert paths with logging
- ✅ Edit-panel textarea uses Outfit (no italic)
- ✅ Summary pill stays visible when editing; "edit" link hidden in that state
- ✅ CompleteFollowupSheet mirrors Save/Skip bottom pattern + reminder insert
- ✅ All `console.log` preserved

