

## Log Flow Redesign — Full Plan

### Task 2: Redesigned Stepper

**File: `src/components/StepIndicator.tsx`** — Rewrite ✅

- Circles: 22px, always show number (never checkmark)
- Active step: transparent fill + 1.5px `#c8622a` border, sienna number
- Completed step: solid `#c8622a` fill, white number
- Inactive step: muted gray fill, gray number
- Line: gray when step 1 active, sienna when step 1 complete
- Labels: 9px uppercase tracking below circles ("What happened" / "What's next")
- **No `expandStep2` prop** — stepper is identical in structure on both steps
- No "Step 2" label above circle, no 22px heading, no expansion logic

### Task 4: LogStep2 Redesign

**File: `src/components/LogStep2.tsx`** — Moderate rewrite (pending)

- Stepper no longer provides a heading — LogStep2 keeps its own standalone "What's next?" heading in Crimson Pro
- Remove "← Edit log" back link entirely
- Green confirmation card replaces current summary
- Inline edit mode via "Tap to edit"
- Follow-up chips same pill style
- CTA: "Save →", skip: "Skip follow-up"

### Task 1: New Toast Component (replaces CelebrationHeader) — pending
### Task 3: Unified Note Card (LogStep1 redesign) — pending
### Task 5: LogInteraction Page Updates — pending
### Task 6: CompleteFollowupSheet Updates — pending
### Task 7: Entry Point Wiring — pending
