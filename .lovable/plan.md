

## Plan: LogStep1 Owns Bottom Action Area

**Files:** `src/components/LogStep1.tsx`, `src/components/LogInteractionSheet.tsx`, `src/components/CompleteFollowupSheet.tsx`.

### Part 1 — LogStep1.tsx

**Imports:** Add `ArrowRight` and `CalendarIcon` to the existing `lucide-react` import.

**Interface updates:**
- Add: `onNext: () => void`, `isSubmitting?: boolean`, `logOnly?: boolean`, `onSkipLog?: () => void`, `activeFollowup?: { planned_type: string | null; planned_date: string } | null`, `onSaveLogOnly?: () => void`.
- Remove (no longer used): `onSubmit`, `submitLabel`, `disabled`, `contacts`, `onContactSelect`, `onAddNewContact`, `onSkipToFollowup`, `onChangeContact`, `showDateRow`, `connectDate`, `setConnectDate`, `contactInitials`.
- Keep `isContactPrefilled` as optional, unused.

**Internal computed:**
```ts
const canNext = note.trim().length > 0 || connectType !== "";
```

**Render — append bottom action area** (uses `marginTop: "auto"` to pin to bottom of the existing flex column root):
- Active follow-up nudge (conditional on `activeFollowup && onSaveLogOnly`): `#fdf4f0` card with `CalendarIcon`, contact name, "Save log only?" sienna underlined button.
- Next button reveal: `maxHeight`/`opacity` transition on `canNext`. Sienna button, `ArrowRight` icon, label = `isSubmitting ? "Saving…" : logOnly ? "Save" : "Next"`. `disabled={!!isSubmitting}`.
- Skip log link (conditional on `onSkipLog`): muted underlined text button.

### Part 2 — LogInteractionSheet.tsx

- Remove the entire `{step === 1 && <div>...</div>}` bottom action block (lines ~940–1064).
- Remove the `canNext` computed value (line ~683).
- Update the `<LogStep1 ... />` call site (line ~895) to pass new props:
  ```tsx
  onNext={() => logMutation.mutate()}
  isSubmitting={logMutation.isPending}
  logOnly={logOnly}
  onSkipLog={!logOnly && !activeFollowup ? handleSkipToFollowup : undefined}
  activeFollowup={activeFollowup && contactId && !logOnly ? activeFollowup : null}
  onSaveLogOnly={activeFollowup && contactId && !logOnly ? handleSaveLogOnly : undefined}
  ```
- Remove `paddingBottom: 24` from the step 1 padding wrapper (line ~877) since LogStep1's bottom area now handles its own spacing.

### Part 3 — CompleteFollowupSheet.tsx

- Remove the `{step === 1 && <div>...</div>}` bottom action block (lines ~276–315).
- Remove the `step1CanSubmit` computed value (line ~237).
- Update `<LogStep1 ... />` call site to add: `onNext={() => logMutation.mutate()}`, `isSubmitting={logMutation.isPending}`. No `onSkipLog`, no `activeFollowup`/`onSaveLogOnly`.
- Remove `paddingBottom: 24` from the step 1 padding wrapper since LogStep1's bottom area now handles its own spacing.

### Preserved
- All `console.log` statements.
- All mutations, handlers, contact-picker step, outstanding step, step 2 behavior, dialogs, celebration overlay.
- Voice recording, transcription, contact chip, note card, Log Type affordance.

### Checklist
- ✅ Only the three files touched
- ✅ LogStep1 owns Next button reveal, nudge card, skip log link
- ✅ `canNext` computed inside LogStep1
- ✅ Bottom area uses `marginTop: "auto"` to pin to flex-column bottom
- ✅ Nudge card only renders when both `activeFollowup` and `onSaveLogOnly` provided
- ✅ Skip log only renders when `onSkipLog` provided
- ✅ `ArrowRight` and `CalendarIcon` added to LogStep1 Lucide imports
- ✅ LogInteractionSheet: bottom action block + `canNext` removed; `paddingBottom: 24` removed from step 1 wrapper; new props passed
- ✅ CompleteFollowupSheet: bottom action block + `step1CanSubmit` removed; `paddingBottom: 24` removed from step 1 wrapper; new props passed
- ✅ Both parents add `paddingBottom: 24` to step 1 padding wrapper
- ✅ All `console.log` preserved

